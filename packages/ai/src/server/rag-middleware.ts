import type { LanguageModelMiddleware } from 'ai'
import type { RAGMiddlewareOptions, RetrievedDocument } from '../types'

function defaultFormatContext(docs: RetrievedDocument[]): string {
  return docs
    .map((doc, i) => {
      const source = doc.metadata?.title ?? doc.metadata?.source ?? doc.id
      return `[${i + 1}] (${source}): ${doc.content}`
    })
    .join('\n\n')
}

export function createRAGMiddleware(options: RAGMiddlewareOptions): LanguageModelMiddleware {
  const { retriever, topK = 5, rerank, formatContext = defaultFormatContext } = options

  return {
    transformParams: async ({ params }) => {
      // Find last user message
      const lastUserMsg = [...params.prompt].reverse().find((m) => m.role === 'user')
      if (!lastUserMsg || lastUserMsg.role !== 'user') return params

      // Extract text from user message content parts
      const text = lastUserMsg.content
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join(' ')

      if (!text.trim()) return params

      // Search with more results if reranking
      const searchTopK = rerank ? topK * 2 : topK
      const results = await retriever.search(text, searchTopK, -1)

      if (results.length === 0) return params

      // Optional reranking — simple score-based re-ordering
      let finalResults: RetrievedDocument[]
      if (rerank) {
        const topN = rerank.topN ?? topK
        // Re-score by combining original score with position weight
        finalResults = results.sort((a, b) => b.score - a.score).slice(0, topN)
      } else {
        finalResults = results.slice(0, topK)
      }

      const contextString = formatContext(finalResults)

      // Prepend a system message with the retrieved context
      return {
        ...params,
        prompt: [
          {
            role: 'system' as const,
            content: `Relevant context from documentation:\n\n${contextString}`,
          },
          ...params.prompt,
        ],
      }
    },
  }
}
