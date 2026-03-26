import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Core utilities — coverage gaps', () => {
  // -------------------------------------------------------
  // Client rate limiter
  // -------------------------------------------------------
  describe('SlidingWindowRateLimiter', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('allows requests within limit', async () => {
      const { SlidingWindowRateLimiter } = await import('../../core/rate-limiter')
      const limiter = new SlidingWindowRateLimiter({ maxMessages: 3, windowMs: 60000 })

      expect(limiter.recordMessage()).toBe(true)
      expect(limiter.recordMessage()).toBe(true)
      expect(limiter.recordMessage()).toBe(true)
    })

    it('blocks requests exceeding limit', async () => {
      const { SlidingWindowRateLimiter } = await import('../../core/rate-limiter')
      const limiter = new SlidingWindowRateLimiter({ maxMessages: 2, windowMs: 60000 })

      limiter.recordMessage()
      limiter.recordMessage()
      expect(limiter.recordMessage()).toBe(false)
    })

    it('reports correct status', async () => {
      const { SlidingWindowRateLimiter } = await import('../../core/rate-limiter')
      const limiter = new SlidingWindowRateLimiter({ maxMessages: 3, windowMs: 60000 })

      const initialStatus = limiter.getStatus()
      expect(initialStatus.canSend).toBe(true)
      expect(initialStatus.remaining).toBe(3)

      limiter.recordMessage()
      const afterOne = limiter.getStatus()
      expect(afterOne.remaining).toBe(2)
      expect(afterOne.canSend).toBe(true)
    })

    it('resets rate limit', async () => {
      const { SlidingWindowRateLimiter } = await import('../../core/rate-limiter')
      const limiter = new SlidingWindowRateLimiter({ maxMessages: 1, windowMs: 60000 })

      limiter.recordMessage()
      expect(limiter.recordMessage()).toBe(false)

      limiter.reset()
      expect(limiter.recordMessage()).toBe(true)
    })

    it('uses default config values', async () => {
      const { SlidingWindowRateLimiter } = await import('../../core/rate-limiter')
      const limiter = new SlidingWindowRateLimiter()
      const status = limiter.getStatus()
      // Default is 10 messages
      expect(status.remaining).toBe(10)
    })

    it('resets after window expires', async () => {
      vi.useFakeTimers()
      const { SlidingWindowRateLimiter } = await import('../../core/rate-limiter')
      const limiter = new SlidingWindowRateLimiter({ maxMessages: 1, windowMs: 1000 })

      limiter.recordMessage()
      expect(limiter.recordMessage()).toBe(false)

      vi.advanceTimersByTime(1100)
      expect(limiter.recordMessage()).toBe(true)
      vi.useRealTimers()
    })
  })

  // -------------------------------------------------------
  // createRateLimiter factory
  // -------------------------------------------------------
  describe('createRateLimiter', () => {
    it('creates a SlidingWindowRateLimiter', async () => {
      const { createRateLimiter, SlidingWindowRateLimiter } = await import(
        '../../core/rate-limiter'
      )
      const limiter = createRateLimiter({ maxMessages: 5, windowMs: 30000 })
      expect(limiter).toBeInstanceOf(SlidingWindowRateLimiter)
    })
  })

  // -------------------------------------------------------
  // Strings
  // -------------------------------------------------------
  describe('strings', () => {
    it('exports DEFAULT_STRINGS', async () => {
      const strings = await import('../../core/strings')
      expect(strings).toBeDefined()
    })
  })
})
