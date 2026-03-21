# Phase 5 Test Plan — Suggestions

**Package:** `@tour-kit/ai`
**Phase:** 5 — Suggestions
**Phase Type:** Service (mock fetch for dynamic suggestions, mock `generateText` for engine)
**Framework:** Vitest + `@testing-library/react` + TypeScript
**Date:** 2026-03-21

---

## User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a user, I want static suggestions shown immediately, so that I know what to ask | `useSuggestions().suggestions` contains the static strings on first render; already-sent suggestions are filtered out | Unit (hook) |
| US-2 | As a user, I want AI-generated follow-up suggestions after each response, so that the conversation flows naturally | Dynamic suggestions fetched after `status` transitions `'streaming' → 'ready'`; appended to suggestions array | Unit (hook) |
| US-3 | As a developer, I want suggestions cached per message, so that re-renders do not trigger new LLM calls | Cache keyed by last assistant message ID + TTL; no re-fetch within TTL for same messageId | Unit (hook) |
| US-4 | As a developer, I want `parseSuggestions` to handle numbered/bulleted responses, so that the engine is robust | `parseSuggestions` strips `1. `, `- `, `* `, surrounding quotes; returns clean `string[]` | Unit (engine) |

---

## Component Mock Strategy

| Dependency | Mock Type | Rationale |
|------------|-----------|-----------|
| `generateText` from `ai` | **vi.mock('ai')** | Avoid real LLM calls; return controlled multi-line text responses |
| `global.fetch` | **vi.fn()** | Mock HTTP calls from `useSuggestions` to the suggestions endpoint |
| `useAiChat` | **vi.mock** or **Provider wrapper** | Provide controlled `messages`, `status`, `sendMessage` to the hook |
| `useAiChatContext` | **Provider wrapper** | Provide `config` with `suggestions` settings |
| `AiChatProvider` | **Test wrapper component** | Wraps `renderHook` calls with required context |
| `Date.now` | **vi.spyOn** | Control cache TTL expiration timing |

---

## Test Tier Table

| Tier | Test Count | Scope |
|------|-----------|-------|
| Unit (hook) | ~15 | `useSuggestions` — static filtering, dynamic fetch, caching, refresh, select |
| Unit (engine) | ~10 | `generateSuggestions` — prompt construction, response parsing, error handling |
| Unit (parser) | ~6 | `parseSuggestions` — numbered, bulleted, quoted, empty, excess lines |
| Integration | ~4 | Route handler `?suggestions=true`, component auto-connect |
| **Total** | **~35** | |

---

## Fake / Mock Implementations

### Mock Fetch for Hook Tests

```typescript
// packages/ai/src/__tests__/helpers/mock-fetch.ts

import { vi } from 'vitest'

export interface MockFetchOptions {
  suggestions?: string[]
  status?: number
  delay?: number
}

export function createMockFetch(options: MockFetchOptions = {}) {
  const {
    suggestions = ['How do I export?', 'What plans are available?', 'How do I invite team members?'],
    status = 200,
  } = options

  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ suggestions }),
  })
}
```

### Test Provider Wrapper

```typescript
// packages/ai/src/__tests__/helpers/test-provider.tsx

import React from 'react'
import type { AiChatConfig } from '../../types'
import { AiChatProvider } from '../../context/ai-chat-provider'

interface TestProviderProps {
  config?: Partial<AiChatConfig>
  children: React.ReactNode
}

export function createTestProvider(configOverrides: Partial<AiChatConfig> = {}) {
  const config: AiChatConfig = {
    endpoint: '/api/chat',
    suggestions: {
      static: ['How do I get started?', 'What features are available?'],
      dynamic: true,
      cacheTtl: 60_000,
    },
    ...configOverrides,
  }

  return function TestProvider({ children }: { children: React.ReactNode }) {
    return <AiChatProvider config={config}>{children}</AiChatProvider>
  }
}
```

### Mock `useAiChat` Return Value

