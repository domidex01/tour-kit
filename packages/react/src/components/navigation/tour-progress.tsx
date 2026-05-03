'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
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
    if (variant === 'none') return null

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

    if (variant === 'bar' || variant === 'narrow') {
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

    if (variant === 'chain') {
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
          {Array.from({ length: total }, (_, i) => {
            const status =
              i + 1 < current ? 'completed' : i + 1 === current ? 'active' : 'pending'
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-length segment array never reorders
                key={`seg-${i}`}
                data-status={status}
                className="h-1 flex-1 rounded-full bg-muted data-[status=completed]:bg-primary data-[status=active]:bg-primary"
              />
            )
          })}
        </div>
      )
    }

    if (variant === 'numbered') {
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
          <span className="font-medium">{current}</span>
          <span className="text-muted-foreground">/</span>
          <span>{total}</span>
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
