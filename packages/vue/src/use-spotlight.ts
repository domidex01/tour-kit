/**
 * `hooks/use-spotlight.ts`'s shape on `shallowRef`s.
 *
 * `shallowRef` for the rect, deliberately: a `DOMRect` behind a deep `ref` is a
 * Proxy, and every `Object.is` comparison downstream breaks against it.
 *
 * One tracker at a time. `show(a)` then `show(b)` with no `hide()` between is a
 * real flow — an overlay advances a step that way — and the §1.3b execution
 * shipped a regression where the second `show()` kept tracking the first node.
 *
 * @module use-spotlight
 */
import {
  type SpotlightConfig,
  type SpotlightCutoutStyle,
  type SpotlightOverlayStyle,
  computeSpotlight,
  defaultSpotlightConfig,
  trackRect,
} from '@tour-kit/core/engine'
import { type ComputedRef, type ShallowRef, computed, onScopeDispose, shallowRef } from 'vue'

export interface UseSpotlightReturn {
  isVisible: Readonly<ShallowRef<boolean>>
  targetRect: Readonly<ShallowRef<DOMRect | null>>
  overlayStyle: ComputedRef<SpotlightOverlayStyle>
  cutoutStyle: ComputedRef<SpotlightCutoutStyle | Record<string, never>>
  show: (target: HTMLElement, config?: SpotlightConfig) => void
  hide: () => void
  update: () => void
}

export function useSpotlight(): UseSpotlightReturn {
  const isVisible = shallowRef(false)
  const targetRect = shallowRef<DOMRect | null>(null)
  const config = shallowRef<SpotlightConfig>(defaultSpotlightConfig)

  let target: HTMLElement | null = null
  let stop: (() => void) | null = null

  const stopTracking = () => {
    stop?.()
    stop = null
  }

  const show = (next: HTMLElement, spotlightConfig?: SpotlightConfig) => {
    // Retarget: the previous tracker has to go before the new one starts, or
    // the spotlight follows the step the tour has already left.
    stopTracking()
    target = next
    config.value = { ...defaultSpotlightConfig, ...spotlightConfig }
    // Seeded synchronously so the tracker never needs an attach-time read.
    targetRect.value = next.getBoundingClientRect()
    isVisible.value = true
    stop = trackRect(next, (rect) => {
      targetRect.value = rect
    }).stop
  }

  const hide = () => {
    stopTracking()
    target = null
    targetRect.value = null
    isVisible.value = false
  }

  /** Works while hidden too — there is no tracker then, and there is a target. */
  const update = () => {
    if (target) targetRect.value = target.getBoundingClientRect()
  }

  const styles = computed(() => computeSpotlight(targetRect.value, config.value))

  onScopeDispose(stopTracking)

  return {
    isVisible,
    targetRect,
    overlayStyle: computed(() => styles.value.overlayStyle),
    cutoutStyle: computed(() => styles.value.cutoutStyle ?? {}),
    show,
    hide,
    update,
  }
}