```typescript
// packages/ai/src/__tests__/helpers/mock-use-ai-chat.ts

import { vi } from 'vitest'
import type { ChatStatus } from '../../types'

export interface MockAiChatState {
  messages: Array<{ id: string; role: 'user' | 'assistant'; parts: Array<{ type: 'text'; text: string }> }>
  status: ChatStatus
  sendMessage: ReturnType<typeof vi.fn>
}

export function createMockAiChatState(overrides: Partial<MockAiChatState> = {}): MockAiChatState {
  return {
    messages: [],
    status: 'ready',
    sendMessage: vi.fn(),
    ...overrides,
  }
}

export function createMessagesWithAssistantReply(): MockAiChatState['messages'] {
  return [
    {
      id: 'msg-1',
      role: 'user',
      parts: [{ type: 'text', text: 'How do I get started?' }],
    },
    {
      id: 'msg-2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Welcome! Here is how to get started...' }],
    },
  ]
}
```

---

## Test File List

| # | File | Tests | Tier | US Coverage |
|---|------|-------|------|-------------|
| 1 | `packages/ai/src/__tests__/hooks/use-suggestions.test.tsx` | ~15 | Unit (hook) | US-1, US-2, US-3 |
| 2 | `packages/ai/src/__tests__/core/suggestion-engine.test.ts` | ~10 | Unit (engine) | US-4 |
| 3 | `packages/ai/src/__tests__/core/parse-suggestions.test.ts` | ~6 | Unit (parser) | US-4 |
| 4 | `packages/ai/src/__tests__/server/route-handler-suggestions.test.ts` | ~4 | Integration | US-2 |
| 5 | `packages/ai/src/__tests__/helpers/mock-fetch.ts` | — | Helper | — |
| 6 | `packages/ai/src/__tests__/helpers/test-provider.tsx` | — | Helper | — |
| 7 | `packages/ai/src/__tests__/helpers/mock-use-ai-chat.ts` | — | Helper | — |

---

## Helpers Structure

```
packages/ai/src/__tests__/
├── helpers/
│   ├── mock-fetch.ts            # createMockFetch() for dynamic suggestion requests
│   ├── test-provider.tsx        # createTestProvider() wrapping AiChatProvider
│   ├── mock-use-ai-chat.ts     # createMockAiChatState(), createMessagesWithAssistantReply()
│   ├── factories.ts             # (shared with Phase 4)
│   └── ...                      # (other helpers from previous phases)
├── hooks/
│   └── use-suggestions.test.tsx
├── core/
│   ├── suggestion-engine.test.ts
│   └── parse-suggestions.test.ts
└── server/
    └── route-handler-suggestions.test.ts
```

---

## Key Testing Decisions

1. **Mock `fetch` at the global level for hook tests.** The `useSuggestions` hook calls `fetch()` to the suggestions endpoint. We assign `global.fetch = vi.fn()` in `beforeEach` and restore it in `afterEach`. This avoids needing MSW or a real server.

2. **Mock `useAiChat` via module mock, not provider.** For isolated hook testing, we `vi.mock('../hooks/use-ai-chat')` to return controlled state. This decouples `useSuggestions` tests from the full `AiChatProvider` implementation and Phase 1 internals.

3. **Status transitions tested via `rerender`.** To simulate `status` changing from `'streaming'` to `'ready'`, we mock `useAiChat` to return different status values on successive calls, then call `rerender()` on the `renderHook` result. This triggers the `useEffect` that watches status transitions.

4. **Cache TTL tested with `vi.spyOn(Date, 'now')`.** Instead of real timers, we spy on `Date.now` to control the timestamp returned. This lets us test cache expiration deterministically without `vi.useFakeTimers()` (which can interfere with `renderHook` async behavior).

5. **`parseSuggestions` tested separately.** Since `parseSuggestions` is a pure function exported from `suggestion-engine.ts`, it gets its own focused test file. This is the most thorough test suite for edge cases (numbered, bulleted, quoted, empty lines, excess suggestions).

