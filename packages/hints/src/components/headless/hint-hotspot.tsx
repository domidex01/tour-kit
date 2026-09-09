'use client'

import * as React from 'react'
import type { HotspotPosition } from '../../types'
import { getHotspotPosition } from '../hotspot-position'

export interface HintHotspotHeadlessProps extends React.ComponentPropsWithoutRef<'button'> {
  /** Target element's bounding rect */
  targetRect: DOMRect
  /** Position relative to the target element */
  position: HotspotPosition
  /** Whether the hint tooltip is open */
  isOpen?: boolean
  /** Render prop for custom rendering */
  render?: (props: HintHotspotRenderProps) => React.ReactNode
}

export interface HintHotspotRenderProps {
  position: { top: number; left: number }
  isOpen: boolean
  targetRect: DOMRect
}

export const HintHotspotHeadless = React.forwardRef<HTMLButtonElement, HintHotspotHeadlessProps>(
  ({ targetRect, position, isOpen = false, render, className, style, ...props }, ref) => {
    const pos = getHotspotPosition(position, targetRect)

    if (render) {
      return <>{render({ position: pos, isOpen, targetRect })}</>
    }

    return (
      <button
        ref={ref}
        type="button"
        className={className}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          ...style,
        }}
        aria-label="Show hint"
        aria-expanded={isOpen}
        {...props}
      />
    )
  }
)
HintHotspotHeadless.displayName = 'HintHotspotHeadless'
