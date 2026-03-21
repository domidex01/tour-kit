# Phase 7 — Rate Limiting + Hooks + Events: Test Plan

**Package:** `@tour-kit/ai`
**Phase Type:** Service — mock timers for rate limiting, mock Request objects, mock event handlers
**Test Framework:** Vitest + `@testing-library/react`
**Test Files:**
- `packages/ai/src/__tests__/core/rate-limiter.test.ts`
- `packages/ai/src/__tests__/server/rate-limiter.test.ts`
- `packages/ai/src/__tests__/server/hooks.test.ts`
- `packages/ai/src/__tests__/core/events.test.ts`
- `packages/ai/src/__tests__/core/analytics-bridge.test.ts`

---

## 1. Scope

Tests covering five subsystems introduced in Phase 7:

1. **Client-side sliding window rate limiter** (`SlidingWindowRateLimiter`)
2. **Server-side rate limiter** (`createServerRateLimiter`, `createInMemoryRateLimitStore`)
3. **Route handler hooks** (`beforeSend`, `beforeResponse`)
4. **Event emission** (`emitEvent` helper, all 7 event types)
5. **Analytics bridge** (`createAnalyticsBridge`)

---

## 2. Mock Strategy

### 2.1 Fake timers (rate limiter tests)

All rate limiter tests use `vi.useFakeTimers()` to control `Date.now()` precisely. No real `setTimeout` delays.

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

### 2.2 Mock Request objects (server tests)

```typescript
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
```

### 2.3 Mock RateLimitStore (server tests)

```typescript
import type { RateLimitStore } from '../../types/config'

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
```

### 2.4 Event / hook / track spies

```typescript
const onEvent = vi.fn()
const track = vi.fn()
const beforeSend = vi.fn()
const beforeResponse = vi.fn()
```

### 2.5 Mock UIMessage fixtures

```typescript
import type { UIMessage } from '@ai-sdk/react'

const createUserMessage = (text: string): UIMessage => ({
  id: `user-${Date.now()}`,
  role: 'user',
  parts: [{ type: 'text', text }],
  createdAt: new Date(),
}) as UIMessage

const createAssistantMessage = (text: string): UIMessage => ({
  id: `assistant-${Date.now()}`,
  role: 'assistant',
  parts: [{ type: 'text', text }],
  createdAt: new Date(),
}) as UIMessage
```

---

## 3. Test File 1: `__tests__/core/rate-limiter.test.ts`

### `describe('SlidingWindowRateLimiter')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('allows messages under the limit')` | Messages below max pass | `expect(limiter.recordMessage()).toBe(true)` for first N messages |
| 2 | `it('blocks messages at the limit')` | 11th message blocked at default limit 10 | Send 10, assert 11th returns `false` |
| 3 | `it('resets after window expires')` | Timestamps pruned after `windowMs` | Send 10, advance 60001ms, assert `recordMessage()` returns `true` |
| 4 | `it('uses sliding window — not fixed window')` | Partial expiry within window | Send 5 at t=0, 5 at t=30s, advance to t=60.001s — first 5 expire, 5 remain, can send 5 more |
| 5 | `it('returns correct remaining count')` | `getStatus().remaining` accuracy | Send 3, assert `remaining === 7` |
| 6 | `it('returns correct resetInMs')` | Time until oldest timestamp expires | Send 1 at t=0, advance 10s, assert `resetInMs === 50_000` |
| 7 | `it('returns resetInMs of 0 when no messages sent')` | Empty state | `expect(limiter.getStatus().resetInMs).toBe(0)` |
| 8 | `it('reset() clears all timestamps')` | Manual reset | Send 10, `reset()`, assert `canSend === true` and `remaining === 10` |
| 9 | `it('uses default config when none provided')` | Default maxMessages=10, windowMs=60000 | Send 10, assert 11th blocked; advance 60001ms, assert allowed |
| 10 | `it('respects custom maxMessages')` | Override limit | `new SlidingWindowRateLimiter({ maxMessages: 3 })`, send 3, assert 4th blocked |
| 11 | `it('respects custom windowMs')` | Override window | `{ windowMs: 5000 }`, send max, advance 5001ms, assert allowed |

**Example — Tests 2, 4:**

```typescript
import { SlidingWindowRateLimiter, createRateLimiter } from '../../core/rate-limiter'

describe('SlidingWindowRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('blocks messages at the limit', () => {
    const limiter = new SlidingWindowRateLimiter()

    for (let i = 0; i < 10; i++) {
      expect(limiter.recordMessage()).toBe(true)
    }

    expect(limiter.recordMessage()).toBe(false)
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
```

---

