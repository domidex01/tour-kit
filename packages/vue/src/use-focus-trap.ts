/**
 * `createFocusTrap` (core) with a Vue `ref` for the container and the
 * enabled-flag watch the React wrapper has.
 *
 * Two-phase, like the React one: `capture()` records `document.activeElement`
 * as the return target BEFORE the card mounts, and `activate()` moves focus
 * once it exists. Capturing at activate time records the card itself and
 * `Escape` returns focus to nothing.
 *
 * @module use-focus-trap
 */
import { type FocusTrapOptions, createFocusTrap } from '@tour-kit/core/engine'
import {
  type MaybeRefOrGetter,
  type ShallowRef,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
} from 'vue'

export interface UseFocusTrapReturn {
  /** Bind with `ref="containerRef"` (or `:ref`) on the element to trap. */
  containerRef: ShallowRef<HTMLElement | null>
  activate: () => void
  deactivate: () => void
}

export function useFocusTrap(
  enabled: MaybeRefOrGetter<boolean> = true,
  options: FocusTrapOptions = {}
): UseFocusTrapReturn {
  const containerRef = shallowRef<HTMLElement | null>(null)
  const trap = createFocusTrap(() => containerRef.value, options)

  // `immediate` is safe here and nowhere else in this package: `capture()`
  // reads `document.activeElement` and constructs nothing. It is not a verb.
  watch(
    () => toValue(enabled),
    (on) => (on ? trap.capture() : trap.forget()),
    { immediate: true }
  )

  onScopeDispose(trap.release)

  return {
    containerRef,
    activate: () => {
      if (toValue(enabled)) trap.activate()
    },
    deactivate: trap.deactivate,
  }
}
