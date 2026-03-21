# Phase 1 — Test Plan: Foundation (Types + Provider + Route Handler with CAG)

**Package:** `@tour-kit/ai`
**Phase Type:** Service — mock the AI SDK, test the provider/hook/route-handler logic
**Framework:** Vitest + `@testing-library/react`
**Date:** 2026-03-21

---

## User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a developer, I want `useAiChat().sendMessage()` to produce a streamed response, so that I can build chat UIs | `sendMessage` calls `useChat.append`; messages update in state | Unit (mocked `useChat`) |
| US-2 | As a developer, I want `createChatRouteHandler` to return a valid POST handler, so that I can wire it to Next.js routes | Returns `{ POST }` object; `POST` is an async function accepting `Request` | Unit (mocked `streamText`) |
| US-3 | As a developer, I want status transitions (ready→submitted→streaming→ready), so that I can show loading states | Provider reflects `useChat.status` as `ChatStatus`; error state handled | Unit (mocked `useChat`) |
| US-4 | As a developer, I want CAG strategy to stuff documents into the system prompt, so that the LLM has context | Route handler concatenates document content into system prompt; `streamText` receives it | Unit (mocked `streamText`) |
| US-5 | As a developer, I want type exports to resolve correctly from all entry points, so that TypeScript consumers get full type safety | All public types are importable from `@tour-kit/ai` and `@tour-kit/ai/server` | Unit (static import checks) |

---

## Component Mock Strategy

| Component | Real or Mock | Implementation | Rationale |
|-----------|-------------|----------------|-----------|
| `useChat` from `@ai-sdk/react` | **Mock** | `vi.mock('@ai-sdk/react')` returning controlled state | We test our wrapper logic, not the AI SDK internals |
| `streamText` from `ai` | **Mock** | `vi.mock('ai')` returning a fake stream result | Route handler tests need deterministic responses without API calls |
| `convertToModelMessages` from `ai` | **Mock** | `vi.mock('ai')` — passthrough identity function | Not testing AI SDK message conversion |
| `AiChatProvider` | **Real** | Rendered with `renderHook` wrapper | The provider IS the system under test |
| `useAiChat` | **Real** | Called via `renderHook` inside provider | The hook IS the system under test |
| `createChatRouteHandler` | **Real** | Called directly, mocked `streamText` underneath | The factory IS the system under test |
| `Request` / `Response` | **Real** | Use native `Request`/`Response` (available in Node 18+) | No need to mock — jsdom + Node 18 support them |

---

## Test Tier Table

| Test File | Tier | US | Mocks Used | Lines (est.) |
|-----------|------|----|------------|-------------|
| `types/config-types.test.ts` | Unit | US-5 | None (type-level) | ~60 |
| `types/document-types.test.ts` | Unit | US-5 | None (type-level) | ~40 |
| `types/adapter-types.test.ts` | Unit | US-5 | None (type-level) | ~40 |
| `types/events-types.test.ts` | Unit | US-5 | None (type-level) | ~30 |
| `types/barrel-exports.test.ts` | Unit | US-5 | None | ~50 |
| `context/ai-chat-provider.test.tsx` | Unit | US-1, US-3 | `vi.mock('@ai-sdk/react')` | ~150 |
| `hooks/use-ai-chat.test.tsx` | Unit | US-1, US-3 | `vi.mock('@ai-sdk/react')` | ~180 |
| `server/route-handler.test.ts` | Unit | US-2, US-4 | `vi.mock('ai')` | ~200 |
| `server/cag-strategy.test.ts` | Unit | US-4 | `vi.mock('ai')` | ~120 |

---

## Fake/Mock Implementations

### Mock: `useChat` from `@ai-sdk/react`

```typescript
// packages/ai/src/__tests__/helpers/mock-use-chat.ts
import { vi } from 'vitest'
import type { UIMessage } from 'ai'

export interface MockUseChatReturn {
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  error: Error | null
  input: string
  setInput: ReturnType<typeof vi.fn>
  append: ReturnType<typeof vi.fn>
  reload: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  setMessages: ReturnType<typeof vi.fn>
}

export function createMockUseChatReturn(
  overrides: Partial<MockUseChatReturn> = {}
): MockUseChatReturn {
  return {
    messages: [],
    status: 'ready',
    error: null,
    input: '',
    setInput: vi.fn(),
    append: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    ...overrides,
  }
}

/**
 * Sets up vi.mock for @ai-sdk/react with controllable useChat return value.
 * Call in beforeEach; update mockReturn properties to simulate state changes.
 *
 * Usage:
 *   const mockReturn = createMockUseChatReturn()
 *   vi.mock('@ai-sdk/react', () => ({
 *     useChat: vi.fn(() => mockReturn),
 *   }))
 */
```

