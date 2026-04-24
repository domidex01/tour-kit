'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import {
  type TourProgressVariants,
  tourProgressDotVariants,
  tourProgressVariants,
} from '../ui/progress-variants'

export interface TourProgressProps
  extends React.ComponentPropsWithoutRef<'div'>,
    TourProgressVariants {
  /** Current step (1-indexed) */
  current: number
  /** Total number of steps */
  total: number
}

export const TourProgress = React.forwardRef<HTMLDivElement, TourProgressProps>(
  ({ current, total, variant = 'dots', className, ...props }, ref) => {
    if (variant === 'text') {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(tourProgressVariants({ variant }), className)}
          {...props}
        >
          {current} of {total}
        </span>
      )
    }

    if (variant === 'bar') {
      const percentage = total > 0 ? (current / total) * 100 : 0
      return (
        // biome-ignore lint/a11y/useFocusableInteractive: Progress bar is read-only indicator
        <div
          ref={ref}
          className={cn(tourProgressVariants({ variant }), className)}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Step ${current} of ${total}`}
          {...props}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )
    }

    // Default: dots variant
    return (
      <div
        ref={ref}
        className={cn(tourProgressVariants({ variant }), className)}
        // biome-ignore lint/a11y/useSemanticElements: fieldset requires legend and has unwanted default styling
        role="group"
        aria-label={`Step ${current} of ${total}`}
        {...props}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-length dot array never reorders
            key={`dot-${i}`}
            className={cn(tourProgressDotVariants({ active: i + 1 === current }))}
            aria-current={i + 1 === current ? 'step' : undefined}
          />
        ))}
      </div>
    )
  }
)
TourProgress.displayName = 'TourProgress'
