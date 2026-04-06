'use client'

import type { ReactNode } from 'react'

export interface SurveyPopoverProps {
  surveyId: string
  children?: ReactNode
  className?: string
}

export function SurveyPopover({ children, className }: SurveyPopoverProps) {
  return (
    <div className={className} data-survey-popover="">
      {children}
    </div>
  )
}
