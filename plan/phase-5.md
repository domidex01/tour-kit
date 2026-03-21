# Phase 5 — Suggestions

**Duration:** Days 20–21 (~7h)
**Depends on:** Phase 1 (provider, `useAiChat`), Phase 2 (system prompt), Phase 3 (`AiChatSuggestions` component)
**Blocks:** Phase 9 (Docs + Ship)
**Risk Level:** LOW — straightforward hook + server utility with well-defined inputs/outputs; no infrastructure dependencies; caching is simple TTL-based
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Add a suggestions system to `@tour-kit/ai` that provides two types of contextual suggestions: static strings defined in config (shown immediately) and dynamic AI-generated follow-up suggestions produced after each assistant response (cached with a configurable TTL).

**Success looks like:**

- `useSuggestions().suggestions` returns the static suggestions array immediately on mount
- After an AI response completes, the hook triggers the suggestion engine to generate 3 follow-up suggestions, which appear in `suggestions` alongside any remaining static ones
- Dynamic suggestions are cached: re-rendering the component within `cacheTtl` ms returns the cached suggestions without a new LLM call
- `useSuggestions().select("How do I export?")` sends that string as a chat message via `useAiChat().sendMessage()`
- `useSuggestions().refresh()` clears the cache and regenerates dynamic suggestions
- The `AiChatSuggestions` component (from Phase 3) is wired to use `useSuggestions()` for its data
- All unit tests pass with > 80% coverage on Phase 5 files

---

## 2. Key Design Decisions

**D1: Suggestions hook consumes `AiChatContext`, does not create its own provider.**
`useSuggestions()` reads chat state (messages, status) from `AiChatContext` (Phase 1) and config from `AiChatConfig.suggestions`. It does NOT introduce a new provider or context — it is a standalone hook that composes with the existing provider.

**D2: Dynamic suggestion generation is a server-side API call, not a client-side LLM call.**
The suggestion engine runs on the server via a dedicated endpoint (or a separate call to the same chat endpoint with a special flag). The `useSuggestions` hook makes a `fetch()` call to generate suggestions — it does NOT import or call LLM APIs on the client. This keeps the client bundle clean and avoids exposing API keys.

**D3: Suggestion generation uses `generateText` (non-streaming), not `streamText`.**
Suggestions are short (3 strings). Streaming is unnecessary overhead. The server-side engine calls `generateText()` with a structured prompt asking for exactly 3 follow-up questions, parses the response, and returns `string[]`.

**D4: Cache is per-conversation-state, keyed by last message ID.**
The cache key is the ID of the last assistant message. If the conversation progresses (new messages), the cache is automatically invalidated. The TTL is a secondary expiration — whichever fires first (new message or TTL) triggers regeneration.

**D5: Static suggestions are always shown first, dynamic suggestions append.**
The `suggestions` array returned by the hook is `[...staticSuggestions, ...dynamicSuggestions]`. Static suggestions that have already been sent as messages are filtered out. Dynamic suggestions that duplicate static ones are also filtered out.

**D6: Generation is debounced — only trigger after status transitions to `'ready'` from `'streaming'`.**
The hook watches `status` from `useAiChat()`. It only triggers dynamic suggestion generation when status transitions from `'streaming'` to `'ready'`, meaning the assistant has finished responding. This avoids generating suggestions mid-stream or on initial load.

---

## 3. Tasks

### 5.1: `useSuggestions` hook — static + dynamic, with cache TTL (2–3h)

**File:** `packages/ai/src/hooks/use-suggestions.ts`

- Read `AiChatConfig.suggestions` from `AiChatContext`
- Read `messages`, `status`, `sendMessage` from `useAiChat()`
- Return `UseSuggestionsReturn`: `{ suggestions, refresh, select }`
- Static suggestions: filter out any that match already-sent user messages
- Dynamic suggestions: fetch from server endpoint after assistant response completes
- Cache: store `{ suggestions: string[], messageId: string, timestamp: number }` in a `useRef`
- On `status` transition `'streaming' → 'ready'`: check cache validity (messageId + TTL), fetch if stale
- `refresh()`: clear cache, re-fetch dynamic suggestions
- `select(suggestion)`: call `sendMessage({ text: suggestion })`, emit `'suggestion_clicked'` event

