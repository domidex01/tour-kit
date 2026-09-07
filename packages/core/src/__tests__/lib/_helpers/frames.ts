/**
 * Manual `requestAnimationFrame` control.
 *
 * The five hook suites stub rAF as `mockImplementation((cb) => { cb(0); return 0 })`
 * — SYNCHRONOUS. Under that, `throttleRAF` clears its `rafId` before returning,
 * so two scrolls produce two `onRect` calls and the coalescing that is the
 * whole point of the throttle is unobservable. A deferred queue is the only way
 * to assert "one call per frame".
 */
import { vi } from 'vitest'

export interface FrameHarness {
  /** Run every frame queued since the last flush, as one animation frame. */
  flush(): void
  /** Frames requested and not yet flushed. */
  pending(): number
  restore(): void
}

export function deferredFrames(): FrameHarness {
  let nextId = 1
  const queue = new Map<number, FrameRequestCallback>()

  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = nextId++
    queue.set(id, cb)
    return id
  })
  // Spied too: `trackRect().stop()` calls `throttled.cancel()`, which calls
  // cancelAnimationFrame. Without this, `pending()` would still report a queued
  // frame after stop() and "stop then scroll calls nothing" would be untestable.
  const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    queue.delete(id)
  })

  return {
    flush() {
      const due = [...queue.values()]
      queue.clear()
      for (const cb of due) cb(performance.now())
    },
    pending: () => queue.size,
    restore() {
      queue.clear()
      raf.mockRestore()
      caf.mockRestore()
    },
  }
}
