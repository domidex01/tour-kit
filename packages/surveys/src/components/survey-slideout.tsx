'use client'

import type { ReactNode } from 'react'

export interface SurveySlideoutProps {
  surveyId: string
  children?: ReactNode
  className?: string
}

export function SurveySlideout({ children, className }: SurveySlideoutProps) {
  return <div className={className} data-survey-slideout="">{children}</div>
}
