import type { ReactNode } from 'react'
import type { AnswerValue } from './question'
import type { SurveyQueueConfig } from './queue'
import type { DismissalReason, SurveyConfig, SurveyState } from './survey'

/** Surveys context value exposed to consumers */
export interface SurveysContextValue {
  /** All registered survey states */
  surveys: Map<string, SurveyState>

  /** Currently active (visible) survey ID */
  activeSurvey: string | null

  /** Queue of pending survey IDs */
  queue: string[]

  /** Register a survey */
  register: (config: SurveyConfig) => void

  /** Unregister a survey */
  unregister: (id: string) => void

  /** Show a survey (may queue if another is active) */
  show: (id: string) => void

  /** Hide a survey temporarily */
  hide: (id: string) => void

  /** Dismiss a survey with a reason */
  dismiss: (id: string, reason?: DismissalReason) => void

  /** Snooze a survey (hide and schedule return) */
  snooze: (id: string) => void

  /** Record an answer for a question */
  answer: (surveyId: string, questionId: string, value: AnswerValue) => void

  /** Advance to the next question */
  nextQuestion: (surveyId: string) => void

  /** Go back to the previous question */
  prevQuestion: (surveyId: string) => void

  /** Mark a survey as completed */
  complete: (surveyId: string) => void

  /** Reset a survey to initial state */
  reset: (id: string) => void

  /** Reset all surveys */
  resetAll: () => void

  /** Get state for a specific survey */
  getState: (id: string) => SurveyState | undefined

  /** Get config for a specific survey */
  getConfig: (id: string) => SurveyConfig | undefined

  /** Check if a survey can be shown (respects frequency, cooldown, sampling) */
  canShow: (id: string) => boolean
}

/** Props for the SurveysProvider component */
export interface SurveysProviderProps {
  children: ReactNode

  /** Initial survey configurations to register */
  surveys?: SurveyConfig[]

  /** Queue configuration */
  queueConfig?: Partial<SurveyQueueConfig>

  /** Storage adapter for persistence (default: localStorage) */
  storage?: Storage | null

  /** Storage key prefix */
  storageKey?: string

  /** User context for audience targeting */
  userContext?: Record<string, unknown>

  /** Global cooldown in days between any two surveys (default: 14) */
  globalCooldownDays?: number

  /** Global sampling rate 0-1 (default: 1 = show to everyone) */
  samplingRate?: number

  /** Max surveys per session (default: 1) */
  maxPerSession?: number

  /** Callback when any survey is shown */
  onSurveyShow?: (id: string) => void

  /** Callback when any survey is dismissed */
  onSurveyDismiss?: (id: string, reason: DismissalReason) => void

  /** Callback when any survey is completed */
  onSurveyComplete?: (id: string, responses: Map<string, AnswerValue>) => void

  /** Callback when any question is answered */
  onSurveyAnswer?: (surveyId: string, questionId: string, value: AnswerValue) => void

  /** Callback when any survey is snoozed */
  onSurveySnooze?: (id: string) => void

  /** Callback when a question is answered (alias for analytics) */
  onQuestionAnswered?: (surveyId: string, questionId: string, value: AnswerValue) => void

  /** Callback when a score is calculated after survey completion */
  onScoreCalculated?: (
    surveyId: string,
    scoreType: 'nps' | 'csat' | 'ces',
    result:
      | import('./scoring').NPSResult
      | import('./scoring').CSATResult
      | import('./scoring').CESResult
  ) => void
}