**State management:**
- `dynamicSuggestions: string[]` via `useState`
- `isLoading: boolean` via `useState` (true while fetching dynamic suggestions)
- Cache ref: `useRef<{ suggestions: string[]; messageId: string; timestamp: number } | null>(null)`
- Previous status ref: `useRef<ChatStatus>('ready')` for detecting transitions

### 5.2: Suggestion engine — server-side LLM call to generate follow-ups (2–3h)

**File:** `packages/ai/src/core/suggestion-engine.ts`

- `generateSuggestions(options): Promise<string[]>`
- Takes: `{ messages: UIMessage[], model: string, productName?: string, count?: number }`
- Builds a prompt: "Based on the conversation, suggest {count} follow-up questions the user might ask. Return only the questions, one per line, no numbering."
- Calls `generateText()` from `'ai'` (non-streaming)
- Parses response: split by newlines, trim, filter empty, take first `count` (default 3)
- Returns `string[]`

**Server integration:**
- Add a `suggestions` handler to `createChatRouteHandler` that accepts POST with `{ messages, type: 'suggestions' }` body
- OR: expose `generateSuggestions` as a standalone export from `@tour-kit/ai/server` that consumers wire into their own route
- Recommended approach: add a query parameter `?suggestions=true` to the existing chat endpoint, which triggers suggestion generation instead of chat streaming

**Implementation in route handler:**
```typescript
// In createChatRouteHandler, check for suggestions request:
if (url.searchParams.get('suggestions') === 'true') {
  const { messages } = await req.json()
  const suggestions = await generateSuggestions({
    messages,
    model: options.model,
    productName: options.instructions?.productName,
  })
  return Response.json({ suggestions })
}
```

### 5.3: Wire suggestions into `AiChatSuggestions` component (1h)

**File:** `packages/ai/src/components/ai-chat-suggestions.tsx` (update existing from Phase 3)

- If `AiChatSuggestions` currently accepts `suggestions` and `onSelect` as props, keep that API
- Add a "connected" mode: when used inside `AiChatProvider` without explicit props, it auto-connects to `useSuggestions()`
- Props override hook data when provided (controlled vs uncontrolled pattern)
- Show loading state while dynamic suggestions are being generated (optional skeleton/shimmer)

### 5.4: Unit tests for suggestions hook and engine (1–2h)

**Files:**
- `packages/ai/src/__tests__/hooks/use-suggestions.test.tsx`
- `packages/ai/src/__tests__/core/suggestion-engine.test.ts`

**Hook tests (`use-suggestions.test.tsx`):**
- Returns static suggestions immediately
- Filters out static suggestions that match sent messages
- Triggers dynamic suggestion fetch after status `'streaming' → 'ready'`
- Caches dynamic suggestions — no re-fetch within TTL
- Cache invalidated when new message arrives (different messageId)
- `refresh()` clears cache and re-fetches
- `select(suggestion)` calls `sendMessage` with the suggestion text
- Returns empty array when `suggestions` config is undefined
- `isLoading` is true during fetch, false after

**Engine tests (`suggestion-engine.test.ts`):**
- Calls `generateText` with correct prompt structure
- Parses multi-line response into `string[]`
- Handles response with numbering (strips "1. ", "2. " prefixes)
- Returns at most `count` suggestions
- Handles empty/error response gracefully (returns `[]`)
- Includes product name in prompt when provided

---

## 4. Deliverables

| File | Description |
|------|-------------|
| `packages/ai/src/hooks/use-suggestions.ts` | Suggestions hook with static + dynamic support and caching |
| `packages/ai/src/core/suggestion-engine.ts` | Server-side suggestion generation via `generateText` |
| `packages/ai/src/server/route-handler.ts` | Updated with `?suggestions=true` query parameter support |
| `packages/ai/src/components/ai-chat-suggestions.tsx` | Updated to auto-connect with `useSuggestions()` |
| `packages/ai/src/__tests__/hooks/use-suggestions.test.tsx` | Hook unit tests |
| `packages/ai/src/__tests__/core/suggestion-engine.test.ts` | Engine unit tests |

---

## 5. Exit Criteria

