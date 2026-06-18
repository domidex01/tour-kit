'use client'

import type { ReactNode } from 'react'
import { type UseSurveyReturn, useSurvey } from '../../hooks/use-survey'

// Mirrors the single-survey control surface of `useSurvey`, plus the survey id.
// Derived from `UseSurveyReturn` so the two can't drift — adding a method to the
// hook automatically flows here.
export interface HeadlessSurveyRenderProps extends UseSurveyReturn {
  surveyId: string
}

export interface HeadlessSurveyProps {
  surveyId: string
  children: (props: HeadlessSurveyRenderProps) => ReactNode
}

export function HeadlessSurvey({ surveyId, children }: HeadlessSurveyProps) {
  const survey = useSurvey(surveyId)
  return <>{children({ surveyId, ...survey })}</>
}
