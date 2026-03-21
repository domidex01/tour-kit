# Phase 7 — Rate Limiting + Hooks + Events

**Duration:** Days 24–27 (~12h)
**Depends on:** Phase 1 (types, provider, `AiChatConfig`), Phase 4 (route handler with RAG, `createChatRouteHandler`)
**Blocks:** Phase 9 (docs, examples, final quality)
**Risk Level:** MEDIUM — crosses client/server boundary; sliding window algorithm needs precise timer handling; server rate limiter must handle concurrent requests; analytics bridge introduces an optional cross-package dependency
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

**Objective:** Protect against abuse and cost overruns with dual-layer rate limiting (client UX + server cost). Provide guardrail hooks (`beforeSend`, `beforeResponse`) for user-defined content filtering. Emit structured events for analytics and observability. Optionally bridge events to `@tour-kit/analytics`.

**What success looks like:**

- Client-side: after 10 messages in 60 seconds, the send button disables and a "slow down" message appears. The counter resets after the window expires.
- Server-side: after 20 requests from the same IP in 60 seconds, the route handler returns HTTP 429 with a `Retry-After` header. A pluggable `RateLimitStore` supports Redis or database-backed rate limiting.
- `beforeSend` returning `null` silently blocks the message. Returning a modified message sends the modified version.
- `beforeResponse` can redact or transform the AI response string before it reaches the client.
- All 7 event types (`chat_opened`, `chat_closed`, `message_sent`, `response_received`, `suggestion_clicked`, `message_rated`, `error`) fire at the correct moments with structured payloads.
- `createAnalyticsBridge()` optionally forwards `AiChatEvent`s to `@tour-kit/analytics` plugins.

---

## 2. Key Design Decisions

### 2.1 Sliding window algorithm (not fixed window)

Fixed windows allow burst-then-reset patterns (e.g., 10 messages at 0:59, 10 more at 1:01). Sliding window tracks timestamps of individual messages and counts how many fall within the trailing `windowMs`. This provides smoother, more predictable rate limiting.

### 2.2 Client rate limiter is a pure function, not a hook

The rate limiter is a plain TypeScript class (`SlidingWindowRateLimiter`) with no React dependency. The provider instantiates it and checks `canSend()` before dispatching messages. This makes it testable without React rendering and reusable on the server side if needed.

### 2.3 Server rate limiter defaults to in-memory Map

The default `RateLimitStore` uses a `Map<string, { timestamps: number[] }>`. This works for single-process deployments (Vercel serverless, single-node). For multi-instance deployments, users provide a Redis-backed `RateLimitStore`. The interface is intentionally minimal (2 methods).

### 2.4 Hooks run in the route handler pipeline

`beforeSend` runs after rate limiting but before context retrieval and LLM call. `beforeResponse` runs after `streamText` completes but before the response is returned. Both are async-compatible. This positioning means `beforeSend` can prevent expensive LLM calls, and `beforeResponse` can filter the final output.

### 2.5 Events are fire-and-forget

`onEvent` is called synchronously on the client and with `void | Promise<void>` on the server. Errors in event handlers are caught and logged — they never block chat functionality. This matches the pattern used by `@tour-kit/analytics`.

### 2.6 Analytics bridge is a factory, not a hook

`createAnalyticsBridge()` returns an `onEvent` callback function. It does not use React hooks internally — it receives an analytics `track` function at creation time. This makes it usable in both client (`AiChatProvider`) and server (`createChatRouteHandler`) contexts.

---

## 3. Tasks

### Task 7.1 — Client-side rate limiter (2h)

**File:** `packages/ai/src/core/rate-limiter.ts`

Implement a sliding window rate limiter for client-side use.

**Data Model Rules:**
- Types defined in `packages/ai/src/types/config.ts`
- Class is framework-agnostic — no React imports
- Export both the class and a factory function

**Type definitions (from `packages/ai/src/types/config.ts`):**

```typescript
interface ClientRateLimitConfig {
  /** Maximum messages allowed in the window (default: 10) */
  maxMessages?: number
  /** Window duration in milliseconds (default: 60000) */
  windowMs?: number
}
```

**Class signature:**

