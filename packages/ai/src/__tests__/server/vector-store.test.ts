import { describe, expect, it, vi } from 'vitest'

// Mock the ai module to avoid loading the massive ai package
vi.mock('ai', () => ({
  cosineSimilarity: (a: number[], b: number[]) => {
    // Real cosine similarity implementation for testing
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

import { createInMemoryVectorStore } from '../../server/vector-store'
import type { Document } from '../../types'

describe('createInMemoryVectorStore', () => {
  describe('upsert', () => {
    it('stores documents and embeddings by document ID', async () => {
      const store = createInMemoryVectorStore()
      const documents: Document[] = [
        { id: 'doc-a', content: 'about cats' },
        { id: 'doc-b', content: 'about dogs' },
      ]
      const embeddings = [
        [1, 0, 0],
        [0, 1, 0],
      ]

      await store.upsert(documents, embeddings)

      const results = await store.search([1, 0, 0], 10)
      expect(results).toHaveLength(2)
    })

    it('throws when documents.length !== embeddings.length', async () => {
      const store = createInMemoryVectorStore()
      const documents: Document[] = [{ id: 'doc-a', content: 'test' }]
      const embeddings = [
        [1, 0, 0],
        [0, 1, 0],
      ]

      await expect(store.upsert(documents, embeddings)).rejects.toThrow(
        /Documents length.*must match embeddings length/
      )
    })

    it('overwrites existing entries on duplicate upsert', async () => {
      const store = createInMemoryVectorStore()
      const doc: Document = { id: 'doc-a', content: 'original' }

      await store.upsert([doc], [[1, 0, 0]])
      await store.upsert([{ id: 'doc-a', content: 'updated' }], [[0, 1, 0]])

      const results = await store.search([0, 1, 0], 1)
      expect(results[0].content).toBe('updated')
    })
  })

  describe('search', () => {
    it('returns results sorted by cosine similarity descending', async () => {
      const store = createInMemoryVectorStore()
      const documents: Document[] = [
        { id: 'doc-a', content: 'about cats' },
        { id: 'doc-b', content: 'about dogs' },
        { id: 'doc-c', content: 'about birds' },
      ]
      const embeddings = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]

      await store.upsert(documents, embeddings)
      const results = await store.search([0.9, 0.1, 0], 3)

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('doc-a')
      expect(results[0].score).toBeGreaterThan(results[1].score)
      expect(results[1].score).toBeGreaterThan(results[2].score)
    })

    it('respects topK limit', async () => {
      const store = createInMemoryVectorStore()
      const documents: Document[] = [
        { id: 'doc-a', content: 'a' },
        { id: 'doc-b', content: 'b' },
        { id: 'doc-c', content: 'c' },
      ]
      const embeddings = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]

      await store.upsert(documents, embeddings)
      const results = await store.search([1, 0, 0], 1)

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-a')
    })

    it('filters results below minScore', async () => {
      const store = createInMemoryVectorStore()
      const documents: Document[] = [
        { id: 'doc-a', content: 'relevant' },
        { id: 'doc-b', content: 'irrelevant' },
      ]
      const embeddings = [
        [1, 0, 0],
        [0, 0, 1],
      ]

      await store.upsert(documents, embeddings)
      const results = await store.search([1, 0, 0], 10, 0.9)

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-a')
      expect(results[0].score).toBeGreaterThanOrEqual(0.9)
    })

    it('returns empty array when store is empty', async () => {
      const store = createInMemoryVectorStore()
      const results = await store.search([1, 0, 0], 5)
      expect(results).toEqual([])
    })

    it('defaults minScore to 0 when not provided', async () => {
      const store = createInMemoryVectorStore()
      const documents: Document[] = [
        { id: 'doc-a', content: 'a' },
        { id: 'doc-b', content: 'b' },
      ]
      const embeddings = [
        [1, 0, 0],
        [0, 1, 0],
      ]

      await store.upsert(documents, embeddings)
      const results = await store.search([1, 0, 0], 10)
      expect(results).toHaveLength(2)
    })
  })

  describe('delete', () => {
    it('removes documents by ID', async () => {
      const store = createInMemoryVectorStore()
      await store.upsert(
        [
          { id: 'doc-a', content: 'a' },
          { id: 'doc-b', content: 'b' },
        ],
        [
          [1, 0, 0],
          [0, 1, 0],
        ]
      )

      await store.delete(['doc-a'])
      const results = await store.search([1, 0, 0], 10)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-b')
    })

    it('ignores IDs that do not exist', async () => {
      const store = createInMemoryVectorStore()
      await store.upsert([{ id: 'doc-a', content: 'a' }], [[1, 0, 0]])

      await expect(store.delete(['nonexistent'])).resolves.not.toThrow()
      const results = await store.search([1, 0, 0], 10)
      expect(results).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('empties all stored data', async () => {
      const store = createInMemoryVectorStore()
      await store.upsert(
        [
          { id: 'doc-a', content: 'a' },
          { id: 'doc-b', content: 'b' },
        ],
        [
          [1, 0, 0],
          [0, 1, 0],
        ]
      )

      await store.clear()
      const results = await store.search([1, 0, 0], 10)
      expect(results).toEqual([])
    })
  })
})
