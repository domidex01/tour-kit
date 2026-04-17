'use client'

import * as React from 'react'
import { cn } from './cn'
import {
  type ChecklistProgressVariants,
  type ProgressBarVariants,
  checklistProgressVariants,
  progressBarVariants,
  progressTextVariants,
  progressTrackVariants,
} from './ui/progress-variants'

export interface ChecklistProgressProps
  extends React.ComponentPropsWithoutRef<'div'>,
    ChecklistProgressVariants,
    ProgressBarVariants {
  /** Current value */
  value: number
  /** Maximum value */
  max: number
  /** Show percentage text */
  showPercentage?: boolean
  /** Show count text (e.g., "3/5") */
  showCount?: boolean
  /** Track className */
  trackClassName?: string
  /** Bar className */
  barClassName?: string
}

/**
 * Progress bar component for checklists
 * Follows shadcn/ui patterns with CVA variants
 *
 * @example
 * ```tsx
 * <ChecklistProgress value={3} max={5} showPercentage />
 * ```
 *
 * @example
 * ```tsx
 * <ChecklistProgress value={3} max={5} size="lg" variant="success" />
 * ```
 */
export const ChecklistProgress = React.forwardRef<HTMLDivElement, ChecklistProgressProps>(
  (
    {
      value,
      max,
      showPercentage = false,
      showCount = false,
      size,
      variant,
      className,
      trackClassName,
      barClassName,
      ...props
    },
    ref
  ) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0

    return (
      <div ref={ref} className={cn(checklistProgressVariants({ size }), className)} {...props}>
        <div
          className={cn(progressTrackVariants({ size }), trackClassName)}
          role="progressbar"
          tabIndex={-1}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Progress: ${percentage}%`}
        >
          <div
            className={cn(progressBarVariants({ variant }), barClassName)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage && (
          <span className={cn(progressTextVariants({ size }), 'min-w-[3ch]')}>{percentage}%</span>
        )}
        {showCount && (
          <span className={progressTextVariants({ size })}>
            {value}/{max}
          </span>
        )}
      </div>
    )
  }
)
ChecklistProgress.displayName = 'ChecklistProgress'
