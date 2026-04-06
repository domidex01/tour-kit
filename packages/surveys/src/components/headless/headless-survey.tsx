'use client'

import type { ReactNode } from 'react'

export interface HeadlessSurveyRenderProps {
  surveyId: string
}

export interface HeadlessSurveyProps {
  surveyId: string
  children: (props: HeadlessSurveyRenderProps) => ReactNode
}

export function HeadlessSurvey({ surveyId, children }: HeadlessSurveyProps) {
  return <>{children({ surveyId })}</>
}
