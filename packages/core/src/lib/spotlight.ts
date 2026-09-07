/**
 * v2 §1.3b — `use-spotlight.ts`'s two `useMemo`s as one pure function.
 *
 * The returned shapes are React-free interfaces with literal-typed `position`
 * and `pointerEvents`, which is what makes them assignable to
 * `React.CSSProperties` without this file ever naming React.
 * `__tests__/types/spotlight-styles.test-d.ts` holds that check.
 *
 * @module spotlight
 */
import type { SpotlightConfig } from '../types'
import { defaultSpotlightConfig } from '../types/config'

export interface SpotlightOverlayStyle {
  position: 'fixed'
  inset: 0
  /** Always `'transparent'`. The colour is the cutout's `boxShadow`. */
  backgroundColor: string
  transition?: string
  pointerEvents: 'auto'
}

export interface SpotlightCutoutStyle {
  position: 'absolute'
  top: number
  left: number
  width: number
  height: number
  borderRadius: number
  /** `0 0 0 9999px <color>` — the ring that darkens everything but the hole. */
  boxShadow: string
  transition?: string
  pointerEvents: 'none'
}

export interface SpotlightStyles {
  overlayStyle: SpotlightOverlayStyle
  /** `null` when there is no target rect. The hook maps that to `{}`. */
  cutoutStyle: SpotlightCutoutStyle | null
}

export function computeSpotlight(rect: DOMRect | null, config?: SpotlightConfig): SpotlightStyles {
  const merged = { ...defaultSpotlightConfig, ...config }
  const transition = merged.animate
    ? `all ${merged.animationDuration ?? 300}ms ease-out`
    : undefined

  const overlayStyle: SpotlightOverlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'transparent',
    transition,
    pointerEvents: 'auto',
  }

  if (!rect) return { overlayStyle, cutoutStyle: null }

  const padding = merged.padding ?? 8
  const borderRadius = merged.borderRadius ?? 4

  return {
    overlayStyle,
    cutoutStyle: {
      position: 'absolute',
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius,
      boxShadow: `0 0 0 9999px ${merged.color ?? 'rgba(0, 0, 0, 0.5)'}`,
      transition,
      pointerEvents: 'none',
    },
  }
}
