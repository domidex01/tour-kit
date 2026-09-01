import { describe, expect, it } from 'vitest'
import { calculateCES, calculateCSAT, calculateNPS } from '../core/scoring'

// Real-behavior unit tests for the aggregate scoring math. These exercise the
// uncovered arms of core/scoring.ts (the per-response classification loops and
// the empty-array guards) and pin the published result shapes from types/scoring.

describe('calculateNPS', () => {
  it('returns the zeroed result for an empty array', () => {
    expect(calculateNPS([])).toEqual({
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoterPct: 0,
      passivePct: 0,
      detractorPct: 0,
      total: 0,
      responses: [],
    })
  })

  it('classifies promoters (9-10), passives (7-8), detractors (0-6)', () => {
    // 2 promoters (9,10), 2 passives (7,8), 1 detractor (3) of 5 total.
    const r = calculateNPS([9, 10, 7, 8, 3])
    expect(r.promoters).toBe(2)
    expect(r.passives).toBe(2)
    expect(r.detractors).toBe(1)
    expect(r.total).toBe(5)
    expect(r.promoterPct).toBe(40)
    expect(r.passivePct).toBe(40)
    expect(r.detractorPct).toBe(20)
    // score = round(%promoters − %detractors) = round(40 − 20) = 20
    expect(r.score).toBe(20)
    expect(r.responses).toEqual([9, 10, 7, 8, 3])
  })

  it('scores 100 when all promoters and -100 when all detractors', () => {
    expect(calculateNPS([9, 10, 9]).score).toBe(100)
    expect(calculateNPS([0, 6, 3]).score).toBe(-100)
  })

  it('rounds the net percentage to an integer', () => {
    // 1 promoter, 2 detractors of 3 → 33.33 − 66.66 = -33.33 → round → -33
    expect(calculateNPS([9, 0, 6]).score).toBe(-33)
  })
})

describe('calculateCSAT', () => {
  it('returns the zeroed result for an empty array', () => {
    expect(calculateCSAT([])).toEqual({
      score: 0,
      positive: 0,
      negative: 0,
      total: 0,
      threshold: 4,
      responses: [],
    })
  })

  it('buckets at-or-above default threshold (4) as positive', () => {
    const r = calculateCSAT([5, 4, 3, 2]) // 2 positive (5,4), 2 negative (3,2)
    expect(r.positive).toBe(2)
    expect(r.negative).toBe(2)
    expect(r.total).toBe(4)
    expect(r.threshold).toBe(4)
    expect(r.score).toBe(50) // round(2/4 * 100)
  })

  it('honors a custom threshold', () => {
    const r = calculateCSAT([5, 4, 3], 5) // only 5 is positive
    expect(r.positive).toBe(1)
    expect(r.negative).toBe(2)
    expect(r.threshold).toBe(5)
    expect(r.score).toBe(33) // round(1/3 * 100)
  })
})

describe('calculateCES', () => {
  it('returns the zeroed result for an empty array', () => {
    expect(calculateCES([])).toEqual({
      score: 0,
      easy: 0,
      difficult: 0,
      neutral: 0,
      total: 0,
      responses: [],
    })
  })

  it('classifies easy (>=5), difficult (<=3), neutral (4) and averages', () => {
    const r = calculateCES([7, 5, 4, 3, 1]) // easy: 7,5 / neutral: 4 / difficult: 3,1
    expect(r.easy).toBe(2)
    expect(r.neutral).toBe(1)
    expect(r.difficult).toBe(2)
    expect(r.total).toBe(5)
    // average = (7+5+4+3+1)/5 = 4.0
    expect(r.score).toBe(4)
  })

  it('rounds the average to two decimal places', () => {
    // (1 + 2) / 2 = 1.5; (1 + 2 + 2) / 3 = 1.666... → 1.67
    expect(calculateCES([1, 2]).score).toBe(1.5)
    expect(calculateCES([1, 2, 2]).score).toBe(1.67)
  })
})
