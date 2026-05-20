'use client'

import { cn, useReducedMotion, useUILibrary } from '@tour-kit/core'
import * as React from 'react'

import { getHotspotPosition } from '../components/hotspot-position'
import { hintHotspotVariants } from '../components/ui/hint-variants'
import { Slot, UnifiedSlot } from '../lib/slot'
import type { HotspotPosition } from '../types'

export interface HintBeaconWithLabelProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'color'> {
  /** Target element's bounding rect. */
  targetRect: DOMRect
  /** Position relative to the target element. */
  position: HotspotPosition
  /** Visible label adjacent to the beacon. Read by SR through the button's aria-label. */
  label: string
  /** Side the label sits on relative to the beacon. Defaults to "right". */
  side?: 'left' | 'right'
  /** Whether the parent hint tooltip is open. */
  isOpen?: boolean
  /** Render through a Slot for custom element composition. */
  asChild?: boolean
}

export const HintBeaconWithLabel = React.forwardRef<HTMLButtonElement, HintBeaconWithLabelProps>(
  (
    {
      targetRect,
      position,
      label,
      side = 'right',
      isOpen = false,
      asChild = false,
      className,
      ...props
    },
    ref
  ) => {
    const library = useUILibrary()
    const reducedMotion = useReducedMotion()
    const pos = getHotspotPosition(position, targetRect)
    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'

    // Tier-3 JS gate: strip pulse from the className chain under reduce.
    const shouldPulse = !isOpen && !reducedMotion
    const beaconAnimation = shouldPulse ? 'motion-safe:animate-tour-pulse' : ''

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(
          hintHotspotVariants({ variant: 'beacon-with-label', pulse: false }),
          side === 'left' ? 'flex-row-reverse' : null,
          className
        )}
        style={{ top: pos.top, left: pos.left }}
        aria-label="Show hint"
        aria-expanded={isOpen}
        {...props}
      >
        <span
          className={cn('h-2.5 w-2.5 rounded-full bg-primary shadow-md', beaconAnimation)}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-foreground" aria-hidden="true">
          {label}
        </span>
      </Comp>
    )
  }
)
HintBeaconWithLabel.displayName = 'HintBeaconWithLabel'
