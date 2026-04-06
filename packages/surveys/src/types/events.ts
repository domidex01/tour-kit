import type { SurveyType, DisplayMode, DismissalReason } from './survey'
import type { QuestionType, AnswerValue } from './question'

/** Survey analytics event types */
export type SurveyEventType =
  | 'survey_registered'
  | 'survey_shown'
  | 'survey_dismissed'
  | 'survey_snoozed'
  | 'survey_completed'
  | 'survey_question_answered'
  | 'survey_score_calculated'

/** Base survey event */
export interface BaseSurveyEvent {
  type: SurveyEventType
  surveyId: string
  surveyType: SurveyType
  displayMode: DisplayMode
  timestamp: number
  metadata?: Record<string, unknown>
}

/** Survey registered event */
export interface SurveyRegisteredEvent extends BaseSurveyEvent {
  type: 'survey_registered'
}

/** Survey shown event */
export interface SurveyShownEvent extends BaseSurveyEvent {
  type: 'survey_shown'
  viewCount: number
  fromQueue: boolean
}

/** Survey dismissed event */
export interface SurveyDismissedEvent extends BaseSurveyEvent {
  type: 'survey_dismissed'
  reason: DismissalReason
  viewDuration: number
}

/** Survey snoozed event */
export interface SurveySnoozedEvent extends BaseSurveyEvent {
  type: 'survey_snoozed'
  snoozeCount: number
  snoozeUntil: Date
}

/** Survey completed event */
export interface SurveyCompletedEvent extends BaseSurveyEvent {
  type: 'survey_completed'
  viewDuration: number
  responses: Map<string, AnswerValue>
  /** Percentage of questions answered (0-100) */
  completionRate: number
}

/** Question answered event */
export interface SurveyQuestionAnsweredEvent extends BaseSurveyEvent {
  type: 'survey_question_answered'
  questionId: string
  questionType: QuestionType
  stepIndex: number
}

/** Score calculated event */
export interface SurveyScoreCalculatedEvent extends BaseSurveyEvent {
  type: 'survey_score_calculated'
  scoreType: 'nps' | 'csat' | 'ces'
  score: number
}

/** Discriminated union of all survey events */
export type SurveyEvent =
  | SurveyRegisteredEvent
  | SurveyShownEvent
  | SurveyDismissedEvent
  | SurveySnoozedEvent
  | SurveyCompletedEvent
  | SurveyQuestionAnsweredEvent
  | SurveyScoreCalculatedEvent