```typescript
interface RateLimitStatus {
  /** Whether the user can send a message right now */
  canSend: boolean
  /** Number of messages remaining in the current window */
  remaining: number
  /** Milliseconds until the oldest message in the window expires (0 if canSend) */
  resetInMs: number
}

class SlidingWindowRateLimiter {
  constructor(config?: ClientRateLimitConfig)

  /** Record a sent message. Returns false if rate limited. */
  recordMessage(): boolean

  /** Check current status without recording. */
  getStatus(): RateLimitStatus

  /** Reset all tracked timestamps. */
  reset(): void
}

/** Factory function for convenience */
function createRateLimiter(config?: ClientRateLimitConfig): SlidingWindowRateLimiter
```

**Implementation guidance:**

1. Store message timestamps in an array: `timestamps: number[]`
2. On `recordMessage()`:
   - Prune timestamps older than `now - windowMs`
   - If `timestamps.length >= maxMessages`, return `false`
   - Otherwise push `Date.now()`, return `true`
3. On `getStatus()`:
   - Prune stale timestamps
   - `canSend = timestamps.length < maxMessages`
   - `remaining = maxMessages - timestamps.length`
   - `resetInMs = timestamps.length > 0 ? (timestamps[0] + windowMs) - Date.now() : 0`
   - Clamp `resetInMs` to minimum 0
4. Defaults: `maxMessages = 10`, `windowMs = 60000`
5. No `setInterval` — timestamps are pruned lazily on each call

**Wire into provider (`ai-chat-provider.tsx`):**

- Instantiate `SlidingWindowRateLimiter` via `useRef` (stable across renders)
- Before `sendMessage`, check `rateLimiter.recordMessage()` — if `false`, emit `'error'` event with `{ reason: 'rate_limited' }` and do not call `chat.handleSubmit`
- Expose `rateLimitStatus: RateLimitStatus` in context so UI can disable the send button and show remaining count

---

### Task 7.2 — Server-side rate limiter (2–3h)

**File:** `packages/ai/src/server/rate-limiter.ts`

Implement server-side rate limiting with a pluggable store.

**Type definitions (from `packages/ai/src/types/config.ts`):**

```typescript
interface ServerRateLimitConfig {
  /** Maximum messages per window (default: 20) */
  maxMessages?: number
  /** Window duration in milliseconds (default: 60000) */
  windowMs?: number
  /** Extract unique identifier from the request (IP, user ID, API key, etc.) */
  identifier: (req: Request) => string | Promise<string>
  /** Pluggable rate limit store (default: in-memory Map) */
  store?: RateLimitStore
}

interface RateLimitStore {
  /** Increment the counter for an identifier. Returns current count and reset time. */
  increment(identifier: string, windowMs: number): Promise<{ count: number; resetAt: number }>
  /** Check the current count without incrementing. */
  check(identifier: string): Promise<{ count: number; resetAt: number }>
}
```

**Exports:**

```typescript
interface ServerRateLimitResult {
  allowed: boolean
  count: number
  limit: number
  remaining: number
  resetAt: number
}

/** Create the rate limit check function used by the route handler */
function createServerRateLimiter(
  config: ServerRateLimitConfig
): {
  /** Check and increment. Returns result with allowed/denied status. */
  check(req: Request): Promise<ServerRateLimitResult>
}

/** Default in-memory store (single-process only) */
function createInMemoryRateLimitStore(): RateLimitStore
```

**Implementation guidance:**

1. `createInMemoryRateLimitStore()`:
   - Uses `Map<string, number[]>` (identifier -> timestamps)
   - `increment`: prune stale timestamps, push `Date.now()`, return `{ count, resetAt }`
   - `check`: prune stale timestamps, return `{ count, resetAt }` without pushing
   - Periodically clean up entries with no recent timestamps to prevent memory leaks (on every 100th call, sweep entries older than `2 * windowMs`)

2. `createServerRateLimiter(config)`:
   - Defaults: `maxMessages = 20`, `windowMs = 60000`
   - If no `store` provided, create `createInMemoryRateLimitStore()`
   - `check(req)`: extract identifier via `config.identifier(req)`, call `store.increment(identifier, windowMs)`, return `ServerRateLimitResult`

