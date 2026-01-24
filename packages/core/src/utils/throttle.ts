/**
 * Throttle utilities for performance optimization
 * @module throttle
 */

type AnyFunction = (...args: unknown[]) => void

export interface ThrottledFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void
  /** Cancel any pending execution */
  cancel: () => void
}

export interface ThrottledFunctionWithFlush<T extends AnyFunction> extends ThrottledFunction<T> {
  /** Execute pending call immediately */
  flush: () => void
}

/**
 * RAF-based throttling for smooth 60fps updates during scroll/resize.
 * Coalesces rapid calls to a single execution per animation frame.
 *
 * @example
 * ```ts
 * const throttledUpdate = throttleRAF(() => {
 *   element.getBoundingClientRect()
 * })
 *
 * window.addEventListener('scroll', throttledUpdate, { passive: true })
 *
 * // Cleanup
 * throttledUpdate.cancel()
 * ```
 */
export function throttleRAF<T extends AnyFunction>(callback: T): ThrottledFunction<T> {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (lastArgs) {
          callback(...lastArgs)
          lastArgs = null
        }
      })
    }
  }) as ThrottledFunction<T>

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastArgs = null
  }

  return throttled
}

/**
 * Time-based throttling with trailing edge execution.
 * Queues the most recent call and executes after the interval.
 * Supports flush for immediate execution of pending call.
 *
 * @example
 * ```ts
 * const throttled = throttleTime(sendAnalytics, 1000)
 *
 * // Call multiple times - only fires once per second
 * throttled(event1)
 * throttled(event2)
 *
 * // Force immediate execution of pending call
 * throttled.flush()
 * ```
 */
export function throttleTime<T extends AnyFunction>(
  callback: T,
  ms: number
): ThrottledFunctionWithFlush<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastCallTime = 0

  const execute = () => {
    if (lastArgs) {
      lastCallTime = Date.now()
      callback(...lastArgs)
      lastArgs = null
    }
  }

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args
    const now = Date.now()
    const remaining = ms - (now - lastCallTime)

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      execute()
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        timeoutId = null
        execute()
      }, remaining)
    }
  }) as ThrottledFunctionWithFlush<T>

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  throttled.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    execute()
  }

  return throttled
}

/**
 * Leading-edge throttle - fires immediately, then ignores calls for interval.
 * Useful for immediate user feedback while preventing rapid-fire events.
 *
 * @example
 * ```ts
 * const throttled = throttleLeading(onClick, 500)
 *
 * // First call fires immediately
 * // Subsequent calls within 500ms are ignored
 * throttled() // Executes
 * throttled() // Ignored
 * throttled() // Ignored
 * ```
 */
export function throttleLeading<T extends AnyFunction>(
  callback: T,
  ms: number
): ThrottledFunction<T> {
  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCallTime >= ms) {
      lastCallTime = now
      callback(...args)
    }
  }) as ThrottledFunction<T>

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastCallTime = 0
  }

  return throttled
}
