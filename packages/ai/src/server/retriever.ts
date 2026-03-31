import type { Document, Retriever, RetrieverOptions } from '../types'
import { createInMemoryVectorStore } from './vector-store'

/**
 * Splits a single document into chunks with overlap.
 * Uses paragraph-aware splitting with sentence fallback.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: chunking algorithm requires nested boundary logic
export function chunkDocument(
  document: Document,
  chunkSize: number,
  chunkOverlap: number
): Document[] {
  const { content } = document
  if (content.length <= chunkSize) {
    return [
      {
        id: `${document.id}-chunk-0`,
        content,
        metadata: { ...document.metadata, chunkIndex: 0 },
      },
    ]
  }

  const paragraphs = content.split('\n\n')
  const chunks: Document[] = []
  let currentChunk = ''
  let chunkIndex = 0

  function pushChunk(text: string) {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    chunks.push({
      id: `${document.id}-chunk-${chunkIndex}`,
      content: trimmed,
      metadata: { ...document.metadata, chunkIndex },
    })
    chunkIndex++
  }

  function getOverlap(text: string): string {
    if (chunkOverlap <= 0) return ''
    return text.slice(-chunkOverlap)
  }

  for (const paragraph of paragraphs) {
    // If a single paragraph exceeds chunkSize, split it further
    if (paragraph.length > chunkSize) {
      // Push any accumulated content first
      if (currentChunk.length > 0) {
        pushChunk(currentChunk)
        currentChunk = getOverlap(currentChunk)
      }

      // Split oversized paragraph by sentences
      const sentences = paragraph.split('. ')
      let sentenceBuffer = ''

      for (let i = 0; i < sentences.length; i++) {
        const sentence = i < sentences.length - 1 ? `${sentences[i]}. ` : sentences[i]

        if (sentenceBuffer.length + sentence.length > chunkSize) {
          if (sentenceBuffer.length > 0) {
            pushChunk(sentenceBuffer)
            sentenceBuffer = getOverlap(sentenceBuffer)
          }
          // If a single sentence exceeds chunkSize, hard-split it
          if (sentence.length > chunkSize) {
            let remaining = sentence
            while (remaining.length > 0) {
              const slice = remaining.slice(0, chunkSize)
              pushChunk(slice)
              remaining = remaining.slice(chunkSize)
              if (remaining.length > 0) {
                remaining = getOverlap(slice) + remaining
              }
            }
          } else {
            sentenceBuffer += sentence
          }
        } else {
          sentenceBuffer += sentence
        }
      }

      if (sentenceBuffer.length > 0) {
        currentChunk = sentenceBuffer
      }
      continue
    }

    const separator = currentChunk.length > 0 ? '\n\n' : ''
    if (currentChunk.length + separator.length + paragraph.length > chunkSize) {
      pushChunk(currentChunk)
      currentChunk = getOverlap(currentChunk) + paragraph
    } else {
      currentChunk += separator + paragraph
    }
  }

  // Push remaining content
  if (currentChunk.trim().length > 0) {
    pushChunk(currentChunk)
  }

  return chunks
}

/**
 * Chunks all documents and returns a flat array.
 */
export function chunkDocuments(
  documents: Document[],
  chunkSize: number,
  chunkOverlap: number
): Document[] {
  return documents.flatMap((doc) => chunkDocument(doc, chunkSize, chunkOverlap))
}

/**
 * Creates a retriever that chunks, embeds, indexes, and searches documents.
 * Supports lazy indexing on first search.
 */
export function createRetriever(options: RetrieverOptions): Retriever {
  const {
    documents,
    embedding,
    vectorStore = createInMemoryVectorStore(),
    chunkSize = 512,
    chunkOverlap = 50,
  } = options

  let indexed = false
  let indexingPromise: Promise<void> | null = null

  async function doIndex(): Promise<void> {
    const chunks = chunkDocuments(documents, chunkSize, chunkOverlap)
    const contents = chunks.map((c) => c.content)
    const embeddings = await embedding.embedMany(contents)
    await vectorStore.upsert(chunks, embeddings)
    indexed = true
  }

  return {
    async index(): Promise<void> {
      if (indexed) return
      if (indexingPromise) {
        await indexingPromise
        return
      }
      indexingPromise = doIndex()
      await indexingPromise
    },

    async search(query: string, topK = 5, minScore = 0.7) {
      // Auto-index on first search
      if (!indexed) {
        if (!indexingPromise) {
          indexingPromise = doIndex()
        }
        await indexingPromise
      }

      const queryEmbedding = await embedding.embed(query)
      return vectorStore.search(queryEmbedding, topK, minScore)
    },
  }
}
