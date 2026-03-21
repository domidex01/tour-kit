import type { Document, RetrievedDocument, VectorStoreAdapter } from '../../types'

export function createMockVectorStore(): VectorStoreAdapter & {
  upsertCalls: Array<{ documents: Document[]; embeddings: number[][] }>
  searchCalls: Array<{ embedding: number[]; topK: number; minScore?: number }>
  setSearchResults(results: RetrievedDocument[]): void
} {
  let storedResults: RetrievedDocument[] = []
  const upsertCalls: Array<{ documents: Document[]; embeddings: number[][] }> = []
  const searchCalls: Array<{ embedding: number[]; topK: number; minScore?: number }> = []

  return {
    name: 'mock-vector-store',
    upsertCalls,
    searchCalls,

    setSearchResults(results: RetrievedDocument[]) {
      storedResults = results
    },

    async upsert(documents: Document[], embeddings: number[][]): Promise<void> {
      upsertCalls.push({ documents, embeddings })
    },

    async search(
      embedding: number[],
      topK: number,
      minScore?: number
    ): Promise<RetrievedDocument[]> {
      searchCalls.push({ embedding, topK, minScore })
      return storedResults.slice(0, topK)
    },

    async delete(_ids: string[]): Promise<void> {},
    async clear(): Promise<void> {
      storedResults = []
    },
  }
}
