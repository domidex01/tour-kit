import { describe, expect, it, vi } from 'vitest'

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

import { createRAGMiddleware } from '../../server/rag-middleware'
import { createRetriever } from '../../server/retriever'
import type { Document, VectorStoreAdapter } from '../../types'
import { createTestDocuments } from '../helpers/factories'
import { createMockEmbedding } from '../helpers/mock-embedding'

describe('RAG Pipeline Integration', () => {
  it('indexes documents and retrieves relevant results for a query', async () => {
    const embedding = createMockEmbedding()
    const docs: Document[] = [
      { id: 'doc-1', content: 'Tour Kit provides branching logic for conditional tours.' },
      { id: 'doc-2', content: 'The useTour hook manages tour state and navigation.' },
      { id: 'doc-3', content: 'Keyboard shortcuts are configurable via useKeyboard hook.' },
      { id: 'doc-4', content: 'The spotlight overlay highlights the active tour step element.' },
      { id: 'doc-5', content: 'Persistence allows saving tour progress across sessions.' },
    ]

    const retriever = createRetriever({
      documents: docs,
      embedding,
      chunkSize: 512,
      chunkOverlap: 50,
    })

    const results = await retriever.search('branching in tours', 3, 0)

    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(3)
    // Results should have scores
    for (const result of results) {
      expect(typeof result.score).toBe('number')
    }
  })

  it('RAG middleware injects retrieved context into LLM prompt', async () => {
    const embedding = createMockEmbedding()
    const docs: Document[] = [
      {
        id: 'doc-1',
        content: 'Tour Kit uses React context for state management.',
        metadata: { title: 'State' },
      },
      {
        id: 'doc-2',
        content: 'Animations are handled via CSS transitions.',
        metadata: { title: 'Animations' },
      },
    ]

    const retriever = createRetriever({
      documents: docs,
      embedding,
    })

    const middleware = createRAGMiddleware({
      retriever,
      topK: 5,
    })

    const params = {
      type: 'generate' as const,
      params: {
        prompt: [
          { role: 'system' as const, content: 'You are a helpful assistant.' },
          {
            role: 'user' as const,
            content: [{ type: 'text' as const, text: 'How does state management work?' }],
          },
        ],
      },
      model: {} as never,
    }

    const result = await middleware.transformParams?.(params)

    // Should have 3 messages: injected context + original system + user
    expect(result?.prompt.length).toBe(3)
    expect(result?.prompt[0].role).toBe('system')
    expect((result?.prompt[0] as { content: string }).content).toContain('Relevant context')
  })

  it('end-to-end: index → query → retrieve → verify ranked results', async () => {
    const embedding = createMockEmbedding()
    const docs = createTestDocuments(20)

    const retriever = createRetriever({
      documents: docs,
      embedding,
    })

    await retriever.index()
    const results = await retriever.search('Document 5 content', 5, 0)

    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(5)
    // All results should have scores sorted descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('works with custom VectorStoreAdapter', async () => {
    const embedding = createMockEmbedding()
    const customStore: VectorStoreAdapter = {
      name: 'custom-test',
      _data: new Map<string, { doc: Document; emb: number[] }>(),
      async upsert(documents, embeddings) {
        for (let i = 0; i < documents.length; i++) {
          ;(this as unknown as { _data: Map<string, { doc: Document; emb: number[] }> })._data.set(
            documents[i].id,
            { doc: documents[i], emb: embeddings[i] }
          )
        }
      },
      async search(_embedding, topK) {
        const entries = Array.from(
          (
            this as unknown as { _data: Map<string, { doc: Document; emb: number[] }> }
          )._data.values()
        )
        return entries.slice(0, topK).map((e) => ({ ...e.doc, score: 0.9 }))
      },
      async delete(ids) {
        for (const id of ids) {
          ;(this as unknown as { _data: Map<string, unknown> })._data.delete(id)
        }
      },
      async clear() {
        ;(this as unknown as { _data: Map<string, unknown> })._data.clear()
      },
    } as VectorStoreAdapter

    const docs: Document[] = [{ id: 'doc-1', content: 'Test content.' }]

    const retriever = createRetriever({
      documents: docs,
      embedding,
      vectorStore: customStore,
    })

    const results = await retriever.search('test', 5, 0)
    expect(results.length).toBeGreaterThan(0)
  })

  it('handles rerank option in middleware', async () => {
    const embedding = createMockEmbedding()
    const docs: Document[] = [
      { id: 'doc-1', content: 'First document about tours.', metadata: { title: 'Tours' } },
      { id: 'doc-2', content: 'Second document about hooks.', metadata: { title: 'Hooks' } },
      { id: 'doc-3', content: 'Third document about state.', metadata: { title: 'State' } },
    ]

    const retriever = createRetriever({ documents: docs, embedding })

    const middleware = createRAGMiddleware({
      retriever,
      topK: 2,
      rerank: { model: 'rerank-model', topN: 1 },
    })

    const params = {
      type: 'generate' as const,
      params: {
        prompt: [
          {
            role: 'user' as const,
            content: [{ type: 'text' as const, text: 'How do tours work?' }],
          },
        ],
      },
      model: {} as never,
    }

    const result = await middleware.transformParams?.(params)

    // Should have injected context
    expect(result?.prompt[0].role).toBe('system')
  })

  it('lazy indexes on first search — no upfront blocking', async () => {
    const embedding = createMockEmbedding()
    const embedManySpy = vi.fn(embedding.embedMany.bind(embedding))
    const trackedEmbedding = { ...embedding, embedMany: embedManySpy }

    const docs = createTestDocuments(5)
    const retriever = createRetriever({
      documents: docs,
      embedding: trackedEmbedding,
    })

    // No index() call — search should trigger indexing
    const results = await retriever.search('test', 3, 0)

    expect(embedManySpy).toHaveBeenCalledTimes(1)
    expect(results.length).toBeGreaterThanOrEqual(0)
  })

  describe('Performance', () => {
    it('indexes and searches 500 documents in < 200ms', async () => {
      const embedding = createMockEmbedding()
      const docs = createTestDocuments(500)

      const retriever = createRetriever({
        documents: docs,
        embedding,
      })

      const start = performance.now()
      await retriever.index()
      const results = await retriever.search('test query about topic 3', 5, 0)
      const elapsed = performance.now() - start

      expect(results.length).toBeGreaterThan(0)
      expect(elapsed).toBeLessThan(200)
    })

    it('subsequent searches after indexing complete in < 50ms', async () => {
      const embedding = createMockEmbedding()
      const docs = createTestDocuments(500)

      const retriever = createRetriever({
        documents: docs,
        embedding,
      })

      await retriever.index()

      const start = performance.now()
      const results = await retriever.search('test query', 5, 0)
      const elapsed = performance.now() - start

      expect(results.length).toBeGreaterThan(0)
      expect(elapsed).toBeLessThan(50)
    })
  })
})
