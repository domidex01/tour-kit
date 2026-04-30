'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import { useUILibrary } from '@tour-kit/core'
import type { HotspotPosition } from '../types'
import { type HintHotspotVariants, hintHotspotVariants } from './ui/hint-variants'

export interface HintHotspotProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'color'>,
    HintHotspotVariants {
  /** Target element's bounding rect */
  targetRect: DOMRect
  /** Position relative to the target element */
  position: HotspotPosition
  /** Whether the hint tooltip is open */
  isOpen?: boolean
  /** Use custom element via Slot */
  asChild?: boolean
}

function getHotspotPosition(position: HotspotPosition, rect: DOMRect) {
  const offset = 4

  switch (position) {
    case 'top-left':
      return { top: rect.top - offset, left: rect.left - offset }
    case 'top-right':
      return { top: rect.top - offset, left: rect.right - offset }
    case 'bottom-left':
      return { top: rect.bottom - offset, left: rect.left - offset }
    case 'bottom-right':
      return { top: rect.bottom - offset, left: rect.right - offset }
    case 'center':
      return {
        top: rect.top + rect.height / 2 - 6,
        left: rect.left + rect.width / 2 - 6,
      }
    default:
      return { top: rect.top - offset, left: rect.right - offset }
  }
}

export const HintHotspot = React.forwardRef<HTMLButtonElement, HintHotspotProps>(
  (
    {
      targetRect,
      position,
      size,
      color,
      pulse = true,
      zIndex,
      isOpen = false,
      asChild = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const library = useUILibrary()
    const pos = getHotspotPosition(position, targetRect)
    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'

    // Don't pulse when tooltip is open
    const shouldPulse = pulse && !isOpen

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(hintHotspotVariants({ size, color, pulse: shouldPulse, zIndex }), className)}
        style={{
          top: pos.top,
          left: pos.left,
        }}
        aria-label="Show hint"
        aria-expanded={isOpen}
        {...props}
      >
        {children ?? <span className="sr-only">Show hint</span>}
      </Comp>
    )
  }
)
HintHotspot.displayName = 'HintHotspot'
