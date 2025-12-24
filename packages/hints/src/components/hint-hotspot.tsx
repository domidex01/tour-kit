import * as React from 'react'
import type { HotspotPosition } from '../types'

interface HintHotspotProps {
  targetRect: DOMRect
  position: HotspotPosition
  pulse?: boolean
  isOpen?: boolean
  onClick: () => void
  className?: string
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

const pulseKeyframes = `
@keyframes tourkit-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  50% { opacity: 1; box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}
`

export const HintHotspot = React.forwardRef<HTMLButtonElement, HintHotspotProps>(
  function HintHotspot(
    { targetRect, position, pulse = true, isOpen = false, onClick, className },
    ref
  ) {
    const pos = getHotspotPosition(position, targetRect)

    return (
      <>
        <style>{pulseKeyframes}</style>
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
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            border: '3px solid #ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            padding: 0,
            animation: pulse && !isOpen ? 'tourkit-pulse 1.5s ease-in-out infinite' : 'none',
          }}
          aria-label="Show hint"
          aria-expanded={isOpen}
        />
      </>
    )
  }
)
