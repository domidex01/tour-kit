/**
 * jsdom has no `ResizeObserver`. Same shape as the stub at
 * `__tests__/hooks/use-element-position.test.ts:62`, plus the ability to read
 * back what was observed and to drive a resize.
 *
 * Deliberately no existence guard on the production side: `trackRect` must
 * construct one unconditionally when `observeResize` is set, exactly as
 * `use-element-position.ts` does today.
 */
import { vi } from 'vitest'

export interface ResizeObserverStub {
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  /** Every element passed to observe(), across all instances. */
  observed(): Element[]
  /** Invoke every constructed observer's callback, as a resize would. */
  trigger(): void
  restore(): void
}

export function stubResizeObserver(): ResizeObserverStub {
  const observe = vi.fn()
  const disconnect = vi.fn()
  const callbacks: ResizeObserverCallback[] = []

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: ResizeObserverCallback) {
        callbacks.push(cb)
      }
      observe = observe
      unobserve = vi.fn()
      disconnect = disconnect
    }
  )

  return {
    observe,
    disconnect,
    observed: () => observe.mock.calls.map((c) => c[0] as Element),
    trigger() {
      for (const cb of callbacks) cb([], {} as ResizeObserver)
    },
    restore: () => vi.unstubAllGlobals(),
  }
}
