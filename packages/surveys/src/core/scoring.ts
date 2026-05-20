import type { CESResult, CSATResult, NPSResult } from '../types/scoring'

/**
 * Single-score NPS bucket. Mirrors the aggregate cutoffs used by
 * `calculateNPS`: promoters ≥ 9, passives 7–8, detractors ≤ 6.
 */
export type NpsCategory = 'promoter' | 'passive' | 'detractor'

/**
 * Single-score CES bucket. Mirrors the aggregate cutoffs used by
 * `calculateCES`: easy ≥ 5, neutral = 4, difficult ≤ 3.
 */
export type CesCategory = 'easy' | 'neutral' | 'difficult'

/**
 * Bucket a single NPS score into its category. Use this in turnkey modal
 * `onSubmit` callbacks so consumers don't re-implement the cutoffs.
 */
export function computeNpsCategory(score: number): NpsCategory {
  if (score >= 9) return 'promoter'
  if (score >= 7) return 'passive'
  return 'detractor'
}

/**
 * Bucket a single CES score into its category. Use this in turnkey modal
 * `onSubmit` callbacks so consumers don't re-implement the cutoffs.
 */
export function computeCesCategory(score: number): CesCategory {
  if (score >= 5) return 'easy'
  if (score <= 3) return 'difficult'
  return 'neutral'
}

/**
 * Calculate Net Promoter Score from an array of ratings (0-10).
 * Promoters: 9-10, Passives: 7-8, Detractors: 0-6
 */
export function calculateNPS(responses: number[]): NPSResult {
  const total = responses.length
  if (total === 0) {
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoterPct: 0,
      passivePct: 0,
      detractorPct: 0,
      total: 0,
      responses: [],
    }
  }

  let promoters = 0
  let passives = 0
  let detractors = 0

  for (const r of responses) {
    if (r >= 9) promoters++
    else if (r >= 7) passives++
    else detractors++
  }

  const promoterPct = (promoters / total) * 100
  const passivePct = (passives / total) * 100
  const detractorPct = (detractors / total) * 100

  return {
    score: Math.round(promoterPct - detractorPct),
    promoters,
    passives,
    detractors,
    promoterPct,
    passivePct,
    detractorPct,
    total,
    responses,
  }
}

/**
 * Calculate Customer Satisfaction Score.
 * Score = percentage of responses at or above threshold.
 * Default threshold: 4 on a 1-5 scale.
 */
export function calculateCSAT(responses: number[], threshold = 4): CSATResult {
  const total = responses.length
  if (total === 0) {
    return { score: 0, positive: 0, negative: 0, total: 0, threshold, responses: [] }
  }

  let positive = 0
  let negative = 0

  for (const r of responses) {
    if (r >= threshold) positive++
    else negative++
  }

  return {
    score: Math.round((positive / total) * 100),
    positive,
    negative,
    total,
    threshold,
    responses,
  }
}

/**
 * Calculate Customer Effort Score.
 * Score = average of all responses.
 * On a 1-7 scale: easy >= 5, difficult <= 3, neutral = 4.
 */
export function calculateCES(responses: number[]): CESResult {
  const total = responses.length
  if (total === 0) {
    return { score: 0, easy: 0, difficult: 0, neutral: 0, total: 0, responses: [] }
  }

  let easy = 0
  let difficult = 0
  let neutral = 0
  let sum = 0

  for (const r of responses) {
    sum += r
    if (r >= 5) easy++
    else if (r <= 3) difficult++
    else neutral++
  }

  return {
    score: Math.round((sum / total) * 100) / 100,
    easy,
    difficult,
    neutral,
    total,
    responses,
  }
}
