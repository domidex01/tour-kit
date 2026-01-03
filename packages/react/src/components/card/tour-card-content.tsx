import * as React from 'react'
import { cn } from '../../lib/utils'
import { type TourCardContentVariants, tourCardContentVariants } from '../ui/card-variants'

export interface TourCardContentProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    TourCardContentVariants {
  /** Content to display */
  content?: React.ReactNode
}

export const TourCardContent = React.forwardRef<HTMLDivElement, TourCardContentProps>(
  ({ content, spacing, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(tourCardContentVariants({ spacing }), className)} {...props}>
        {children ?? content}
      </div>
    )
  }
)
TourCardContent.displayName = 'TourCardContent'