3. Wire into `createChatRouteHandler` (`packages/ai/src/server/route-handler.ts`):
   - If `rateLimit` config provided, create server rate limiter at handler creation time (not per-request)
   - On each POST request, call `rateLimiter.check(req)` before processing
   - If `!result.allowed`, return `Response` with:
     - Status: `429`
     - Body: `JSON.stringify({ error: 'Too many requests', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) })`
     - Headers: `{ 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)), 'X-RateLimit-Limit': String(result.limit), 'X-RateLimit-Remaining': String(result.remaining), 'X-RateLimit-Reset': String(result.resetAt) }`
   - If allowed, add rate limit headers to the streaming response as well

---

### Task 7.3 — `beforeSend` hook (1–2h)

**File:** Update `packages/ai/src/server/route-handler.ts`

Add the `beforeSend` hook to the route handler pipeline.

**Type (already in `ChatRouteHandlerOptions`):**

```typescript
interface ChatRouteHandlerOptions {
  // ... existing ...
  /** Hook: runs before message is processed. Return null to block, return modified message to transform. */
  beforeSend?(message: UIMessage): Promise<UIMessage | null> | UIMessage | null
}
```

**Implementation guidance:**

1. `beforeSend` receives the latest user message (last element of the incoming `messages` array where `role === 'user'`)
2. Pipeline position: after rate limiting, before `convertToModelMessages` and context retrieval
3. If `beforeSend` returns `null`:
   - Return `Response` with status `200` and empty body (or a brief JSON: `{ blocked: true }`)
   - Emit `'message_sent'` event with `{ blocked: true }` in data
   - Do NOT call the LLM
4. If `beforeSend` returns a modified `UIMessage`:
   - Replace the last user message in the array with the returned message
   - Continue processing with the modified message
5. If `beforeSend` throws, catch the error, emit `'error'` event, return `500`
6. Wrap in try/catch — a broken `beforeSend` must not crash the handler

---

### Task 7.4 — `beforeResponse` hook (1–2h)

**File:** Update `packages/ai/src/server/route-handler.ts`

Add the `beforeResponse` hook to the route handler pipeline.

**Type (already in `ChatRouteHandlerOptions`):**

```typescript
interface ChatRouteHandlerOptions {
  // ... existing ...
  /** Hook: runs before response is sent to client. Can modify the response text. */
  beforeResponse?(response: string): Promise<string> | string
}
```

**Implementation guidance:**

1. `beforeResponse` runs after `streamText` produces the full response text
2. This hook operates on the **complete response string** — it does not modify individual tokens during streaming
3. Implementation approach: use AI SDK 6's `onFinish` callback from `streamText` to capture the full text, then apply `beforeResponse` transformation
4. If `beforeResponse` modifies the text, the modified version is what gets stored in message history
5. If `beforeResponse` throws, the original unmodified response is used (logged via `console.warn`)
6. Note: because streaming has already occurred, `beforeResponse` applies to the final persisted message. For real-time filtering during streaming, this is a documented limitation — users should use `beforeSend` for pre-emptive blocking.

**Alternative approach (if full-text post-processing is insufficient):**

If the AI SDK 6 `streamText` API supports a `transform` option or `onChunk` callback that allows modifying chunks in-flight, prefer that approach for `beforeResponse`. Check the AI SDK 6 docs. If not available, document that `beforeResponse` applies to the final assembled response.

---

### Task 7.5 — `onEvent` callback with all 7 event types (2h)

**Files:**
- `packages/ai/src/types/events.ts` (types already defined, verify/update)
- `packages/ai/src/context/ai-chat-provider.tsx` (client events)
- `packages/ai/src/server/route-handler.ts` (server events)

**Type definitions (from `packages/ai/src/types/events.ts`):**

```typescript
type AiChatEventType =
  | 'chat_opened'
  | 'chat_closed'
  | 'message_sent'
  | 'response_received'
  | 'suggestion_clicked'
  | 'message_rated'
  | 'error'

interface AiChatEvent {
  type: AiChatEventType
  data: Record<string, unknown>
  timestamp: Date
}
```

**Event emission points:**

