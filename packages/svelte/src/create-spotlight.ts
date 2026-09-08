/**
 * `createSpotlight()` (core) behind a `createSubscriber` getter.
 *
 * The state machine — the four fields, the one-tracker-at-a-time retarget rule,
 * the `computeSpotlight` call — lives in core since v2 §1.5f, because this
 * binding and the Vue one proved it was framework-agnostic by implementing it
 * identically. What is left here is the bridge, and it is the same bridge
 * `create-tour-kit.ts` uses over the engine: one `createSubscriber` over a
 * reference-stable `getState()`.
 *
 * The getters are reactive inside `$derived` / `$effect` / a template and plain
 * reads elsewhere. `start` runs for the first subscriber and its cleanup when
 * the last is destroyed, so a component that never renders the spotlight never
 * subscribes.
 *
 * @module create-spotlight
 */
import {
  type SpotlightConfig,
  type SpotlightSnapshot,
  createSpotlight as createSpotlightController,
} from '@tour-kit/core/engine'
import { createSubscriber } from 'svelte/reactivity'

export interface Spotlight {
  readonly isVisible: boolean
  readonly targetRect: SpotlightSnapshot['targetRect']
  readonly overlayStyle: SpotlightSnapshot['overlayStyle']
  readonly cutoutStyle: SpotlightSnapshot['cutoutStyle']
  show: (target: HTMLElement, config?: SpotlightConfig) => void
  hide: () => void
  /** Re-read the current target. Works while hidden, where no tracker exists. */
  update: () => void
  /** Stop the live tracker. Call from `onDestroy` in the owning component. */
  destroy: () => void
}

export function createSpotlight(): Spotlight {
  const controller = createSpotlightController()
  const subscribe = createSubscriber((update) => controller.subscribe(update))
  const read = (): SpotlightSnapshot => {
    subscribe()
    return controller.getState()
  }

  return {
    get isVisible() {
      return read().isVisible
    },
    get targetRect() {
      return read().targetRect
    },
    get overlayStyle() {
      return read().overlayStyle
    },
    get cutoutStyle() {
      return read().cutoutStyle
    },
    show: controller.show,
    hide: controller.hide,
    update: controller.update,
    destroy: controller.destroy,
  }
}
