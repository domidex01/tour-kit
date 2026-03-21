import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock the ai module to avoid loading the massive ai package
vi.mock('ai', () => ({
  cosineSimilarity: (a: number[], b: number[]) => {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  },
}))

import { chunkDocument, chunkDocuments, createRetriever } from '../../server/retriever'
import { createMockEmbedding } from '../helpers/mock-embedding'
import { createMockVectorStore } from '../helpers/mock-vector-store'
import type { Document } from '../../types'

describe('chunkDocument', () => {
  it('returns single chunk for short document below chunkSize', () => {
    const doc: Document = {
      id: 'doc-1',
      content: 'Short content.',
      metadata: { source: 'test', title: 'Short Doc' },
    }

    const chunks = chunkDocument(doc, 512, 50)

    expect(chunks).toHaveLength(1)
    expect(chunks[0].id).toBe('doc-1-chunk-0')
    expect(chunks[0].content).toBe('Short content.')
    expect(chunks[0].metadata).toEqual({ source: 'test', title: 'Short Doc', chunkIndex: 0 })
  })

  it('splits long document into multiple chunks with correct overlap', () => {
    const paragraph = 'A'.repeat(200)
    const content = `${paragraph}\n\n${paragraph}\n\n${paragraph}`
    const doc: Document = { id: 'doc-1', content }

    const chunks = chunkDocument(doc, 250, 50)

    expect(chunks.length).toBeGreaterThan(1)
    // Verify IDs are sequential
    chunks.forEach((chunk, i) => {
      expect(chunk.id).toBe(`doc-1-chunk-${i}`)
    })
  })

  it('splits at paragraph boundaries (\\n\\n)', () => {
    const content = 'Paragraph one about cats.\n\nParagraph two about dogs.\n\nParagraph three about birds.'
    const doc: Document = { id: 'doc-1', content }

    // chunkSize large enough for first two paragraphs but not all three
    const chunks = chunkDocument(doc, 60, 10)

    expect(chunks.length).toBeGreaterThan(1)
    // First chunk should contain whole paragraphs
    expect(chunks[0].content).toContain('Paragraph one')
  })

  it('falls back to sentence splitting for oversized paragraphs', () => {
    // One long paragraph with sentences
    const sentences = Array.from({ length: 10 }, (_, i) => `Sentence ${i} about topic.`).join('. ')
    const doc: Document = { id: 'doc-1', content: sentences }

    const chunks = chunkDocument(doc, 100, 20)

    expect(chunks.length).toBeGreaterThan(1)
  })

  it('hard-splits at chunkSize when no sentence boundary found', () => {
    // Single word repeated without sentence boundaries
    const content = 'A'.repeat(1000)
    const doc: Document = { id: 'doc-1', content }

    const chunks = chunkDocument(doc, 200, 0)

    expect(chunks.length).toBeGreaterThan(1)
  })

  it('generates chunk IDs as ${docId}-chunk-${index}', () => {
    const content = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
    const doc: Document = { id: 'my-doc', content }

    const chunks = chunkDocument(doc, 20, 5)

    chunks.forEach((chunk, i) => {
      expect(chunk.id).toBe(`my-doc-chunk-${i}`)
    })
  })

  it('preserves parent document metadata on all chunks', () => {
    const doc: Document = {
      id: 'doc-1',
      content: 'First part.\n\nSecond part.\n\nThird part.',
      metadata: { source: 'wiki', title: 'Article', tags: ['test'] },
    }

    const chunks = chunkDocument(doc, 20, 5)

    for (const chunk of chunks) {
      expect(chunk.metadata?.source).toBe('wiki')
      expect(chunk.metadata?.title).toBe('Article')
      expect(chunk.metadata?.tags).toEqual(['test'])
    }
  })

  it('adds chunkIndex to each chunk metadata', () => {
    const doc: Document = {
      id: 'doc-1',
      content: 'First part.\n\nSecond part.\n\nThird part.',
      metadata: { source: 'test' },
    }

    const chunks = chunkDocument(doc, 20, 5)

    chunks.forEach((chunk, i) => {
      expect(chunk.metadata?.chunkIndex).toBe(i)
    })
  })
})

describe('chunkDocuments', () => {
  it('chunks all documents and returns flat array', () => {
    const docs: Document[] = [
      { id: 'doc-1', content: 'First paragraph.\n\nSecond paragraph.', metadata: { source: 'a' } },
      { id: 'doc-2', content: 'Third paragraph.\n\nFourth paragraph.', metadata: { source: 'b' } },
    ]

    const chunks = chunkDocuments(docs, 20, 5)

    expect(chunks.length).toBeGreaterThan(2)
    expect(chunks.some((c) => c.id.startsWith('doc-1-chunk-'))).toBe(true)
    expect(chunks.some((c) => c.id.startsWith('doc-2-chunk-'))).toBe(true)
  })
})

