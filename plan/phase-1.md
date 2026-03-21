# Phase 1: Foundation — Types + Provider + Route Handler with CAG

**Package:** `@tour-kit/ai`
**Goal:** Basic chat working end-to-end with context-stuffing strategy. User provides documents, they go in the system prompt, LLM streams a response.
**Depends on:** Phase 0 (validated build system, confirmed AI SDK 6.x APIs)
**Estimated Effort:** 12–15h
**Risk Level:** MEDIUM

---

## 1. Task Breakdown

| # | Task | Hours | Dependencies | Output |
|---|------|-------|-------------|--------|
| 1.1 | Define all TypeScript types (`config.ts`, `document.ts`, `adapter.ts`, `events.ts`) | 2–3h | — | Type files with full interfaces |
| 1.2 | Implement `AiChatProvider` wrapping `useChat` from `@ai-sdk/react` | 2–3h | 1.1 | Provider managing chat lifecycle |
| 1.3 | Implement `useAiChat` hook (thin wrapper exposing chat state + actions) | 2–3h | 1.2 | Working hook with `sendMessage`, `stop`, `reload` |
| 1.4 | Implement `createChatRouteHandler()` with CAG (context-stuffing) strategy | 3–4h | 1.1 | Route handler factory, documents in system prompt |
| 1.5 | Integration test: provider → route handler → streaming response | 2h | 1.3, 1.4 | E2E chat flow verified |
| 1.6 | Unit tests for types and provider | 1–2h | 1.1–1.3 | > 80% coverage on Phase 1 code |

---

## 2. Exit Criteria

- [ ] `useAiChat().sendMessage({ text: "hello" })` produces a streamed response visible in console
- [ ] `createChatRouteHandler({ model: '...', context: { strategy: 'context-stuffing', documents } })` returns a `{ POST }` object with a valid request handler
- [ ] `status` transitions: `ready` → `submitted` → `streaming` → `ready`
- [ ] On LLM error, `status` transitions to `error` and `error` is populated
- [ ] All unit tests pass, coverage > 80% for Phase 1 files
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with zero TypeScript errors
- [ ] Server entry point (`@tour-kit/ai/server`) exports `createChatRouteHandler` only — no React imports leak

---

## 3. File-by-File Implementation

### Project Structure

```
packages/ai/src/
├── types/
│   ├── config.ts        ← Task 1.1
│   ├── document.ts      ← Task 1.1
│   ├── adapter.ts       ← Task 1.1
│   ├── events.ts        ← Task 1.1
│   └── index.ts         ← Task 1.1
├── context/
│   ├── ai-chat-context.ts    ← Task 1.2
│   └── ai-chat-provider.tsx  ← Task 1.2
├── hooks/
│   └── use-ai-chat.ts       ← Task 1.3
├── server/
│   ├── route-handler.ts      ← Task 1.4
│   └── index.ts              ← Task 1.4
├── index.ts                   ← Task 1.1 (re-exports)
└── __tests__/
    ├── context/
    │   └── ai-chat-provider.test.tsx  ← Task 1.6
    ├── hooks/
    │   └── use-ai-chat.test.tsx       ← Task 1.6
    └── server/
        └── route-handler.test.ts      ← Task 1.5, 1.6
```

---

### Task 1.1: TypeScript Types

#### `src/types/config.ts`

All client-side configuration types. Phase 1 defines the full shape but only `endpoint` is functionally wired. The remaining fields (`suggestions`, `persistence`, `rateLimit`) are typed now, implemented in later phases.

