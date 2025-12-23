import type { Alignment, Placement, Position, Rect, Side } from '../types'

/**
 * Get element's position including scroll offset
 */
export function getElementRect(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect()

  return {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.width,
    height: rect.height,
  }
}

/**
 * Get current viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  }
}

/**
 * Parse placement string into side and alignment
 */
export function parsePlacement(placement: Placement): {
  side: Side
  alignment: Alignment
} {
  const parts = placement.split('-') as [Side, Alignment?]

  return {
    side: parts[0],
    alignment: parts[1] ?? 'center',
  }
}

/**
 * Get the opposite side
 */
export function getOppositeSide(side: Side): Side {
  const opposites: Record<Side, Side> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }

  return opposites[side]
}

/**
 * Calculate position for tooltip relative to target
 */
export function calculatePosition(
  targetRect: Rect,
  tooltipSize: { width: number; height: number },
  placement: Placement,
  offset: [number, number] = [0, 0]
): Position {
  const { side, alignment } = parsePlacement(placement)
  const [offsetX, offsetY] = offset

  let x = 0
  let y = 0

  // Calculate main axis
  switch (side) {
    case 'top':
      y = targetRect.y - tooltipSize.height - offsetY
      break
    case 'bottom':
      y = targetRect.y + targetRect.height + offsetY
      break
    case 'left':
      x = targetRect.x - tooltipSize.width - offsetX
      break
    case 'right':
      x = targetRect.x + targetRect.width + offsetX
      break
  }

  // Calculate cross axis (alignment)
  if (side === 'top' || side === 'bottom') {
    switch (alignment) {
      case 'start':
        x = targetRect.x + offsetX
        break
      case 'end':
        x = targetRect.x + targetRect.width - tooltipSize.width - offsetX
        break
      case 'center':
      default:
        x = targetRect.x + (targetRect.width - tooltipSize.width) / 2 + offsetX
    }
  } else {
    switch (alignment) {
      case 'start':
        y = targetRect.y + offsetY
        break
      case 'end':
        y = targetRect.y + targetRect.height - tooltipSize.height - offsetY
        break
      case 'center':
      default:
        y = targetRect.y + (targetRect.height - tooltipSize.height) / 2 + offsetY
    }
  }

  return { x, y }
}

/**
 * Check if position would cause overflow
 */
export function wouldOverflow(
  position: Position,
  dimensions: { width: number; height: number },
  viewport: { width: number; height: number }
): { top: boolean; right: boolean; bottom: boolean; left: boolean } {
  return {
    top: position.y < 0,
    right: position.x + dimensions.width > viewport.width,
    bottom: position.y + dimensions.height > viewport.height,
    left: position.x < 0,
  }
}
