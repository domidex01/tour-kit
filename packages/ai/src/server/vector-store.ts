import { cosineSimilarity } from 'ai'
import type { Document, RetrievedDocument, VectorStoreAdapter } from '../types'

interface VectorStoreEntry {
  document: Document
  embedding: number[]
}

export function createInMemoryVectorStore(): VectorStoreAdapter {
  const store = new Map<string, VectorStoreEntry>()

  return {
    name: 'in-memory',

    async upsert(documents: Document[], embeddings: number[][]): Promise<void> {
      if (documents.length !== embeddings.length) {
        throw new Error(
          `Documents length (${documents.length}) must match embeddings length (${embeddings.length})`
        )
      }

      for (let i = 0; i < documents.length; i++) {
        store.set(documents[i].id, {
          document: documents[i],
          embedding: embeddings[i],
        })
      }
    },

    async search(
      queryEmbedding: number[],
      topK: number,
      minScore = 0
    ): Promise<RetrievedDocument[]> {
      const results: RetrievedDocument[] = []

      for (const entry of store.values()) {
        const score = cosineSimilarity(queryEmbedding, entry.embedding)
        if (score >= minScore) {
          results.push({ ...entry.document, score })
        }
      }

      results.sort((a, b) => b.score - a.score)
      return results.slice(0, topK)
    },

    async delete(ids: string[]): Promise<void> {
      for (const id of ids) {
        store.delete(id)
      }
    },

    async clear(): Promise<void> {
      store.clear()
    },
  }
}