```typescript
import type { UIMessage } from 'ai'

// ── Client Config ──

export interface AiChatConfig {
  /** API endpoint for chat completions (e.g., '/api/chat') */
  endpoint: string
  /** Enable optional tour-kit context injection (requires @tour-kit/core) */
  tourContext?: boolean
  /** Suggestions config — static strings and/or dynamic AI-generated */
  suggestions?: SuggestionsConfig
  /** Chat persistence — 'local' for localStorage, or custom adapter */
  persistence?: PersistenceConfig
  /** Client-side rate limiting (UX protection) */
  rateLimit?: ClientRateLimitConfig
  /** Event callback for analytics/tracking */
  onEvent?(event: AiChatEvent): void
  /** Configurable UI strings (all have English defaults) */
  strings?: Partial<AiChatStrings>
  /** Error message shown to user on failure */
  errorMessage?: string
}

export interface SuggestionsConfig {
  /** Static suggestion strings shown immediately */
  static?: string[]
  /** Enable dynamic AI-generated suggestions after each response */
  dynamic?: boolean
  /** Cache TTL for dynamic suggestions in ms (default: 60000) */
  cacheTtl?: number
}

export type PersistenceConfig =
  | 'local'
  | { adapter: PersistenceAdapter }

export interface PersistenceAdapter {
  save(chatId: string, messages: UIMessage[]): Promise<void>
  load(chatId: string): Promise<UIMessage[] | null>
  clear(chatId: string): Promise<void>
}

export interface ClientRateLimitConfig {
  /** Max messages per window (default: 10) */
  maxMessages?: number
  /** Window duration in ms (default: 60000) */
  windowMs?: number
}

export interface AiChatStrings {
  placeholder: string
  send: string
  errorMessage: string
  emptyState: string
  stopGenerating: string
  retry: string
}

// ── Chat State ──

/**
 * Aligned with AI SDK 6's useChat status values.
 * 'ready' = idle, 'submitted' = request sent, 'streaming' = tokens arriving, 'error' = failed.
 */
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export interface AiChatState {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null
  isOpen: boolean
}

// ── Server Config ──

export interface ChatRouteHandlerOptions {
  /** AI SDK model identifier (e.g., 'openai/gpt-4o-mini') */
  model: string
  /** Context strategy — how documents are provided to the LLM */
  context: ContextConfig
  /** Layered system prompt configuration */
  instructions?: InstructionsConfig
  /** Server-side rate limiting (cost protection) */
  rateLimit?: ServerRateLimitConfig
  /** Hook: runs before message is processed. Return null to block. */
  beforeSend?(message: UIMessage): Promise<UIMessage | null> | UIMessage | null
  /** Hook: runs before response is returned (output filtering) */
  beforeResponse?(response: string): Promise<string> | string
  /** Max request duration in seconds (default: 30) */
  maxDuration?: number
  /** Server-side event callback */
  onEvent?(event: AiChatEvent): void | Promise<void>
}

export type ContextConfig = ContextStuffingConfig | RAGConfig

export interface ContextStuffingConfig {
  strategy: 'context-stuffing'
  documents: Document[]
}

export interface RAGConfig {
  strategy: 'rag'
  documents: Document[]
  embedding: EmbeddingAdapter
  vectorStore?: VectorStoreAdapter
  topK?: number
  minScore?: number
  chunkSize?: number
  chunkOverlap?: number
  rerank?: { model: string; topN?: number }
}

export interface InstructionsConfig {
  productName?: string
  productDescription?: string
  tone?: 'professional' | 'friendly' | 'concise'
  boundaries?: string[]
  custom?: string
  override?: boolean
}

export interface ServerRateLimitConfig {
  maxMessages?: number
  windowMs?: number
  identifier: (req: Request) => string | Promise<string>
  store?: RateLimitStore
}

// Forward imports from other type files (avoids circular imports)
import type { Document } from './document'
import type { VectorStoreAdapter, EmbeddingAdapter, RateLimitStore } from './adapter'
import type { AiChatEvent } from './events'
```

**Implementation notes:**
- Import `UIMessage` from `'ai'` (the AI SDK 6 package), NOT from `'@ai-sdk/react'`.
- `ContextConfig` is a discriminated union on `strategy`. Phase 1 only implements `'context-stuffing'`. The `RAGConfig` branch is typed but will throw "not implemented" if used.
- Forward imports at bottom of file to avoid circular deps. The import order matters: `config.ts` references `document.ts`, `adapter.ts`, and `events.ts`, but none of those reference `config.ts`.

#### `src/types/document.ts`

```typescript
export interface Document {
  id: string
  content: string
  metadata?: DocumentMetadata
}

export interface DocumentMetadata {
  source?: string
  title?: string
  tags?: string[]
  [key: string]: unknown
}

export interface RetrievedDocument extends Document {
  score: number
}
```

**Implementation notes:**
- `DocumentMetadata` uses index signature `[key: string]: unknown` for extensibility.
- `RetrievedDocument` extends `Document` — used in Phase 4 (RAG). Define it now so the type is stable.

#### `src/types/adapter.ts`