- [ ] `useSuggestions().suggestions` returns static suggestions immediately when `suggestions.static` is configured
- [ ] After AI response completes (status `'streaming' → 'ready'`), dynamic suggestions are generated and appended to the suggestions array
- [ ] Dynamic suggestions are cached: no re-fetch within `cacheTtl` ms for the same conversation state
- [ ] Cache is invalidated when a new assistant message arrives (different last message ID)
- [ ] `useSuggestions().select("suggestion text")` sends it as a chat message via `sendMessage()`
- [ ] `useSuggestions().refresh()` clears cache and regenerates dynamic suggestions immediately
- [ ] Static suggestions already sent as messages are filtered out
- [ ] `AiChatSuggestions` component auto-connects to `useSuggestions()` when used inside `AiChatProvider`
- [ ] Server-side `generateSuggestions()` calls `generateText()` (not streaming) and returns `string[]`
- [ ] All unit tests pass: `pnpm --filter @tour-kit/ai test`
- [ ] Coverage > 80% for Phase 5 files

---

## 6. Execution Prompt

You are implementing Phase 5 (Suggestions) of `@tour-kit/ai` in the tour-kit monorepo at `packages/ai/`. This phase adds static and dynamic suggestion support to the chat widget — static suggestions from config and AI-generated follow-up suggestions after each assistant response.

### Data Model Rules

All types are defined in `packages/ai/src/types/`. Use these exact interfaces — do not redefine them:

```typescript
// From types/config.ts
interface SuggestionsConfig {
  /** Static suggestion strings shown immediately */
  static?: string[]
  /** Enable dynamic AI-generated suggestions after each response */
  dynamic?: boolean
  /** Cache TTL for dynamic suggestions in ms (default: 60000) */
  cacheTtl?: number
}

// From types/config.ts — relevant parts of AiChatConfig
interface AiChatConfig {
  endpoint: string
  suggestions?: SuggestionsConfig
  onEvent?(event: AiChatEvent): void
  // ... other fields
}

// Hook return type — define in hooks/use-suggestions.ts
interface UseSuggestionsReturn {
  /** Combined static + dynamic suggestions, filtered for relevance */
  suggestions: string[]
  /** True while dynamic suggestions are being fetched */
  isLoading: boolean
  /** Clear cache and regenerate dynamic suggestions */
  refresh(): void
  /** Send a suggestion as a chat message */
  select(suggestion: string): void
}

// From types/events.ts
interface AiChatEvent {
  type: AiChatEventType
  data: Record<string, unknown>
  timestamp: Date
}

type AiChatEventType =
  | 'chat_opened'
  | 'chat_closed'
  | 'message_sent'
  | 'response_received'
  | 'suggestion_clicked'
  | 'message_rated'
  | 'error'

// AI SDK types used
type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'
// UIMessage from '@ai-sdk/react' — used as-is, not re-exported
```

### Confirmed AI SDK 6.x APIs

```typescript
// generateText — non-streaming text generation (for suggestion engine)
import { generateText } from 'ai'

const { text } = await generateText({
  model: 'openai/gpt-4o-mini',  // Use a cheap/fast model for suggestions
  prompt: 'Based on this conversation, suggest 3 follow-up questions...',
  // OR use messages format:
  messages: [
    { role: 'system', content: 'You generate follow-up question suggestions...' },
    { role: 'user', content: 'Generate 3 suggestions based on:\n...' },
  ],
})
// text: string — the full generated response

// useChat from '@ai-sdk/react' — already wrapped by useAiChat in Phase 1
// The hook exposes: messages, status, sendMessage, etc.
```

### Per-File Implementation Guidance

**`hooks/use-suggestions.ts`**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAiChat } from './use-ai-chat'
import { useAiChatContext } from '../context/ai-chat-context'
import type { UseSuggestionsReturn } from './types'

interface SuggestionCache {
  suggestions: string[]
  messageId: string
  timestamp: number
}