## 4. Test File 2: `__tests__/server/rate-limiter.test.ts`

### `describe('createInMemoryRateLimitStore')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('increments counter for identifier')` | Count goes up | `increment('user-1', 60000)` returns `{ count: 1, ... }` |
| 2 | `it('returns correct count and resetAt')` | Accurate metadata | `resetAt` is `Date.now() + windowMs` for first entry |
| 3 | `it('check() does not increment')` | Read-only operation | Call `check`, assert count unchanged, call `increment`, assert count is 1 |
| 4 | `it('isolates different identifiers')` | No cross-contamination | Increment `'user-1'` 3x, increment `'user-2'` 1x, check counts are 3 and 1 |
| 5 | `it('prunes stale timestamps')` | Window expiry | Increment at t=0, advance past window, increment again, assert count is 1 (not 2) |

### `describe('createServerRateLimiter')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('allows requests under the limit')` | Happy path | `result.allowed === true`, `result.remaining > 0` |
| 2 | `it('denies requests at the limit')` | Limit enforcement | Send `maxMessages` requests, assert next has `allowed === false` |
| 3 | `it('extracts identifier from request')` | Identifier function called | `identifier: vi.fn().mockReturnValue('user-1')`, assert called with the `Request` |
| 4 | `it('handles async identifier function')` | Promise-based identifiers | `identifier: vi.fn().mockResolvedValue('user-1')`, assert works |
| 5 | `it('uses in-memory store by default')` | Default store | Create without `store` option, verify it works (increment/check) |
| 6 | `it('uses custom store when provided')` | Pluggable store | Pass `createMockStore()`, assert `store.increment` called |
| 7 | `it('returns correct rate limit result fields')` | Response shape | Assert `{ allowed, count, limit, remaining, resetAt }` all present and correct |
| 8 | `it('resets after window expires')` | Window expiry | Fill limit, advance time past window, assert allowed again |

**Example — Tests 2, 6:**

```typescript
import {
  createServerRateLimiter,
  createInMemoryRateLimitStore,
} from '../../server/rate-limiter'

describe('createServerRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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
```

---

## 5. Test File 3: `__tests__/server/hooks.test.ts`

### `describe('beforeSend')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('passes message through when hook returns message unchanged')` | Passthrough | Response status is 200, LLM receives the original message |
| 2 | `it('blocks message when hook returns null')` | Null = block | Response body includes `{ blocked: true }`, LLM not called |
| 3 | `it('transforms message when hook returns modified message')` | Modification | The modified message text reaches the LLM call |
| 4 | `it('handles async beforeSend hook')` | Promise support | Async hook resolves, message passes through |
| 5 | `it('continues processing on hook error — logs warning')` | Error resilience | Hook throws, response is still 200 (original message used), `console.warn` called |

### `describe('beforeResponse')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('passes response through when hook returns string unchanged')` | Passthrough | Final text matches original LLM output |
| 2 | `it('transforms response when hook returns modified string')` | Modification | Final text is the hook's return value |
| 3 | `it('handles async beforeResponse hook')` | Promise support | Async hook resolves, modified text used |
| 4 | `it('uses original response on hook error')` | Error resilience | Hook throws, original text used, `console.warn` called |

**Example — beforeSend tests 2, 5:**

```typescript
import type { UIMessage } from '@ai-sdk/react'

// Assumes a test helper that creates a minimal route handler with a mock model.
// The exact setup depends on how createChatRouteHandler is structured.

describe('beforeSend', () => {
  it('blocks message when hook returns null', async () => {
    const beforeSend = vi.fn().mockReturnValue(null)
    const mockModel = vi.fn() // mock LLM — should NOT be called

    const handler = createChatRouteHandler({
      model: mockModel,
      beforeSend,
    })

    const messages: UIMessage[] = [createUserMessage('bad content')]
    const req = createMockRequest({ messages })
    const response = await handler(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.blocked).toBe(true)
    // LLM should not have been invoked
  })

  it('continues processing on hook error — logs warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const beforeSend = vi.fn().mockRejectedValue(new Error('hook crashed'))

    const handler = createChatRouteHandler({
      model: 'test-model',
      beforeSend,
    })

    const messages: UIMessage[] = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler(req)

    // Should not return 500 — falls through with original message
    expect(response.status).not.toBe(500)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('beforeResponse', () => {
  it('transforms response when hook returns modified string', async () => {
    const beforeResponse = vi.fn().mockReturnValue('[REDACTED]')

    const handler = createChatRouteHandler({
      model: 'test-model',
      beforeResponse,
    })

    const messages: UIMessage[] = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    await handler(req)

    // beforeResponse should have been called with the LLM output
    expect(beforeResponse).toHaveBeenCalled()
    // The exact assertion on the response depends on streaming format;
    // verify the hook was invoked with a string and returned the modified version
  })

  it('uses original response on hook error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const beforeResponse = vi.fn().mockRejectedValue(new Error('hook crashed'))

    const handler = createChatRouteHandler({
      model: 'test-model',
      beforeResponse,
    })

    const messages: UIMessage[] = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler(req)

    // Response should still succeed (original text used)
    expect(response.status).not.toBe(500)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
```

