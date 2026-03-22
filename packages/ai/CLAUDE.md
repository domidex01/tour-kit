# @tour-kit/ai

AI-powered chat assistant for product tours. Provides context-aware conversational UI that understands your tour structure.

## Key Architectural Decisions

### Client/Server Split

- **Client** (`src/index.ts`): React hooks, providers, components — browser-safe
- **Server** (`src/server/index.ts`): Route handlers, RAG pipeline, embeddings — Node.js only
- Server code must NEVER import React or client modules (`../hooks`, `../components`, `../context`)

### Context Strategies

- **CAG (Context-Augmented Generation)**: Stuffs tour context directly into the system prompt. Simple, no vector store needed.
- **RAG (Retrieval-Augmented Generation)**: Uses vector store + embeddings for large doc sets. Requires `createInMemoryVectorStore` or custom `VectorStoreAdapter`.

### Barrel Exports

- Entry point (`src/index.ts`) re-exports from `context/`, `hooks/`, `components/`, `core/`, `types/`
- Server entry (`src/server/index.ts`) re-exports from `server/` directory only

## Gotchas

- **SSR safety**: Server files must not reference `window`, `document`, `localStorage`, `sessionStorage`, or `navigator` without `typeof` guards
- **Context null checks**: All context hooks throw if used outside `AiChatProvider`
- **Rate limiting**: Client uses `SlidingWindowRateLimiter`, server uses `createServerRateLimiter` — they are separate implementations

## Commands

```bash
pnpm --filter @tour-kit/ai build
pnpm --filter @tour-kit/ai typecheck
pnpm --filter @tour-kit/ai test
```

## Related Rules

- `tour-kit/rules/hooks.md`
- `tour-kit/rules/typescript.md`
- `tour-kit/rules/architecture.md`
