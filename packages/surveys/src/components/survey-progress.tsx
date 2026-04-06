'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import { progressBarVariants } from './ui/question-variants'

export interface SurveyProgressProps {
  /** Current step (1-based) */
  current: number
  /** Total number of steps */
  total: number
  /** Display mode: text, bar, or both */
  mode?: 'text' | 'bar' | 'both'
  /** Label template with {current} and {total} placeholders */
  labelTemplate?: string
  /** Additional class names */
  className?: string
  /** Size variant for the progress bar */
  size?: 'sm' | 'md' | 'lg'
}

const SurveyProgress = React.forwardRef<HTMLDivElement, SurveyProgressProps>(
  (
    {
      current,
      total,
      mode = 'both',
      labelTemplate = 'Question {current} of {total}',
      className,
      size = 'md',
    },
    ref
  ) => {
    if (total <= 1) {
      return null
    }

    const progressText = labelTemplate
      .replace('{current}', String(current))
      .replace('{total}', String(total))

    const percentage = Math.round((current / total) * 100)

    const showText = mode === 'text' || mode === 'both'
    const showBar = mode === 'bar' || mode === 'both'

    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)}>
        {showText && (
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {progressText}
          </span>
        )}
        {showBar && (
          <div className="w-full rounded-full bg-secondary">
            {/* biome-ignore lint/a11y/useFocusableInteractive: progressbar is a visual indicator, not an interactive control */}
            <div
              role="progressbar"
              aria-valuenow={current}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label="Survey progress"
              className={cn(progressBarVariants({ size }))}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    )
  }
)
SurveyProgress.displayName = 'SurveyProgress'

export { SurveyProgress }