```typescript
import type { Document, RetrievedDocument } from './document'

export interface VectorStoreAdapter {
  name: string
  upsert(documents: Document[], embeddings: number[][]): Promise<void>
  search(embedding: number[], topK: number, minScore?: number): Promise<RetrievedDocument[]>
  delete(ids: string[]): Promise<void>
  clear(): Promise<void>
}

export interface EmbeddingAdapter {
  name: string
  embed(text: string): Promise<number[]>
  embedMany(texts: string[]): Promise<number[][]>
  dimensions: number
}

export interface RateLimitStore {
  increment(identifier: string, windowMs: number): Promise<{ count: number; resetAt: number }>
  check(identifier: string): Promise<{ count: number; resetAt: number }>
}
```

**Implementation notes:**
- These are all interface-only. No implementations in Phase 1. `VectorStoreAdapter` and `EmbeddingAdapter` are implemented in Phase 4. `RateLimitStore` is implemented in Phase 7.
- Defining them now ensures `ChatRouteHandlerOptions` compiles without placeholders.

#### `src/types/events.ts`

```typescript
export type AiChatEventType =
  | 'chat_opened'
  | 'chat_closed'
  | 'message_sent'
  | 'response_received'
  | 'suggestion_clicked'
  | 'message_rated'
  | 'error'

export interface AiChatEvent {
  type: AiChatEventType
  data: Record<string, unknown>
  timestamp: Date
}
```

**Implementation notes:**
- In Phase 1, only `'message_sent'`, `'response_received'`, and `'error'` events are emitted by the provider. The others are wired in Phase 3 (UI) and Phase 7 (full events).
- `onEvent` is called but never throws — wrap calls in try/catch.

#### `src/types/index.ts`

Re-export everything. This is the single import point for all types.

```typescript
export type {
  AiChatConfig,
  SuggestionsConfig,
  PersistenceConfig,
  PersistenceAdapter,
  ClientRateLimitConfig,
  AiChatStrings,
  ChatStatus,
  AiChatState,
  ChatRouteHandlerOptions,
  ContextConfig,
  ContextStuffingConfig,
  RAGConfig,
  InstructionsConfig,
  ServerRateLimitConfig,
} from './config'

export type {
  Document,
  DocumentMetadata,
  RetrievedDocument,
} from './document'

export type {
  VectorStoreAdapter,
  EmbeddingAdapter,
  RateLimitStore,
} from './adapter'

export type {
  AiChatEvent,
  AiChatEventType,
} from './events'
```

**Implementation notes:**
- Use `export type` for all re-exports — these are pure type modules with zero runtime code.
- The main `src/index.ts` re-exports from `types/index.ts` so consumers can do `import type { AiChatConfig } from '@tour-kit/ai'`.

---

### Task 1.2: AiChatProvider

#### `src/context/ai-chat-context.ts`

Creates the React context. Separated from the provider to allow `useAiChat` to import only the context (no circular dependency with provider).

```typescript
import { createContext } from 'react'

// The context value type — what AiChatProvider makes available
export interface AiChatContextValue {
  // Chat state
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null

  // Chat actions
  sendMessage(input: { text: string }): void
  stop(): void
  reload(): void
  setMessages(messages: UIMessage[]): void

  // Panel state
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void

  // Config (for child components that need it)
  config: AiChatConfig
}

import type { UIMessage } from 'ai'
import type { ChatStatus, AiChatConfig } from '../types'

export const AiChatContext = createContext<AiChatContextValue | null>(null)
AiChatContext.displayName = 'AiChatContext'
```

**Implementation notes:**
- Context defaults to `null`. The `useAiChat` hook throws a descriptive error if used outside the provider.
- `displayName` set for React DevTools.

#### `src/context/ai-chat-provider.tsx`

The core provider. Wraps AI SDK's `useChat` hook and manages panel open/close state.

