---
title: RAG / CAG pipeline
type: concept
sources:
  - ../packages/ai/src/server/index.ts
  - ../packages/ai/src/server/retriever.ts
  - ../packages/ai/src/server/vector-store.ts
  - ../packages/ai/src/server/embedding.ts
  - ../packages/ai/src/server/rag-middleware.ts
updated: 2026-04-26
---

*`@tour-kit/ai` supports two strategies for grounding the model: CAG (stuff context into the prompt) for small fixed contexts, RAG (retrieve from a vector store) for large doc sets. Both run on the server entry only.*

## Strategy comparison

| | CAG (Context-Augmented) | RAG (Retrieval-Augmented) |
|---|---|---|
| Context size | Small, fixed | Large, dynamic |
| Setup | None | Vector store + embeddings |
| Latency | Lower (no retrieval round trip) | Higher |
| Cost per query | Higher (always-stuffed prompt) | Lower (retrieve relevant chunks only) |
| Configured via | `ContextStuffingConfig` | `RAGConfig` |

## Server-only

All RAG primitives live at `@tour-kit/ai/server` — never imported from client code:

```ts
createRetriever(...)
chunkDocument(text, options)
chunkDocuments(docs, options)
createInMemoryVectorStore()
createAiSdkEmbedding(options)        // wraps AI SDK embedding model
createRAGMiddleware(...)
createSystemPrompt(...)
```

## Adapter interfaces

```ts
interface VectorStoreAdapter {
  add(documents: Document[]): Promise<void>
  search(query: string, k?: number): Promise<RetrievedDocument[]>
  // ...
}

interface EmbeddingAdapter {
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}
```

Built-ins: `createInMemoryVectorStore()` (good for prototypes, dev, small content) and `createAiSdkEmbedding()` (uses the AI SDK's embedding models — OpenAI, Cohere, etc.).

For production, wire your own `VectorStoreAdapter` to Pinecone, Weaviate, pgvector, etc.

## Chunking

```ts
chunkDocument(text, { size: 1000, overlap: 200 })  → Document[]
chunkDocuments(docs, options)                       → Document[]
```

Standard size+overlap chunking. Tweak per content type — code chunks differently than prose.

## Wiring into a route handler

```ts
// app/api/chat/route.ts
import {
  createChatRouteHandler,
  createRAGMiddleware,
  createRetriever,
  createInMemoryVectorStore,
  createAiSdkEmbedding,
} from '@tour-kit/ai/server'

const store = createInMemoryVectorStore()
// ... pre-load docs into store on app startup

const retriever = createRetriever({ store, embedding: createAiSdkEmbedding(...) })

export const POST = createChatRouteHandler({
  middleware: [createRAGMiddleware({ retriever })],
  // ... model config
})
```

## Suggestions

```ts
generateSuggestions(options)     // produces follow-up question chips
parseSuggestions(rawText)        // parses model output into chips
```

Used by `<AiChatSuggestions>` on the client.

## Gotchas

- **In-memory store is volatile.** `createInMemoryVectorStore()` loses content on server restart — fine for dev, not prod.
- **Embedding cost.** Re-embedding on every request is expensive. Embed at ingest time, store the vectors, and only embed the query at runtime.
- **Edge runtimes.** Some Next.js edge runtimes don't support all Node APIs — verify your vector store and embedding adapter work in your target runtime.

## Related

- [packages/ai.md](../packages/ai.md)
- [architecture/client-server-split.md](../architecture/client-server-split.md)
