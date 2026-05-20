import type { HotspotPosition } from '../types'

/**
 * Resolve a hotspot's top/left offsets from a target rect.
 *
 * Shared by the legacy `<HintHotspot>` dot path and every variant in
 * `packages/hints/src/variants/*`. Single source of truth for positioning.
 */
export function getHotspotPosition(
  position: HotspotPosition,
  rect: DOMRect
): { top: number; left: number } {
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
