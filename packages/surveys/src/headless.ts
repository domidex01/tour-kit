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
export { calculateNPS, calculateCSAT, calculateCES } from './core'

// Headless components
export { HeadlessSurvey } from './components/headless'
export { HeadlessQuestionRating } from './components/headless'
export { HeadlessQuestionText } from './components/headless'
export { HeadlessQuestionSelect } from './components/headless'
export { HeadlessQuestionBoolean } from './components/headless'