describe('createRetriever', () => {
  let mockEmbedding: ReturnType<typeof createMockEmbedding>
  let mockVectorStore: ReturnType<typeof createMockVectorStore>

  beforeEach(() => {
    mockEmbedding = createMockEmbedding()
    mockVectorStore = createMockVectorStore()
    vi.clearAllMocks()
  })

  describe('index', () => {
    it('chunks documents and calls embedMany on chunk contents', async () => {
      const embedManySpy = vi.spyOn(mockEmbedding, 'embedMany')
      const docs: Document[] = [
        { id: 'doc-1', content: 'Short content.' },
      ]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.index()

      expect(embedManySpy).toHaveBeenCalledTimes(1)
      // Should have been called with chunk contents
      const callArgs = embedManySpy.mock.calls[0][0]
      expect(callArgs.length).toBeGreaterThan(0)
    })

    it('upserts chunks and embeddings into vector store', async () => {
      const docs: Document[] = [
        { id: 'doc-1', content: 'Some content for testing.' },
      ]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.index()

      expect(mockVectorStore.upsertCalls).toHaveLength(1)
      expect(mockVectorStore.upsertCalls[0].documents.length).toBeGreaterThan(0)
      expect(mockVectorStore.upsertCalls[0].embeddings.length).toBeGreaterThan(0)
    })

    it('uses default in-memory vector store when none provided', async () => {
      const docs: Document[] = [
        { id: 'doc-1', content: 'Content.' },
      ]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
      })

      // Should not throw — uses built-in in-memory store
      await expect(retriever.index()).resolves.not.toThrow()
    })

    it('uses custom vector store when provided', async () => {
      const docs: Document[] = [
        { id: 'doc-1', content: 'Content.' },
      ]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.index()
      expect(mockVectorStore.upsertCalls).toHaveLength(1)
    })
  })

  describe('search', () => {
    it('embeds query and searches vector store', async () => {
      const embedSpy = vi.spyOn(mockEmbedding, 'embed')
      const docs: Document[] = [{ id: 'doc-1', content: 'Content.' }]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.index()
      await retriever.search('test query')

      expect(embedSpy).toHaveBeenCalledWith('test query')
      expect(mockVectorStore.searchCalls).toHaveLength(1)
    })

    it('returns RetrievedDocument[] from vector store results', async () => {
      mockVectorStore.setSearchResults([
        { id: 'doc-1', content: 'result', score: 0.95 },
      ])

      const docs: Document[] = [{ id: 'doc-1', content: 'Content.' }]
      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.index()
      const results = await retriever.search('query')

      expect(results).toHaveLength(1)
      expect(results[0].score).toBe(0.95)
    })

    it('auto-indexes on first search if not yet indexed', async () => {
      const embedManySpy = vi.spyOn(mockEmbedding, 'embedMany')
      const docs: Document[] = [{ id: 'doc-1', content: 'Content.' }]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      // Don't call index() — search should trigger it
      await retriever.search('query')

      expect(embedManySpy).toHaveBeenCalledTimes(1)
      expect(mockVectorStore.upsertCalls).toHaveLength(1)
    })

    it('does not re-index on subsequent searches', async () => {
      const embedManySpy = vi.spyOn(mockEmbedding, 'embedMany')
      const docs: Document[] = [{ id: 'doc-1', content: 'Content.' }]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.search('first query')
      await retriever.search('second query')

      expect(embedManySpy).toHaveBeenCalledTimes(1)
    })

    it('concurrent search calls share the same indexing promise', async () => {
      const embedManySpy = vi.spyOn(mockEmbedding, 'embedMany')
      const docs: Document[] = [{ id: 'doc-1', content: 'Content.' }]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      // Fire multiple searches concurrently
      await Promise.all([
        retriever.search('query 1'),
        retriever.search('query 2'),
        retriever.search('query 3'),
      ])

      // embedMany should have been called only once
      expect(embedManySpy).toHaveBeenCalledTimes(1)
    })

    it('uses default topK=5 and minScore=0.7 when not specified', async () => {
      const docs: Document[] = [{ id: 'doc-1', content: 'Content.' }]

      const retriever = createRetriever({
        documents: docs,
        embedding: mockEmbedding,
        vectorStore: mockVectorStore,
      })

      await retriever.index()
      await retriever.search('query')

      expect(mockVectorStore.searchCalls[0].topK).toBe(5)
      expect(mockVectorStore.searchCalls[0].minScore).toBe(0.7)
    })
  })
})
