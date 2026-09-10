/**
 * Internal barrel for the surveys engine. The PUBLIC door is
 * `src/engine/index.ts`; this one exists so in-package React files import one
 * path instead of six.
 */
export {
  type StepValidation,
  type SurveysEngine,
  type SurveysEngineOptions,
  createSurveysEngine,
  initialSurveysState,
  seedSurveysState,
} from './create-surveys-engine'
export { type SurveysHandle, createSurveysHandle } from './create-surveys-handle'
export {
  daysBetween,
  passesFrequencyGates,
  passesGlobalCooldown,
  passesSampling,
  passesSessionLimit,
  passesSnoozeLimit,
  type SurveyGateInput,
} from './frequency'
export { deserializeState, serializeState } from './persistence'
export { createInitialSurveyState, drainQueue, surveysReducer, updateSurvey } from './reducer'
export {
  DEFAULT_SURVEY_QUEUE_CONFIG,
  type AnswerValue,
  type DismissalReason,
  type DisplayMode,
  type EngineSurveyConfig,
  type FrequencyRule,
  type IsScheduleActive,
  type PriorityOrder,
  type StackBehavior,
  type SurveyPriority,
  type SurveyQueueConfig,
  type SurveyQueueItem,
  type SurveyState,
  type SurveyStorageAdapter,
  type SurveyType,
  type SurveysAction,
  type SurveysEngineState,
} from './types'
