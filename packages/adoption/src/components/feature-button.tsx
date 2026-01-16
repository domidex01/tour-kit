import * as React from 'react'
import { useFeature } from '../hooks'
import { Slot, UnifiedSlot } from '../lib/slot'
import { useUILibrary } from '../lib/ui-library-context'
import { cn } from '../lib/utils'
import { type FeatureButtonVariants, featureButtonVariants } from './ui/button-variants'

export interface FeatureButtonProps
  extends React.ComponentPropsWithoutRef<'button'>,
    FeatureButtonVariants {
  /** Feature ID to track */
  featureId: string
  /** Show "new" indicator if not adopted */
  showNewIndicator?: boolean
  /** Use custom element via Slot */
  asChild?: boolean
}

/**
 * Button wrapper that automatically tracks feature usage
 * Follows shadcn/ui patterns with forwardRef and cva variants
 */
export const FeatureButton = React.forwardRef<HTMLButtonElement, FeatureButtonProps>(
  (
    {
      featureId,
      showNewIndicator = true,
      children,
      onClick,
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const library = useUILibrary()
    const { isAdopted, trackUsage } = useFeature(featureId)

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        trackUsage()
        onClick?.(e)
      },
      [trackUsage, onClick]
    )

    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        onClick={handleClick}
        className={cn(featureButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
        {showNewIndicator && !isAdopted && (
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive"
            aria-label="New feature"
          />
        )}
      </Comp>
    )
  }
)
FeatureButton.displayName = 'FeatureButton'
