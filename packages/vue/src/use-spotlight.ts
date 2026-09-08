/**
 * `createSpotlight()` (core) behind a Vue `shallowRef`.
 *
 * The state machine — the four fields, the one-tracker-at-a-time retarget rule,
 * the `computeSpotlight` call — lives in core since v2 §1.5f, because this
 * binding and the Svelte one proved it was framework-agnostic by implementing
 * it identically. What is left here is the bridge, and it is the same bridge
 * `create-tour-kit.ts` uses over the engine: one `shallowRef` mirroring a
 * reference-stable `getState()`.
 *
 * `shallowRef` and not `ref`: the snapshot holds a `DOMRect`, and a deep `ref`
 * would proxy it so every downstream `Object.is` breaks against the proxy.
 *
 * @module use-spotlight
 */
import {
  type SpotlightConfig,
  type SpotlightSnapshot,
  createSpotlight,
} from '@tour-kit/core/engine'
import { type ComputedRef, type ShallowRef, computed, onScopeDispose, shallowRef } from 'vue'

export interface UseSpotlightReturn {
  isVisible: ComputedRef<boolean>
  targetRect: ComputedRef<SpotlightSnapshot['targetRect']>
  overlayStyle: ComputedRef<SpotlightSnapshot['overlayStyle']>
  cutoutStyle: ComputedRef<SpotlightSnapshot['cutoutStyle']>
  show: (target: HTMLElement, config?: SpotlightConfig) => void
  hide: () => void
  update: () => void
}

export function useSpotlight(): UseSpotlightReturn {
  const controller = createSpotlight()
  const state: ShallowRef<SpotlightSnapshot> = shallowRef(controller.getState())
  const unsubscribe = controller.subscribe(() => {
    state.value = controller.getState()
  })

  onScopeDispose(() => {
    unsubscribe()
    controller.destroy()
  })

  return {
    isVisible: computed(() => state.value.isVisible),
    targetRect: computed(() => state.value.targetRect),
    overlayStyle: computed(() => state.value.overlayStyle),
    cutoutStyle: computed(() => state.value.cutoutStyle),
    show: controller.show,
    hide: controller.hide,
    update: controller.update,
  }
}