```tsx
'use client'

import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import type { AiChatConfig, ChatStatus } from '../types'
import { AiChatContext, type AiChatContextValue } from './ai-chat-context'

interface AiChatProviderProps {
  config: AiChatConfig
  children: ReactNode
}

export function AiChatProvider({ config, children }: AiChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  // AI SDK useChat — this is the core chat engine
  const {
    messages,
    setMessages,
    status: sdkStatus,
    error: sdkError,
    sendMessage: sdkSendMessage,
    stop,
    reload,
  } = useChat({
    transport: new DefaultChatTransport({ api: config.endpoint }),
    onFinish: ({ message }) => {
      config.onEvent?.({
        type: 'response_received',
        data: { messageId: message.id },
        timestamp: new Date(),
      })
    },
    onError: (error) => {
      config.onEvent?.({
        type: 'error',
        data: { message: error.message },
        timestamp: new Date(),
      })
    },
  })

  // Map AI SDK status to our ChatStatus type
  // AI SDK 6 useChat status: 'ready' | 'submitted' | 'streaming' | 'error'
  // Our ChatStatus is identical, so this is a direct cast.
  const status: ChatStatus = sdkStatus as ChatStatus
  const error: Error | null = sdkError ?? null

  // Wrap sendMessage to emit events
  const sendMessage = useCallback(
    (input: { text: string }) => {
      try {
        config.onEvent?.({
          type: 'message_sent',
          data: { text: input.text },
          timestamp: new Date(),
        })
      } catch {
        // onEvent errors must never break chat
      }
      sdkSendMessage(input)
    },
    [sdkSendMessage, config]
  )

  const open = useCallback(() => {
    setIsOpen(true)
    try {
      config.onEvent?.({
        type: 'chat_opened',
        data: {},
        timestamp: new Date(),
      })
    } catch {
      // swallow
    }
  }, [config])

  const close = useCallback(() => {
    setIsOpen(false)
    try {
      config.onEvent?.({
        type: 'chat_closed',
        data: {},
        timestamp: new Date(),
      })
    } catch {
      // swallow
    }
  }, [config])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value: AiChatContextValue = useMemo(
    () => ({
      messages,
      status,
      error,
      sendMessage,
      stop,
      reload,
      setMessages,
      isOpen,
      open,
      close,
      toggle,
      config,
    }),
    [messages, status, error, sendMessage, stop, reload, setMessages, isOpen, open, close, toggle, config]
  )

  return (
    <AiChatContext.Provider value={value}>
      {children}
    </AiChatContext.Provider>
  )
}
```

**Critical implementation details:**

1. **`DefaultChatTransport`** — AI SDK 6.x requires explicit transport. Import from `'ai'`, not `'@ai-sdk/react'`.

2. **`useChat` import** — From `'@ai-sdk/react'`, NOT from `'ai'`. The `'ai'` package exports server-side streaming utilities; `'@ai-sdk/react'` exports the React hook.

3. **Status mapping** — AI SDK 6's `useChat` returns `status` with values `'ready' | 'submitted' | 'streaming' | 'error'`. These map 1:1 to our `ChatStatus`. If AI SDK changes these values in a minor release, this is the single point to update.

4. **`sendMessage` signature** — AI SDK 6's `sendMessage` accepts `{ text: string }` (confirmed via Context7, 2026-03-21). This is different from AI SDK 4.x/5.x which used `handleSubmit(e)` or `append(message)`.

5. **Event emission** — All `onEvent` calls are wrapped in try/catch. A broken analytics callback must never crash the chat.

6. **`useMemo` for value** — Prevents unnecessary re-renders of the entire subtree. Every callback is `useCallback`-wrapped.

7. **`'use client'` banner** — Required for Next.js App Router. tsup config should NOT add this banner to the server entry point.

---

### Task 1.3: useAiChat Hook

#### `src/hooks/use-ai-chat.ts`

Thin wrapper that reads from `AiChatContext`. Exists so consumers have a clean hook API and don't need to know about `useContext`.

```typescript
'use client'

import { useContext } from 'react'
import { AiChatContext, type AiChatContextValue } from '../context/ai-chat-context'

export interface UseAiChatReturn {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null
  sendMessage(input: { text: string }): void
  stop(): void
  reload(): void
  setMessages(messages: UIMessage[]): void
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void
}

import type { UIMessage } from 'ai'
import type { ChatStatus } from '../types'

export function useAiChat(): UseAiChatReturn {
  const context = useContext(AiChatContext)

  if (!context) {
    throw new Error(
      'useAiChat must be used within an <AiChatProvider>. ' +
      'Wrap your component tree with <AiChatProvider config={...}>.'
    )
  }

  // Return only the public API — exclude `config` which is internal
  return {
    messages: context.messages,
    status: context.status,
    error: context.error,
    sendMessage: context.sendMessage,
    stop: context.stop,
    reload: context.reload,
    setMessages: context.setMessages,
    isOpen: context.isOpen,
    open: context.open,
    close: context.close,
    toggle: context.toggle,
  }
}
```

