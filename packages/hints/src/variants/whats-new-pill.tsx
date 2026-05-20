'use client'

import { cn, useReducedMotion, useUILibrary } from '@tour-kit/core'
import * as React from 'react'

import { getHotspotPosition } from '../components/hotspot-position'
import { hintHotspotVariants } from '../components/ui/hint-variants'
import { Slot, UnifiedSlot } from '../lib/slot'
import type { HotspotPosition } from '../types'

export interface HintWhatsNewPillProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'color'> {
  /** Target element's bounding rect. */
  targetRect: DOMRect
  /** Position relative to the target element. */
  position: HotspotPosition
  /** Pill label (also drives the button's aria-label). */
  label: string
  /** Whether the parent hint tooltip is open. */
  isOpen?: boolean
  /** Render through a Slot for custom element composition. */
  asChild?: boolean
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

export const HintWhatsNewPill = React.forwardRef<HTMLButtonElement, HintWhatsNewPillProps>(
  (
    {
      targetRect,
      position,
      label,
      isOpen = false,
      asChild = false,
      className,
      onPointerDown,
      onFocus,
      ...props
    },
    ref
  ) => {
    const library = useUILibrary()
    const reducedMotion = useReducedMotion()
    const [hasInteracted, setHasInteracted] = React.useState(false)

    // Tier-3 JS gate: under reduce, fade-out is replaced by hard removal so the
    // pill doesn't linger as an invisible-but-focusable element.
    if (hasInteracted && reducedMotion) return null

    const pos = getHotspotPosition(position, targetRect)
    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'

    const markInteracted = () => {
      if (!hasInteracted) setHasInteracted(true)
    }

    const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
      markInteracted()
      onPointerDown?.(event)
    }
    const handleFocus: React.FocusEventHandler<HTMLButtonElement> = (event) => {
      markInteracted()
      onFocus?.(event)
    }

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(
          hintHotspotVariants({ variant: 'what-s-new-pill', pulse: false }),
          'motion-safe:transition-opacity motion-safe:duration-200',
          hasInteracted ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{ top: pos.top, left: pos.left }}
        aria-label={label}
        aria-expanded={isOpen}
        onPointerDown={handlePointerDown as React.PointerEventHandler<HTMLElement>}
        onFocus={handleFocus as React.FocusEventHandler<HTMLElement>}
        {...props}
      >
        <SparkleIcon />
        <span>{label}</span>
      </Comp>
    )
  }
)
HintWhatsNewPill.displayName = 'HintWhatsNewPill'
