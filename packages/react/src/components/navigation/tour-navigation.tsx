'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { type TourButtonVariants, tourButtonVariants } from '../ui/button-variants'

export interface TourNavigationProps extends React.ComponentPropsWithoutRef<'div'> {
  isFirstStep: boolean
  isLastStep: boolean
  onPrev: () => void
  onNext: () => void
  onSkip?: () => void
  prevLabel?: string
  nextLabel?: string
  finishLabel?: string
  skipLabel?: string
  /** Custom button variant for previous button */
  prevVariant?: TourButtonVariants['variant']
  /** Custom button variant for next button */
  nextVariant?: TourButtonVariants['variant']
}

export const TourNavigation = React.forwardRef<HTMLDivElement, TourNavigationProps>(
  (
    {
      isFirstStep,
      isLastStep,
      onPrev,
      onNext,
      onSkip,
      className,
      prevLabel = 'Back',
      nextLabel = 'Next',
      finishLabel = 'Finish',
      skipLabel = 'Skip',
      prevVariant = 'secondary',
      nextVariant = 'default',
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
        {onSkip && !isLastStep && (
          <button
            type="button"
            onClick={onSkip}
            className={cn(tourButtonVariants({ variant: 'link', size: 'sm' }))}
          >
            {skipLabel}
          </button>
        )}
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrev}
            className={cn(tourButtonVariants({ variant: prevVariant, size: 'sm' }))}
          >
            {prevLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className={cn(tourButtonVariants({ variant: nextVariant, size: 'sm' }))}
        >
          {isLastStep ? finishLabel : nextLabel}
        </button>
      </div>
    )
  }
)
TourNavigation.displayName = 'TourNavigation'