**Implementation notes:**

1. **Return type** — `UseAiChatReturn` is exported separately from `AiChatContextValue`. The hook strips `config` from the return value. Consumers should not depend on internal config.

2. **Error message** — Descriptive error with fix instructions. Follow the pattern from `@tour-kit/core`'s `useTour()`.

3. **No additional logic** — This hook is intentionally thin in Phase 1. Phase 6 adds persistence wiring, Phase 7 adds client-side rate limiting. Keep it simple now; extend later.

4. **`'use client'`** — Required because it calls `useContext`.

---

### Task 1.4: createChatRouteHandler (Server)

#### `src/server/route-handler.ts`

Factory function that returns a `{ POST }` object compatible with Next.js App Router route handlers.

```typescript
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import type { ChatRouteHandlerOptions, ContextStuffingConfig, Document } from '../types'

/**
 * Creates a Next.js App Router route handler for AI chat.
 *
 * Phase 1: only 'context-stuffing' strategy is implemented.
 * RAG strategy throws an error until Phase 4.
 *
 * @example
 * ```ts
 * // app/api/chat/route.ts
 * import { createChatRouteHandler } from '@tour-kit/ai/server'
 *
 * export const { POST } = createChatRouteHandler({
 *   model: 'openai/gpt-4o-mini',
 *   context: {
 *     strategy: 'context-stuffing',
 *     documents: [
 *       { id: '1', content: 'How to export: Go to Settings > Export...' },
 *     ],
 *   },
 * })
 * ```
 */
export function createChatRouteHandler(options: ChatRouteHandlerOptions): { POST: (req: Request) => Promise<Response> } {
  const { model, context, instructions, maxDuration = 30 } = options

  // Validate context strategy at creation time (fail fast)
  if (context.strategy === 'rag') {
    throw new Error(
      'RAG strategy is not yet implemented. Use "context-stuffing" strategy, ' +
      'or wait for Phase 4. See: https://github.com/tour-kit/tour-kit/issues/TBD'
    )
  }

  // Pre-build the system prompt at creation time (not per-request)
  const systemPrompt = buildSystemPrompt(context as ContextStuffingConfig, instructions)

  async function POST(req: Request): Promise<Response> {
    try {
      // 1. Parse request body
      const { messages }: { messages: UIMessage[] } = await req.json()

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request: messages array required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // 2. Emit message_sent event (server-side)
      const lastMessage = messages[messages.length - 1]
      if (options.onEvent && lastMessage) {
        try {
          await options.onEvent({
            type: 'message_sent',
            data: { messageId: lastMessage.id, role: lastMessage.role },
            timestamp: new Date(),
          })
        } catch {
          // onEvent errors must never break the request
        }
      }

      // 3. beforeSend hook
      // Note: In Phase 1, beforeSend receives the last user message only.
      // Full message-level filtering is Phase 7.
      if (options.beforeSend && lastMessage) {
        const result = await options.beforeSend(lastMessage)
        if (result === null) {
          return new Response(
            JSON.stringify({ error: 'Message blocked by beforeSend hook' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      // 4. Convert UIMessage[] to model messages (AI SDK 6 format)
      const modelMessages = convertToModelMessages(messages)

      // 5. Stream the response
      const result = streamText({
        model,
        system: systemPrompt,
        messages: modelMessages,
        maxDuration,
      })

      // 6. Return streaming response
      return result.toUIMessageStreamResponse()
    } catch (err) {
      // Emit error event
      if (options.onEvent) {
        try {
          await options.onEvent({
            type: 'error',
            data: { message: err instanceof Error ? err.message : 'Unknown error' },
            timestamp: new Date(),
          })
        } catch {
          // swallow
        }
      }

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return { POST }
}

// ── Internal helpers ──

function buildSystemPrompt(
  context: ContextStuffingConfig,
  instructions?: ChatRouteHandlerOptions['instructions']
): string {
  const parts: string[] = []

  // Layer 1: Library defaults (grounding + safety)
  // Skipped if instructions.override === true
  if (!instructions?.override) {
    const productName = instructions?.productName ?? 'this product'
    parts.push(
      `You are a helpful assistant for ${productName}.`,
      'Answer questions based ONLY on the provided documentation context.',
      'If the answer is not in the provided context, say "I don\'t have information about that in my documentation."',
      'Do not make up information or hallucinate facts.',
      'Be concise and direct in your responses.',
    )
  }

  // Layer 2: Structured config
  if (instructions?.productDescription) {
    parts.push(`Product description: ${instructions.productDescription}`)
  }

  if (instructions?.tone) {
    const toneMap = {
      professional: 'Use a professional, authoritative tone.',
      friendly: 'Use a warm, friendly, approachable tone.',
      concise: 'Be extremely concise. Use short sentences and bullet points.',
    } as const
    parts.push(toneMap[instructions.tone])
  }

  if (instructions?.boundaries && instructions.boundaries.length > 0) {
    parts.push('BOUNDARIES:')
    for (const boundary of instructions.boundaries) {
      parts.push(`- ${boundary}`)
    }
  }

  // Layer 3: Custom instructions (appended verbatim)
  if (instructions?.custom) {
    parts.push(instructions.custom)
  }

  // Context: inject all documents into the prompt (CAG strategy)
  if (context.documents.length > 0) {
    parts.push('')
    parts.push('--- DOCUMENTATION CONTEXT ---')
    for (const doc of context.documents) {
      const header = doc.metadata?.title ? `[${doc.metadata.title}]` : `[Document ${doc.id}]`
      parts.push(`${header}\n${doc.content}`)
    }
    parts.push('--- END DOCUMENTATION CONTEXT ---')
  }

  return parts.join('\n')
}
```