export function useSuggestions(): UseSuggestionsReturn {
  const { config } = useAiChatContext()
  const { messages, status, sendMessage } = useAiChat()
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<SuggestionCache | null>(null)
  const prevStatusRef = useRef<string>(status)

  const suggestionsConfig = config.suggestions
  const cacheTtl = suggestionsConfig?.cacheTtl ?? 60_000

  // Get last assistant message ID for cache key
  const lastAssistantMessage = messages.findLast(m => m.role === 'assistant')
  const lastMessageId = lastAssistantMessage?.id ?? ''

  // Get sent user messages for filtering static suggestions
  const sentMessages = new Set(
    messages.filter(m => m.role === 'user').map(m => {
      // Extract text from message parts
      const textParts = m.parts?.filter(p => p.type === 'text') ?? []
      return textParts.map(p => p.text).join(' ')
    })
  )

  // Filter static suggestions: remove ones already sent
  const staticSuggestions = (suggestionsConfig?.static ?? [])
    .filter(s => !sentMessages.has(s))

  // Fetch dynamic suggestions
  const fetchDynamic = useCallback(async () => {
    if (!suggestionsConfig?.dynamic || messages.length === 0) return

    // Check cache
    const cached = cacheRef.current
    if (
      cached &&
      cached.messageId === lastMessageId &&
      Date.now() - cached.timestamp < cacheTtl
    ) {
      setDynamicSuggestions(cached.suggestions)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${config.endpoint}?suggestions=true`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        }
      )
      const data = await response.json()
      const suggestions: string[] = data.suggestions ?? []

      // Filter out duplicates of static suggestions
      const filtered = suggestions.filter(
        s => !staticSuggestions.includes(s)
      )

      cacheRef.current = {
        suggestions: filtered,
        messageId: lastMessageId,
        timestamp: Date.now(),
      }
      setDynamicSuggestions(filtered)
    } catch {
      setDynamicSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [config.endpoint, messages, lastMessageId, cacheTtl, suggestionsConfig?.dynamic, staticSuggestions])

  // Trigger on status transition: streaming → ready
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (prevStatus === 'streaming' && status === 'ready') {
      fetchDynamic()
    }
  }, [status, fetchDynamic])

  const refresh = useCallback(() => {
    cacheRef.current = null
    fetchDynamic()
  }, [fetchDynamic])

  const select = useCallback((suggestion: string) => {
    sendMessage({ text: suggestion })
    config.onEvent?.({
      type: 'suggestion_clicked',
      data: { suggestion },
      timestamp: new Date(),
    })
  }, [sendMessage, config])

  return {
    suggestions: [...staticSuggestions, ...dynamicSuggestions],
    isLoading,
    refresh,
    select,
  }
}
```

**`core/suggestion-engine.ts`**

```typescript
import { generateText } from 'ai'
// NOTE: This file is server-only. It uses generateText which requires server-side execution.

interface GenerateSuggestionsOptions {
  /** Recent messages for context */
  messages: Array<{ role: string; content: string }>
  /** AI SDK model identifier */
  model: string
  /** Product name for context in the prompt */
  productName?: string
  /** Number of suggestions to generate (default: 3) */
  count?: number
}

export async function generateSuggestions(
  options: GenerateSuggestionsOptions
): Promise<string[]> {
  const { messages, model, productName, count = 3 } = options

  // Build conversation summary from recent messages (last 6 messages max)
  const recentMessages = messages.slice(-6)
  const conversationContext = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const productContext = productName
    ? ` about ${productName}`
    : ''

  const prompt = [
    `Based on this conversation${productContext}, suggest exactly ${count} natural follow-up questions the user might want to ask next.`,
    '',
    'Conversation:',
    conversationContext,
    '',
    'Rules:',
    '- Return ONLY the questions, one per line',
    '- Do NOT number them or add bullet points',
    '- Keep questions concise (under 60 characters)',
    '- Questions should be diverse and relevant',
    '- Do NOT repeat topics already covered in the conversation',
  ].join('\n')

  try {
    const { text } = await generateText({
      model,
      prompt,
    })

    return parseSuggestions(text, count)
  } catch {
    return []
  }
}

/** Parse LLM response into clean suggestion strings */
export function parseSuggestions(text: string, count: number): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^\d+[\.\)]\s*/, ''))  // strip "1. " or "1) " prefixes
    .map(line => line.replace(/^[-*]\s*/, ''))        // strip "- " or "* " prefixes
    .map(line => line.replace(/^["']|["']$/g, ''))    // strip surrounding quotes
    .filter(line => line.length > 0)
    .slice(0, count)
}
```

**Updating `server/route-handler.ts`**

Add suggestion handling to the existing route handler. Insert this check early in the POST handler, before the main chat logic:

```typescript
// At the top of the POST handler:
const url = new URL(req.url)

if (url.searchParams.get('suggestions') === 'true') {
  const body = await req.json()
  const suggestions = await generateSuggestions({
    messages: body.messages.map((m: UIMessage) => ({
      role: m.role,
      content: m.parts
        ?.filter((p: { type: string }) => p.type === 'text')
        .map((p: { text: string }) => p.text)
        .join(' ') ?? '',
    })),
    model: options.model,
    productName: options.instructions?.productName,
  })
  return Response.json({ suggestions })
}

// ... rest of existing chat handler
```

**Updating `components/ai-chat-suggestions.tsx`**

Add auto-connection mode. The component should work in two modes:
1. **Controlled:** `suggestions` and `onSelect` props provided explicitly
2. **Connected:** Used inside `AiChatProvider` without props — auto-connects to `useSuggestions()`

```typescript
// Simplified pattern:
export function AiChatSuggestions(props: AiChatSuggestionsProps) {
  // Try to use hook data if inside provider and no explicit props
  const hookData = useOptionalSuggestions() // returns null if outside provider

  const suggestions = props.suggestions ?? hookData?.suggestions ?? []
  const onSelect = props.onSelect ?? hookData?.select

  // ... render suggestion chips
}

// useOptionalSuggestions: try/catch around useSuggestions()
// or check if context is available before calling
```

### Testing Patterns

Use vitest and `@testing-library/react`. Mock the fetch API for dynamic suggestion tests:

```typescript
// Mock fetch for dynamic suggestions
const mockFetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({
    suggestions: ['How do I export?', 'What plans are available?', 'How do I invite team members?']
  }),
})
global.fetch = mockFetch

// Wrap hook in test provider
function renderUseSuggestions(config: Partial<AiChatConfig> = {}) {
  return renderHook(() => useSuggestions(), {
    wrapper: ({ children }) => (
      <AiChatProvider config={{ endpoint: '/api/chat', ...config }}>
        {children}
      </AiChatProvider>
    ),
  })
}
```

For `suggestion-engine.test.ts`, mock the `generateText` function from `'ai'`:

```typescript
vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

import { generateText } from 'ai'
const mockGenerateText = vi.mocked(generateText)

// Test: parses multi-line response
mockGenerateText.mockResolvedValue({ text: 'Question 1\nQuestion 2\nQuestion 3' })
const result = await generateSuggestions({ messages: [...], model: 'test' })
expect(result).toEqual(['Question 1', 'Question 2', 'Question 3'])
```

### Constraints

- `hooks/use-suggestions.ts` is client-side React code — NO server imports, NO `generateText`
- `core/suggestion-engine.ts` is server-side — uses `generateText` from `'ai'`, must be in the server entry point
- The hook communicates with the engine via `fetch()` to the chat endpoint with `?suggestions=true`
- Do NOT create a separate suggestions endpoint/route — piggyback on the existing chat endpoint
- Use `useCallback` and `useRef` for stable references to avoid infinite re-render loops
- All functions are named exports (no default exports)
- Run `pnpm --filter @tour-kit/ai build` and `pnpm --filter @tour-kit/ai test` after implementation

---

## Readiness Check

Before starting Phase 5, confirm:

- [ ] Phase 1 is complete: `AiChatProvider` and `useAiChat()` work with `sendMessage()`, `messages`, and `status`
- [ ] Phase 1 is complete: `AiChatConfig` includes the `suggestions?: SuggestionsConfig` field
- [ ] Phase 2 is complete: `createChatRouteHandler` exists and handles POST requests
- [ ] Phase 3 is complete: `AiChatSuggestions` component exists with `suggestions` and `onSelect` props
- [ ] `pnpm --filter @tour-kit/ai build` succeeds
- [ ] `pnpm --filter @tour-kit/ai test` passes all existing tests
- [ ] The `SuggestionsConfig` and `UseSuggestionsReturn` interfaces exist in `types/` (or will be created in task 5.1)
