import { vi } from 'vitest'

/** Spies on `window.addEventListener` and `window.removeEventListener`. */
export function spyOnEventListeners(): {
  add: ReturnType<typeof vi.spyOn>
  remove: ReturnType<typeof vi.spyOn>
} {
  return {
    add: vi.spyOn(window, 'addEventListener'),
    remove: vi.spyOn(window, 'removeEventListener'),
  }
}

/** Counts spy calls whose first argument matches `eventName`. */
export function countEventOps(spy: ReturnType<typeof vi.spyOn>, eventName: string): number {
  return spy.mock.calls.filter((call: unknown[]) => call[0] === eventName).length
}
