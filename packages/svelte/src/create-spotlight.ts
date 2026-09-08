/**
 * The spotlight, as a `createSubscriber`-backed object.
 *
 * Callable from a component `<script>`; the getters are reactive inside
 * `$derived` / `$effect` / a template and plain reads elsewhere, exactly like
 * `createTourKit`'s `state`.
 *
 * One tracker at a time. `show(a)` then `show(b)` with no `hide()` between is a
 * real flow — an overlay advances a step that way — and the §1.3b execution
 * shipped a version that kept tracking the first node.
 *
 * @module create-spotlight
 */
import {
  type SpotlightConfig,
  type SpotlightCutoutStyle,
  type SpotlightOverlayStyle,
  computeSpotlight,
  defaultSpotlightConfig,
  trackRect,
} from '@tour-kit/core/engine'
import { createSubscriber } from 'svelte/reactivity'

export interface Spotlight {
  readonly isVisible: boolean
  readonly targetRect: DOMRect | null
  readonly overlayStyle: SpotlightOverlayStyle
  readonly cutoutStyle: SpotlightCutoutStyle | Record<string, never>
  show: (target: HTMLElement, config?: SpotlightConfig) => void
  hide: () => void
  /** Re-read the current target. Works while hidden, where no tracker exists. */
  update: () => void
  /** Stop the live tracker. Call from `onDestroy` in the owning component. */
  destroy: () => void
}

export function createSpotlight(): Spotlight {
  let visible = false
  let rect: DOMRect | null = null
  let config: SpotlightConfig = defaultSpotlightConfig
  let target: HTMLElement | null = null
  let stop: (() => void) | null = null

  let notify: (() => void) | null = null
  const subscribe = createSubscriber((update) => {
    notify = update
    return () => {
      notify = null
    }
  })

  const stopTracking = () => {
    stop?.()
    stop = null
  }

  const styles = () => computeSpotlight(rect, config)

  return {
    get isVisible() {
      subscribe()
      return visible
    },
    get targetRect() {
      subscribe()
      return rect
    },
    get overlayStyle() {
      subscribe()
      return styles().overlayStyle
    },
    get cutoutStyle() {
      subscribe()
      return styles().cutoutStyle ?? {}
    },

    show(next, spotlightConfig) {
      // Retarget: the previous tracker has to go before the new one starts, or
      // the spotlight follows the step the tour has already left.
      stopTracking()
      target = next
      config = { ...defaultSpotlightConfig, ...spotlightConfig }
      // Seeded synchronously so the tracker never needs an attach-time read.
      rect = next.getBoundingClientRect()
      visible = true
      stop = trackRect(next, (r) => {
        rect = r
        notify?.()
      }).stop
      notify?.()
    },

    hide() {
      stopTracking()
      target = null
      rect = null
      visible = false
      notify?.()
    },

    update() {
      if (target) {
        rect = target.getBoundingClientRect()
        notify?.()
      }
    },

    destroy: stopTracking,
  }
}