| Event | Where | Trigger | Data Payload |
|-------|-------|---------|--------------|
| `chat_opened` | Client — `AiChatProvider` | `open()` called | `{}` |
| `chat_closed` | Client — `AiChatProvider` | `close()` called | `{ messageCount: number }` |
| `message_sent` | Client — `AiChatProvider` | `sendMessage()` called | `{ messageLength: number, blocked?: boolean }` |
| `response_received` | Client — `AiChatProvider` | AI response completes (status changes from `streaming` to `ready`) | `{ responseLength: number, responseTimeMs: number }` |
| `suggestion_clicked` | Client — `AiChatProvider` | `useSuggestions().select()` called | `{ suggestion: string }` |
| `message_rated` | Client — `AiChatProvider` | User rates a message | `{ messageId: string, rating: 'positive' \| 'negative' }` |
| `error` | Client + Server | Error occurs | `{ error: string, source: 'client' \| 'server', reason?: string }` |

**Implementation guidance:**

1. Create a helper function `emitEvent(onEvent, type, data)`:

```typescript
function emitEvent(
  onEvent: ((event: AiChatEvent) => void) | undefined,
  type: AiChatEventType,
  data: Record<string, unknown> = {}
): void {
  if (!onEvent) return
  try {
    onEvent({ type, data, timestamp: new Date() })
  } catch (error) {
    console.warn(`[@tour-kit/ai] Event handler error for '${type}':`, error)
  }
}
```

2. Client-side: call `emitEvent(config.onEvent, ...)` at each trigger point in the provider
3. Server-side: call `emitEvent(options.onEvent, ...)` in the route handler for `'error'` events (rate limit hit, `beforeSend` rejection, LLM error)
4. For `response_received`: track start time when `status` transitions to `'submitted'`, calculate `responseTimeMs` when it transitions to `'ready'`
5. `onEvent` on the server is `void | Promise<void>` — await it if it returns a promise, but do not block the response

---

### Task 7.6 — `createAnalyticsBridge()` (1h)

**File:** `packages/ai/src/core/analytics-bridge.ts`

Create an optional bridge between `@tour-kit/ai` events and `@tour-kit/analytics`.

**Implementation guidance:**

```typescript
import type { AiChatEvent } from '../types/events'

interface AnalyticsBridgeConfig {
  /** Track function from @tour-kit/analytics — track(eventName, properties) */
  track: (eventName: string, properties?: Record<string, unknown>) => void
  /** Optional prefix for event names (default: 'ai_chat') */
  prefix?: string
}

/**
 * Creates an onEvent callback that forwards AiChatEvent to @tour-kit/analytics.
 *
 * @example
 * ```tsx
 * import { useAnalytics } from '@tour-kit/analytics'
 *
 * function App() {
 *   const { track } = useAnalytics()
 *   const onEvent = createAnalyticsBridge({ track })
 *
 *   return (
 *     <AiChatProvider config={{ onEvent, ... }}>
 *       {children}
 *     </AiChatProvider>
 *   )
 * }
 * ```
 */
function createAnalyticsBridge(
  config: AnalyticsBridgeConfig
): (event: AiChatEvent) => void {
  const prefix = config.prefix ?? 'ai_chat'
  return (event: AiChatEvent) => {
    config.track(`${prefix}.${event.type}`, {
      ...event.data,
      timestamp: event.timestamp.toISOString(),
    })
  }
}
```

**Key constraints:**

- `@tour-kit/analytics` is NOT a dependency — the bridge accepts a `track` function, it does not import the analytics package
- The bridge is a pure function factory — no React hooks, no side effects at import time
- Event names are prefixed to avoid collision with tour-kit analytics events (e.g., `ai_chat.message_sent` vs `tour_completed`)
- Export from `packages/ai/src/index.ts` (client entry point)

---

### Task 7.7 — Unit tests (2–3h)

**Files:**
- `packages/ai/src/__tests__/core/rate-limiter.test.ts`
- `packages/ai/src/__tests__/server/rate-limiter.test.ts`
- `packages/ai/src/__tests__/server/hooks.test.ts`
- `packages/ai/src/__tests__/core/events.test.ts`
- `packages/ai/src/__tests__/core/analytics-bridge.test.ts`

**Test structure:**

