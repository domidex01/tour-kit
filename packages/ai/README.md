# @tour-kit/ai

> React AI chat widget with RAG & tour context — drop-in conversational assistant powered by Vercel AI SDK with vector search.

[![npm version](https://img.shields.io/npm/v/@tour-kit/ai.svg)](https://www.npmjs.com/package/@tour-kit/ai)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/ai.svg)](https://www.npmjs.com/package/@tour-kit/ai)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/ai?label=gzip)](https://bundlephobia.com/package/@tour-kit/ai)
[![types](https://img.shields.io/npm/types/@tour-kit/ai.svg)](https://www.npmjs.com/package/@tour-kit/ai)

Drop-in **AI chat assistant** for React onboarding flows — adds a conversational layer that understands your tour structure, guides users through setup, and answers product questions. Powered by [Vercel AI SDK](https://sdk.vercel.ai/) with built-in **RAG**, **CAG**, vector search, suggestion chips, and rate limiting.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Alternative to:** [Intercom Fin](https://www.intercom.com/fin), [Chatbase](https://www.chatbase.co/), [Crisp MagicReply](https://crisp.chat/), [Pendo Listen](https://www.pendo.io/), hand-rolled OpenAI/Anthropic chat-with-tour-context.

## Features

- **Tour-aware** — `useTourAssistant()` injects current tour step into the system prompt
- **CAG** (Context-Augmented Generation) — stuff tour context directly into the prompt
- **RAG** (Retrieval-Augmented Generation) — vector search over your docs with `createInMemoryVectorStore` or a custom adapter
- **Suggestion chips** — AI-generated follow-up prompts
- **Rate limiting** — both client and server-side, sliding window
- **Strict client/server split** — server entry never imports React or browser APIs
- **Vercel AI SDK** — works with OpenAI, Anthropic, Google, Mistral, and any AI SDK provider
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/ai @tour-kit/license @ai-sdk/react ai
# or
pnpm add @tour-kit/ai @tour-kit/license @ai-sdk/react ai
```

For server-side, install your AI provider:

```bash
pnpm add @ai-sdk/openai      # or @ai-sdk/anthropic, @ai-sdk/google, etc.
```

## Quick Start

### Client

```tsx
import { LicenseProvider } from '@tour-kit/license'
import { AiChatProvider, AiChatPanel, AiChatToggle } from '@tour-kit/ai'

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <AiChatProvider config={{ endpoint: '/api/chat', tourContext: true }}>
        <YourApp />
        <AiChatToggle />
        <AiChatPanel />
      </AiChatProvider>
    </LicenseProvider>
  )
}
```

Or compose your own UI:

```tsx
import { useAiChat, useTourAssistant } from '@tour-kit/ai'

function ChatWidget() {
  const { messages, sendMessage, status } = useAiChat()
  const { tourContext } = useTourAssistant()

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') sendMessage({ text: e.currentTarget.value })
        }}
      />
    </div>
  )
}
```

### Server (Next.js App Router)

```ts
// app/api/chat/route.ts
import { createChatRouteHandler } from '@tour-kit/ai/server'
import { openai } from '@ai-sdk/openai'

export const { POST } = createChatRouteHandler({
  model: openai('gpt-4o-mini'),
  context: {
    strategy: 'context-stuffing',
    documents: [
      { id: 'getting-started', content: '...' },
    ],
  },
})
```

For RAG with vector search:

```ts
// app/api/chat/route.ts
import {
  createChatRouteHandler,
  createInMemoryVectorStore,
  createAiSdkEmbedding,
  createRAGMiddleware,
} from '@tour-kit/ai/server'
import { openai } from '@ai-sdk/openai'

const embedding = createAiSdkEmbedding({ model: openai.embedding('text-embedding-3-small') })
const vectorStore = createInMemoryVectorStore({ embedding })
await vectorStore.addDocuments(myDocuments)

