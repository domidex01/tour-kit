/** NPS (Net Promoter Score) calculation result */
export interface NPSResult {
  /** NPS score (-100 to 100) */
  score: number
  /** Count of promoters (9-10) */
  promoters: number
  /** Count of passives (7-8) */
  passives: number
  /** Count of detractors (0-6) */
  detractors: number
  /** Percentage of promoters */
  promoterPct: number
  /** Percentage of passives */
  passivePct: number
  /** Percentage of detractors */
  detractorPct: number
  /** Total number of responses */
  total: number
  /** Raw response values */
  responses: number[]
}

/** CSAT (Customer Satisfaction Score) calculation result */
export interface CSATResult {
  /** CSAT score (0-100, percentage of positive responses) */
  score: number
  /** Count of positive responses (at or above threshold) */
  positive: number
  /** Count of negative responses (below threshold) */
  negative: number
  /** Total number of responses */
  total: number
  /** The threshold value used for positive/negative split */
  threshold: number
  /** Raw response values */
  responses: number[]
}

/** CES (Customer Effort Score) calculation result */
export interface CESResult {
  /** CES score (average of all responses) */
  score: number
  /** Count of "easy" responses (>= 5 on 1-7 scale) */
  easy: number
  /** Count of "difficult" responses (<= 3 on 1-7 scale) */
  difficult: number
  /** Count of neutral responses (4 on 1-7 scale) */
  neutral: number
  /** Total number of responses */
  total: number
  /** Raw response values */
  responses: number[]
}