```typescript
// ── Client Rate Limiter ──
describe('SlidingWindowRateLimiter', () => {
  it('allows messages under the limit')
  it('blocks messages at the limit')
  it('resets after window expires')
  it('uses sliding window (not fixed window)')
  it('returns correct remaining count')
  it('returns correct resetInMs')
  it('reset() clears all timestamps')
  it('uses default config when none provided')
  it('respects custom maxMessages')
  it('respects custom windowMs')
})

// ── Server Rate Limiter ──
describe('createServerRateLimiter', () => {
  it('allows requests under the limit')
  it('denies requests at the limit')
  it('extracts identifier from request')
  it('handles async identifier function')
  it('uses in-memory store by default')
  it('uses custom store when provided')
  it('returns correct rate limit headers')
  it('resets after window expires')
})

describe('createInMemoryRateLimitStore', () => {
  it('increments counter for identifier')
  it('returns correct count and resetAt')
  it('check() does not increment')
  it('isolates different identifiers')
  it('prunes stale entries')
})

// ── beforeSend Hook ──
describe('beforeSend', () => {
  it('passes message through when hook returns message unchanged')
  it('blocks message when hook returns null')
  it('transforms message when hook returns modified message')
  it('handles async hook')
  it('continues processing on hook error (logs warning)')
})

// ── beforeResponse Hook ──
describe('beforeResponse', () => {
  it('passes response through when hook returns string unchanged')
  it('transforms response when hook returns modified string')
  it('handles async hook')
  it('uses original response on hook error')
})

// ── Events ──
describe('emitEvent', () => {
  it('calls onEvent with correct event shape')
  it('includes timestamp as Date')
  it('does nothing when onEvent is undefined')
  it('catches and logs handler errors')
})

describe('event integration', () => {
  it('emits chat_opened on open()')
  it('emits chat_closed on close() with messageCount')
  it('emits message_sent on sendMessage() with messageLength')
  it('emits response_received when streaming completes with responseTimeMs')
  it('emits suggestion_clicked on suggestion select')
  it('emits message_rated on rate')
  it('emits error on rate limit hit')
})

// ── Analytics Bridge ──
describe('createAnalyticsBridge', () => {
  it('calls track with prefixed event name')
  it('passes event data as properties')
  it('includes timestamp in ISO format')
  it('uses custom prefix when provided')
  it('uses default prefix "ai_chat" when none provided')
})
```

**Test utilities:**

- Use `vi.useFakeTimers()` for all rate limiter tests — control `Date.now()` precisely
- Mock `Request` objects: `new Request('http://localhost/api/chat', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })`
- For route handler hook tests: create a minimal route handler with mock model, call the POST handler with mock requests, inspect responses
- For event tests: pass `onEvent: vi.fn()` and assert call arguments
- For analytics bridge tests: pass `track: vi.fn()` and assert call arguments

---

## 4. Deliverables

| File | Description |
|------|-------------|
| `packages/ai/src/core/rate-limiter.ts` | `SlidingWindowRateLimiter` class + `createRateLimiter()` factory |
| `packages/ai/src/server/rate-limiter.ts` | `createServerRateLimiter()` + `createInMemoryRateLimitStore()` |
| `packages/ai/src/server/route-handler.ts` | Updated with `beforeSend`, `beforeResponse` hooks, rate limiting, and event emission |
| `packages/ai/src/core/analytics-bridge.ts` | `createAnalyticsBridge()` factory |
| `packages/ai/src/types/events.ts` | Verified/updated `AiChatEvent` and `AiChatEventType` types |
| `packages/ai/src/types/config.ts` | Verified/updated `ClientRateLimitConfig`, `ServerRateLimitConfig`, `RateLimitStore` |
| `packages/ai/src/context/ai-chat-provider.tsx` | Updated with client rate limiting, event emission, `rateLimitStatus` in context |
| `packages/ai/src/__tests__/core/rate-limiter.test.ts` | Client rate limiter tests |
| `packages/ai/src/__tests__/server/rate-limiter.test.ts` | Server rate limiter + store tests |
| `packages/ai/src/__tests__/server/hooks.test.ts` | `beforeSend` and `beforeResponse` tests |
| `packages/ai/src/__tests__/core/events.test.ts` | Event emission and integration tests |
| `packages/ai/src/__tests__/core/analytics-bridge.test.ts` | Analytics bridge tests |

---

## 5. Exit Criteria

