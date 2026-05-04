import type { LocalizedText } from '@tour-kit/core'
import type { MediaSlotProps } from '@tour-kit/media'

/** Question input types */
export type QuestionType =
  | 'rating'
  | 'text'
  | 'textarea'
  | 'single-select'
  | 'multi-select'
  | 'boolean'

/** Answer value union covering all question types */
export type AnswerValue = string | number | boolean | string[]

/**
 * Preset rating shapes that fill in `min`/`max`/`style`/`emojiMap` defaults
 * so consumers can ship the two most common rating UIs without composing
 * `RatingScale` by hand.
 *
 * - `'stars'` → `min: 1, max: 5, style: 'stars'`
 * - `'thumbs'` → `min: 1, max: 3, style: 'emoji'` with map `1: 👎, 2: 😐, 3: 👍`
 *
 * Thumbs values are `1, 2, 3` (not `-1, 0, 1`) so they fit the existing
 * `RatingScale.min/max` contract and the existing scoring engine doesn't need
 * to change.
 */
export type RatingPreset = 'thumbs' | 'stars'

/** Rating scale configuration */
export interface RatingScale {
  /** Minimum value (e.g., 0 for NPS, 1 for stars) */
  min: number
  /** Maximum value (e.g., 10 for NPS, 5 for stars) */
  max: number
  /** Step increment (default: 1) */
  step?: number
  /** Labels for min and max extremes */
  labels?: {
    min?: string
    max?: string
  }
  /** Visual style for the rating */
  style?: 'numeric' | 'stars' | 'emoji'
}

/** Option for single-select and multi-select questions */
export interface SelectOption {
  value: string
  /** Option label — `LocalizedText` (string template or `{ key }`). */
  label: LocalizedText
  disabled?: boolean
}

/** Skip logic rule for conditional question flow */
export interface SkipLogic {
  /** Question whose answer triggers this rule */
  questionId: string
  /** Condition evaluated against the answer */
  condition: (answer: AnswerValue) => boolean
  /** Target question to skip to when condition is true */
  skipTo: string
}

/** Configuration for a single question */
export interface QuestionConfig {
  /** Unique identifier within the survey */
  id: string
  /** Question input type */
  type: QuestionType
  /** Question prompt text — `LocalizedText` (string template or `{ key }`). */
  text: LocalizedText
  /** Optional description or helper text — `LocalizedText`. */
  description?: LocalizedText
  /**
   * Optional media (video / GIF / Lottie / image) rendered above the question
   * prompt. Auto-detects the embed provider via URL pattern matching.
   */
  media?: MediaSlotProps
  /** Whether an answer is required before advancing */
  required?: boolean
  /** Placeholder text for text inputs — `LocalizedText`. */
  placeholder?: LocalizedText
  /** Rating scale config (only for 'rating' type). Wins over `preset` when both are set. */
  ratingScale?: RatingScale
  /**
   * Optional rating preset that fills in `min`/`max`/`style`/`emojiMap` defaults.
   * Only meaningful when `type === 'rating'`. Explicit `ratingScale` overrides.
   */
  preset?: RatingPreset
  /** Options (only for 'single-select' and 'multi-select' types) */
  options?: SelectOption[]
  /** Maximum character length (only for 'text' and 'textarea' types) */
  maxLength?: number
  /** Skip logic rules evaluated after this question is answered */
  skipLogic?: SkipLogic[]
  /** Custom validation function */
  validation?: (value: AnswerValue) => string | null
}
