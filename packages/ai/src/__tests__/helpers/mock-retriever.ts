import type { Retriever, RetrievedDocument } from '../../types'

export function createMockRetriever(
  results: RetrievedDocument[] = [],
): Retriever & { indexCalled: boolean } {
  return {
    indexCalled: false,

    async index(): Promise<void> {
      this.indexCalled = true
    },

    async search(
      _query: string,
      topK = 5,
      _minScore?: number,
    ): Promise<RetrievedDocument[]> {
      return results.slice(0, topK)
    },
  }
}