- [ ] Client rate limiter blocks messages after `maxMessages` (default 10) in `windowMs` (default 60s), and `getStatus()` reports `canSend: false` with correct `remaining` and `resetInMs`
- [ ] Client rate limiter resets correctly — after `windowMs` elapses, oldest timestamps are pruned and `canSend` returns `true`
- [ ] Server rate limiter returns HTTP 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers when limit exceeded
- [ ] `createInMemoryRateLimitStore()` correctly isolates identifiers and prunes stale entries
- [ ] Custom `RateLimitStore` adapter is called when provided — verified with mock
- [ ] `beforeSend` returning `null` blocks the message — LLM is NOT called, client receives a non-error response
- [ ] `beforeSend` returning a modified `UIMessage` sends the modified version to the LLM
- [ ] `beforeResponse` can modify the final response string before it is persisted
- [ ] `beforeSend` and `beforeResponse` errors are caught — they do not crash the route handler
- [ ] All 7 event types fire at the correct moments with the correct `data` payloads (verified by `vi.fn()` spy)
- [ ] `onEvent` errors are caught and logged — they do not affect chat functionality
- [ ] `createAnalyticsBridge({ track })` returns an `onEvent` function that calls `track('ai_chat.{eventType}', { ...data })` for every event
- [ ] All unit tests pass with > 80% coverage on Phase 7 files
- [ ] `pnpm --filter @tour-kit/ai typecheck` passes with no errors
- [ ] No `any` types in any file

---

## 6. Execution Prompt

You are implementing Phase 7 (Rate Limiting + Hooks + Events) of the `@tour-kit/ai` package in a pnpm monorepo at `packages/ai/`. This phase adds dual-layer rate limiting, guardrail hooks, event tracking, and an optional analytics bridge.

**Monorepo context:**
- Build: `pnpm --filter @tour-kit/ai build` (tsup, ESM + CJS)
- Typecheck: `pnpm --filter @tour-kit/ai typecheck`
- Test: `pnpm --filter @tour-kit/ai test`
- The package uses AI SDK 6.x — `useChat` from `@ai-sdk/react`, `streamText` from `ai`
- `@tour-kit/analytics` is an optional peer dependency — never import it directly

**Data Model Rules:**
- All types live in `packages/ai/src/types/` — never define interfaces in implementation files
- Import `UIMessage` from `@ai-sdk/react` as type-only: `import type { UIMessage } from '@ai-sdk/react'`
- Use `interface` for object shapes, `type` for unions
- All public interfaces must have JSDoc comments on every field
- No `any` types — use `unknown` for generic error catches

**Type definitions to use (defined in `packages/ai/src/types/config.ts`):**

```typescript
interface ClientRateLimitConfig {
  /** Maximum messages allowed in the window (default: 10) */
  maxMessages?: number
  /** Window duration in milliseconds (default: 60000) */
  windowMs?: number
}

interface ServerRateLimitConfig {
  /** Maximum messages per window (default: 20) */
  maxMessages?: number
  /** Window duration in milliseconds (default: 60000) */
  windowMs?: number
  /** Extract unique identifier from the request */
  identifier: (req: Request) => string | Promise<string>
  /** Pluggable rate limit store (default: in-memory) */
  store?: RateLimitStore
}

interface RateLimitStore {
  /** Increment counter for identifier, return current count and reset time */
  increment(identifier: string, windowMs: number): Promise<{ count: number; resetAt: number }>
  /** Check current count without incrementing */
  check(identifier: string): Promise<{ count: number; resetAt: number }>
}
```

**Type definitions (from `packages/ai/src/types/events.ts`):**

```typescript
type AiChatEventType =
  | 'chat_opened'
  | 'chat_closed'
  | 'message_sent'
  | 'response_received'
  | 'suggestion_clicked'
  | 'message_rated'
  | 'error'

interface AiChatEvent {
  type: AiChatEventType
  data: Record<string, unknown>
  timestamp: Date
}
```

**File 1 — `packages/ai/src/core/rate-limiter.ts`:**

- `SlidingWindowRateLimiter` class — stores `timestamps: number[]`, prunes lazily on each call
- `recordMessage()`: prune stale, check limit, push timestamp if allowed, return boolean
- `getStatus()`: return `{ canSend, remaining, resetInMs }` — `resetInMs` is ms until oldest timestamp expires
- `reset()`: clear timestamps array
- `createRateLimiter(config?)`: factory returning new instance
- Defaults: `maxMessages = 10`, `windowMs = 60000`
- No `setInterval`, no React dependencies, no side effects

