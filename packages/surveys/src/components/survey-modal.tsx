'use client'

import type { ReactNode } from 'react'

export interface SurveyModalProps {
  surveyId: string
  children?: ReactNode
  className?: string
}

export function SurveyModal({ children, className }: SurveyModalProps) {
  return (
    <div className={className} data-survey-modal="">
      {children}
    </div>
  )
}
