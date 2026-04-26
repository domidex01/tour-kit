---
title: "@tour-kit/ai"
type: package
package: "@tour-kit/ai"
version: 0.0.4
sources:
  - ../packages/ai/CLAUDE.md
  - ../packages/ai/package.json
  - ../packages/ai/src/index.ts
  - ../packages/ai/src/server/index.ts
updated: 2026-04-26
---

*AI-powered chat assistant for product tours. Strict client/server split: client provides the UI and provider; server provides the route handler, RAG pipeline, embeddings, and rate limiting.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/ai` |
| Version | 0.0.4 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/license`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Peer | `@ai-sdk/react`, `ai`, `react`, `react-dom` |
| Optional peer | `@tour-kit/core` |
| Entry points | `.`, `./server`, `./headless`, `./tailwind` |

## Client/server split (strict)

| Layer | Entry | Allowed | Forbidden |
|---|---|---|---|
| Client | `src/index.ts` | React, hooks, components, browser APIs | none |
| Server | `src/server/index.ts` | Node.js, fetch, AI SDK | importing from `../hooks`, `../components`, `../context`, React |

Server files must not reference `window`, `document`, `localStorage`, `sessionStorage`, or `navigator` without `typeof` guards.

## Context strategies

| Strategy | When | Cost |
|---|---|---|
| **CAG** (Context-Augmented Generation) | Small, fixed tour context | Stuffed into system prompt — simple, no vector store |
| **RAG** (Retrieval-Augmented Generation) | Large doc sets | Vector store + embeddings — `createInMemoryVectorStore` or custom `VectorStoreAdapter` |

## Client API (`@tour-kit/ai`)

### Provider

```ts
AiChatProvider
AiChatContext, useAiChatContext, AiChatContextValue
```

### Hooks

```ts
useAiChat()                                    → UseAiChatReturn
useTourAssistant()                             → UseTourAssistantReturn
assembleTourContext(tour)                      → TourAssistantContext
useSuggestions()                               → UseSuggestionsReturn
useOptionalSuggestions()
```

### Components

```ts
AiChatPanel, AiChatToggle, AiChatHeader,
AiChatMessageList, AiChatMessage,
AiChatInput, AiChatSuggestions, AiChatPortal
```

Each with `*Props` types.

### CVA variants

```ts
aiChatPanelVariants, aiChatHeaderVariants, aiChatMessageVariants,
aiChatSuggestionChipVariants, aiChatToggleVariants
```

### Core utilities (client-safe)

```ts
SlidingWindowRateLimiter, createRateLimiter
createAnalyticsBridge
```

### Types

```ts
AiChatConfig, SuggestionsConfig,
PersistenceConfig, PersistenceAdapter,
ClientRateLimitConfig, AiChatStrings, ChatStatus, AiChatState,
ChatRouteHandlerOptions,
ContextConfig, ContextStuffingConfig, RAGConfig, InstructionsConfig,
ServerRateLimitConfig, ServerRateLimitResult, RateLimitStatus,
AnalyticsBridgeConfig,
Document, DocumentMetadata, RetrievedDocument,
VectorStoreAdapter, EmbeddingAdapter, RateLimitStore,
AiChatEvent, AiChatEventType
```

## Server API (`@tour-kit/ai/server`)

```ts
createChatRouteHandler         // Next.js / generic route handler factory

// Rate limiting
createServerRateLimiter, createInMemoryRateLimitStore, ServerRateLimitResult

// System prompt
createSystemPrompt, SystemPromptConfig

// Vector store + embeddings
createInMemoryVectorStore
createAiSdkEmbedding, AiSdkEmbeddingOptions

// Retrieval / chunking
createRetriever, chunkDocument, chunkDocuments

// RAG middleware
createRAGMiddleware

// Suggestion generation
generateSuggestions, parseSuggestions, GenerateSuggestionsOptions
```

## Gotchas

- **SSR safety on the server.** Even though `server/` runs in Node, browser globals are forbidden without `typeof` guards — Next.js may bundle for edge runtimes that share constraints.
- **Two rate limiters, two implementations.** `SlidingWindowRateLimiter` (client) ≠ `createServerRateLimiter` (server). Don't share instances.
- **Context hooks throw outside `AiChatProvider`.** Use `useOptionalSuggestions` if you need a soft variant.
- **`@tour-kit/core` is an optional peer.** The AI package can run standalone — `useTourAssistant` only requires it when wiring to live tour state.

## Related

- [packages/license.md](license.md) — gating
- [packages/core.md](core.md) — optional integration target
- [concepts/rag-pipeline.md](../concepts/rag-pipeline.md)
- [architecture/client-server-split.md](../architecture/client-server-split.md)
