import type { Alignment, Placement, Position, Rect, Side } from '../types'

/**
 * Detect document direction
 */
export function getDocumentDirection(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr'
  const dir = document.documentElement.dir || document.body.dir
  return dir === 'rtl' ? 'rtl' : 'ltr'
}

/**
 * Mirror a side for RTL
 */
export function mirrorSide(side: Side, isRTL: boolean): Side {
  if (!isRTL) return side
  if (side === 'left') return 'right'
  if (side === 'right') return 'left'
  return side
}

/**
 * Mirror an alignment for RTL
 */
export function mirrorAlignment(alignment: Alignment, isRTL: boolean): Alignment {
  if (!isRTL) return alignment
  if (alignment === 'start') return 'end'
  if (alignment === 'end') return 'start'
  return alignment
}

/**
 * Mirror a placement for RTL layout
 * - left ↔ right
 * - start ↔ end
 */
export function mirrorPlacementForRTL(placement: Placement, isRTL: boolean): Placement {
  if (!isRTL) return placement

  const { side, alignment } = parsePlacement(placement)
  const mirroredSide = mirrorSide(side, true)
  const mirroredAlignment = mirrorAlignment(alignment, true)

  if (mirroredAlignment === 'center') {
    return mirroredSide as Placement
  }

  return `${mirroredSide}-${mirroredAlignment}` as Placement
}

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

/**
 * Get fallback placements for a given side
 */
export function getFallbackPlacements(placement: Placement): Placement[] {
  const { side, alignment } = parsePlacement(placement)
  const opposite = getOppositeSide(side)

  // Build alignment suffix
  const alignmentSuffix = alignment !== 'center' ? `-${alignment}` : ''
  const oppositeAlignment = alignment === 'start' ? 'end' : alignment === 'end' ? 'start' : 'center'
  const oppositeAlignmentSuffix = oppositeAlignment !== 'center' ? `-${oppositeAlignment}` : ''

  // Return fallback order: opposite side, then perpendicular sides
  const fallbacks: Placement[] = []

  // 1. Opposite side with same alignment
  fallbacks.push(`${opposite}${alignmentSuffix}` as Placement)

  // 2. Perpendicular sides
  if (side === 'top' || side === 'bottom') {
    fallbacks.push(`left${alignmentSuffix}` as Placement)
    fallbacks.push(`right${alignmentSuffix}` as Placement)
  } else {
    fallbacks.push(`top${alignmentSuffix}` as Placement)
    fallbacks.push(`bottom${alignmentSuffix}` as Placement)
  }

  // 3. Same side with opposite alignment
  if (alignment !== 'center') {
    fallbacks.push(`${side}${oppositeAlignmentSuffix}` as Placement)
  }

  return fallbacks
}

/**
 * Result of position calculation with collision detection
 */
export interface PositionResult {
  x: number
  y: number
  placement: Placement
  hasOverflow: boolean
}

/**
 * Calculate position with viewport collision detection and auto-fallback
 */
export function calculatePositionWithCollision(
  targetRect: Rect,
  tooltipSize: { width: number; height: number },
  placement: Placement,
  options: {
    offset?: [number, number]
    fallbackPlacements?: Placement[]
    padding?: number
  } = {}
): PositionResult {
  const { offset = [0, 0], fallbackPlacements, padding = 0 } = options
  const viewport = getViewportDimensions()

  // Adjust viewport for padding
  const adjustedViewport = {
    width: viewport.width - padding * 2,
    height: viewport.height - padding * 2,
  }

  // Try primary placement
  const primaryPosition = calculatePosition(targetRect, tooltipSize, placement, offset)
  const primaryOverflow = wouldOverflow(
    { x: primaryPosition.x - padding, y: primaryPosition.y - padding },
    tooltipSize,
    adjustedViewport
  )

  const hasOverflow = Object.values(primaryOverflow).some(Boolean)

  if (!hasOverflow) {
    return {
      ...primaryPosition,
      placement,
      hasOverflow: false,
    }
  }

  // Try fallback placements
  const fallbacks = fallbackPlacements ?? getFallbackPlacements(placement)

  for (const fallbackPlacement of fallbacks) {
    const fallbackPosition = calculatePosition(targetRect, tooltipSize, fallbackPlacement, offset)
    const fallbackOverflow = wouldOverflow(
      { x: fallbackPosition.x - padding, y: fallbackPosition.y - padding },
      tooltipSize,
      adjustedViewport
    )

    if (!Object.values(fallbackOverflow).some(Boolean)) {
      return {
        ...fallbackPosition,
        placement: fallbackPlacement,
        hasOverflow: false,
      }
    }
  }

  // No fallback worked, return primary with overflow flag
  // Also try to shift the position to stay within viewport
  const shiftedPosition = shiftPositionIntoViewport(primaryPosition, tooltipSize, viewport, padding)

  return {
    ...shiftedPosition,
    placement,
    hasOverflow: true,
  }
}

/**
 * Shift position to keep element within viewport bounds
 */
function shiftPositionIntoViewport(
  position: Position,
  dimensions: { width: number; height: number },
  viewport: { width: number; height: number },
  padding: number
): Position {
  let { x, y } = position

  // Shift horizontally
  if (x < padding) {
    x = padding
  } else if (x + dimensions.width > viewport.width - padding) {
    x = viewport.width - dimensions.width - padding
  }

  // Shift vertically
  if (y < padding) {
    y = padding
  } else if (y + dimensions.height > viewport.height - padding) {
    y = viewport.height - dimensions.height - padding
  }

  return { x, y }
}