6. **Engine tests mock only `generateText`.** The `generateSuggestions` function calls `generateText` from `ai`. We mock the entire `ai` module and verify the prompt structure and response parsing. No fetch mocking needed — the engine runs server-side.

7. **Route handler suggestion tests use a real `Request` object.** We construct `new Request('http://localhost/api/chat?suggestions=true', { method: 'POST', body: ... })` and pass it to the handler. This tests the query parameter parsing and response format.

---

## Example Test Case

```typescript
// packages/ai/src/__tests__/hooks/use-suggestions.test.tsx

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSuggestions } from '../../hooks/use-suggestions'

// Mock useAiChat to control chat state
const mockSendMessage = vi.fn()
let mockStatus = 'ready'
let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }> = []

vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => ({
    messages: mockMessages,
    status: mockStatus,
    sendMessage: mockSendMessage,
  }),
}))

vi.mock('../../context/ai-chat-context', () => ({
  useAiChatContext: () => ({
    config: {
      endpoint: '/api/chat',
      suggestions: {
        static: ['How do I get started?', 'What features are available?'],
        dynamic: true,
        cacheTtl: 60_000,
      },
    },
  }),
}))

describe('useSuggestions', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    mockStatus = 'ready'
    mockMessages = []
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        suggestions: ['Follow-up 1', 'Follow-up 2', 'Follow-up 3'],
      }),
    })
    global.fetch = mockFetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns static suggestions immediately on mount', () => {
    const { result } = renderHook(() => useSuggestions())

    expect(result.current.suggestions).toEqual([
      'How do I get started?',
      'What features are available?',
    ])
    expect(result.current.isLoading).toBe(false)
  })

  it('filters out static suggestions that match sent user messages', () => {
    mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'How do I get started?' }],
      },
    ]

    const { result } = renderHook(() => useSuggestions())

    expect(result.current.suggestions).toEqual([
      'What features are available?',
    ])
  })

  it('calls sendMessage when select() is invoked', () => {
    const { result } = renderHook(() => useSuggestions())

    act(() => {
      result.current.select('How do I get started?')
    })

    expect(mockSendMessage).toHaveBeenCalledWith({ text: 'How do I get started?' })
  })

  it('fetches dynamic suggestions after status transitions from streaming to ready', async () => {
    mockMessages = [
      { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
      { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
    ]
    mockStatus = 'streaming'

    const { result, rerender } = renderHook(() => useSuggestions())

    // Transition to ready
    mockStatus = 'ready'
    rerender()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat?suggestions=true',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    await waitFor(() => {
      expect(result.current.suggestions).toContain('Follow-up 1')
    })
  })
})
```

---

## Detailed Test Outlines

### 1. `use-suggestions.test.tsx`

```typescript
describe('useSuggestions', () => {
  describe('Static Suggestions', () => {
    it('returns static suggestions immediately on mount')
    it('filters out static suggestions that match sent user messages')
    it('returns empty array when suggestions config is undefined')
    it('returns empty array when suggestions.static is undefined')
  })

  describe('Dynamic Suggestions', () => {
    it('fetches dynamic suggestions after status transitions streaming → ready')
    it('does not fetch when dynamic is false or undefined')
    it('does not fetch when there are no messages')
    it('appends dynamic suggestions after static suggestions')
    it('filters out dynamic suggestions that duplicate static ones')
    it('sets isLoading to true during fetch, false after')
    it('returns empty dynamic suggestions on fetch error')
  })

  describe('Caching', () => {
    it('does not re-fetch within cacheTtl for the same messageId')
    it('re-fetches when a new assistant message arrives (different messageId)')
    it('re-fetches after cacheTtl expires')
  })

  describe('Actions', () => {
    it('select() calls sendMessage with the suggestion text')
    it('select() emits suggestion_clicked event via onEvent')
    it('refresh() clears cache and re-fetches dynamic suggestions')
  })
})
```

