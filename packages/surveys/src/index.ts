// Types
export type {
  SurveyConfig,
  SurveyState,
  SurveyType,
  DisplayMode,
  SurveyPriority,
  FrequencyRule,
  DismissalReason,
  SurveyStorageAdapter,
  ModalOptions,
  SlideoutOptions,
  BannerOptions,
  PopoverOptions,
  AudienceCondition,
  SlideoutPosition,
  BannerPosition,
  PopoverPosition,
} from './types/survey'

export type {
  QuestionConfig,
  QuestionType,
  AnswerValue,
  SkipLogic,
  RatingScale,
  SelectOption,
} from './types/question'

export type {
  NPSResult,
  CSATResult,
  CESResult,
} from './types/scoring'

export type {
  SurveysContextValue,
  SurveysProviderProps,
} from './types/context'

export type {
  SurveyEvent,
  SurveyEventType,
  BaseSurveyEvent,
  SurveyShownEvent,
  SurveyDismissedEvent,
  SurveySnoozedEvent,
  SurveyCompletedEvent,
  SurveyQuestionAnsweredEvent,
  SurveyScoreCalculatedEvent,
} from './types/events'

export type {
  SurveyQueueConfig,
  SurveyQueueItem,
  PriorityOrder,
  StackBehavior,
} from './types/queue'

// Provider
export { SurveysProvider } from './context'
export { useSurveysContext } from './context'

// Hooks
export { useSurvey, useSurveys, useSurveyScoring } from './hooks'

// Scoring functions
export { calculateNPS, calculateCSAT, calculateCES } from './core/scoring'

// Styled display components
export { SurveyPopover } from './components'
export { SurveyModal } from './components'
export { SurveySlideout } from './components'
export { SurveyBanner } from './components'
export { SurveyInline } from './components'

// Question components
export { QuestionRating } from './components'
export type { QuestionRatingProps } from './components'

export { QuestionText } from './components'
export type { QuestionTextProps } from './components'

export { QuestionSelect } from './components'
export type { QuestionSelectProps } from './components'

export { QuestionBoolean } from './components'
export type { QuestionBooleanProps } from './components'

export { QuestionMedia } from './components'
export type { QuestionMediaProps } from './components'

export { SurveyProgress } from './components'
export type { SurveyProgressProps } from './components'

// CVA variants
export {
  ratingOptionVariants,
  textInputVariants,
  selectOptionVariants,
  booleanOptionVariants,
  progressBarVariants,
} from './components/ui/question-variants'

export { modalContentVariants, modalOverlayVariants } from './components/ui/modal-variants'

export {
  slideoutContentVariants,
  slideoutOverlayVariants,
} from './components/ui/slideout-variants'

// Accessibility hooks (re-exported for ergonomic in-package access)
export { useReducedMotion } from '@tour-kit/core'