---

## 6. Test File 4: `__tests__/core/events.test.ts`

### `describe('emitEvent')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('calls onEvent with correct event shape')` | Event structure | `onEvent` called with `{ type, data, timestamp }` |
| 2 | `it('includes timestamp as Date instance')` | Timestamp type | `expect(event.timestamp).toBeInstanceOf(Date)` |
| 3 | `it('does nothing when onEvent is undefined')` | Null safety | No error thrown when `onEvent` is `undefined` |
| 4 | `it('catches and logs handler errors')` | Error isolation | `onEvent` throws, `console.warn` called, no propagation |

### `describe('event integration')`

These tests verify each event type fires at the correct trigger point. They require rendering `AiChatProvider` and triggering actions.

| # | Test name | What it verifies | Data payload assertions |
|---|-----------|------------------|------------------------|
| 1 | `it('emits chat_opened on open()')` | Open event | `type === 'chat_opened'`, `data === {}` |
| 2 | `it('emits chat_closed on close() with messageCount')` | Close event | `type === 'chat_closed'`, `data.messageCount` is a number |
| 3 | `it('emits message_sent on sendMessage() with messageLength')` | Send event | `type === 'message_sent'`, `data.messageLength > 0` |
| 4 | `it('emits response_received when streaming completes with responseTimeMs')` | Response event | `type === 'response_received'`, `data.responseLength > 0`, `data.responseTimeMs >= 0` |
| 5 | `it('emits suggestion_clicked on suggestion select')` | Suggestion event | `type === 'suggestion_clicked'`, `data.suggestion` is a string |
| 6 | `it('emits message_rated on rate')` | Rating event | `type === 'message_rated'`, `data.messageId`, `data.rating` is `'positive'` or `'negative'` |
| 7 | `it('emits error on rate limit hit')` | Error event | `type === 'error'`, `data.reason === 'rate_limited'` |

**Example — emitEvent tests:**

```typescript
import { emitEvent } from '../../core/events' // or wherever emitEvent is exported/importable
import type { AiChatEvent } from '../../types/events'

describe('emitEvent', () => {
  it('calls onEvent with correct event shape', () => {
    const onEvent = vi.fn()

    emitEvent(onEvent, 'message_sent', { messageLength: 42 })

    expect(onEvent).toHaveBeenCalledTimes(1)
    const event: AiChatEvent = onEvent.mock.calls[0][0]
    expect(event.type).toBe('message_sent')
    expect(event.data).toEqual({ messageLength: 42 })
    expect(event.timestamp).toBeInstanceOf(Date)
  })

  it('includes timestamp as Date instance', () => {
    const onEvent = vi.fn()

    emitEvent(onEvent, 'chat_opened', {})

    const event: AiChatEvent = onEvent.mock.calls[0][0]
    expect(event.timestamp).toBeInstanceOf(Date)
  })

  it('does nothing when onEvent is undefined', () => {
    // Should not throw
    expect(() => emitEvent(undefined, 'chat_opened', {})).not.toThrow()
  })

  it('catches and logs handler errors', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onEvent = vi.fn().mockImplementation(() => {
      throw new Error('handler exploded')
    })

    // Should not throw
    expect(() => emitEvent(onEvent, 'error', { error: 'test' })).not.toThrow()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
```

---

## 7. Test File 5: `__tests__/core/analytics-bridge.test.ts`

### `describe('createAnalyticsBridge')`

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('calls track with prefixed event name')` | Name format | `track` called with `'ai_chat.message_sent'` |
| 2 | `it('passes event data as properties')` | Data forwarding | `track` second arg includes all `event.data` fields |
| 3 | `it('includes timestamp in ISO format')` | Timestamp serialization | Properties include `timestamp` as ISO string |
| 4 | `it('uses custom prefix when provided')` | Custom prefix | `prefix: 'custom'` yields `'custom.chat_opened'` |
| 5 | `it('uses default prefix "ai_chat" when none provided')` | Default prefix | Omit `prefix`, assert `'ai_chat.chat_opened'` |

**Full example:**

```typescript
import { createAnalyticsBridge } from '../../core/analytics-bridge'
import type { AiChatEvent } from '../../types/events'