### 2. `suggestion-engine.test.ts`

```typescript
vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

describe('generateSuggestions', () => {
  it('calls generateText with a prompt containing conversation context')
  it('includes product name in prompt when provided')
  it('uses only the last 6 messages for context')
  it('returns parsed suggestions from multi-line response')
  it('returns at most count suggestions (default 3)')
  it('returns empty array on generateText error')
  it('passes the model identifier to generateText')

  describe('prompt construction', () => {
    it('includes conversation messages formatted as role: content')
    it('includes rules about format (no numbering, concise, diverse)')
    it('requests exactly count suggestions')
  })
})
```

### 3. `parse-suggestions.test.ts`

```typescript
describe('parseSuggestions', () => {
  it('splits multi-line text into string array')
  it('trims whitespace from each line')
  it('strips numbered prefixes like "1. " and "1) "')
  it('strips bullet prefixes like "- " and "* "')
  it('strips surrounding quotes from suggestions')
  it('filters out empty lines')
  it('returns at most count results')
  it('handles response with mixed formatting (numbers + bullets)')
  it('returns empty array for empty string input')
  it('handles single-line response')
})
```

### 4. `route-handler-suggestions.test.ts`

```typescript
vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}))

describe('createChatRouteHandler — suggestions', () => {
  it('returns JSON response with suggestions when ?suggestions=true')
  it('calls generateSuggestions with messages from request body')
  it('passes productName from instructions config')
  it('returns 200 with empty suggestions array on engine error')
})
```

---

## Execution Prompt

You are writing tests for Phase 5 (Suggestions) of `@tour-kit/ai`. Use Vitest with `@testing-library/react` for hook tests and plain Vitest for server-side engine tests. Hook tests use `.test.tsx`, server/engine tests use `.test.ts`.

**Setup:**
1. Create helper files: `mock-fetch.ts`, `test-provider.tsx`, `mock-use-ai-chat.ts`
2. Write `parseSuggestions` tests first (pure function, no mocks)
3. Write `suggestion-engine` tests next (mock `generateText` only)
4. Write `useSuggestions` hook tests last (mock `fetch`, `useAiChat`, `useAiChatContext`)
5. Write route handler integration tests

**Conventions:**
- Import `{ describe, expect, it, vi, beforeEach, afterEach }` from `'vitest'`
- Import `{ renderHook, act, waitFor }` from `'@testing-library/react'`
- Use `vi.mock()` at the top of files for module-level mocks
- Use `vi.mocked()` for typed access to mocked functions
- Reset mocks in `beforeEach` with `vi.clearAllMocks()`
- Save and restore `global.fetch` in `beforeEach`/`afterEach`
- Use `waitFor` for async assertions in hook tests
- Use `rerender()` to simulate status transitions
- Test names start with a verb: "returns", "fetches", "filters", "calls"
- No `any` types — use proper TypeScript types or `unknown`

**Run command:**
```bash
pnpm --filter @tour-kit/ai test -- --run src/__tests__/hooks/use-suggestions.test.tsx src/__tests__/core/
```

---

## Run Commands

```bash
# Run all Phase 5 tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/hooks/use-suggestions.test.tsx src/__tests__/core/suggestion-engine.test.ts src/__tests__/core/parse-suggestions.test.ts src/__tests__/server/route-handler-suggestions.test.ts

# Run individual test files
pnpm --filter @tour-kit/ai test -- --run src/__tests__/hooks/use-suggestions.test.tsx
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/suggestion-engine.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/parse-suggestions.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/route-handler-suggestions.test.ts

# Run with coverage for Phase 5 files
pnpm --filter @tour-kit/ai test -- --run --coverage src/__tests__/hooks/use-suggestions.test.tsx src/__tests__/core/suggestion-engine.test.ts src/__tests__/core/parse-suggestions.test.ts

# Run only caching tests
pnpm --filter @tour-kit/ai test -- --run -t "Caching" src/__tests__/hooks/use-suggestions.test.tsx
```
