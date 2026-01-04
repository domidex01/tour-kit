import * as React from 'react'
import { useFeature } from '../hooks'
import { cn } from '../lib/utils'
import { type NewFeatureBadgeVariants, newFeatureBadgeVariants } from './ui/badge-variants'

export interface NewFeatureBadgeProps
  extends React.ComponentPropsWithoutRef<'span'>,
    NewFeatureBadgeVariants {
  /** Feature ID to check */
  featureId: string
  /** Badge text */
  text?: string
}

/**
 * Badge that shows "New" for unadopted features
 * Follows shadcn/ui patterns with forwardRef and cva variants
 */
export const NewFeatureBadge = React.forwardRef<HTMLSpanElement, NewFeatureBadgeProps>(
  ({ featureId, text = 'New', className, variant, size, ...props }, ref) => {
    const { isAdopted } = useFeature(featureId)

    if (isAdopted) {
      return null
    }

    return (
      <span
        ref={ref}
        className={cn(newFeatureBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {text}
      </span>
    )
  }
)
NewFeatureBadge.displayName = 'NewFeatureBadge'
