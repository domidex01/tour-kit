import { cosineSimilarity } from 'ai'
import { describe, expect, it } from 'vitest'

describe('cosineSimilarity — US-4 (pure math)', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 0, 0, 1]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
  })

  it('returns -1 for opposite vectors', () => {
    const a = [1, 0]
    const b = [-1, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5)
  })

  it('returns 0 for orthogonal vectors', () => {
    const a = [1, 0]
    const b = [0, 1]
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5)
  })

  it('returns a value between -1 and 1 for arbitrary vectors', () => {
    const a = [0.5, 0.3, 0.9, 0.1]
    const b = [0.2, 0.8, 0.4, 0.6]
    const result = cosineSimilarity(a, b)
    expect(result).toBeGreaterThanOrEqual(-1)
    expect(result).toBeLessThanOrEqual(1)
  })
})
