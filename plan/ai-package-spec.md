# @tour-kit/ai — Technical Specification

**Version:** 2.0.0
**Date:** 2026-03-21
**Status:** Draft (validated against AI SDK 6.x — 2026-03-20, revised 2026-03-21)

---

## 1. Problem Statement & Value Analysis

Users have questions about products — how features work, how to accomplish tasks, billing, troubleshooting. Today, they either search a help center, open a support ticket, or give up. There is no in-context, intelligent help layer that can answer questions grounded in a product's actual documentation.

`@tour-kit/ai` is a **drop-in RAG Q&A chat widget for React apps**. It ships as part of the tour-kit ecosystem with optional tour-kit context awareness, but works standalone — no `@tour-kit/core` required.

### Primary Use Cases

1. **Product support** — "How do I export my data?" "What file formats are supported?"
2. **Feature discovery** — "What can I do with the dashboard?" "How do I set up integrations?"
3. **Sales / pre-purchase** — "What's included in the Pro plan?" "Do you offer team pricing?"
4. **Onboarding assistance** — "I'm new, where should I start?" (enhanced with optional tour-kit context)

### Cost / Time Impact

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Support tickets | ~15% of users need help | ~5% (AI resolves in-context) | 65–70% reduction |
| Time to answer | Wait for support response | Instant AI response | Minutes → seconds |
| Custom AI chat integration | 2–4 weeks per product | Drop-in package + config | 80% dev time saved |
| Knowledge base utilization | Low (users don't search docs) | High (AI surfaces relevant docs) | Better ROI on docs |

---

## 2. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │ TourKit     │   │  AiChatProvider   │   │  UI Components  │  │
│  │ Providers   │──▶│                   │──▶│  AiChatPanel    │  │
│  │ (optional)  │   │  • useAiChat      │   │  AiChatBubble   │  │
│  │             │   │  • useTourAssist  │   │  AiChatMessage  │  │
│  │             │   │  • useSuggestions │   │  AiChatInput    │  │
│  └─────────────┘   └────────┬─────────┘   └─────────────────┘  │
│                             │ POST /api/chat                    │
│                             ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                        SERVER (Route Handler)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  createChatRouteHandler()                                │   │
│  │                                                          │   │
│  │  1. Rate limiting (per-user/IP, in-memory or adapter)    │   │
│  │  2. beforeSend hook (user-defined guardrails)            │   │
│  │  3. convertToModelMessages(messages)                     │   │
│  │  4. Context strategy:                                    │   │
│  │     ├─ CAG: inject all docs into system prompt           │   │
│  │     └─ RAG: embed query → vector search → inject top-K   │   │
│  │  5. Layered system prompt (defaults + config + custom)   │   │
│  │  6. streamText() → token-by-token streaming              │   │
│  │  7. beforeResponse hook (user-defined output filtering)  │   │
│  │  8. result.toUIMessageStreamResponse()                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Context Strategy                                        │   │
│  │  ├─ CAG: all docs in system prompt (< 50K tokens)        │   │
│  │  ├─ RAG in-memory: embed + cosine similarity (< 500 docs)│   │
│  │  └─ RAG external: user-provided VectorStoreAdapter       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Layers

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Client — Context | `AiChatProvider` | Wraps AI SDK `useChat`, manages chat lifecycle, persistence, rate limiting (UX) |
| Client — Hooks | `useAiChat`, `useTourAssistant`, `useSuggestions` | Chat actions, optional tour-aware assistance, contextual suggestions |
| Client — UI | `AiChatPanel`, `AiChatBubble`, `AiChatMessage`, `AiChatInput`, `AiChatSuggestions` | shadcn-style chat components (structured, user-styled via CSS vars/Tailwind) |
| Client — Rendering | Built-in markdown renderer | Lightweight (~2-3KB) chat-focused markdown → React (bold, italic, code, lists, links, headings) |
| Server — Handler | `createChatRouteHandler()` | Route handler factory with layered prompts, context strategy, rate limiting, hooks |
| Server — Context | CAG or RAG strategy | Context-stuffing for small content, RAG middleware for large content |
| Server — RAG | `createRAGMiddleware()` | AI SDK `LanguageModelV3Middleware` — embed, search, optional rerank, inject context |
| Server — Retriever | `createRetriever()` | Chunk, embed, index, and search documents |
| Server — Storage | `VectorStoreAdapter` interface + in-memory default | Pluggable vector storage |

### Data Flow

1. User types a message in `AiChatPanel` → `useAiChat.sendMessage()` sends POST to `/api/chat`
2. Server-side rate limiter checks per-user/IP limits
3. `beforeSend` hook runs (user-defined guardrails/filtering)
4. Route handler converts `UIMessage[]` via `convertToModelMessages()`
5. Context strategy resolves:
   - **CAG:** all documents already in system prompt — no retrieval needed
   - **RAG:** extract query → embed → vector search (+ optional rerank) → inject top-K context
6. Layered system prompt assembled (library defaults + structured config + custom instructions)
7. `streamText()` produces response, streamed token-by-token
8. `beforeResponse` hook runs (user-defined output filtering)
9. Response streamed back via `toUIMessageStreamResponse()`, rendered in `AiChatMessage` with built-in markdown renderer

---

## 3. Data Model Strategy

This is a TypeScript/React package. All data boundaries use TypeScript interfaces + Zod for runtime validation at API edges.

| Type | Used For | Why |
|------|----------|-----|
| TypeScript `interface` | Internal types (`AiChatConfig`, `ChatState`) | Zero runtime cost, full IDE support |
| TypeScript `type` | Union types, mapped types (`ChatStatus`, `ContextStrategy`) | Discriminated unions for state machines |
| Zod schema | API request/response validation | Runtime validation at server boundary |
| `@tour-kit/core` types | Tour state, step definitions (when tour context enabled) | Reuse existing types — no duplication |

### Key Types

```typescript
// ── Configuration ──

interface AiChatConfig {
  /** API endpoint for chat completions */
  endpoint: string
  /** Enable optional tour-kit context injection (requires @tour-kit/core) */
  tourContext?: boolean
  /** Suggestions — static strings and/or dynamic AI-generated */
  suggestions?: SuggestionsConfig
  /** Chat persistence */
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

interface SuggestionsConfig {
  /** Static suggestion strings */
  static?: string[]
  /** Enable dynamic AI-generated suggestions after each response */
  dynamic?: boolean
  /** Cache TTL for dynamic suggestions in ms (default: 60000) */
  cacheTtl?: number
}

type PersistenceConfig =
  | 'local'  // localStorage
  | { adapter: PersistenceAdapter }  // custom server-side adapter

interface PersistenceAdapter {
  save(chatId: string, messages: UIMessage[]): Promise<void>
  load(chatId: string): Promise<UIMessage[] | null>
  clear(chatId: string): Promise<void>
}

interface ClientRateLimitConfig {
  /** Max messages per window (default: 10) */
  maxMessages?: number
  /** Window duration in ms (default: 60000) */
  windowMs?: number
}

interface AiChatStrings {
  placeholder: string        // "Ask a question..."
  send: string               // "Send"
  errorMessage: string       // "Something went wrong. Please try again."
  emptyState: string         // "How can I help you?"
  stopGenerating: string     // "Stop generating"
  retry: string              // "Retry"
}

// ── Messages ──
// Uses AI SDK 6's UIMessage type directly — no custom wrapper.
// MessagePart types from AI SDK: 'text' | 'tool-invocation' | 'source'

interface MessageMetadata {
  /** Tour context at time of message (when tour integration active) */
  tourId?: string
  stepId?: string
  /** Feedback */
  rating?: 'positive' | 'negative'
  /** Latency */
  responseTimeMs?: number
}

// ── Documents ──

interface Document {
  id: string
  content: string
  metadata?: DocumentMetadata
}

interface DocumentMetadata {
  source?: string  // user-defined: 'docs', 'faq', 'tour', 'custom', etc.
  title?: string
  tags?: string[]
  [key: string]: unknown  // extensible
}

interface RetrievedDocument extends Document {
  score: number
}

// ── Adapters ──

interface VectorStoreAdapter {
  name: string
  upsert(documents: Document[], embeddings: number[][]): Promise<void>
  search(embedding: number[], topK: number, minScore?: number): Promise<RetrievedDocument[]>
  delete(ids: string[]): Promise<void>
  clear(): Promise<void>
}

interface EmbeddingAdapter {
  name: string
  embed(text: string): Promise<number[]>
  embedMany(texts: string[]): Promise<number[][]>
  dimensions: number
}

interface RateLimitStore {
  /** Increment counter for identifier, return current count */
  increment(identifier: string, windowMs: number): Promise<{ count: number; resetAt: number }>
  /** Check current count without incrementing */
  check(identifier: string): Promise<{ count: number; resetAt: number }>
}

// ── Events ──

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

// ── Chat State ──

type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'
// Aligned with AI SDK 6's useChat status values

interface AiChatState {
  messages: UIMessage[]  // AI SDK 6 UIMessage type
  status: ChatStatus
  error: Error | null
  isOpen: boolean
}
```

---

## 4. Module Interface Contract

This is a library package, not a standalone service. The contract is defined by its public API exports.

### Client Exports (`@tour-kit/ai`)

#### `<AiChatProvider config={AiChatConfig}>`

Wraps children with AI chat context. Works standalone or nested inside `TourKitProvider`.

```tsx
// Standalone — no tour-kit dependency
<AiChatProvider config={{
  endpoint: '/api/chat',
  suggestions: { static: ['How do I export?', 'What plans are available?'] },
}}>
  {children}
</AiChatProvider>

// With optional tour-kit context
<TourKitProvider config={tourConfig}>
  <AiChatProvider config={{
    endpoint: '/api/chat',
    tourContext: true,
  }}>
    {children}
  </AiChatProvider>
</TourKitProvider>
```

#### `useAiChat()`

Core chat hook. Thin wrapper over AI SDK's `useChat` with persistence and panel state.

```typescript
interface UseAiChatReturn {
  messages: UIMessage[]    // AI SDK 6 UIMessage
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
```

#### `useTourAssistant()`

High-level hook combining chat + tour awareness. Only available when `@tour-kit/core` is installed and `tourContext: true`.

```typescript
interface UseTourAssistantReturn extends UseAiChatReturn {
  /** Suggestions based on current tour/step context */
  suggestions: string[]
  /** Ask about the current step */
  askAboutStep(): void
  /** Ask for help with current task */
  askForHelp(topic?: string): void
  /** Current tour context */
  tourContext: TourAssistantContext
}

interface TourAssistantContext {
  activeTour: { id: string; name: string; currentStep: number; totalSteps: number } | null
  activeStep: { id: string; title: string; content: string } | null
  completedTours: string[]
  checklistProgress: { completed: number; total: number } | null
}
```

#### `useSuggestions()`

```typescript
interface UseSuggestionsReturn {
  suggestions: string[]
  /** Re-generate dynamic suggestions */
  refresh(): void
  /** Send a suggestion as a message */
  select(suggestion: string): void
}
```

Dynamic suggestions refresh after every AI response (cacheable via `cacheTtl`). Static suggestions are always available.

#### UI Components

All components are **shadcn-style** — structured with sensible defaults, styled via CSS custom properties and Tailwind classes. All support `asChild` via UnifiedSlot.

| Component | Props | Headless | Description |
|-----------|-------|----------|-------------|
| `AiChatPanel` | `mode: 'slideout' \| 'popover' \| 'inline'`, `position`, `className` | Yes | Main chat container, responsive by default |
| `AiChatBubble` | `unreadCount`, `pulse`, `className` | Yes | Floating trigger button |
| `AiChatMessage` | `message: UIMessage`, `onRate` | Yes | Single message with built-in markdown rendering |
| `AiChatInput` | `placeholder`, `onSubmit`, `disabled` | Yes | Text input with send button |
| `AiChatSuggestions` | `suggestions: string[]`, `onSelect` | Yes | Clickable suggestion chips |

#### Built-in Markdown Renderer

Lightweight (~2-3KB gzipped) chat-focused markdown renderer. No external dependencies.

**Supported syntax:**
- Bold, italic, strikethrough
- Links (open in new tab by default)
- Inline code and fenced code blocks with language tags
- Ordered and unordered lists
- Headings (h1–h6)
- Paragraphs and line breaks

**Not supported in v1:** tables, images, blockquotes, footnotes, math/LaTeX, raw HTML.

#### Accessibility

- **Non-modal panel** — does not trap focus, user can interact with the page while chat is open
- **ARIA live region** — new messages announced to screen readers
- **Focus management** — input focused on panel open
- **Keyboard navigation** — Escape to close, Enter to send
- **WCAG 2.1 AA compliant**

### Server Exports (`@tour-kit/ai/server`)

#### `createChatRouteHandler(options)`

Factory for Next.js App Router route handler.

```typescript
interface ChatRouteHandlerOptions {
  /** AI SDK model identifier */
  model: string
  /** Context strategy — how documents are provided to the LLM */
  context: ContextConfig
  /** Layered system prompt */
  instructions?: InstructionsConfig
  /** Server-side rate limiting (cost protection) */
  rateLimit?: ServerRateLimitConfig
  /** Hook: runs before message is processed (guardrails, filtering) */
  beforeSend?(message: UIMessage): Promise<UIMessage | null> | UIMessage | null
  /** Hook: runs before response is returned (output filtering) */
  beforeResponse?(response: string): Promise<string> | string
  /** Max request duration in seconds (default: 30) */
  maxDuration?: number
  /** Event callback */
  onEvent?(event: AiChatEvent): void | Promise<void>
}

// ── Context Strategy ──

type ContextConfig =
  | ContextStuffingConfig
  | RAGConfig

interface ContextStuffingConfig {
  strategy: 'context-stuffing'
  /** Documents to include in system prompt (< ~50K tokens) */
  documents: Document[]
}

interface RAGConfig {
  strategy: 'rag'
  /** Documents to index */
  documents: Document[]
  /** Embedding adapter */
  embedding: EmbeddingAdapter
  /** Vector store (default: in-memory) */
  vectorStore?: VectorStoreAdapter
  /** Number of results to retrieve (default: 5) */
  topK?: number
  /** Minimum similarity threshold (default: 0.7) */
  minScore?: number
  /** Chunking options */
  chunkSize?: number    // default: 512 tokens
  chunkOverlap?: number // default: 50 tokens
  /** Optional rerank for improved relevance (AI SDK 6) */
  rerank?: { model: string; topN?: number }
}

// ── Layered System Prompt ──

interface InstructionsConfig {
  /** Product name (used in Layer 1 defaults) */
  productName?: string
  /** Product description */
  productDescription?: string
  /** Tone: 'professional' | 'friendly' | 'concise' (default: 'professional') */
  tone?: 'professional' | 'friendly' | 'concise'
  /** Topics the AI should stay within */
  boundaries?: string[]
  /** Additional custom instructions (appended to generated prompt) */
  custom?: string
  /** Skip library defaults (Layer 1) entirely — full manual control */
  override?: boolean
}

// ── Server Rate Limiting ──

interface ServerRateLimitConfig {
  /** Max messages per window (default: 20) */
  maxMessages?: number
  /** Window duration in ms (default: 60000) */
  windowMs?: number
  /** Extract user identifier from request */
  identifier: (req: Request) => string | Promise<string>
  /** Rate limit store (default: in-memory) */
  store?: RateLimitStore
}

// Usage in app/api/chat/route.ts:
import { createChatRouteHandler } from '@tour-kit/ai/server'

// Tier 1: CAG — small content, zero infrastructure
export const { POST } = createChatRouteHandler({
  model: 'openai/gpt-4o',
  context: {
    strategy: 'context-stuffing',
    documents: [
      { id: '1', content: 'How to export: Go to Settings > Export...' },
      { id: '2', content: 'Pricing: Free tier includes...' },
    ],
  },
  instructions: {
    productName: 'Acme App',
    tone: 'friendly',
    boundaries: ['Only answer about Acme App features and pricing'],
  },
})

// Tier 2: RAG — larger content, in-memory vector store
export const { POST } = createChatRouteHandler({
  model: 'openai/gpt-4o',
  context: {
    strategy: 'rag',
    documents: myLargeDocArray,
    embedding: createAiSdkEmbedding({ model: 'openai/text-embedding-3-small' }),
    // vectorStore defaults to in-memory
  },
  instructions: {
    productName: 'Acme App',
    custom: 'Always suggest contacting sales@acme.com for enterprise pricing.',
  },
  rateLimit: {
    maxMessages: 20,
    windowMs: 60_000,
    identifier: (req) => getIPFromRequest(req),
  },
})

// Tier 3: RAG — massive content, external vector store
export const { POST } = createChatRouteHandler({
  model: 'openai/gpt-4o',
  context: {
    strategy: 'rag',
    documents: massiveDocArray,
    embedding: createAiSdkEmbedding({ model: 'openai/text-embedding-3-small' }),
    vectorStore: myPineconeAdapter, // implements VectorStoreAdapter
    topK: 10,
    rerank: { model: 'cohere/rerank-v3.5', topN: 5 },
  },
})
```

#### `createRAGMiddleware(options)`

For users who want to compose their own route handler instead of using `createChatRouteHandler`.

```typescript
interface RAGMiddlewareOptions {
  retriever: Retriever
  topK?: number
  /** Optional rerank for improved relevance (AI SDK 6) */
  rerank?: { model: string; topN?: number }
  /** Custom context formatting */
  formatContext?(docs: RetrievedDocument[]): string
}

// Returns: LanguageModelV3Middleware (uses transformParams to inject context)
```

#### `createRetriever(options)`

```typescript
interface RetrieverOptions {
  documents: Document[]
  embedding: EmbeddingAdapter
  vectorStore?: VectorStoreAdapter // defaults to in-memory
  chunkSize?: number    // default: 512 tokens
  chunkOverlap?: number // default: 50 tokens
}

interface Retriever {
  /** Index all documents (call on startup or content change) */
  index(): Promise<void>
  /** Search for relevant documents */
  search(query: string, topK?: number, minScore?: number): Promise<RetrievedDocument[]>
}
```

#### `createSystemPrompt(config)`

Builds the layered system prompt.

```typescript
interface SystemPromptConfig {
  productName?: string
  productDescription?: string
  tone?: 'professional' | 'friendly' | 'concise'
  boundaries?: string[]
  custom?: string
  override?: boolean
  /** For CAG: documents to inline in prompt */
  documents?: Document[]
}

// Returns: string (formatted system prompt)
//
// Layer 1 (library defaults — always included unless override: true):
//   - Grounding: "Only answer based on the provided context"
//   - Refusal: "If you don't have relevant information, say so clearly"
//   - Citation: "Reference source documents when possible"
//   - Safety: "Do not generate harmful, misleading, or off-topic content"
//
// Layer 2 (structured config):
//   - Product context, tone, boundaries
//
// Layer 3 (custom):
//   - User's raw string appended
```

#### `createAiSdkEmbedding(options)`

```typescript
// Uses AI SDK 6's embed/embedMany directly
import { createAiSdkEmbedding } from '@tour-kit/ai/server'

const embedding = createAiSdkEmbedding({
  model: 'openai/text-embedding-3-small', // any AI SDK embedding model
})
```

#### `createInMemoryVectorStore()`

```typescript
import { createInMemoryVectorStore } from '@tour-kit/ai/server'

const store = createInMemoryVectorStore()
// Suitable for < 500 documents
// Uses AI SDK's cosineSimilarity for search
```

### Analytics Events

Via `onEvent` callback on both client (`AiChatConfig`) and server (`ChatRouteHandlerOptions`):

| Event Type | When | Data |
|------------|------|------|
| `chat_opened` | User opens chat panel | `{}` |
| `chat_closed` | User closes chat panel | `{ messageCount, durationMs }` |
| `message_sent` | User sends a message | `{ messageLength }` |
| `response_received` | AI response completes | `{ responseTimeMs }` |
| `suggestion_clicked` | User clicks a suggestion | `{ suggestion }` |
| `message_rated` | User rates a response | `{ rating: 'positive' \| 'negative', messageId }` |
| `error` | Error occurs | `{ errorType, errorMessage }` |

Optional `@tour-kit/analytics` bridge: a `createAnalyticsBridge()` function that wraps the `onEvent` callback and forwards events to `useAnalyticsOptional()`. Ships as a separate utility — not required.

---

## 5. Quality Thresholds

| Feature | Metric | Threshold | Measurement Method |
|---------|--------|-----------|-------------------|
| Bundle size (client) | Gzipped size of `@tour-kit/ai` client entry | < 15KB | `size-limit` in CI |
| Bundle size (server) | Gzipped size of `@tour-kit/ai/server` entry | < 8KB | `size-limit` in CI |
| Bundle size (markdown renderer) | Gzipped size of built-in renderer | < 3KB | `size-limit` in CI |
| Tree-shaking | Server code excluded from client bundle | 0 bytes server code in client | `source-map-explorer` verification |
| First message latency | Time from send to first streamed token | < 800ms (p50), < 2000ms (p95) | Timer in `useAiChat` |
| RAG retrieval latency | Time for vector search + context assembly | < 200ms (p95) with in-memory store | Timer in middleware |
| TypeScript coverage | Strict mode, no `any` in public API | 100% typed public API | `tsc --noEmit` in CI |
| Test coverage | Line coverage across package | > 80% | Vitest coverage report |
| Accessibility | Chat panel WCAG compliance | WCAG 2.1 AA | axe-core in component tests |
| Keyboard navigation | Full chat usable via keyboard | All actions reachable | Manual + automated a11y tests |
| Screen reader | Messages announced correctly | ARIA live regions working | VoiceOver/NVDA manual test |
| SSR safety | No `window`/`document` access during SSR | Zero hydration errors | Next.js build + Playwright |
| Streaming reliability | Messages complete without truncation | 100% completion rate | Integration test with mock model |
| Responsive | Chat panel usable on mobile viewports | Functional at 320px width | Playwright viewport tests |

---

## 6. Key Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | AI SDK 6.x breaking changes or v7 release | Low | Medium | Pin `ai@^6.0.0` as peer dep. Use only stable APIs (`useChat`, `streamText`, `convertToModelMessages`, `embed`, `embedMany`, `cosineSimilarity`, `wrapLanguageModel`). Abstract AI SDK calls behind internal wrappers. Run `npx @ai-sdk/codemod` for future upgrades. |
| 2 | LLM hallucinating incorrect information | Medium | High | Layered system prompt (Layer 1) always includes grounding instructions: "only answer from provided context, say I don't know when uncertain." RAG `minScore` threshold filters low-relevance results. `beforeResponse` hook enables user-defined output validation. |
| 3 | Bundle size exceeds budget | Medium | Medium | Client entry imports only `@ai-sdk/react` hooks (lightweight). Built-in markdown renderer replaces `react-markdown` dep (~30KB savings). Server code and vector store logic in separate entry points — tree-shaken if unused. |
| 4 | In-memory vector store insufficient for large datasets | Medium | Low | In-memory is explicitly scoped to < 500 documents. `VectorStoreAdapter` interface lets users plug in Pinecone/pgvector/etc. CAG (context-stuffing) available as zero-infrastructure alternative for small content sets. |
| 5 | Rate limiting / cost runaway from AI API calls | Medium | Medium | Client-side rate limiter prevents UX spam (default: 10/minute). Server-side rate limiter with pluggable store (in-memory default, Redis adapter interface) provides real cost protection. `maxDuration: 30` prevents hung connections. |
| 6 | Content too small for RAG, too large for context window | Low | Low | Three-tier strategy: CAG for < 50K tokens, RAG in-memory for < 500 docs, RAG external for 500+. `createChatRouteHandler` validates and warns if content size doesn't match strategy. |

---

## 7. Confirmed Library Versions

| Library | Version | Key API Confirmed | Notes |
|---------|---------|-------------------|-------|
| `ai` (Vercel AI SDK) | 6.x (6.0.116 current) | `streamText`, `convertToModelMessages`, `UIMessage`, `cosineSimilarity`, `embed`, `embedMany`, `rerank`, `wrapLanguageModel` | **v6 is stable**. Codemod available: `npx @ai-sdk/codemod v6`. Confirmed 2026-03-20. |
| `@ai-sdk/react` | 6.x (ships with `ai`) | `useChat` → `{ messages, sendMessage, stop, status, setMessages }` | Part of AI SDK monorepo, version-locked. `sendMessage` replaced `append` in v5. |
| `@ai-sdk/provider` | 6.x | `LanguageModelV3Middleware` with `transformParams` for RAG | Middleware API is the official RAG pattern. `wrapLanguageModel` applies it. |
| `zod` | 3.x | `z.object`, `z.string`, `z.number`, `z.enum` | Required by AI SDK for future tool support |
| `react` | 18.x / 19.x | Peer dependency | Same range as `@tour-kit/react` |

```typescript
// Confirmed via Context7 + Web (2026-03-20)
// AI SDK 6.x — Route handler pattern:
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const result = streamText({
    model: 'openai/gpt-4o',
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages),
  })
  return result.toUIMessageStreamResponse()
}
```

```typescript
// Confirmed via Context7 + Web (2026-03-20)
// AI SDK 6.x — useChat client pattern:
'use client'
import { useChat } from '@ai-sdk/react'

const { messages, sendMessage, stop, status, setMessages } = useChat()
// sendMessage({ text: input }) to send (v5+: replaces append())
// status: 'ready' | 'submitted' | 'streaming' | 'error'
// messages[n].parts for rendering:
//   type: 'text' | 'source'
```

```typescript
// Confirmed via Context7 + Web (2026-03-20)
// AI SDK 6.x — RAG Middleware pattern (LanguageModelV3Middleware):
import type { LanguageModelV3Middleware } from '@ai-sdk/provider'
import { wrapLanguageModel } from 'ai'

export const ragMiddleware: LanguageModelV3Middleware = {
  transformParams: async ({ params }) => {
    const lastUserMessageText = getLastUserMessageText({ prompt: params.prompt })
    if (lastUserMessageText == null) return params
    const instruction = 'Use the following information:\n' +
      findSources({ text: lastUserMessageText })
        .map(chunk => JSON.stringify(chunk)).join('\n')
    return addToLastUserMessage({ params, text: instruction })
  },
}

// Apply middleware:
const wrappedModel = wrapLanguageModel({
  model: yourModel,
  middleware: [ragMiddleware],
})
```

```typescript
// Confirmed via Context7 + Web (2026-03-20)
// AI SDK 6.x — RAG embedding + in-memory vector search:
import { cosineSimilarity, embed, embedMany, rerank } from 'ai'

const { embeddings } = await embedMany({
  model: 'openai/text-embedding-3-small',
  values: chunks,
})

const { embedding } = await embed({
  model: 'openai/text-embedding-3-small',
  value: query,
})

// Cosine similarity search:
const results = db
  .map(item => ({
    document: item,
    similarity: cosineSimilarity(embedding, item.embedding),
  }))
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, topK)

// Rerank for improved relevance:
const { results: reranked } = await rerank({
  model: 'cohere/rerank-v3.5',
  query: userQuery,
  documents: results.map(r => r.document.content),
})
```

---

## 8. Package Structure

```
packages/ai/
├── src/
│   ├── types/
│   │   ├── config.ts              # AiChatConfig, SuggestionsConfig, PersistenceConfig
│   │   ├── document.ts            # Document, DocumentMetadata, RetrievedDocument
│   │   ├── adapter.ts             # VectorStoreAdapter, EmbeddingAdapter, RateLimitStore, PersistenceAdapter
│   │   ├── events.ts              # AiChatEvent, AiChatEventType
│   │   └── index.ts               # Re-exports all types
│   │
│   ├── context/
│   │   ├── ai-chat-context.ts     # AiChatContext definition
│   │   └── ai-chat-provider.tsx   # AiChatProvider wrapping useChat
│   │
│   ├── hooks/
│   │   ├── use-ai-chat.ts         # Core chat hook
│   │   ├── use-tour-assistant.ts  # Tour-aware chat hook (optional @tour-kit/core)
│   │   ├── use-suggestions.ts     # Static + dynamic suggestions
│   │   └── use-persistence.ts     # Chat persistence (localStorage / adapter)
│   │
│   ├── components/
│   │   ├── ai-chat-panel.tsx      # Chat panel (slideout/popover/inline), responsive
│   │   ├── ai-chat-bubble.tsx     # Trigger button
│   │   ├── ai-chat-message.tsx    # Message with built-in markdown rendering
│   │   ├── ai-chat-input.tsx      # Text input + send
│   │   ├── ai-chat-suggestions.tsx # Suggestion chips
│   │   ├── headless/              # Render-prop versions of all above
│   │   │   ├── headless-chat-panel.tsx
│   │   │   ├── headless-chat-message.tsx
│   │   │   ├── headless-chat-input.tsx
│   │   │   ├── headless-chat-suggestions.tsx
│   │   │   └── index.ts
│   │   └── ui/                    # CVA variant definitions
│   │       ├── chat-panel.variants.ts
│   │       ├── chat-message.variants.ts
│   │       └── ...
│   │
│   ├── core/
│   │   ├── markdown-renderer.tsx  # Built-in lightweight markdown → React
│   │   ├── suggestion-engine.ts   # Dynamic suggestion generation (LLM call after response)
│   │   ├── rate-limiter.ts        # Client-side rate limiting
│   │   └── analytics-bridge.ts    # Optional @tour-kit/analytics integration
│   │
│   ├── server/
│   │   ├── route-handler.ts       # createChatRouteHandler()
│   │   ├── rag-middleware.ts      # createRAGMiddleware()
│   │   ├── system-prompt.ts       # createSystemPrompt() — layered prompt builder
│   │   ├── retriever.ts           # createRetriever() — chunk, embed, index, search
│   │   ├── vector-store.ts        # createInMemoryVectorStore()
│   │   ├── embedding.ts           # createAiSdkEmbedding()
│   │   ├── rate-limiter.ts        # Server-side rate limiting with adapter interface
│   │   └── index.ts               # Server-only exports
│   │
│   ├── lib/
│   │   ├── unified-slot.tsx       # Radix/Base UI slot compatibility
│   │   ├── ui-library-context.tsx # UI library provider
│   │   └── utils.ts               # cn(), shared utilities
│   │
│   ├── styles/
│   │   ├── variables.css          # CSS custom properties
│   │   └── components.css         # Component styles
│   │
│   └── index.ts                   # Client-only exports (types, hooks, components, context)
│
├── package.json
├── tsconfig.json
├── tsup.config.ts                 # ESM + CJS, entries: ['.', './server', './headless']
├── CLAUDE.md                      # Package-specific guidance
├── CHANGELOG.md
└── README.md
```

### `tsup.config.ts` Entry Points

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',                        // Client: hooks, components, types, context
    server: 'src/server/index.ts',                 // Server: route handler, RAG, retriever, adapters
    headless: 'src/components/headless/index.ts',  // Headless components only
  },
  format: ['esm', 'cjs'],
  dts: true,
  external: [
    'react',
    'react-dom',
    '@tour-kit/core',
    '@tour-kit/analytics',
    'ai',
    '@ai-sdk/react',
    '@ai-sdk/provider',
  ],
  splitting: true,
  treeshake: true,
})
```

### `package.json` Dependencies

```json
{
  "name": "@tour-kit/ai",
  "peerDependencies": {
    "ai": "^6.0.0",
    "@ai-sdk/react": "^6.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "zod": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "@tour-kit/core": { "optional": true },
    "@tour-kit/analytics": { "optional": true }
  },
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./server": { "import": "./dist/server.mjs", "require": "./dist/server.js", "types": "./dist/server.d.ts" },
    "./headless": { "import": "./dist/headless.mjs", "require": "./dist/headless.js", "types": "./dist/headless.d.ts" },
    "./styles.css": "./dist/styles.css"
  }
}
```

---

## 9. Implementation Phases

| Phase | Scope | Depends On | Description |
|-------|-------|------------|-------------|
| **1** | Types + `AiChatProvider` + `useAiChat` + `createChatRouteHandler` with CAG | — | Foundation: basic chat working with context-stuffing. User provides documents, they go in the system prompt. Token-by-token streaming. |
| **2** | Layered system prompt + `createSystemPrompt()` + configurable error messages + string overrides | Phase 1 | Intelligence: library defaults (grounding, refusal, citation) + structured config + custom instructions. |
| **3** | UI components (styled + headless) + built-in markdown renderer + responsive layout | Phase 1 | Components: `AiChatPanel`, `AiChatBubble`, `AiChatMessage`, `AiChatInput`, `AiChatSuggestions`. shadcn-style. WCAG 2.1 AA. |
| **4** | RAG pipeline: `createRetriever`, `createInMemoryVectorStore`, `createAiSdkEmbedding`, `createRAGMiddleware` | Phase 2 | Retrieval: chunking, embedding, in-memory vector store, cosine similarity search, optional rerank. |
| **5** | `useSuggestions` (static + dynamic) + suggestion engine | Phase 3 | Suggestions: static from config, dynamic via LLM after each response, cacheable. |
| **6** | Persistence (localStorage + server adapter) + `usePersistence` | Phase 1 | Persistence: chat history survives page reload. |
| **7** | Rate limiting (client + server) + `beforeSend`/`beforeResponse` hooks + `onEvent` callback + optional analytics bridge | Phase 4 | Protection & observability: cost control, guardrail hooks, event tracking. |
| **8** | Optional tour-kit integration: `useTourAssistant` + tour context injection | Phase 2 | Tour awareness: read tour state when `@tour-kit/core` is present and `tourContext: true`. |
| **9** | Documentation + examples + tests to > 80% coverage | All | Ship: docs, example apps (standalone + tour-kit integrated), comprehensive test suite. |

---

## Deferred to Post-v1

The following features are intentionally excluded from v1 to keep scope focused on the core Q&A experience:

| Feature | Reason for Deferral |
|---------|-------------------|
| `tourKitTools` (goToStep, completeTour, etc.) | Primary use case is Q&A, not tour navigation. Tools add complexity (approval UI, action dispatch, state coupling). |
| `ToolLoopAgent` / agent mode | Not needed for Q&A. `streamText` is sufficient. |
| `AiChatToolApproval` component | No tools = no approval UI needed. |
| `needsApproval` integration | Deferred with tools. |
| Plugin system (`AiPlugin` interface) | No concrete use case remaining after hooks replaced guard/beforeRequest/afterResponse. |
| Supabase/Pinecone vector store adapters | `VectorStoreAdapter` interface ships in v1 — community/users build adapters. |
| Built-in guardrails engine | `beforeSend`/`beforeResponse` hooks are sufficient. Content safety is domain-specific. |
| i18n framework integration | All strings overridable via props. Full i18n adds significant complexity for low v1 value. |

---

## Spec Review Checklist

- [x] Every public API has typed input + output — Module interface fully defined with TypeScript interfaces
- [x] Every quality threshold uses a number — All thresholds are measurable (< 15KB, > 80%, < 800ms, etc.)
- [x] Every external dependency has a fallback — RAG failure → no-context response; vector store → in-memory default; LLM error → configurable error message
- [x] Every risk has a mitigation strategy — 6 risks with specific mechanisms
- [x] Data model strategy covers all data boundaries — API edges (Zod-ready), internal types (interfaces), external state (adapters)
- [x] Every library version confirmed via Context7 + Web search — ai 6.x, @ai-sdk/react 6.x, @ai-sdk/provider 6.x, zod 3.x all confirmed 2026-03-20
- [x] `@tour-kit/core` is optional — package works standalone as a general RAG Q&A widget
- [x] Three-tier content strategy — CAG (small) → RAG in-memory (medium) → RAG external (large)
- [x] No over-engineering — plugins, tools, agents, built-in guardrails all deferred to post-v1

---

## Appendix: Validation Log (2026-03-20)

### Sources Used

| Source | What was validated |
|--------|--------------------|
| [npm: ai package](https://www.npmjs.com/package/ai) | AI SDK 6.0.116 is current stable release |
| [AI SDK 6 Blog Post](https://vercel.com/blog/ai-sdk-6) | v6 features: ToolLoopAgent, needsApproval, rerank, DevTools, Output.object() |
| [AI SDK Migration Guide 5→6](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) | Breaking changes: Experimental_Agent→ToolLoopAgent, system→instructions, tool properties input/output |
| [AI SDK Middleware Docs](https://ai-sdk.dev/docs/ai-sdk-core/middleware) | LanguageModelV3Middleware from @ai-sdk/provider, transformParams pattern, wrapLanguageModel |
| [AI SDK embed() Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed) | embed/embedMany still in ai package, embeddingModel() rename from textEmbeddingModel() |
| [AI SDK cosineSimilarity](https://ai-sdk.dev/docs/reference/ai-sdk-core/cosine-similarity) | cosineSimilarity from 'ai' confirmed |
| [AI SDK Reranking](https://ai-sdk.dev/docs/ai-sdk-core/reranking) | rerank() function new in v6 |
| Context7 /vercel/ai | useChat API: sendMessage (not append), messages.parts, status, setMessages, stop |
| Context7 /websites/ai-sdk_dev | RAG cookbook, in-memory vector search pattern |

### Revision Log (2026-03-21)

| v1.1.0 (Original) | v2.0.0 (Revised) | Reason |
|--------------------|-------------------|--------|
| Tour-kit navigator with tools | General RAG Q&A widget | Primary use case is answering questions, not driving tours |
| `@tour-kit/core` required peer dep | Optional peer dep | Package works standalone — tour context is opt-in |
| 6 tour-kit tools + needsApproval + ToolLoopAgent | Deferred to post-v1 | Q&A doesn't need tour state manipulation |
| Plugin system (`AiPlugin`) | Cut entirely | Hooks (`beforeSend`/`beforeResponse`) cover all interception points |
| `react-markdown` optional peer dep | Built-in ~2-3KB markdown renderer | Eliminates ~30KB dep, covers 95% of chat LLM output |
| `GuardrailConfig` + guard plugin | `beforeSend`/`beforeResponse` hooks | Content safety is domain-specific — library provides hooks, not solutions |
| Supabase + Pinecone adapters | `VectorStoreAdapter` interface only | Ship interface, users build adapters |
| `createDocumentLoader()` separate concept | Folded into `createRetriever()` | Simpler API — one function handles chunk + embed + index |
| Single strategy (RAG) | Three tiers: CAG → RAG in-memory → RAG external | CAG is the 80% case — most apps have < 50K tokens of content |
| No persistence | localStorage + server adapter (opt-in) | Users expect chat to survive page refresh |
| No suggestions config | Static + dynamic (cacheable, after every response) | Both zero-cost and AI-powered paths available |
| Raw system prompt string | Layered prompts (defaults + config + custom) | Library provides grounding/refusal defaults, user extends |
| Client-only rate limiting | Client (UX) + server (cost) with adapter | Client-side is trivially bypassed — server-side required for cost control |
| 9 analytics events via `@tour-kit/analytics` | `onEvent` callback + optional analytics bridge | Decouples from analytics package — user tracks however they want |
| No string customization | All UI strings overridable via props | No i18n framework, just customizable English defaults |
