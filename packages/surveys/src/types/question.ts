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
  label: string
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
  /** Question prompt text */
  text: string
  /** Optional description or helper text */
  description?: string
  /** Whether an answer is required before advancing */
  required?: boolean
  /** Placeholder text for text inputs */
  placeholder?: string
  /** Rating scale config (only for 'rating' type) */
  ratingScale?: RatingScale
  /** Options (only for 'single-select' and 'multi-select' types) */
  options?: SelectOption[]
  /** Maximum character length (only for 'text' and 'textarea' types) */
  maxLength?: number
  /** Skip logic rules evaluated after this question is answered */
  skipLogic?: SkipLogic[]
  /** Custom validation function */
  validation?: (value: AnswerValue) => string | null
}
