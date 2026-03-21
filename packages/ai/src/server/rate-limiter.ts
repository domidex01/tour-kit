import type { RateLimitStore } from '../types/adapter'
import type { ServerRateLimitConfig, ServerRateLimitResult } from '../types/config'

const DEFAULT_MAX_MESSAGES = 20
const DEFAULT_WINDOW_MS = 60_000

/** Default in-memory store (single-process only) */
export function createInMemoryRateLimitStore(): RateLimitStore {
  const store = new Map<string, number[]>()
  const windowMsPerIdentifier = new Map<string, number>()
  let callCount = 0

  function prune(identifier: string, windowMs: number): number[] {
    const cutoff = Date.now() - windowMs
    const timestamps = (store.get(identifier) ?? []).filter((t) => t > cutoff)
    store.set(identifier, timestamps)
    windowMsPerIdentifier.set(identifier, windowMs)
    return timestamps
  }

  function sweep(windowMs: number): void {
    callCount++
    if (callCount % 100 !== 0) return
    const cutoff = Date.now() - windowMs * 2
    for (const [key, timestamps] of store) {
      const recent = timestamps.filter((t) => t > cutoff)
      if (recent.length === 0) {
        store.delete(key)
        windowMsPerIdentifier.delete(key)
      } else {
        store.set(key, recent)
      }
    }
  }

  return {
    async increment(identifier: string, windowMs: number) {
      sweep(windowMs)
      const timestamps = prune(identifier, windowMs)
      const now = Date.now()
      timestamps.push(now)
      store.set(identifier, timestamps)
      return {
        count: timestamps.length,
        resetAt: timestamps[0] + windowMs,
      }
    },

    async check(identifier: string) {
      const windowMs = windowMsPerIdentifier.get(identifier) ?? DEFAULT_WINDOW_MS
      const cutoff = Date.now() - windowMs
      const timestamps = (store.get(identifier) ?? []).filter((t) => t > cutoff)
      store.set(identifier, timestamps)
      if (timestamps.length === 0) {
        return { count: 0, resetAt: 0 }
      }
      return {
        count: timestamps.length,
        resetAt: timestamps[0] + windowMs,
      }
    },
  }
}

/** Create the rate limit check function used by the route handler */
export function createServerRateLimiter(config: ServerRateLimitConfig): {
  check(req: Request): Promise<ServerRateLimitResult>
} {
  const maxMessages = config.maxMessages ?? DEFAULT_MAX_MESSAGES
  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS
  const rateLimitStore = config.store ?? createInMemoryRateLimitStore()

  return {
    async check(req: Request): Promise<ServerRateLimitResult> {
      const identifier = await config.identifier(req)
      const { count, resetAt } = await rateLimitStore.increment(identifier, windowMs)

      const allowed = count <= maxMessages
      const remaining = Math.max(0, maxMessages - count)

      return { allowed, count, limit: maxMessages, remaining, resetAt }
    },
  }
}