### Mock: `streamText` from `ai`

```typescript
// packages/ai/src/__tests__/helpers/mock-stream-text.ts
import { vi } from 'vitest'

export interface MockStreamResult {
  toUIMessageStreamResponse: ReturnType<typeof vi.fn>
  text: Promise<string>
  usage: Promise<{ promptTokens: number; completionTokens: number }>
}

export function createMockStreamResult(
  overrides: Partial<MockStreamResult> = {}
): MockStreamResult {
  return {
    toUIMessageStreamResponse: vi.fn(() => new Response('mock stream', {
      headers: { 'Content-Type': 'text/event-stream' },
    })),
    text: Promise.resolve('Mock AI response'),
    usage: Promise.resolve({ promptTokens: 10, completionTokens: 20 }),
    ...overrides,
  }
}

/**
 * Usage:
 *   const mockResult = createMockStreamResult()
 *   vi.mock('ai', () => ({
 *     streamText: vi.fn(() => mockResult),
 *     convertToModelMessages: vi.fn((msgs) => msgs),
 *   }))
 */
```

### Factory: Test Documents

```typescript
// packages/ai/src/__tests__/helpers/test-documents.ts
import type { Document } from '../../types/document'

export function createTestDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    content: 'Tour Kit is a headless onboarding library for React.',
    metadata: { source: 'test', title: 'Test Document' },
    ...overrides,
  }
}

export function createTestDocuments(count: number): Document[] {
  return Array.from({ length: count }, (_, i) =>
    createTestDocument({
      id: `doc-${i + 1}`,
      content: `Test document ${i + 1} content about topic ${i + 1}.`,
      metadata: { source: 'test', title: `Document ${i + 1}` },
    })
  )
}
```

### Factory: Test Config

```typescript
// packages/ai/src/__tests__/helpers/test-config.ts
import type { AiChatConfig } from '../../types/config'

export function createTestConfig(overrides: Partial<AiChatConfig> = {}): AiChatConfig {
  return {
    endpoint: '/api/chat',
    ...overrides,
  }
}
```

### Wrapper: Provider for Hook Tests

```typescript
// packages/ai/src/__tests__/helpers/test-wrapper.tsx
import type * as React from 'react'
import { AiChatProvider } from '../../context/ai-chat-provider'
import type { AiChatConfig } from '../../types/config'
import { createTestConfig } from './test-config'

export function createTestWrapper(configOverrides: Partial<AiChatConfig> = {}) {
  const config = createTestConfig(configOverrides)
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return <AiChatProvider config={config}>{children}</AiChatProvider>
  }
}
```

---

## Test File List

```
packages/ai/src/__tests__/
├── helpers/
│   ├── mock-use-chat.ts          ← Mock factory for useChat return value
│   ├── mock-stream-text.ts       ← Mock factory for streamText result
│   ├── test-documents.ts         ← Document factory (createTestDocument, createTestDocuments)
│   ├── test-config.ts            ← AiChatConfig factory
│   └── test-wrapper.tsx          ← Provider wrapper for renderHook
├── types/
│   ├── config-types.test.ts      ← US-5: Type assignability checks
│   ├── document-types.test.ts    ← US-5: Document/RetrievedDocument type checks
│   ├── adapter-types.test.ts     ← US-5: VectorStoreAdapter/EmbeddingAdapter type checks
│   ├── events-types.test.ts      ← US-5: AiChatEvent type checks
│   └── barrel-exports.test.ts    ← US-5: All types importable from entry points
├── context/
│   └── ai-chat-provider.test.tsx ← US-1, US-3: Provider renders, passes config to useChat
├── hooks/
│   └── use-ai-chat.test.tsx      ← US-1, US-3: Hook exposes state + actions
└── server/
    ├── route-handler.test.ts     ← US-2, US-4: Route handler factory returns POST
    └── cag-strategy.test.ts      ← US-4: Context-stuffing builds correct system prompt
```

---

## Helpers Structure

| File | Purpose |
|------|---------|
| `helpers/mock-use-chat.ts` | `createMockUseChatReturn()` — controllable mock for `@ai-sdk/react` `useChat` |
| `helpers/mock-stream-text.ts` | `createMockStreamResult()` — mock for `ai` `streamText` result |
| `helpers/test-documents.ts` | `createTestDocument()`, `createTestDocuments(n)` — Document factories |
| `helpers/test-config.ts` | `createTestConfig()` — AiChatConfig factory with sensible defaults |
| `helpers/test-wrapper.tsx` | `createTestWrapper()` — Provider wrapper factory for `renderHook` |

