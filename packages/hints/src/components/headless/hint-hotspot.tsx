import * as React from 'react'
import type { HotspotPosition } from '../../types'

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
