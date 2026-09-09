/**
 * v3 Phase 1 — moved here from `components/hotspot-position.ts`.
 *
 * The one pure positioning function a non-React renderer needs, so it belongs
 * on `@tour-kit/hints/engine`. Its `HotspotPosition` now comes from
 * `@tour-kit/core/engine`: the old path read it from `../types`, which imports
 * `react` and `@tour-kit/media` and would drag both into the engine's `.d.ts`
 * closure. `DOMRect` is a `lib.dom` type, which the declaration guard allows —
 * core's `trackRect` does the same.
 */
import type { HotspotPosition } from '@tour-kit/core/engine'

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