---

## Key Testing Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mock `useChat` entirely | `vi.mock('@ai-sdk/react')` | We test our provider/hook wrapper logic, not the AI SDK transport layer |
| Mock `streamText` entirely | `vi.mock('ai')` | Route handler tests verify prompt assembly and response wiring, not LLM calls |
| Type tests use `expectTypeOf` | Vitest `expectTypeOf` for compile-time checks | Validates that interfaces are correctly shaped without runtime assertions |
| Provider tests use `renderHook` | `@testing-library/react` `renderHook` | Standard pattern for testing React hooks; matches monorepo conventions |
| Route handler tests use real `Request`/`Response` | Node 18+ globals | No need to mock web APIs — they're available natively |
| CAG tests assert system prompt content | Capture `streamText` call args | Verify documents are concatenated into the system prompt string |
| No integration tests in Phase 1 | All mocked | Integration was validated in Phase 0; Phase 1 tests the wrapper logic |
| Status mapping is tested exhaustively | All 4 states: ready, submitted, streaming, error | Critical for consumers building loading UIs |

---

## Example Test Cases

### AiChatProvider (Context)

```typescript
// packages/ai/src/__tests__/context/ai-chat-provider.test.tsx
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAiChat } from '../../hooks/use-ai-chat'
import { createTestWrapper } from '../helpers/test-wrapper'
import { createMockUseChatReturn } from '../helpers/mock-use-chat'

const mockUseChatReturn = createMockUseChatReturn()

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => mockUseChatReturn),
}))

describe('AiChatProvider — US-1, US-3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChatReturn.messages = []
    mockUseChatReturn.status = 'ready'
    mockUseChatReturn.error = null
  })

  it('provides chat state to children via useAiChat', () => {
    const wrapper = createTestWrapper({ endpoint: '/api/chat' })
    const { result } = renderHook(() => useAiChat(), { wrapper })

    expect(result.current.messages).toEqual([])
    expect(result.current.status).toBe('ready')
    expect(result.current.error).toBeNull()
  })

  it('throws when useAiChat is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAiChat())
    }).toThrow('useAiChat must be used within an AiChatProvider')

    consoleSpy.mockRestore()
  })

  it('exposes sendMessage that calls useChat.append', () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useAiChat(), { wrapper })

    result.current.sendMessage({ text: 'Hello' })

    expect(mockUseChatReturn.append).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      })
    )
  })
})
```

### useAiChat Hook

```typescript
// packages/ai/src/__tests__/hooks/use-ai-chat.test.tsx
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAiChat } from '../../hooks/use-ai-chat'
import { createTestWrapper } from '../helpers/test-wrapper'
import { createMockUseChatReturn } from '../helpers/mock-use-chat'

const mockUseChatReturn = createMockUseChatReturn()

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => mockUseChatReturn),
}))

describe('useAiChat — US-1, US-3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChatReturn.messages = []
    mockUseChatReturn.status = 'ready'
    mockUseChatReturn.error = null
  })

  describe('Status transitions — US-3', () => {
    it.each([
      ['ready', 'ready'],
      ['submitted', 'submitted'],
      ['streaming', 'streaming'],
      ['error', 'error'],
    ] as const)('maps useChat status "%s" to ChatStatus "%s"', (useChatStatus, expected) => {
      mockUseChatReturn.status = useChatStatus
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      expect(result.current.status).toBe(expected)
    })

    it('exposes error when status is "error"', () => {
      const testError = new Error('LLM failed')
      mockUseChatReturn.status = 'error'
      mockUseChatReturn.error = testError
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe(testError)
    })
  })

  describe('Actions — US-1', () => {
    it('sendMessage calls append with user message', () => {
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      result.current.sendMessage({ text: 'How do I install?' })

      expect(mockUseChatReturn.append).toHaveBeenCalledTimes(1)
      expect(mockUseChatReturn.append).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          parts: [{ type: 'text', text: 'How do I install?' }],
        })
      )
    })

    it('stop calls useChat.stop', () => {
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      result.current.stop()

      expect(mockUseChatReturn.stop).toHaveBeenCalledTimes(1)
    })

    it('reload calls useChat.reload', () => {
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      result.current.reload()

      expect(mockUseChatReturn.reload).toHaveBeenCalledTimes(1)
    })
  })
})
```

### Route Handler (Server)