**Critical implementation details:**

1. **`model` parameter** — Passed directly to `streamText()`. This is the AI SDK model identifier string (e.g., `'openai/gpt-4o-mini'`). The user must configure their model provider separately. `streamText` resolves the model string via the AI SDK provider registry.

2. **`convertToModelMessages`** — Imported from `'ai'`. Converts `UIMessage[]` (client format with parts) to model messages (server format). This is required in AI SDK 6.x — you cannot pass `UIMessage[]` directly to `streamText`.

3. **`toUIMessageStreamResponse()`** — Returns a `Response` with streaming body. The client-side `useChat` (via `DefaultChatTransport`) knows how to parse this stream format.

4. **System prompt built once** — `buildSystemPrompt()` runs at handler creation time, not per-request. Documents are static in CAG strategy. This avoids re-concatenating documents on every request.

5. **RAG throws at creation time** — Not per-request. Fail fast so developers see the error immediately during development, not when the first user sends a message.

6. **`maxDuration`** — Passed to `streamText()`. AI SDK 6 uses this to abort long-running requests. Default 30 seconds.

7. **No React imports** — This file is server-only. It must NOT import from `'react'` or `'@ai-sdk/react'`. Only `'ai'` (the server-side SDK).

#### `src/server/index.ts`

```typescript
export { createChatRouteHandler } from './route-handler'
```

**Implementation notes:**
- This is the entry point for `@tour-kit/ai/server`. The tsup config (from Phase 0) should have a separate entry for `server/index.ts` that does NOT include the `'use client'` banner.

---

### Task 1.5 & 1.6: Tests

#### `src/__tests__/context/ai-chat-provider.test.tsx`

Tests for `AiChatProvider`. Mock `useChat` from `@ai-sdk/react`.

```
Test cases:
1. renders children without crashing
2. provides context value to child components
3. throws no error when used correctly
4. calls useChat with correct transport config (endpoint from config)
5. sendMessage emits 'message_sent' event via onEvent
6. onFinish callback emits 'response_received' event
7. onError callback emits 'error' event
8. onEvent errors do not crash the provider (try/catch)
9. open() sets isOpen to true and emits 'chat_opened'
10. close() sets isOpen to false and emits 'chat_closed'
11. toggle() flips isOpen
```

**Mocking strategy:**
- Mock `@ai-sdk/react` with `vi.mock('@ai-sdk/react', ...)` — return controlled `messages`, `status`, `sendMessage`, `stop`, `reload`, `setMessages` from the mock `useChat`.
- Mock `ai` to stub `DefaultChatTransport`.
- Use `@testing-library/react` `renderHook` for hook tests.
- Use `vi.fn()` for `onEvent` spy.

