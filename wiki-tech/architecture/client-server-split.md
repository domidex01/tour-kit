---
title: Client / server split
type: architecture
sources:
  - ../packages/ai/CLAUDE.md
  - ../packages/ai/src/index.ts
  - ../packages/ai/src/server/index.ts
  - ../packages/license/src/index.ts
  - ../packages/license/src/headless.ts
updated: 2026-04-26
---

*Two packages enforce a hard runtime boundary inside their dist: `@tour-kit/ai` (client vs Node) and `@tour-kit/license` (React vs headless). The boundary is a compile-time tree-shaking guarantee.*

## `@tour-kit/ai`: client vs server

| Entry | Path | Allowed | Forbidden |
|---|---|---|---|
| Client | `@tour-kit/ai` | React, hooks, components, browser APIs | none specifically |
| Server | `@tour-kit/ai/server` | Node fetch, AI SDK, vector store | importing React, `../hooks`, `../components`, `../context` |

The server entry's `index.ts` re-exports only from `src/server/`:

```ts
createChatRouteHandler          // Next.js route handler factory
createServerRateLimiter, createInMemoryRateLimitStore
createSystemPrompt
createInMemoryVectorStore, createAiSdkEmbedding
createRetriever, chunkDocument, chunkDocuments
createRAGMiddleware
generateSuggestions, parseSuggestions
```

Server files must not reference `window`, `document`, `localStorage`, `sessionStorage`, or `navigator` without `typeof` guards (Edge runtimes share constraints with Node-but-no-DOM).

### Two rate limiters

- Client: `SlidingWindowRateLimiter`, `createRateLimiter` (for UI throttling)
- Server: `createServerRateLimiter`, `createInMemoryRateLimitStore` (per-request)

Don't share instances. Different storage assumptions.

## `@tour-kit/license`: React vs headless

| Entry | Path | Allowed | Forbidden |
|---|---|---|---|
| Default | `@tour-kit/license` | React + headless | — |
| Headless | `@tour-kit/license/headless` | Pure logic | importing React |

The headless entry exposes:

```ts
validateLicenseKey, validateKey, activateKey, deactivateKey
readCache, writeCache, clearCache
getCurrentDomain, isDevEnvironment, validateDomainAtRender
```

Use the headless entry from CLI tools, build scripts, edge functions — anywhere React would be dead weight.

## Why the split matters

- Bundle size: server-only deps (AI SDK, vector store) shouldn't ship to the browser; React shouldn't ship to a CLI
- Security: server-only code (API keys, secrets) shouldn't run in client bundles
- Tree-shaking guarantee: bundlers only see legal imports through each entry

## Related

- [packages/ai.md](../packages/ai.md)
- [packages/license.md](../packages/license.md)
- [architecture/build-pipeline.md](build-pipeline.md)
