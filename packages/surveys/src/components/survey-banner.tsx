'use client'

import type { ReactNode } from 'react'

export interface SurveyBannerProps {
  surveyId: string
  children?: ReactNode
  className?: string
}

export function SurveyBanner({ children, className }: SurveyBannerProps) {
  return <div className={className} data-survey-banner="">{children}</div>
}