```typescript
// packages/ai/src/__tests__/server/route-handler.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockStreamResult } from '../helpers/mock-stream-text'
import { createTestDocuments } from '../helpers/test-documents'

const mockStreamResult = createMockStreamResult()

vi.mock('ai', () => ({
  streamText: vi.fn(() => mockStreamResult),
  convertToModelMessages: vi.fn((msgs: unknown[]) => msgs),
}))

describe('createChatRouteHandler — US-2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an object with a POST function', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(3),
      },
    })

    expect(handler).toHaveProperty('POST')
    expect(typeof handler.POST).toBe('function')
  })

  it('POST returns a Response object', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(3),
      },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await handler.POST(request)

    expect(response).toBeInstanceOf(Response)
    expect(streamText).toHaveBeenCalledTimes(1)
    expect(mockStreamResult.toUIMessageStreamResponse).toHaveBeenCalledTimes(1)
  })
})
```

### CAG Strategy (Context Stuffing)

```typescript
// packages/ai/src/__tests__/server/cag-strategy.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockStreamResult } from '../helpers/mock-stream-text'
import { createTestDocument } from '../helpers/test-documents'

const mockStreamResult = createMockStreamResult()

vi.mock('ai', () => ({
  streamText: vi.fn(() => mockStreamResult),
  convertToModelMessages: vi.fn((msgs: unknown[]) => msgs),
}))

describe('CAG Strategy — US-4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stuffs all document content into the system prompt', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const docs = [
      createTestDocument({ id: 'doc-1', content: 'Tour Kit supports React 18 and 19.' }),
      createTestDocument({ id: 'doc-2', content: 'Install with pnpm add @tour-kit/core.' }),
      createTestDocument({ id: 'doc-3', content: 'WCAG 2.1 AA compliance is built-in.' }),
    ]

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: { strategy: 'context-stuffing', documents: docs },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    await handler.POST(request)

    // Verify streamText was called with system prompt containing all documents
    const streamTextCall = (streamText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const systemPrompt = streamTextCall.system as string

    expect(systemPrompt).toContain('Tour Kit supports React 18 and 19.')
    expect(systemPrompt).toContain('Install with pnpm add @tour-kit/core.')
    expect(systemPrompt).toContain('WCAG 2.1 AA compliance is built-in.')
  })

  it('handles empty documents array gracefully', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: { strategy: 'context-stuffing', documents: [] },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    await handler.POST(request)

    // Should still call streamText (no crash on empty docs)
    expect(streamText).toHaveBeenCalledTimes(1)
  })

  it('includes instructions config in system prompt when provided', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: {
        strategy: 'context-stuffing',
        documents: [createTestDocument({ content: 'Some content.' })],
      },
      instructions: {
        productName: 'Tour Kit',
        productDescription: 'A headless onboarding library',
        tone: 'friendly',
        boundaries: ['Do not discuss competitor products'],
      },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    await handler.POST(request)

    const streamTextCall = (streamText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const systemPrompt = streamTextCall.system as string

    expect(systemPrompt).toContain('Tour Kit')
    expect(systemPrompt).toContain('headless onboarding library')
    expect(systemPrompt).toContain('Do not discuss competitor products')
  })
})
```

### Type Assignability Checks

```typescript
// packages/ai/src/__tests__/types/config-types.test.ts
import { describe, expectTypeOf, it } from 'vitest'
import type {
  AiChatConfig,
  ChatStatus,
  ChatRouteHandlerOptions,
  ContextStuffingConfig,
} from '../../types/config'

describe('Config Types — US-5', () => {
  it('AiChatConfig requires endpoint', () => {
    expectTypeOf<AiChatConfig>().toHaveProperty('endpoint')
    expectTypeOf<AiChatConfig['endpoint']>().toBeString()
  })

  it('AiChatConfig has optional tourContext', () => {
    expectTypeOf<AiChatConfig>().toHaveProperty('tourContext')
    expectTypeOf<AiChatConfig['tourContext']>().toEqualTypeOf<boolean | undefined>()
  })

  it('ChatStatus is a string union of 4 values', () => {
    expectTypeOf<'ready'>().toMatchTypeOf<ChatStatus>()
    expectTypeOf<'submitted'>().toMatchTypeOf<ChatStatus>()
    expectTypeOf<'streaming'>().toMatchTypeOf<ChatStatus>()
    expectTypeOf<'error'>().toMatchTypeOf<ChatStatus>()
  })

  it('ChatRouteHandlerOptions requires model and context', () => {
    expectTypeOf<ChatRouteHandlerOptions>().toHaveProperty('model')
    expectTypeOf<ChatRouteHandlerOptions>().toHaveProperty('context')
  })

  it('ContextStuffingConfig has strategy "context-stuffing"', () => {
    expectTypeOf<ContextStuffingConfig['strategy']>().toEqualTypeOf<'context-stuffing'>()
  })
})
```

