import type { ClientRateLimitConfig } from '../types/config'

export interface RateLimitStatus {
  /** Whether the user can send a message right now */
  canSend: boolean
  /** Number of messages remaining in the current window */
  remaining: number
  /** Milliseconds until the oldest message in the window expires (0 if canSend is true and no messages) */
  resetInMs: number
}

const DEFAULT_MAX_MESSAGES = 10
const DEFAULT_WINDOW_MS = 60_000

export class SlidingWindowRateLimiter {
  private timestamps: number[] = []
  private readonly maxMessages: number
  private readonly windowMs: number

  constructor(config?: ClientRateLimitConfig) {
    this.maxMessages = config?.maxMessages ?? DEFAULT_MAX_MESSAGES
    this.windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS
  }

  /** Record a sent message. Returns false if rate limited. */
  recordMessage(): boolean {
    this.prune()
    if (this.timestamps.length >= this.maxMessages) {
      return false
    }
    this.timestamps.push(Date.now())
    return true
  }

  /** Check current status without recording. */
  getStatus(): RateLimitStatus {
    this.prune()
    const canSend = this.timestamps.length < this.maxMessages
    const remaining = this.maxMessages - this.timestamps.length
    let resetInMs = 0
    if (this.timestamps.length > 0) {
      resetInMs = Math.max(0, this.timestamps[0] + this.windowMs - Date.now())
    }
    return { canSend, remaining, resetInMs }
  }

  /** Reset all tracked timestamps. */
  reset(): void {
    this.timestamps = []
  }

  private prune(): void {
    const cutoff = Date.now() - this.windowMs
    this.timestamps = this.timestamps.filter((t) => t > cutoff)
  }
}

/** Factory function for convenience */
export function createRateLimiter(config?: ClientRateLimitConfig): SlidingWindowRateLimiter {
  return new SlidingWindowRateLimiter(config)
}
