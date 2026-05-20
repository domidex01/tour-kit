import { describe, expect, it } from 'vitest'

import { type CesCategory, computeCesCategory, computeNpsCategory } from '../core/scoring'
import type { NpsCategory } from '../core/scoring'

describe('computeNpsCategory boundaries', () => {
  it.each<[number, NpsCategory]>([
    [10, 'promoter'],
    [9, 'promoter'],
    [8, 'passive'],
    [7, 'passive'],
    [6, 'detractor'],
    [0, 'detractor'],
  ])('score %i → %s', (score, expected) => {
    expect(computeNpsCategory(score)).toBe(expected)
  })
})

describe('computeCesCategory boundaries', () => {
  it.each<[number, CesCategory]>([
    [7, 'easy'],
    [5, 'easy'],
    [4, 'neutral'],
    [3, 'difficult'],
    [1, 'difficult'],
  ])('score %i → %s', (score, expected) => {
    expect(computeCesCategory(score)).toBe(expected)
  })
})