#### `src/__tests__/hooks/use-ai-chat.test.tsx`

Tests for `useAiChat` hook.

```
Test cases:
1. throws descriptive error when used outside AiChatProvider
2. returns all expected properties (messages, status, error, sendMessage, stop, reload, setMessages, isOpen, open, close, toggle)
3. does NOT expose config in return value
4. returns current messages from provider
5. returns current status from provider
6. sendMessage delegates to provider's sendMessage
7. stop delegates to provider's stop
8. reload delegates to provider's reload
```

**Mocking strategy:**
- Wrap test components in `<AiChatProvider>` with mocked `useChat`, OR directly provide `AiChatContext.Provider` with a mock value for isolation.

#### `src/__tests__/server/route-handler.test.ts`

Tests for `createChatRouteHandler`. These are Node.js tests — no React, no browser APIs.

```
Test cases:

Creation:
1. returns object with POST function
2. throws error when context.strategy is 'rag' (not implemented)
3. accepts valid ContextStuffingConfig without throwing

POST handler:
4. returns 400 when request body has no messages array
5. returns 400 when messages is not an array
6. calls streamText with correct model parameter
7. calls streamText with system prompt containing document content
8. calls convertToModelMessages with the provided messages
9. returns streaming response (Response object with body)
10. system prompt includes product name from instructions
11. system prompt includes tone instruction
12. system prompt includes boundaries
13. system prompt includes custom instructions
14. system prompt skips Layer 1 defaults when instructions.override is true
15. system prompt includes document titles when metadata.title is present

Hooks:
16. beforeSend returning null returns 403
17. beforeSend returning message allows request to proceed
18. onEvent is called with 'message_sent' for each request
19. onEvent errors do not crash the handler (try/catch)

Error handling:
20. returns 500 when streamText throws
21. emits 'error' event when handler catches an error
```

**Mocking strategy:**
- Mock `'ai'` module: mock `streamText` to return `{ toUIMessageStreamResponse: () => new Response('streamed') }`, mock `convertToModelMessages` to return the input.
- Create `Request` objects using `new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })`.
- No need for HTTP server — the handler is a plain function `(req: Request) => Promise<Response>`.

---

### Main Entry Point

#### `src/index.ts`

```typescript
// ============================================
// CONTEXT & PROVIDERS
// ============================================
export { AiChatProvider } from './context/ai-chat-provider'
export { AiChatContext, type AiChatContextValue } from './context/ai-chat-context'

// ============================================
// HOOKS
// ============================================
export { useAiChat, type UseAiChatReturn } from './hooks/use-ai-chat'

// ============================================
// TYPES
// ============================================
export type {
  AiChatConfig,
  SuggestionsConfig,
  PersistenceConfig,
  PersistenceAdapter,
  ClientRateLimitConfig,
  AiChatStrings,
  ChatStatus,
  AiChatState,
  ChatRouteHandlerOptions,
  ContextConfig,
  ContextStuffingConfig,
  RAGConfig,
  InstructionsConfig,
  ServerRateLimitConfig,
  Document,
  DocumentMetadata,
  RetrievedDocument,
  VectorStoreAdapter,
  EmbeddingAdapter,
  RateLimitStore,
  AiChatEvent,
  AiChatEventType,
} from './types'
```

**Implementation notes:**
- Server exports (`createChatRouteHandler`) are NOT exported from the main entry point. They come from `@tour-kit/ai/server` via `src/server/index.ts`.
- This prevents server-only imports (`streamText`, `convertToModelMessages`) from being bundled into the client.

---

## 4. Data Model Rules

These TypeScript patterns must be followed across all Phase 1 files.

### Type vs Interface

| Use | Pattern |
|-----|---------|
| Object shapes with known keys | `interface` (extendable, better error messages) |
| Union types / discriminated unions | `type` (required for unions) |
| Function signatures in options | Inline in `interface` (not separate `type`) |
| Re-exports | Always `export type` for type-only exports |

### Import Conventions

```typescript
// Correct: import types with 'type' keyword
import type { UIMessage } from 'ai'
import type { ChatStatus } from '../types'

// Correct: import runtime values without 'type'
import { useChat } from '@ai-sdk/react'
import { streamText, convertToModelMessages } from 'ai'

// Wrong: never use namespace imports for AI SDK
// import * as ai from 'ai'  ← breaks tree-shaking
```

