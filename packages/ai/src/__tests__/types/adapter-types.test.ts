import { describe, expectTypeOf, it } from 'vitest'
import type { VectorStoreAdapter, EmbeddingAdapter, RateLimitStore } from '../../types/adapter'

describe('Adapter Types — US-5', () => {
  it('VectorStoreAdapter has required methods', () => {
    expectTypeOf<VectorStoreAdapter>().toHaveProperty('name')
    expectTypeOf<VectorStoreAdapter>().toHaveProperty('upsert')
    expectTypeOf<VectorStoreAdapter>().toHaveProperty('search')
    expectTypeOf<VectorStoreAdapter>().toHaveProperty('delete')
    expectTypeOf<VectorStoreAdapter>().toHaveProperty('clear')
  })

  it('EmbeddingAdapter has embed, embedMany, and dimensions', () => {
    expectTypeOf<EmbeddingAdapter>().toHaveProperty('embed')
    expectTypeOf<EmbeddingAdapter>().toHaveProperty('embedMany')
    expectTypeOf<EmbeddingAdapter>().toHaveProperty('dimensions')
    expectTypeOf<EmbeddingAdapter['dimensions']>().toBeNumber()
  })

  it('RateLimitStore has increment and check methods', () => {
    expectTypeOf<RateLimitStore>().toHaveProperty('increment')
    expectTypeOf<RateLimitStore>().toHaveProperty('check')
  })
})
