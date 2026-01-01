import * as React from 'react'
import type { HotspotPosition } from '../../types'

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

export interface HintHotspotHeadlessProps {
  targetRect: DOMRect
  position: HotspotPosition
  pulse?: boolean
  isOpen?: boolean
  onClick: () => void
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  /** Render prop */
  render?: (props: HintHotspotRenderProps) => React.ReactNode
}

export interface HintHotspotRenderProps {
  position: { top: number; left: number }
  pulse: boolean
  isOpen: boolean
  onClick: () => void
}

export const HintHotspotHeadless = React.forwardRef<HTMLButtonElement, HintHotspotHeadlessProps>(
  function HintHotspotHeadless(
    {
      targetRect,
      position,
      pulse = true,
      isOpen = false,
      onClick,
      className,
      style,
      children,
      render,
    },
    ref
  ) {
    const pos = getHotspotPosition(position, targetRect)

    const renderProps: HintHotspotRenderProps = {
      position: pos,
      pulse,
      isOpen,
      onClick,
    }

    if (render) {
      return <>{render(renderProps)}</>
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={className}
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: pos.top,
          left: pos.left,
          ...style,
        }}
        aria-label="Show hint"
        aria-expanded={isOpen}
      >
        {children}
      </button>
    )
  }
)
