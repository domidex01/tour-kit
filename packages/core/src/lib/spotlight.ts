/**
 * The spotlight: the pure style math, and the state machine that drives it.
 *
 * v2 §1.3b extracted the *pieces* a binding needs — `trackRect` here, and
 * `computeSpotlight` below — but left the *composition* inside the React hook.
 * §1.5 then hand-rolled that composition twice more, in `@tour-kit/vue` and
 * `@tour-kit/svelte`, giving three copies of one four-field state machine that
 * differed only in reactivity primitive. §1.5f finishes §1.3b's job:
 * `createSpotlight()` is the machine, shaped like `createFocusTrap()` next
 * door, and all three bindings are now mirrors over its snapshot.
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
import { trackRect } from './track-rect'

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

/** The spotlight's whole observable state, recomputed only when it changes. */
export interface SpotlightSnapshot {
  isVisible: boolean
  targetRect: DOMRect | null
  overlayStyle: SpotlightOverlayStyle
  /** `{}` rather than `null` when there is no rect — directly spreadable. */
  cutoutStyle: SpotlightCutoutStyle | Record<string, never>
}

export interface SpotlightController {
  /**
   * Reference-stable between changes, so `useSyncExternalStore` and a Vue
   * `shallowRef` can both compare with `Object.is` and a Svelte
   * `createSubscriber` getter can hand it straight back.
   */
  getState(): SpotlightSnapshot
  subscribe(listener: () => void): () => void
  /**
   * Point the spotlight at an element and start following it.
   *
   * `show(a)` then `show(b)` with no `hide()` between is a real flow — an
   * overlay advances a step that way — so the previous tracker is stopped
   * before the new one starts. Holding the node in two places is what let the
   * §1.3b version keep following the step the tour had already left.
   */
  show(target: HTMLElement, config?: SpotlightConfig): void
  hide(): void
  /** Re-read the current target. Works while hidden, where no tracker exists. */
  update(): void
  /** Stop the live tracker and drop every listener. Idempotent. */
  destroy(): void
}

/**
 * The spotlight state machine, framework-free.
 *
 * No `typeof window` guard, matching `trackRect`: the `HTMLElement` argument to
 * `show()` is the guard, and a controller nobody shows is inert.
 */
export function createSpotlight(): SpotlightController {
  let target: HTMLElement | null = null
  let config: SpotlightConfig = defaultSpotlightConfig
  let stop: (() => void) | null = null

  // Built per controller rather than as a module constant: a module-level
  // `computeSpotlight(null)` runs on import and cannot be tree-shaken out of a
  // bundle that never spotlights anything.
  const hidden: SpotlightSnapshot = {
    isVisible: false,
    targetRect: null,
    overlayStyle: computeSpotlight(null).overlayStyle,
    cutoutStyle: {},
  }
  let snapshot: SpotlightSnapshot = hidden

  const listeners = new Set<() => void>()
  const notify = () => {
    for (const listener of [...listeners]) listener()
  }

  const commit = (rect: DOMRect | null, visible: boolean) => {
    if (!visible) {
      snapshot = hidden
    } else {
      const { overlayStyle, cutoutStyle } = computeSpotlight(rect, config)
      snapshot = { isVisible: true, targetRect: rect, overlayStyle, cutoutStyle: cutoutStyle ?? {} }
    }
    notify()
  }

  const stopTracking = () => {
    stop?.()
    stop = null
  }

  return {
    getState: () => snapshot,

    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    show: (next, spotlightConfig) => {
      stopTracking()
      target = next
      config = { ...defaultSpotlightConfig, ...spotlightConfig }
      // Seeded synchronously, so the tracker never needs an attach-time read.
      commit(next.getBoundingClientRect(), true)
      stop = trackRect(next, (rect) => commit(rect, true)).stop
    },

    hide: () => {
      stopTracking()
      target = null
      commit(null, false)
    },

    update: () => {
      if (target) commit(target.getBoundingClientRect(), true)
    },

    destroy: () => {
      stopTracking()
      target = null
      listeners.clear()
    },
  }
}
