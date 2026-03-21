import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createServerRateLimiter,
  createInMemoryRateLimitStore,
} from '../../server/rate-limiter'
import type { RateLimitStore } from '../../types/adapter'

function createMockRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

function createMockStore(): RateLimitStore {
  return {
    increment: vi.fn<RateLimitStore['increment']>().mockResolvedValue({
      count: 1,
      resetAt: Date.now() + 60_000,
    }),
    check: vi.fn<RateLimitStore['check']>().mockResolvedValue({
      count: 0,
      resetAt: Date.now() + 60_000,
    }),
  }
}

describe('createServerRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests under the limit', async () => {
    const rateLimiter = createServerRateLimiter({
      maxMessages: 5,
      windowMs: 60_000,
      identifier: () => 'user-1',
    })

    const req = createMockRequest({ messages: [] })
    const result = await rateLimiter.check(req)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThan(0)
  })

  it('denies requests at the limit', async () => {
    const rateLimiter = createServerRateLimiter({
      maxMessages: 3,
      windowMs: 60_000,
      identifier: () => 'user-1',
    })

    const req = createMockRequest({ messages: [] })

    // Send 3 requests (at the limit)
    for (let i = 0; i < 3; i++) {
      const result = await rateLimiter.check(req)
      expect(result.allowed).toBe(true)
    }

    // 4th request should be denied
    const result = await rateLimiter.check(req)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('extracts identifier from request', async () => {
    const identifier = vi.fn().mockReturnValue('ip-1.2.3.4')
    const rateLimiter = createServerRateLimiter({
      identifier,
    })

    const req = createMockRequest({ messages: [] }, { 'x-forwarded-for': '1.2.3.4' })
    await rateLimiter.check(req)

    expect(identifier).toHaveBeenCalledWith(req)
  })

  it('handles async identifier function', async () => {
    const identifier = vi.fn().mockResolvedValue('async-user')
    const rateLimiter = createServerRateLimiter({
      maxMessages: 5,
      identifier,
    })

    const req = createMockRequest({ messages: [] })
    const result = await rateLimiter.check(req)

    expect(result.allowed).toBe(true)
    expect(identifier).toHaveBeenCalledWith(req)
  })

  it('uses in-memory store by default', async () => {
    const rateLimiter = createServerRateLimiter({
      maxMessages: 5,
      identifier: () => 'user-1',
    })

    const req = createMockRequest({ messages: [] })
    const result = await rateLimiter.check(req)

    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
  })

  it('uses custom store when provided', async () => {
    const store = createMockStore()
    const rateLimiter = createServerRateLimiter({
      maxMessages: 20,
      windowMs: 60_000,
      identifier: () => 'user-1',
      store,
    })

    const req = createMockRequest({ messages: [] })
    await rateLimiter.check(req)

    expect(store.increment).toHaveBeenCalledWith('user-1', 60_000)
  })

  it('returns correct rate limit result fields', async () => {
    const rateLimiter = createServerRateLimiter({
      maxMessages: 10,
      windowMs: 60_000,
      identifier: () => 'user-1',
    })

    const req = createMockRequest({ messages: [] })
    const result = await rateLimiter.check(req)

    expect(result).toHaveProperty('allowed')
    expect(result).toHaveProperty('count')
    expect(result).toHaveProperty('limit')
    expect(result).toHaveProperty('remaining')
    expect(result).toHaveProperty('resetAt')
    expect(result.limit).toBe(10)
    expect(result.count).toBe(1)
    expect(result.remaining).toBe(9)
  })

  it('resets after window expires', async () => {
    const rateLimiter = createServerRateLimiter({
      maxMessages: 2,
      windowMs: 10_000,
      identifier: () => 'user-1',
    })

    const req = createMockRequest({ messages: [] })

    await rateLimiter.check(req)
    await rateLimiter.check(req)

    const denied = await rateLimiter.check(req)
    expect(denied.allowed).toBe(false)

    vi.advanceTimersByTime(10_001)

    const allowed = await rateLimiter.check(req)
    expect(allowed.allowed).toBe(true)
  })
})

describe('createInMemoryRateLimitStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('increments counter for identifier', async () => {
    const store = createInMemoryRateLimitStore()
    const result = await store.increment('user-1', 60_000)
    expect(result.count).toBe(1)
  })

  it('returns correct count and resetAt', async () => {
    const store = createInMemoryRateLimitStore()
    const now = Date.now()
    const result = await store.increment('user-1', 60_000)

    expect(result.count).toBe(1)
    expect(result.resetAt).toBeGreaterThanOrEqual(now + 60_000)
  })

  it('check() does not increment', async () => {
    const store = createInMemoryRateLimitStore()

    const checkResult = await store.check('user-1')
    expect(checkResult.count).toBe(0)

    await store.increment('user-1', 60_000)
    const afterIncrement = await store.check('user-1')
    expect(afterIncrement.count).toBe(1)
  })

  it('isolates different identifiers', async () => {
    const store = createInMemoryRateLimitStore()

    await store.increment('user-1', 60_000)
    await store.increment('user-1', 60_000)
    await store.increment('user-1', 60_000)
    await store.increment('user-2', 60_000)

    const result1 = await store.check('user-1')
    const result2 = await store.check('user-2')

    expect(result1.count).toBe(3)
    expect(result2.count).toBe(1)
  })

  it('prunes stale timestamps', async () => {
    const store = createInMemoryRateLimitStore()

    await store.increment('user-1', 10_000) // at t=0

    vi.advanceTimersByTime(10_001)

    const result = await store.increment('user-1', 10_000)
    expect(result.count).toBe(1) // old one pruned, only the new one counts
  })
})
