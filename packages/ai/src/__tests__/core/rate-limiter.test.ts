import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SlidingWindowRateLimiter, createRateLimiter } from '../../core/rate-limiter'

describe('SlidingWindowRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows messages under the limit', () => {
    const limiter = new SlidingWindowRateLimiter()

    for (let i = 0; i < 9; i++) {
      expect(limiter.recordMessage()).toBe(true)
    }
    expect(limiter.getStatus().canSend).toBe(true)
  })

  it('blocks messages at the limit', () => {
    const limiter = new SlidingWindowRateLimiter()

    for (let i = 0; i < 10; i++) {
      expect(limiter.recordMessage()).toBe(true)
    }

    expect(limiter.recordMessage()).toBe(false)
  })

  it('resets after window expires', () => {
    const limiter = new SlidingWindowRateLimiter()

    for (let i = 0; i < 10; i++) {
      limiter.recordMessage()
    }

    expect(limiter.getStatus().canSend).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect(limiter.recordMessage()).toBe(true)
  })

  it('uses sliding window — not fixed window', () => {
    const limiter = new SlidingWindowRateLimiter({ maxMessages: 10, windowMs: 60_000 })

    // Send 5 at t=0
    for (let i = 0; i < 5; i++) {
      limiter.recordMessage()
    }

    // Advance 30s, send 5 more
    vi.advanceTimersByTime(30_000)
    for (let i = 0; i < 5; i++) {
      limiter.recordMessage()
    }

    // At t=30s: 10 messages, window full
    expect(limiter.getStatus().canSend).toBe(false)

    // Advance to t=60.001s — first 5 expire (sent at t=0, window is 60s)
    vi.advanceTimersByTime(30_001)

    const status = limiter.getStatus()
    expect(status.canSend).toBe(true)
    expect(status.remaining).toBe(5)
  })

  it('returns correct remaining count', () => {
    const limiter = new SlidingWindowRateLimiter()

    limiter.recordMessage()
    limiter.recordMessage()
    limiter.recordMessage()

    expect(limiter.getStatus().remaining).toBe(7)
  })

  it('returns correct resetInMs', () => {
    const limiter = new SlidingWindowRateLimiter({ windowMs: 60_000 })

    limiter.recordMessage() // at t=0

    vi.advanceTimersByTime(10_000) // now t=10s

    const status = limiter.getStatus()
    expect(status.resetInMs).toBe(50_000)
  })

  it('returns resetInMs of 0 when no messages sent', () => {
    const limiter = new SlidingWindowRateLimiter()
    expect(limiter.getStatus().resetInMs).toBe(0)
  })

  it('reset() clears all timestamps', () => {
    const limiter = new SlidingWindowRateLimiter()

    for (let i = 0; i < 10; i++) {
      limiter.recordMessage()
    }

    expect(limiter.getStatus().canSend).toBe(false)

    limiter.reset()

    expect(limiter.getStatus().canSend).toBe(true)
    expect(limiter.getStatus().remaining).toBe(10)
  })

  it('uses default config when none provided', () => {
    const limiter = new SlidingWindowRateLimiter()

    // Default maxMessages = 10
    for (let i = 0; i < 10; i++) {
      expect(limiter.recordMessage()).toBe(true)
    }
    expect(limiter.recordMessage()).toBe(false)

    // Default windowMs = 60000
    vi.advanceTimersByTime(60_001)
    expect(limiter.recordMessage()).toBe(true)
  })

  it('respects custom maxMessages', () => {
    const limiter = new SlidingWindowRateLimiter({ maxMessages: 3 })

    expect(limiter.recordMessage()).toBe(true)
    expect(limiter.recordMessage()).toBe(true)
    expect(limiter.recordMessage()).toBe(true)
    expect(limiter.recordMessage()).toBe(false)
  })

  it('respects custom windowMs', () => {
    const limiter = new SlidingWindowRateLimiter({
      maxMessages: 2,
      windowMs: 5_000,
    })

    limiter.recordMessage()
    limiter.recordMessage()
    expect(limiter.getStatus().canSend).toBe(false)

    vi.advanceTimersByTime(5_001)
    expect(limiter.getStatus().canSend).toBe(true)
  })
})

describe('createRateLimiter', () => {
  it('returns a SlidingWindowRateLimiter instance', () => {
    const limiter = createRateLimiter({ maxMessages: 5 })
    expect(limiter).toBeInstanceOf(SlidingWindowRateLimiter)
  })
})