### Barrel Exports

```typescript
// packages/ai/src/__tests__/types/barrel-exports.test.ts
import { describe, expect, it } from 'vitest'

describe('Barrel Exports — US-5', () => {
  it('client entry exports AiChatProvider', async () => {
    const clientModule = await import('../../index')
    expect(clientModule.AiChatProvider).toBeDefined()
  })

  it('client entry exports useAiChat', async () => {
    const clientModule = await import('../../index')
    expect(clientModule.useAiChat).toBeDefined()
  })

  it('server entry exports createChatRouteHandler', async () => {
    const serverModule = await import('../../server/index')
    expect(serverModule.createChatRouteHandler).toBeDefined()
  })

  it('server entry does NOT export React components', async () => {
    const serverModule = await import('../../server/index')
    expect(serverModule).not.toHaveProperty('AiChatProvider')
    expect(serverModule).not.toHaveProperty('useAiChat')
  })
})
```

---

## Execution Prompt

> Paste this into a Claude Code session to implement Phase 1 tests.

You are writing **Phase 1 tests** for `@tour-kit/ai`. Phase 1 is a service phase — mock the AI SDK, test the provider/hook/route-handler wrapper logic.

### What to implement

**Helpers (create first):**
1. `packages/ai/src/__tests__/helpers/mock-use-chat.ts` — `createMockUseChatReturn()` factory
2. `packages/ai/src/__tests__/helpers/mock-stream-text.ts` — `createMockStreamResult()` factory
3. `packages/ai/src/__tests__/helpers/test-documents.ts` — `createTestDocument()`, `createTestDocuments(n)`
4. `packages/ai/src/__tests__/helpers/test-config.ts` — `createTestConfig()` factory
5. `packages/ai/src/__tests__/helpers/test-wrapper.tsx` — `createTestWrapper()` provider wrapper

**Test files:**
6. `packages/ai/src/__tests__/types/config-types.test.ts` — Type assignability with `expectTypeOf`
7. `packages/ai/src/__tests__/types/document-types.test.ts` — Document type checks
8. `packages/ai/src/__tests__/types/adapter-types.test.ts` — Adapter interface checks
9. `packages/ai/src/__tests__/types/events-types.test.ts` — Event type checks
10. `packages/ai/src/__tests__/types/barrel-exports.test.ts` — All exports resolve from entry points
11. `packages/ai/src/__tests__/context/ai-chat-provider.test.tsx` — Provider renders, passes config, throws outside provider
12. `packages/ai/src/__tests__/hooks/use-ai-chat.test.tsx` — Hook state, actions, status mapping
13. `packages/ai/src/__tests__/server/route-handler.test.ts` — Route handler factory, POST returns Response
14. `packages/ai/src/__tests__/server/cag-strategy.test.ts` — Context-stuffing system prompt assembly

### Conventions

- Use `describe/it/expect` from `vitest` (explicit imports, not global)
- Use `vi.mock()` at module level (hoisted by Vitest)
- Use `vi.clearAllMocks()` in `beforeEach`
- Use `renderHook` from `@testing-library/react` for hook/provider tests
- Use `expectTypeOf` from `vitest` for type-level assertions
- Factory functions follow pattern: `createMock*` for mocks, `createTest*` for test data
- File extension: `.test.ts` for non-React, `.test.tsx` for React components/hooks
- Every `describe` block references the US it covers: `describe('Feature — US-N', ...)`

### Mock pattern

```typescript
// Module-level mock (hoisted by Vitest)
const mockUseChatReturn = createMockUseChatReturn()
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => mockUseChatReturn),
}))

// Reset in beforeEach
beforeEach(() => {
  vi.clearAllMocks()
  mockUseChatReturn.status = 'ready'
  mockUseChatReturn.messages = []
})
```

---

## Run Commands

```bash
# Run all Phase 1 tests
pnpm --filter @tour-kit/ai test -- --run

# Run with coverage
pnpm --filter @tour-kit/ai test -- --run --coverage

# Run specific test suites
pnpm --filter @tour-kit/ai test -- --run src/__tests__/context/
pnpm --filter @tour-kit/ai test -- --run src/__tests__/hooks/
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/
pnpm --filter @tour-kit/ai test -- --run src/__tests__/types/

# Run a single test file
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/cag-strategy.test.ts

# Watch mode during development
pnpm --filter @tour-kit/ai test -- --watch src/__tests__/hooks/use-ai-chat.test.tsx
```
