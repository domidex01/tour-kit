'use client'

import type { ReactNode } from 'react'

export interface SurveyInlineProps {
  surveyId: string
  children?: ReactNode
  className?: string
}

export function SurveyInline({ children, className }: SurveyInlineProps) {
  return <div className={className} data-survey-inline="">{children}</div>
}
