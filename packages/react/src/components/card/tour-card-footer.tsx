'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { TourNavigation } from '../navigation/tour-navigation'
import { TourProgress } from '../navigation/tour-progress'
import { type TourCardFooterVariants, tourCardFooterVariants } from '../ui/card-variants'

export interface TourCardFooterProps
  extends React.ComponentPropsWithoutRef<'div'>,
    TourCardFooterVariants {
  currentStep: number
  totalSteps: number
  showNavigation?: boolean
  showProgress?: boolean
  isFirstStep: boolean
  isLastStep: boolean
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
}

export const TourCardFooter = React.forwardRef<HTMLDivElement, TourCardFooterProps>(
  (
    {
      currentStep,
      totalSteps,
      showNavigation = true,
      showProgress = true,
      isFirstStep,
      isLastStep,
      onPrev,
      onNext,
      onSkip,
      justify,
      spacing,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(tourCardFooterVariants({ justify, spacing }), className)}
        {...props}
      >
        {showProgress && <TourProgress current={currentStep} total={totalSteps} />}
        {children}
        {showNavigation && (
          <TourNavigation
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onPrev={onPrev}
            onNext={onNext}
            onSkip={onSkip}
          />
        )}
      </div>
    )
  }
)
TourCardFooter.displayName = 'TourCardFooter'
