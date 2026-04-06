// Types
export * from './types'

// Core logic
export * from './core'

// Context
export { SurveysProvider } from './context'
export { useSurveysContext } from './context'

// Hooks
export { useSurvey, useSurveys, useSurveyScoring } from './hooks'

// Components
export { QuestionRating } from './components/question-rating'
export type { QuestionRatingProps } from './components/question-rating'

export { QuestionText } from './components/question-text'
export type { QuestionTextProps } from './components/question-text'

export { QuestionSelect } from './components/question-select'
export type { QuestionSelectProps } from './components/question-select'

export { QuestionBoolean } from './components/question-boolean'
export type { QuestionBooleanProps } from './components/question-boolean'

export { SurveyProgress } from './components/survey-progress'
export type { SurveyProgressProps } from './components/survey-progress'

// CVA variants
export {
  ratingOptionVariants,
  textInputVariants,
  selectOptionVariants,
  booleanOptionVariants,
  progressBarVariants,
} from './components/ui/question-variants'