### Nullability

```typescript
// Use null for explicit absence (not undefined)
error: Error | null  // ✓
error?: Error        // ✗ — unclear if absent or not-yet-set

// Use optional (?) for config fields that have defaults
maxDuration?: number  // ✓ — defaults to 30
```

### Discriminated Unions

```typescript
// Always use a literal string discriminant
type ContextConfig = ContextStuffingConfig | RAGConfig

// Check with narrowing, not type assertion
if (context.strategy === 'context-stuffing') {
  // context is ContextStuffingConfig here
}
```

### Event Data

```typescript
// Event data is always Record<string, unknown> — loose typing is intentional
// This allows events to carry arbitrary metadata without breaking type contracts
interface AiChatEvent {
  type: AiChatEventType
  data: Record<string, unknown>  // not a specific shape per event type
  timestamp: Date
}
```

---

## 5. Verification Checklist

Run these commands after implementation to verify Phase 1 is complete.

### Build

```bash
# Must succeed with zero errors
pnpm --filter @tour-kit/ai build

# Verify two entry points exist
ls packages/ai/dist/index.js packages/ai/dist/index.cjs
ls packages/ai/dist/server/index.js packages/ai/dist/server/index.cjs

# Verify no React imports in server bundle
grep -r "from 'react'" packages/ai/dist/server/ && echo "FAIL: React leaked into server" || echo "PASS"
```

### Type Check

```bash
# Must pass
pnpm --filter @tour-kit/ai typecheck
```

### Tests

```bash
# All tests pass
pnpm --filter @tour-kit/ai test

# Coverage > 80%
pnpm --filter @tour-kit/ai test:coverage
```

### Manual Smoke Test

In the Next.js example app (`examples/next-app/`):

1. Create `app/api/chat/route.ts`:
```typescript
import { createChatRouteHandler } from '@tour-kit/ai/server'

export const { POST } = createChatRouteHandler({
  model: 'openai/gpt-4o-mini',
  context: {
    strategy: 'context-stuffing',
    documents: [
      { id: '1', content: 'Tour Kit is a headless onboarding library for React.' },
      { id: '2', content: 'To install: pnpm add @tour-kit/core @tour-kit/react' },
    ],
  },
  instructions: {
    productName: 'Tour Kit',
    tone: 'friendly',
  },
})
```

2. Create a test page component:
```tsx
'use client'
import { AiChatProvider, useAiChat } from '@tour-kit/ai'

function ChatTest() {
  const { messages, status, sendMessage } = useAiChat()
  return (
    <div>
      <p>Status: {status}</p>
      {messages.map((m) => (
        <div key={m.id}>{m.role}: {JSON.stringify(m.parts)}</div>
      ))}
      <button onClick={() => sendMessage({ text: 'How do I install Tour Kit?' })}>
        Send
      </button>
    </div>
  )
}

export default function Page() {
  return (
    <AiChatProvider config={{ endpoint: '/api/chat' }}>
      <ChatTest />
    </AiChatProvider>
  )
}
```

3. Verify:
   - Status transitions: `ready` → `submitted` → `streaming` → `ready`
   - Response streams token-by-token (not all at once)
   - Response is grounded in the provided documents
   - Console shows no errors

---

## 6. Readiness Check

Before starting Phase 1, confirm:

- [ ] Phase 0 complete: `pnpm --filter @tour-kit/ai build` works with 3 entry points (index, server, headless)
- [ ] Phase 0 spike confirmed: `streamText` + `toUIMessageStreamResponse` streams token-by-token
- [ ] Phase 0 spike confirmed: `DefaultChatTransport` + `useChat` + `sendMessage({ text })` works client-side
- [ ] `ai` package version is `^6.0.0` in `packages/ai/package.json` dependencies
- [ ] `@ai-sdk/react` package version is `^1.0.0` (or matching AI SDK 6.x) in `packages/ai/package.json` dependencies
- [ ] tsup config has separate entry points for `src/index.ts` (with `'use client'` banner) and `src/server/index.ts` (no banner)
- [ ] `packages/ai/tsconfig.json` extends `../../tooling/tsconfig/react-library.json`
- [ ] Vitest is configured and `pnpm --filter @tour-kit/ai test` runs (even with zero tests)

Phase 1 is ready to begin when all boxes are checked.
