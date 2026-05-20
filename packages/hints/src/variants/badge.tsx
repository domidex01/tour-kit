'use client'

import { cn, useUILibrary } from '@tour-kit/core'
import * as React from 'react'

import { getHotspotPosition } from '../components/hotspot-position'
import { hintHotspotVariants } from '../components/ui/hint-variants'
import { Slot, UnifiedSlot } from '../lib/slot'
import type { HotspotPosition } from '../types'

export interface HintBadgeProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'color'> {
  /** Target element's bounding rect. */
  targetRect: DOMRect
  /** Position relative to the target element. */
  position: HotspotPosition
  /** Optional count rendered inside the badge. Values >99 clamp to "99+". */
  count?: number
  /** Whether the parent hint tooltip is open. */
  isOpen?: boolean
  /** Render through a Slot for custom element composition. */
  asChild?: boolean
}

function formatCount(count: number | undefined): string | null {
  if (count == null) return null
  return count > 99 ? '99+' : String(count)
}

export const HintBadge = React.forwardRef<HTMLButtonElement, HintBadgeProps>(
  ({ targetRect, position, count, isOpen = false, asChild = false, className, ...props }, ref) => {
    const library = useUILibrary()
    const pos = getHotspotPosition(position, targetRect)
    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'
    const label = formatCount(count)

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(hintHotspotVariants({ variant: 'badge', pulse: false }), className)}
        style={{ top: pos.top, left: pos.left }}
        aria-label="Show hint"
        aria-expanded={isOpen}
        {...props}
      >
        {label ?? <span className="sr-only">Show hint</span>}
      </Comp>
    )
  }
)
HintBadge.displayName = 'HintBadge'