describe('createAnalyticsBridge', () => {
  it('calls track with prefixed event name', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const event: AiChatEvent = {
      type: 'message_sent',
      data: { messageLength: 42 },
      timestamp: new Date('2026-03-21T12:00:00Z'),
    }

    onEvent(event)

    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'ai_chat.message_sent',
      expect.objectContaining({ messageLength: 42 })
    )
  })

  it('passes event data as properties', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const event: AiChatEvent = {
      type: 'chat_closed',
      data: { messageCount: 5 },
      timestamp: new Date(),
    }

    onEvent(event)

    const properties = track.mock.calls[0][1]
    expect(properties.messageCount).toBe(5)
  })

  it('includes timestamp in ISO format', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const timestamp = new Date('2026-03-21T12:00:00Z')
    const event: AiChatEvent = {
      type: 'chat_opened',
      data: {},
      timestamp,
    }

    onEvent(event)

    const properties = track.mock.calls[0][1]
    expect(properties.timestamp).toBe('2026-03-21T12:00:00.000Z')
  })

  it('uses custom prefix when provided', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track, prefix: 'my_app' })

    const event: AiChatEvent = {
      type: 'chat_opened',
      data: {},
      timestamp: new Date(),
    }

    onEvent(event)

    expect(track).toHaveBeenCalledWith(
      'my_app.chat_opened',
      expect.any(Object)
    )
  })

  it('uses default prefix "ai_chat" when none provided', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const event: AiChatEvent = {
      type: 'error',
      data: { error: 'test' },
      timestamp: new Date(),
    }

    onEvent(event)

    expect(track).toHaveBeenCalledWith(
      'ai_chat.error',
      expect.objectContaining({ error: 'test' })
    )
  })
})
```

---

## 8. User Story Coverage Matrix

| User Story | Tests covering it |
|------------|-------------------|
| US-1: Rate limiting prevents abuse | Client: tests 1-3, 9-11; Server: tests 1-2, 7-8 |
| US-2: `beforeSend` returning null blocks messages | Hooks: beforeSend test 2 |
| US-3: All 7 event types fire correctly | Events: integration tests 1-7 |
| US-4: Analytics bridge forwards to @tour-kit/analytics | Analytics bridge: all 5 tests |
| US-5: Server returns 429 with Retry-After headers | Server: tests 2, 7 (result fields used to build response) |

---

## 9. Edge Cases & Error Scenarios

| Scenario | Test file | Test name | Expected behavior |
|----------|-----------|-----------|-------------------|
| Rate limiter at exact boundary | `rate-limiter.test.ts` | Blocks at limit | 10th allowed, 11th blocked |
| Sliding window partial expiry | `rate-limiter.test.ts` | Uses sliding window | Only expired timestamps pruned |
| Async identifier extraction | `server/rate-limiter.test.ts` | Handles async identifier | `Promise<string>` resolved correctly |
| `beforeSend` throws | `hooks.test.ts` | Continues on error | Original message used, warning logged |
| `beforeResponse` throws | `hooks.test.ts` | Uses original on error | Original text preserved, warning logged |
| `onEvent` handler throws | `events.test.ts` | Catches handler errors | Error caught, `console.warn`, no propagation |
| Custom store provided | `server/rate-limiter.test.ts` | Uses custom store | `store.increment` called instead of default |
| Multiple identifiers in server store | `server/rate-limiter.test.ts` | Isolates identifiers | Each identifier tracked independently |

---

## 10. Test Count Summary

| File | Group | Count |
|------|-------|-------|
| `core/rate-limiter.test.ts` | SlidingWindowRateLimiter | 11 |
| `core/rate-limiter.test.ts` | createRateLimiter factory | 1 |
| `server/rate-limiter.test.ts` | createServerRateLimiter | 8 |
| `server/rate-limiter.test.ts` | createInMemoryRateLimitStore | 5 |
| `server/hooks.test.ts` | beforeSend | 5 |
| `server/hooks.test.ts` | beforeResponse | 4 |
| `core/events.test.ts` | emitEvent | 4 |
| `core/events.test.ts` | event integration | 7 |
| `core/analytics-bridge.test.ts` | createAnalyticsBridge | 5 |
| **Total** | | **50** |

---

## 11. Run Commands

```bash
# All Phase 7 tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/rate-limiter.test.ts src/__tests__/server/rate-limiter.test.ts src/__tests__/server/hooks.test.ts src/__tests__/core/events.test.ts src/__tests__/core/analytics-bridge.test.ts

# Individual test files
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/rate-limiter.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/rate-limiter.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/hooks.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/events.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/analytics-bridge.test.ts
```
