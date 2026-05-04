'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { type TourCardContentVariants, tourCardContentVariants } from '../ui/card-variants'

export interface TourCardContentProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    TourCardContentVariants {
  /** Content to display */
  content?: React.ReactNode
  /** Optional short description rendered above `content` (Phase 3a). */
  description?: React.ReactNode
}

export const TourCardContent = React.forwardRef<HTMLDivElement, TourCardContentProps>(
  ({ content, description, spacing, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(tourCardContentVariants({ spacing }), className)} {...props}>
        {description && (
          <p className="text-sm text-muted-foreground" data-slot="tour-card-description">
            {description}
          </p>
        )}
        {children ?? content}
      </div>
    )
  }
)
TourCardContent.displayName = 'TourCardContent'
