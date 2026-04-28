'use client'

import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import { cn } from '../lib/utils'

export interface SurveyInlineProps extends React.HTMLAttributes<HTMLDivElement> {
  surveyId: string
  /** If true, the inline survey renders even when the survey is hidden (useful for preview) */
  alwaysRender?: boolean
  children?: React.ReactNode
}

export const SurveyInline = React.forwardRef<HTMLDivElement, SurveyInlineProps>(
  ({ surveyId, alwaysRender = false, className, children, ...props }, ref) => {
    const survey = useSurvey(surveyId)
    if (!alwaysRender && !survey.state?.isVisible) return null

    return (
      <div
        ref={ref}
        // biome-ignore lint/a11y/useSemanticElements: <section> would require changing forwardRef to HTMLElement, breaking the public ref type
        role="region"
        aria-label={survey.config?.title ?? 'Survey'}
        data-survey-inline={surveyId}
        className={cn('flex flex-col gap-4', className)}
        {...props}
      >
        {survey.config?.title && <h3 className="font-medium">{survey.config.title}</h3>}
        {survey.config?.description && typeof survey.config.description === 'string' && (
          <p className="text-sm text-muted-foreground">{survey.config.description}</p>
        )}
        {children}
      </div>
    )
  }
)
SurveyInline.displayName = 'SurveyInline'
