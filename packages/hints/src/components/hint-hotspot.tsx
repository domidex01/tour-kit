'use client'

import { cn, useReducedMotion, useUILibrary } from '@tour-kit/core'
import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import type { HotspotPosition } from '../types'
import { HintBadge } from '../variants/badge'
import { HintBeaconWithLabel } from '../variants/beacon-with-label'
import { HintWhatsNewPill } from '../variants/whats-new-pill'
import { getHotspotPosition } from './hotspot-position'
import {
  type HintHotspotVariantName,
  type HintHotspotVariants,
  hintHotspotVariants,
} from './ui/hint-variants'

/** Base props shared by every render path (legacy + every variant). */
type HintHotspotBaseProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'color'> & {
  /** Target element's bounding rect */
  targetRect: DOMRect
  /** Position relative to the target element */
  position: HotspotPosition
  /** Whether the hint tooltip is open */
  isOpen?: boolean
  /** Use custom element via Slot */
  asChild?: boolean
}

/** Legacy cva extras — only attach to the un-variant arm so they cannot leak to variants. */
type HintHotspotLegacyExtras = Omit<HintHotspotVariants, 'variant'>

/**
 * Discriminated union — the Phase 12 contract. The string literals lock here.
 * Legacy `size`/`color`/`pulse`/`zIndex` live only on the un-variant arm so a
 * consumer who opts into a variant can't accidentally pass them through to the
 * DOM as unknown attributes.
 */
type HintHotspotVariantExtras =
  | ({ variant?: undefined } & HintHotspotLegacyExtras)
  | { variant: 'badge'; count?: number }
  | { variant: 'beacon-with-label'; label: string; side?: 'left' | 'right' }
  | { variant: 'what-s-new-pill'; label: string }

export type HintHotspotProps = HintHotspotBaseProps & HintHotspotVariantExtras

export type { HintHotspotVariantName }

/**
 * Defensive runtime strip — the discriminated union already forbids legacy
 * cva extras on variant arms at the type layer, but JS consumers (or anyone
 * casting through `as unknown as`) can still pass them. Without this, React
 * surfaces them as unknown DOM attributes on the rendered `<button>`.
 */
function stripLegacyCvaProps<T extends object>(obj: T): T {
  const {
    size: _s,
    color: _c,
    pulse: _p,
    zIndex: _z,
    ...rest
  } = obj as T & Partial<HintHotspotLegacyExtras>
  return rest as T
}

/**
 * Pure dispatcher — calls no hooks itself so every variant arm (including the
 * legacy `<LegacyHintHotspot>` path) owns an isolated hook context. A consumer
 * who switches `variant` between renders unmounts/mounts the appropriate
 * sub-component instead of changing the hook count of this function.
 */
export const HintHotspot = React.forwardRef<HTMLButtonElement, HintHotspotProps>((props, ref) => {
  if (props.variant === 'badge') {
    const { variant: _variant, count, ...rest } = props
    return <HintBadge ref={ref} count={count} {...stripLegacyCvaProps(rest)} />
  }
  if (props.variant === 'beacon-with-label') {
    const { variant: _variant, label, side, ...rest } = props
    return (
      <HintBeaconWithLabel ref={ref} label={label} side={side} {...stripLegacyCvaProps(rest)} />
    )
  }
  if (props.variant === 'what-s-new-pill') {
    const { variant: _variant, label, ...rest } = props
    return <HintWhatsNewPill ref={ref} label={label} {...stripLegacyCvaProps(rest)} />
  }
  const { variant: _variant, ...legacy } = props
  return <LegacyHintHotspot ref={ref} {...legacy} />
})
HintHotspot.displayName = 'HintHotspot'

type LegacyHintHotspotProps = HintHotspotBaseProps & HintHotspotLegacyExtras

const LegacyHintHotspot = React.forwardRef<HTMLButtonElement, LegacyHintHotspotProps>(
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
    const reducedMotion = useReducedMotion()
    const pos = getHotspotPosition(position, targetRect)
    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'

    // Don't pulse when tooltip is open or when the user prefers reduced motion.
    const shouldPulse = pulse && !isOpen && !reducedMotion

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
LegacyHintHotspot.displayName = 'LegacyHintHotspot'
