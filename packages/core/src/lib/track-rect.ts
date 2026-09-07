/**
 * v2 §1.3b — one rect tracker for `useSpotlight` and `useElementPosition`.
 *
 * Both hooks carried the same scroll + resize + `throttleRAF` block; this is
 * that block, once. `useElementPosition` additionally wants a `ResizeObserver`
 * on the element and on its scroll parent, which is what `observeResize` adds.
 *
 * **Construction reads nothing, deliberately.** `useSpotlight.show()` seeds the
 * first rect itself before its effect runs, so an attach-time read would push a
 * fresh `DOMRect` through `setTargetRect` and buy one extra render per
 * `show()`. `useElementPosition` DOES read synchronously on attach
 * (`use-element-position.ts:47`), so its wrapper calls `update()` once right
 * after constructing the tracker. Neither hook suite counts
 * `getBoundingClientRect` calls, so this asymmetry is pinned in
 * `__tests__/lib/track-rect.test.ts` and nowhere else.
 *
 * @module track-rect
 */
import { getScrollParent } from '../utils/dom'
import { throttleRAF } from '../utils/throttle'

export interface RectTracker {
  /** Read the rect now and hand it to `onRect`. Synchronous. */
  update(): void
  /** Cancel the pending frame, disconnect, remove listeners. Idempotent. */
  stop(): void
}

export interface TrackRectOptions {
  /**
   * Also observe the element (and its `HTMLElement` scroll parent) with a
   * `ResizeObserver`. `useElementPosition` sets this; `useSpotlight` does not.
   */
  observeResize?: boolean
}

/**
 * Follow an element's bounding rect through scroll and resize.
 *
 * @param element - The node to measure. Non-null: the caller has already
 *   resolved it, and a null-tolerant signature would hide a resolution bug.
 */
export function trackRect(
  element: HTMLElement,
  onRect: (rect: DOMRect) => void,
  options: TrackRectOptions = {}
): RectTracker {
  const update = () => onRect(element.getBoundingClientRect())
  const throttled = throttleRAF(update)

  window.addEventListener('scroll', throttled, { passive: true, capture: true })
  window.addEventListener('resize', throttled, { passive: true })

  let observer: ResizeObserver | null = null
  if (options.observeResize) {
    // No existence guard, matching `use-element-position.ts:50` — its suite
    // stubs the global, and adding a guard the hook does not have would change
    // behaviour the oracle pins.
    observer = new ResizeObserver(throttled)
    observer.observe(element)
    const scrollParent = getScrollParent(element)
    if (scrollParent !== window && scrollParent instanceof HTMLElement) {
      observer.observe(scrollParent)
    }
  }

  let stopped = false

  return {
    update,
    stop: () => {
      if (stopped) return
      stopped = true
      throttled.cancel()
      observer?.disconnect()
      observer = null
      window.removeEventListener('scroll', throttled, true)
      window.removeEventListener('resize', throttled)
    },
  }
}
