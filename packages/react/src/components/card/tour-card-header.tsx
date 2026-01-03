import * as React from 'react'
import { cn } from '../../lib/utils'
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
}

export const TourCardHeader = React.forwardRef<HTMLDivElement, TourCardHeaderProps>(
  ({ title, titleId, showClose = true, spacing, className, children, ...props }, ref) => {
    if (!title && !showClose && !children) return null

    return (
      <div ref={ref} className={cn(tourCardHeaderVariants({ spacing }), className)} {...props}>
        {title && (
          <h3 id={titleId} className="font-semibold leading-none tracking-tight">
            {title}
          </h3>
        )}
        {children}
        {showClose && <TourClose />}
      </div>
    )
  }
)
TourCardHeader.displayName = 'TourCardHeader'
