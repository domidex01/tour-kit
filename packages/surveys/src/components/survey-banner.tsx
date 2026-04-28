'use client'

import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import { cn } from '../lib/utils'
import type { BannerOptions } from '../types/survey'
import { bannerVariants } from './ui/banner-variants'

export interface SurveyBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof bannerVariants> {
  surveyId: string
  options?: BannerOptions
  children?: React.ReactNode
}

export const SurveyBanner = React.forwardRef<HTMLDivElement, SurveyBannerProps>(
  ({ surveyId, position, intent, sticky, options, className, children, ...props }, ref) => {
    const survey = useSurvey(surveyId)
    const config = survey.config

    const bannerOptions: BannerOptions = {
      position: 'top',
      sticky: false,
      dismissable: true,
      intent: 'info',
      ...options,
      ...config?.bannerOptions,
    }

    const effectivePosition = position ?? bannerOptions.position ?? 'top'
    const effectiveIntent = intent ?? bannerOptions.intent ?? 'info'
    const effectiveSticky = sticky ?? bannerOptions.sticky ?? false

    if (!survey.state?.isVisible) return null

    return (
      <div
        ref={ref}
        // biome-ignore lint/a11y/useSemanticElements: <section> would require changing forwardRef to HTMLElement, breaking the public ref type
        role="region"
        aria-label={config?.title ?? 'Survey banner'}
        className={cn(
          bannerVariants({
            position: effectivePosition,
            intent: effectiveIntent,
            sticky: effectiveSticky,
          }),
          className
        )}
        data-survey-banner={surveyId}
        {...props}
      >
        <div className="flex flex-col gap-1">
          {config?.title && <span className="font-medium">{config.title}</span>}
          {config?.description && typeof config.description === 'string' && (
            <span className="text-xs opacity-80">{config.description}</span>
          )}
          {children}
        </div>
        {bannerOptions.dismissable && (
          <button
            type="button"
            aria-label="Dismiss survey"
            onClick={() => survey.dismiss('close_button')}
            className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    )
  }
)
SurveyBanner.displayName = 'SurveyBanner'
