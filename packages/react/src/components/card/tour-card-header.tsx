'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { TourClose } from '../navigation/tour-close'
import { type TourCardHeaderVariants, tourCardHeaderVariants } from '../ui/card-variants'

export interface TourCardHeaderProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'>,
    TourCardHeaderVariants {
  /** Title content */
  title?: React.ReactNode
  /** ID for accessibility (aria-labelledby) */
  titleId: string
  /** Whether to show the close button */
  showClose?: boolean
  /** Visible step-of-N indicator. When non-null, renders a decorative
   * `<span aria-hidden="true">{current} / {total}</span>` before the title.
   * The SR announcement is owned by the parent dialog's `aria-label`. */
  stepIndicator?: { current: number; total: number } | null
}

export const TourCardHeader = React.forwardRef<HTMLDivElement, TourCardHeaderProps>(
  (
    { title, titleId, showClose = true, spacing, stepIndicator, className, children, ...props },
    ref
  ) => {
    if (!title && !showClose && !children && !stepIndicator) return null

    return (
      <div ref={ref} className={cn(tourCardHeaderVariants({ spacing }), className)} {...props}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {stepIndicator && (
            <span
              aria-hidden="true"
              className="text-xs font-medium text-muted-foreground tabular-nums"
              data-slot="tour-step-indicator"
            >
              {stepIndicator.current} / {stepIndicator.total}
            </span>
          )}
          {title && (
            <h3 id={titleId} className="font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
        </div>
        {children}
        {showClose && <TourClose />}
      </div>
    )
  }
)
TourCardHeader.displayName = 'TourCardHeader'
