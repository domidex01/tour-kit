import { type Mock, vi } from 'vitest'

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

interface ObserverInstance {
  observe: Mock
  unobserve: Mock
  disconnect: Mock
}

interface ObserverMockResult {
  getInstanceCount(): number
  assertNoLeaks(): void
  cleanup(): void
  getMock(): Mock
}

/**
 * Creates a mock ResizeObserver that tracks instances for leak detection.
 */
export function createResizeObserverMock(): ObserverMockResult {
  const instances = new Set<ObserverInstance>()

  const Mock = vi.fn().mockImplementation(() => {
    const instance: ObserverInstance = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(() => {
        instances.delete(instance)
      }),
    }
    instances.add(instance)
    return instance
  })

  vi.stubGlobal('ResizeObserver', Mock)

  return {
    getInstanceCount(): number {
      return instances.size
    },

    assertNoLeaks(): void {
      if (instances.size > 0) {
        throw new Error(
          `ResizeObserver leak detected: ${instances.size} instance(s) not disconnected`
        )
      }
    },

    cleanup(): void {
      instances.clear()
    },

    getMock(): Mock {
      return Mock
    },
  }
}

interface IntersectionObserverInstance extends ObserverInstance {
  takeRecords: Mock
}

/**
 * Creates a mock IntersectionObserver that tracks instances for leak detection.
 */
export function createIntersectionObserverMock(): ObserverMockResult {
  const instances = new Set<IntersectionObserverInstance>()

  const MockCtor = vi
    .fn()
    .mockImplementation(
      (_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) => {
        const instance: IntersectionObserverInstance = {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(() => {
            instances.delete(instance)
          }),
          takeRecords: vi.fn().mockReturnValue([]),
        }
        instances.add(instance)
        return instance
      }
    )

  vi.stubGlobal('IntersectionObserver', MockCtor)

  return {
    getInstanceCount(): number {
      return instances.size
    },

    assertNoLeaks(): void {
      if (instances.size > 0) {
        throw new Error(
          `IntersectionObserver leak detected: ${instances.size} instance(s) not disconnected`
        )
      }
    },

    cleanup(): void {
      instances.clear()
    },

    getMock(): Mock {
      return MockCtor
    },
  }
}

interface MutationObserverInstance {
  observe: Mock
  disconnect: Mock
  takeRecords: Mock
}

/**
 * Creates a mock MutationObserver that tracks instances for leak detection.
 */
export function createMutationObserverMock(): ObserverMockResult {
  const instances = new Set<MutationObserverInstance>()

  const MockCtor = vi.fn().mockImplementation((_callback: MutationCallback) => {
    const instance: MutationObserverInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(() => {
        instances.delete(instance)
      }),
      takeRecords: vi.fn().mockReturnValue([]),
    }
    instances.add(instance)
    return instance
  })

  vi.stubGlobal('MutationObserver', MockCtor)

  return {
    getInstanceCount(): number {
      return instances.size
    },

    assertNoLeaks(): void {
      if (instances.size > 0) {
        throw new Error(
          `MutationObserver leak detected: ${instances.size} instance(s) not disconnected`
        )
      }
    },

    cleanup(): void {
      instances.clear()
    },

    getMock(): Mock {
      return MockCtor
    },
  }
}

/**
 * Creates a tracker for setInterval/setTimeout timers.
 */
export function createTimerTracker() {
  const intervals = new Set<ReturnType<typeof setInterval>>()
  const timeouts = new Set<ReturnType<typeof setTimeout>>()

  const originalSetInterval = globalThis.setInterval.bind(globalThis)
  const originalClearInterval = globalThis.clearInterval.bind(globalThis)
  const originalSetTimeout = globalThis.setTimeout.bind(globalThis)
  const originalClearTimeout = globalThis.clearTimeout.bind(globalThis)

  const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
  const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
  const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
  const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

  setIntervalSpy.mockImplementation((...args) => {
    const id = originalSetInterval(...args)
    intervals.add(id)
    return id
  })

  clearIntervalSpy.mockImplementation((id) => {
    if (id !== undefined) {
      intervals.delete(id as ReturnType<typeof setInterval>)
    }
    originalClearInterval(id)
  })

  setTimeoutSpy.mockImplementation((...args) => {
    const id = originalSetTimeout(...args)
    timeouts.add(id)
    return id
  })

  clearTimeoutSpy.mockImplementation((id) => {
    if (id !== undefined) {
      timeouts.delete(id as ReturnType<typeof setTimeout>)
    }
    originalClearTimeout(id)
  })

  return {
    getIntervalCount(): number {
      return intervals.size
    },

    getTimeoutCount(): number {
      return timeouts.size
    },

    assertNoLeaks(): void {
      if (intervals.size > 0) {
        throw new Error(`Interval leak detected: ${intervals.size} interval(s) not cleared`)
      }
      if (timeouts.size > 0) {
        throw new Error(`Timeout leak detected: ${timeouts.size} timeout(s) not cleared`)
      }
    },

    cleanup(): void {
      // Clear any remaining timers
      for (const id of intervals) {
        originalClearInterval(id)
      }
      for (const id of timeouts) {
        originalClearTimeout(id)
      }
      intervals.clear()
      timeouts.clear()
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
    },
  }
}

/**
 * Creates a tracker for localStorage/sessionStorage operations.
 */
export function createStorageTracker(storage: Storage = localStorage) {
  const listeners = new Set<EventListener>()
  const originalAdd = window.addEventListener.bind(window)
  const originalRemove = window.removeEventListener.bind(window)

  const addSpy = vi.spyOn(window, 'addEventListener')
  const removeSpy = vi.spyOn(window, 'removeEventListener')

  addSpy.mockImplementation(
    (
      event: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (event === 'storage') {
        const fn = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler)
        listeners.add(fn)
      }
      originalAdd(event, handler, options)
    }
  )

  removeSpy.mockImplementation(
    (
      event: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) => {
      if (event === 'storage') {
        const fn = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler)
        listeners.delete(fn)
      }
      originalRemove(event, handler, options)
    }
  )

  return {
    getStorageListenerCount(): number {
      return listeners.size
    },

    assertNoLeaks(): void {
      if (listeners.size > 0) {
        throw new Error(`Storage listener leak detected: ${listeners.size} listener(s) not removed`)
      }
    },

    cleanup(): void {
      addSpy.mockRestore()
      removeSpy.mockRestore()
      listeners.clear()
      storage.clear()
    },

    storage,
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
