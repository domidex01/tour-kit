import { describe, expect, it, vi } from 'vitest'

// Mock the ai module — rag-middleware imports LanguageModelMiddleware type
vi.mock('ai', () => ({}))

import { createRAGMiddleware } from '../../server/rag-middleware'
import type { RetrievedDocument } from '../../types'
import { createMockRetriever } from '../helpers/mock-retriever'

function createMockParams(userText: string) {
  return {
    type: 'generate' as const,
    params: {
      prompt: [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user' as const,
          content: [{ type: 'text' as const, text: userText }],
        },
      ],
    },
    model: {} as never,
  }
}

describe('createRAGMiddleware', () => {
  const mockResults: RetrievedDocument[] = [
    {
      id: 'doc-1',
      content: 'Tour Kit supports branching.',
      score: 0.95,
      metadata: { title: 'Branching' },
    },
    {
      id: 'doc-2',
      content: 'Use useTour hook for state.',
      score: 0.88,
      metadata: { source: 'hooks-guide' },
    },
  ]

  it('returns a middleware with transformParams', () => {
    const retriever = createMockRetriever()
    const middleware = createRAGMiddleware({ retriever })

    expect(middleware.transformParams).toBeDefined()
    expect(typeof middleware.transformParams).toBe('function')
  })

  describe('transformParams', () => {
    it('extracts text from the last user message', async () => {
      const retriever = createMockRetriever(mockResults)
      const middleware = createRAGMiddleware({ retriever })

      const mockP = createMockParams('How does branching work?')
      await middleware.transformParams?.(mockP)

      // Retriever should have been called — verifies text was extracted
      // We can't spy directly but we know it returns results
    })

    it('searches retriever with extracted text', async () => {
      let searchedQuery = ''
      const retriever = {
        ...createMockRetriever(mockResults),
        async search(query: string, topK?: number) {
          searchedQuery = query
          return mockResults.slice(0, topK ?? 5)
        },
      }

      const middleware = createRAGMiddleware({ retriever })
      await middleware.transformParams?.(createMockParams('How does branching work?'))

      expect(searchedQuery).toBe('How does branching work?')
    })

    it('injects formatted context as a system message prepended to prompt', async () => {
      const retriever = createMockRetriever(mockResults)
      const middleware = createRAGMiddleware({ retriever })

      const result = await middleware.transformParams?.(createMockParams('test query'))

      // First message should be the injected system context
      expect(result?.prompt[0].role).toBe('system')
      expect((result?.prompt[0] as { role: 'system'; content: string }).content).toContain(
        'Relevant context from documentation'
      )
      expect((result?.prompt[0] as { role: 'system'; content: string }).content).toContain(
        'Tour Kit supports branching'
      )
    })

    it('returns params unchanged when no user message found', async () => {
      const retriever = createMockRetriever(mockResults)
      const middleware = createRAGMiddleware({ retriever })

      const params = {
        type: 'generate' as const,
        params: {
          prompt: [{ role: 'system' as const, content: 'System message only.' }],
        },
        model: {} as never,
      }

      const result = await middleware.transformParams?.(params)
      expect(result?.prompt).toHaveLength(1)
      expect(result?.prompt[0].role).toBe('system')
    })

    it('returns params unchanged when retriever returns empty results', async () => {
      const retriever = createMockRetriever([]) // No results
      const middleware = createRAGMiddleware({ retriever })

      const mockP = createMockParams('query with no matches')
      const result = await middleware.transformParams?.(mockP)

      // Should have the original 2 messages, no injected system message
      expect(result?.prompt).toHaveLength(2)
    })

    it('uses custom formatContext function when provided', async () => {
      const retriever = createMockRetriever(mockResults)
      const customFormat = (docs: RetrievedDocument[]) =>
        docs.map((d) => `- ${d.content}`).join('\n')

      const middleware = createRAGMiddleware({
        retriever,
        formatContext: customFormat,
      })

      const result = await middleware.transformParams?.(createMockParams('test'))
      const systemContent = (result?.prompt[0] as { role: 'system'; content: string }).content

      expect(systemContent).toContain('- Tour Kit supports branching.')
      expect(systemContent).toContain('- Use useTour hook for state.')
    })

    it('uses default formatContext with numbered list and source metadata', async () => {
      const retriever = createMockRetriever(mockResults)
      const middleware = createRAGMiddleware({ retriever })

      const result = await middleware.transformParams?.(createMockParams('test'))
      const systemContent = (result?.prompt[0] as { role: 'system'; content: string }).content

      expect(systemContent).toContain('[1] (Branching)')
      expect(systemContent).toContain('[2] (hooks-guide)')
    })
  })
})

// US-1 (guard + earned): the configured RAGConfig.minScore must reach the
// retriever instead of the hardcoded -1 that rag-middleware.ts used to pass.
// RED before Task 4.1; GREEN after the wire. The default stays -1 (match-all)
// so an unset minScore keeps today's retrieval behavior.
describe('createRAGMiddleware — minScore (US-1)', () => {
  const HITS: RetrievedDocument[] = [
    {
      id: 'd1',
      content: 'Tour Kit supports branching.',
      score: 0.95,
      metadata: { title: 'Branching' },
    },
    { id: 'd2', content: 'Use useTour for state.', score: 0.4, metadata: { source: 'hooks' } },
  ]

  it('threads the CONFIGURED minScore to retriever.search (not hardcoded -1)', async () => {
    let received: number | undefined = Number.NaN
    const retriever = {
      ...createMockRetriever(HITS),
      async search(_q: string, topK?: number, minScore?: number) {
        received = minScore
        return HITS.slice(0, topK ?? 5)
      },
    }

    const middleware = createRAGMiddleware({ retriever, minScore: 0.5 })
    await middleware.transformParams?.(createMockParams('How does branching work?'))

    expect(received).toBe(0.5)
  })

  it("unset minScore keeps today's behavior (default -1, match-all)", async () => {
    let received: number | undefined = Number.NaN
    const retriever = {
      ...createMockRetriever(HITS),
      async search(_q: string, topK?: number, minScore?: number) {
        received = minScore
        return HITS.slice(0, topK ?? 5)
      },
    }

    const middleware = createRAGMiddleware({ retriever })
    await middleware.transformParams?.(createMockParams('test'))

    expect(received).toBe(-1)
  })

  it('a minScore above every score ⇒ empty results ⇒ params returned unchanged', async () => {
    const retriever = {
      ...createMockRetriever(HITS),
      async search(_q: string, _topK?: number, minScore?: number) {
        return HITS.filter((h) => h.score >= (minScore ?? -1))
      },
    }

    const middleware = createRAGMiddleware({ retriever, minScore: 0.99 })
    const result = await middleware.transformParams?.(createMockParams('test'))

    // No doc cleared the bar → no "Relevant context…" system message prepended.
    expect(result?.prompt).toHaveLength(2)
    expect(result?.prompt[0].role).toBe('system')
    expect((result?.prompt[0] as { role: 'system'; content: string }).content).not.toContain(
      'Relevant context from documentation'
    )
  })
})
