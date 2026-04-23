import { vi } from 'vitest'

/**
 * Creates a tracker for event listeners on a target element.
 * Useful for detecting memory leaks from unremoved event listeners.
 */
export function createEventListenerTracker(target: EventTarget = document) {
  const listeners = new Map<string, Set<EventListener>>()
  const originalAdd = target.addEventListener.bind(target)
  const originalRemove = target.removeEventListener.bind(target)

  const addSpy = vi.spyOn(target, 'addEventListener')
  const removeSpy = vi.spyOn(target, 'removeEventListener')

  addSpy.mockImplementation(
    (
      event: string,
      handler: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (handler) {
        const fn = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler)
        if (!listeners.has(event)) {
          listeners.set(event, new Set())
        }
        listeners.get(event)?.add(fn)
      }
      originalAdd(event, handler, options)
    }
  )

  removeSpy.mockImplementation(
    (
      event: string,
      handler: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ) => {
      if (handler) {
        const fn = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler)
        listeners.get(event)?.delete(fn)
      }
      originalRemove(event, handler, options)
    }
  )

  return {
    /**
     * Gets the count of active listeners for a specific event type.
     */
    getListenerCount(event: string): number {
      return listeners.get(event)?.size ?? 0
    },

    /**
     * Gets all active listeners as a map of event -> count.
     */
    getActiveListeners(): Map<string, number> {
      const active = new Map<string, number>()
      for (const [event, handlers] of listeners) {
        if (handlers.size > 0) {
          active.set(event, handlers.size)
        }
      }
      return active
    },

    /**
     * Asserts that no event listeners are still active.
     * Throws if any listeners remain attached.
     */
    assertNoLeaks(): void {
      const active = [...listeners.entries()].filter(([, handlers]) => handlers.size > 0)
      if (active.length > 0) {
        const details = active.map(([event, handlers]) => `${event}: ${handlers.size}`).join(', ')
        throw new Error(`Event listener leak detected: ${details}`)
      }
    },

    /**
     * Cleans up the tracker and restores original methods.
     */
    cleanup(): void {
      addSpy.mockRestore()
      removeSpy.mockRestore()
      listeners.clear()
    },
  }
}

/**
 * Helper to verify function identity stability across rerenders.
 * Use this to ensure useCallback functions maintain stable references.
 */
export function createFunctionIdentityChecker<T extends (...args: unknown[]) => unknown>() {
  const references = new Map<string, T>()

  return {
    /**
     * Records a function reference with a name.
     */
    record(name: string, fn: T): void {
      references.set(name, fn)
    },

    /**
     * Checks if a function reference is the same as previously recorded.
     */
    isSame(name: string, fn: T): boolean {
      return references.get(name) === fn
    },

    /**
     * Asserts that a function reference is stable (same as before).
     */
    assertStable(name: string, fn: T): void {
      const previous = references.get(name)
      if (previous && previous !== fn) {
        throw new Error(`Function identity changed for "${name}": expected stable reference`)
      }
      references.set(name, fn)
    },

    /**
     * Clears all recorded references.
     */
    clear(): void {
      references.clear()
    },
  }
}
