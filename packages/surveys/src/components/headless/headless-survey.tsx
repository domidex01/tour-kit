'use client'

import type { ReactNode } from 'react'
import { useSurvey } from '../../hooks/use-survey'
import type { AnswerValue } from '../../types/question'
import type { DismissalReason, SurveyConfig, SurveyState } from '../../types/survey'

export interface HeadlessSurveyRenderProps {
  surveyId: string
  state: SurveyState | undefined
  config: SurveyConfig | undefined
  canShow: boolean
  show: () => void
  hide: () => void
  dismiss: (reason?: DismissalReason) => void
  snooze: () => void
  answer: (questionId: string, value: AnswerValue) => void
  nextQuestion: () => void
  prevQuestion: () => void
  complete: () => void
  reset: () => void
}

export interface HeadlessSurveyProps {
  surveyId: string
  children: (props: HeadlessSurveyRenderProps) => ReactNode
}

export function HeadlessSurvey({ surveyId, children }: HeadlessSurveyProps) {
  const survey = useSurvey(surveyId)
  return <>{children({ surveyId, ...survey })}</>
}
