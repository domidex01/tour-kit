'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { useNudge } from '../hooks'
import { Slot, UnifiedSlot } from '../lib/slot'
import { useUILibrary } from '../lib/ui-library-context'
import type { Feature } from '../types'
import { featureButtonVariants } from './ui/button-variants'
import { type AdoptionNudgeVariants, adoptionNudgeVariants } from './ui/nudge-variants'

export interface NudgeRenderProps {
  feature: Feature
  onDismiss: () => void
  onSnooze: (durationMs: number) => void
  onClick: () => void
}

export interface AdoptionNudgeProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionNudgeVariants {
  /** Custom render function for nudge UI */
  render?: (props: NudgeRenderProps) => React.ReactNode
  /** Delay before showing nudge (ms) */
  delay?: number
  /** Use custom element via Slot */
  asChild?: boolean
}

/**
 * Component that automatically shows nudges for unadopted features
 * Follows shadcn/ui patterns with forwardRef and cva variants
 */
export const AdoptionNudge = React.forwardRef<HTMLDivElement, AdoptionNudgeProps>(
  ({ render, delay = 5000, className, position, size, asChild = false, ...props }, ref) => {
    const library = useUILibrary()
    const { pendingNudges, showNudge, dismissNudge, snoozeNudge, handleNudgeClick } = useNudge()
    const [activeFeature, setActiveFeature] = React.useState<Feature | null>(null)
    const [visible, setVisible] = React.useState(false)

    // Show first pending nudge after delay
    React.useEffect(() => {
      if (pendingNudges.length === 0) {
        setActiveFeature(null)
        setVisible(false)
        return
      }

      const timer = setTimeout(() => {
        const feature = pendingNudges[0]
        setActiveFeature(feature)
        setVisible(true)
        showNudge(feature.id)
      }, delay)

      return () => clearTimeout(timer)
    }, [pendingNudges, delay, showNudge])

    if (!visible || !activeFeature) {
      return null
    }

    const handleDismiss = () => {
      dismissNudge(activeFeature.id)
      setVisible(false)
    }

    const handleSnooze = (durationMs: number) => {
      snoozeNudge(activeFeature.id, durationMs)
      setVisible(false)
    }

    const handleClick = () => {
      handleNudgeClick(activeFeature.id)
      setVisible(false)
    }

    // Custom render
    if (render) {
      return (
        <>
          {render({
            feature: activeFeature,
            onDismiss: handleDismiss,
            onSnooze: handleSnooze,
            onClick: handleClick,
          })}
        </>
      )
    }

    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'div'

    // Default render with shadcn/ui styling
    return (
      <Comp
        ref={ref}
        className={cn(adoptionNudgeVariants({ position, size }), className)}
        {...props}
      >
        <div className="mb-2 font-semibold leading-none tracking-tight">{activeFeature.name}</div>
        {activeFeature.description && (
          <div className="mb-3 text-sm text-muted-foreground">{activeFeature.description}</div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClick}
            className={cn(featureButtonVariants({ variant: 'default', size: 'sm' }))}
          >
            Try it
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(featureButtonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            Dismiss
          </button>
        </div>
      </Comp>
    )
  }
)
AdoptionNudge.displayName = 'AdoptionNudge'