export const { POST } = createChatRouteHandler({
  model: openai('gpt-4o-mini'),
  context: {
    strategy: 'rag',
    middleware: createRAGMiddleware({ vectorStore, topK: 4 }),
  },
})
```

## Context strategies

| Strategy | When to use | Cost |
|---|---|---|
| **CAG** (Context-Augmented Generation) | Small, fixed tour context | Stuff into system prompt — simple, no vector store |
| **RAG** (Retrieval-Augmented Generation) | Large doc sets | Vector store + embeddings |

## Client/server split

| Layer | Entry | Allowed | Forbidden |
|---|---|---|---|
| Client | `@tour-kit/ai` | React, hooks, components, browser APIs | none |
| Server | `@tour-kit/ai/server` | Node.js, fetch, AI SDK | importing React, components, hooks; bare browser globals |

Server files use `typeof window === 'undefined'` guards before any browser API access.

## API Reference

### Client

#### Provider & context

```ts
import { AiChatProvider, AiChatContext, useAiChatContext } from '@tour-kit/ai'
```

#### Hooks

| Hook | Description |
|---|---|
| `useAiChat()` | Core chat — `messages`, `sendMessage`, `status`, `error`, `stop`, `regenerate` |
| `useTourAssistant()` | Tour-aware assistant — auto-injects current step context |
| `useSuggestions()` | AI-generated suggestion chips (throws if no provider) |
| `useOptionalSuggestions()` | Same, but returns `null` instead of throwing |
| `assembleTourContext(tour)` | Build a `TourAssistantContext` from a tour config |

#### Components

| Export | Purpose |
|---|---|
| `AiChatPanel` | Floating chat panel composition |
| `AiChatToggle` | FAB-style open/close button |
| `AiChatHeader` | Panel header (title + close) |
| `AiChatMessageList` | Scrolling message list |
| `AiChatMessage` | Single message bubble |
| `AiChatInput` | Input box with send button |
| `AiChatSuggestions` | Suggestion chip row |
| `AiChatPortal` | Portal primitive for popout |

#### Variants (CVA)

```ts
import {
  aiChatPanelVariants,
  aiChatHeaderVariants,
  aiChatMessageVariants,
  aiChatSuggestionChipVariants,
  aiChatToggleVariants,
} from '@tour-kit/ai'
```

#### Core utilities

```ts
import {
  SlidingWindowRateLimiter,
  createRateLimiter,
  createAnalyticsBridge,
} from '@tour-kit/ai'
```

### Server (`@tour-kit/ai/server`)

```ts
import {
  createChatRouteHandler,        // Route handler factory (Next.js + generic)
  createSystemPrompt,            // System prompt builder
  createServerRateLimiter,
  createInMemoryRateLimitStore,
  createInMemoryVectorStore,
  createAiSdkEmbedding,
  createRetriever,
  chunkDocument,
  chunkDocuments,
  createRAGMiddleware,
  generateSuggestions,
  parseSuggestions,
} from '@tour-kit/ai/server'
```

### Types

```ts
import type {
  AiChatConfig,
  SuggestionsConfig,
  PersistenceConfig,
  PersistenceAdapter,
  ClientRateLimitConfig,
  ServerRateLimitConfig,
  ServerRateLimitResult,
  RateLimitStatus,
  AiChatStrings,
  ChatStatus,
  AiChatState,
  ChatRouteHandlerOptions,
  ContextConfig,
  ContextStuffingConfig,
  RAGConfig,
  InstructionsConfig,
  AnalyticsBridgeConfig,
  Document,
  DocumentMetadata,
  RetrievedDocument,
  VectorStoreAdapter,
  EmbeddingAdapter,
  RateLimitStore,
  AiChatEvent,
  AiChatEventType,
} from '@tour-kit/ai'
```

## Gotchas

- **Two rate limiters, two implementations.** `SlidingWindowRateLimiter` (client) is **not** the same as `createServerRateLimiter` (server). Don't share instances.
- **Context hooks throw outside `AiChatProvider`.** Use `useOptionalSuggestions()` if you need a soft variant.
- **`@tour-kit/core` is an optional peer.** The AI package runs standalone — `useTourAssistant` only requires `@tour-kit/core` when wiring to live tour state.
- **Edge runtime** — server entry uses `typeof` guards but verify your provider supports your target runtime.

## Related packages

- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — sequential product tours (the AI assistant integrates with these)
- [`@tour-kit/checklists`](https://www.npmjs.com/package/@tour-kit/checklists) — onboarding checklists (use AI to nudge incomplete tasks)
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/ai](https://usertourkit.com/docs/ai)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