**File 2 — `packages/ai/src/server/rate-limiter.ts`:**

- `createInMemoryRateLimitStore()`: returns `RateLimitStore` backed by `Map<string, number[]>`
  - `increment`: prune stale timestamps, push `Date.now()`, return `{ count, resetAt }`
  - `check`: prune stale timestamps, return `{ count, resetAt }` without pushing
  - Sweep stale entries every 100th call to prevent memory leak
- `createServerRateLimiter(config)`: returns `{ check(req): Promise<ServerRateLimitResult> }`
  - Extract identifier via `config.identifier(req)`
  - Call `store.increment(identifier, windowMs)`
  - Return `{ allowed, count, limit, remaining, resetAt }`
- Defaults: `maxMessages = 20`, `windowMs = 60000`

**File 3 — Update `packages/ai/src/server/route-handler.ts`:**

Pipeline order in the POST handler:
1. Parse request body (messages array)
2. Rate limiting check — if denied, return 429 with headers
3. `beforeSend` — extract last user message, call hook, handle null/modified/error
4. Context retrieval (CAG or RAG) — existing logic
5. System prompt assembly — existing logic
6. `streamText()` call with `onFinish` callback
7. In `onFinish`: apply `beforeResponse` to full text if provided
8. Return `result.toUIMessageStreamResponse()`
9. Emit server-side events (`message_sent`, `response_received`, `error`) via `options.onEvent`

429 response format:
```typescript
new Response(
  JSON.stringify({ error: 'Too many requests', retryAfter: retryAfterSeconds }),
  {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSeconds),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetAt),
    },
  }
)
```

**File 4 — Update `packages/ai/src/context/ai-chat-provider.tsx`:**

- Instantiate `SlidingWindowRateLimiter` in `useRef` if `config.rateLimit` is provided
- Before `sendMessage`: call `rateLimiter.recordMessage()` — if false, emit error event, do not send
- Expose `rateLimitStatus` in context: `{ canSend, remaining, resetInMs }` — update via `useState` after each send attempt
- Add `emitEvent` helper calls at all 7 trigger points (see Task 7.5 table)
- Track `responseStartTime` via `useRef` to calculate `responseTimeMs` for `response_received`

**File 5 — `packages/ai/src/core/analytics-bridge.ts`:**

- `createAnalyticsBridge(config: { track, prefix? })`: returns `(event: AiChatEvent) => void`
- Calls `config.track(\`${prefix}.${event.type}\`, { ...event.data, timestamp: event.timestamp.toISOString() })`
- Default prefix: `'ai_chat'`
- No imports from `@tour-kit/analytics` — the `track` function is injected

**File 6+ — Tests:**

All test files listed in Task 7.7. Use:
- `vitest` with `vi.useFakeTimers()` for rate limiter timing tests
- `vi.fn()` for spies on `onEvent`, `track`, `beforeSend`, `beforeResponse`
- `@testing-library/react` `renderHook` for provider integration tests
- Mock `Request` via `new Request(url, { method: 'POST', body: JSON.stringify({ messages: [...] }) })`

**Quality gates:**
- `pnpm --filter @tour-kit/ai typecheck` must pass
- All tests must pass with > 80% coverage on Phase 7 files
- No `any` types
- Rate limiter tests must use fake timers — no real `setTimeout` delays in tests
- Server rate limiter must handle concurrent requests correctly (no race conditions in the in-memory store — but document that the in-memory store is single-process only)

---

## Readiness Check

Before starting implementation, confirm:

- [ ] Phase 1 is complete — `AiChatProvider`, `AiChatConfig`, `useAiChat` exist and work
- [ ] Phase 4 is complete — `createChatRouteHandler` exists with CAG and RAG strategies
- [ ] `packages/ai/src/types/config.ts` has `ClientRateLimitConfig`, `ServerRateLimitConfig`, `RateLimitStore` interfaces
- [ ] `packages/ai/src/types/events.ts` has `AiChatEvent` and `AiChatEventType` types
- [ ] `packages/ai/src/server/route-handler.ts` exports `createChatRouteHandler` with the `ChatRouteHandlerOptions` interface
- [ ] `vitest` and `@testing-library/react` are available for testing
- [ ] `pnpm --filter @tour-kit/ai build` succeeds before starting
