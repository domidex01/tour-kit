import type { Document, RetrievedDocument } from './document'

export interface VectorStoreAdapter {
  name: string
  upsert(documents: Document[], embeddings: number[][]): Promise<void>
  search(embedding: number[], topK: number, minScore?: number): Promise<RetrievedDocument[]>
  delete(ids: string[]): Promise<void>
  clear(): Promise<void>
}

export interface EmbeddingAdapter {
  name: string
  embed(text: string): Promise<number[]>
  embedMany(texts: string[]): Promise<number[][]>
  dimensions: number
}

export interface RateLimitStore {
  increment(identifier: string, windowMs: number): Promise<{ count: number; resetAt: number }>
  check(identifier: string): Promise<{ count: number; resetAt: number }>
}
