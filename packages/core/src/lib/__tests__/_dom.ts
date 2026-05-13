/**
 * Test helper: inject HTML into document.body, run a callback, then clean up.
 * Supports both sync and async callbacks.
 */
export function withDOM(html: string, fn: () => void): void
export function withDOM(html: string, fn: () => Promise<void>): Promise<void>
export function withDOM(html: string, fn: () => void | Promise<void>): void | Promise<void> {
  document.body.innerHTML = html
  const cleanup = (): void => {
    document.body.innerHTML = ''
  }
  try {
    const result = fn()
    if (result instanceof Promise) {
      return result.finally(cleanup)
    }
    cleanup()
    return
  } catch (e) {
    cleanup()
    throw e
  }
}
