import type { Alignment, Placement, Rect, Side } from '../types'

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
