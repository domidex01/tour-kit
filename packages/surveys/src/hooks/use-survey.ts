import { useMemo } from 'react'
import { useSurveysContext } from '../context/surveys-context'
import type { AnswerValue } from '../types/question'
import type { DismissalReason, SurveyConfig, SurveyState } from '../types/survey'

interface UseSurveyReturn {
  state: SurveyState | undefined
  config: SurveyConfig | undefined
  show: () => void
  hide: () => void
  dismiss: (reason?: DismissalReason) => void
  snooze: () => void
  answer: (questionId: string, value: AnswerValue) => void
  nextQuestion: () => void
  prevQuestion: () => void
  complete: () => void
  reset: () => void
  canShow: boolean
}

/**
 * Access and control a single survey by ID.
 * Must be used within a SurveysProvider.
 */
export function useSurvey(surveyId: string): UseSurveyReturn {
  const ctx = useSurveysContext()

  return useMemo(
    () => ({
      state: ctx.getState(surveyId),
      config: ctx.getConfig(surveyId),
      show: () => ctx.show(surveyId),
      hide: () => ctx.hide(surveyId),
      dismiss: (reason?: DismissalReason) => ctx.dismiss(surveyId, reason),
      snooze: () => ctx.snooze(surveyId),
      answer: (questionId: string, value: AnswerValue) =>
        ctx.answer(surveyId, questionId, value),
      nextQuestion: () => ctx.nextQuestion(surveyId),
      prevQuestion: () => ctx.prevQuestion(surveyId),
      complete: () => ctx.complete(surveyId),
      reset: () => ctx.reset(surveyId),
      canShow: ctx.canShow(surveyId),
    }),
    [ctx, surveyId],
  )
}
