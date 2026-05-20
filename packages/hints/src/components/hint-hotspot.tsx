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

type HintHotspotBaseProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'color'> &
  Omit<HintHotspotVariants, 'variant'> & {
    /** Target element's bounding rect */
    targetRect: DOMRect
    /** Position relative to the target element */
    position: HotspotPosition
    /** Whether the hint tooltip is open */
    isOpen?: boolean
    /** Use custom element via Slot */
    asChild?: boolean
  }

/**
 * Phase 12 contract — the three string literals lock here; downstream
 * `<HintGroup>` will narrow on these exact values.
 */
type HintHotspotVariantExtras =
  | { variant?: undefined }
  | { variant: 'badge'; count?: number }
  | { variant: 'beacon-with-label'; label: string; side?: 'left' | 'right' }
  | { variant: 'what-s-new-pill'; label: string }

export type HintHotspotProps = HintHotspotBaseProps & HintHotspotVariantExtras

export type { HintHotspotVariantName }

export const HintHotspot = React.forwardRef<HTMLButtonElement, HintHotspotProps>((props, ref) => {
  if (props.variant === 'badge') {
    const { variant: _variant, count, ...rest } = props
    return <HintBadge ref={ref} count={count} {...rest} />
  }
  if (props.variant === 'beacon-with-label') {
    const { variant: _variant, label, side, ...rest } = props
    return <HintBeaconWithLabel ref={ref} label={label} side={side} {...rest} />
  }
  if (props.variant === 'what-s-new-pill') {
    const { variant: _variant, label, ...rest } = props
    return <HintWhatsNewPill ref={ref} label={label} {...rest} />
  }

  // Legacy un-variant path — byte-identical to v1 render output.
  const {
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
    ...rest
  } = props
  return (
    <LegacyHintHotspot
      ref={ref}
      targetRect={targetRect}
      position={position}
      size={size}
      color={color}
      pulse={pulse}
      zIndex={zIndex}
      isOpen={isOpen}
      asChild={asChild}
      className={className}
      {...rest}
    >
      {children}
    </LegacyHintHotspot>
  )
})
HintHotspot.displayName = 'HintHotspot'

type LegacyProps = Omit<HintHotspotBaseProps, never>

const LegacyHintHotspot = React.forwardRef<HTMLButtonElement, LegacyProps>(
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
