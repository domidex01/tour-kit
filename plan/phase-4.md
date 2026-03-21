# Phase 4 — RAG Pipeline

**Duration:** Days 15–19 (~15h)
**Depends on:** Phase 1 (types, route handler), Phase 2 (system prompt)
**Blocks:** Phase 7 (Rate Limiting + Hooks), Phase 9 (Docs + Ship)
**Risk Level:** MEDIUM — multiple moving parts (chunking, embedding, vector search, middleware composition) that must integrate correctly; performance target (500 docs < 200ms) requires careful implementation
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Build a complete retrieval-augmented generation pipeline for `@tour-kit/ai` that takes user-provided documents, chunks them, embeds them, stores them in a vector store, and retrieves the most relevant chunks at query time to inject into the LLM prompt via AI SDK 6.x middleware.

**Success looks like:**

- `createRetriever({ documents, embedding }).search("query", 5)` returns ranked `RetrievedDocument[]` sorted by cosine similarity
- `createInMemoryVectorStore()` indexes 500 documents and returns search results in < 200ms
- `createRAGMiddleware({ retriever })` returns a valid `LanguageModelV3Middleware` that injects retrieved context into the system prompt via `transformParams`
- `createChatRouteHandler({ context: { strategy: 'rag', ... } })` works end-to-end with streaming
- Optional `rerank` re-orders initial retrieval results for improved relevance
- All unit and integration tests pass with > 80% coverage on Phase 4 files
- All files are server-only (no browser globals, safe for Next.js App Router route handlers)

---

## 2. Key Design Decisions

**D1: Character-based chunking, not token-based.**
Use character counts for `chunkSize` and `chunkOverlap` rather than token counting. Token counting requires a tokenizer dependency (tiktoken is 4MB+). Character-based chunking is deterministic, dependency-free, and sufficient for the < 500 doc target. The config property names stay `chunkSize`/`chunkOverlap` but the implementation splits on character boundaries with sentence-aware splitting.

**D2: Lazy indexing on first search.**
`createRetriever()` returns a `Retriever` with an `index()` method. Indexing is NOT automatic at construction — the consumer calls `index()` explicitly (or it auto-indexes on first `search()` if not yet indexed). This avoids blocking the route handler startup and allows the consumer to control when embedding API calls happen.

**D3: In-memory vector store is the default, adapter is the escape hatch.**
`createInMemoryVectorStore()` uses a simple `Map<string, { embedding: number[], document: Document }>` with brute-force cosine similarity. This is sufficient for < 500 documents. For larger datasets, users provide their own `VectorStoreAdapter` (Pinecone, pgvector, etc.).

**D4: RAG middleware uses `transformParams`, not `wrapGenerate`.**
AI SDK 6.x `LanguageModelV3Middleware` supports `transformParams` which runs before the model call and can modify the prompt. This is the correct hook for injecting retrieved context — it prepends context to the last user message, keeping the system prompt clean for instructions only.

**D5: Rerank is optional and uses a separate LLM call.**
When `rerank` is configured, the pipeline first retrieves `topK * 2` results from the vector store, then calls the rerank model to re-score and select the final `topN` (defaulting to `topK`). This two-stage approach improves relevance without changing the core retrieval logic.

**D6: Chunking preserves document metadata.**
Each chunk inherits the parent document's `id` (with a `-chunk-N` suffix), `metadata`, and adds a `chunkIndex` field. This allows the consumer to trace retrieved chunks back to source documents.

---

## 3. Tasks

### 4.1: `createInMemoryVectorStore()` implementing `VectorStoreAdapter` (2–3h)

**File:** `packages/ai/src/server/vector-store.ts`

- Implement `VectorStoreAdapter` interface using an in-memory `Map`
- `upsert()` stores document + embedding pairs, keyed by document ID
- `search()` computes cosine similarity against all stored embeddings, returns top-K above `minScore`
- `delete()` removes documents by ID
- `clear()` empties the store
- Use AI SDK's `cosineSimilarity` function from `'ai'` — do NOT implement custom cosine similarity
- Sort results by score descending, return as `RetrievedDocument[]`

**Implementation notes:**
- Store structure: `Map<string, { document: Document; embedding: number[] }>`
- `search()` iterates all entries, computes cosine similarity, filters by `minScore`, sorts, slices to `topK`
- No persistence — data lives in memory for the lifetime of the Node.js process

### 4.2: `createAiSdkEmbedding()` wrapping AI SDK `embed`/`embedMany` (1–2h)

**File:** `packages/ai/src/server/embedding.ts`

- Factory function that returns an `EmbeddingAdapter`
- Wraps AI SDK 6.x `embed()` and `embedMany()` from `'ai'`
- Accepts `{ model: string }` where model is an AI SDK model identifier (e.g., `'openai/text-embedding-3-small'`)
- `dimensions` property set based on the model (configurable via options, defaults to 1536)
- Handle errors from the embedding API with descriptive messages

**Implementation notes:**
- Import `embed`, `embedMany` from `'ai'`
- The `model` param is passed directly to AI SDK — it handles provider resolution
- Batch embedding via `embedMany` for indexing efficiency

### 4.3: `createRetriever()` — chunk, embed, index, search (3–4h)

**File:** `packages/ai/src/server/retriever.ts`

- Accept `RetrieverOptions`: `documents`, `embedding`, optional `vectorStore` (defaults to in-memory), `chunkSize` (default 512), `chunkOverlap` (default 50)
- `index()`: chunk all documents → embed all chunks via `embedMany` → upsert into vector store
- `search(query, topK?, minScore?)`: embed query via `embed` → search vector store → return `RetrievedDocument[]`
- Implement `chunkDocument(document, chunkSize, chunkOverlap)` as a pure function
- Auto-index on first `search()` if `index()` hasn't been called (lazy initialization with a lock to prevent concurrent indexing)

**Chunking algorithm:**
1. Split content by paragraph (`\n\n`)
2. Accumulate paragraphs until `chunkSize` characters exceeded
3. On overflow, store current chunk, start new chunk with `chunkOverlap` characters of overlap from previous chunk end
4. Each chunk gets ID `${document.id}-chunk-${index}`, inherits parent metadata, adds `chunkIndex`
5. If a single paragraph exceeds `chunkSize`, split by sentences (`. `) then by `chunkSize` hard boundary

**Exported helpers (for testing):**
- `chunkDocument(document: Document, chunkSize: number, chunkOverlap: number): Document[]`
- `chunkDocuments(documents: Document[], chunkSize: number, chunkOverlap: number): Document[]`

### 4.4: `createRAGMiddleware()` — `LanguageModelV3Middleware` with `transformParams` (2–3h)

**File:** `packages/ai/src/server/rag-middleware.ts`

- Accept `RAGMiddlewareOptions`: `retriever`, `topK` (default 5), optional `rerank`, optional `formatContext`
- Return a `LanguageModelV3Middleware` object with `transformParams`
- In `transformParams`: extract last user message text from `params.prompt`, search retriever, format results, inject into prompt
- Default `formatContext`: numbered list with source metadata
- When `rerank` is provided: retrieve `topK * 2` results, call rerank model, take top `topN`

**Implementation notes:**
- Extract last user message: iterate `params.prompt` in reverse, find last `{ role: 'user' }`, extract text from its `content` parts
- Inject context by adding a system message part with the retrieved context, prepended to the prompt
- If no user message found or retriever returns empty results, return `params` unchanged

### 4.5: Wire RAG strategy into `createChatRouteHandler` (1–2h)

**File:** `packages/ai/src/server/route-handler.ts` (update existing)

- When `context.strategy === 'rag'`, create retriever and RAG middleware
- Use `wrapLanguageModel()` from `'ai'` to wrap the model with RAG middleware
- Auto-call `retriever.index()` on first request (lazy, with memoization)
- Pass the wrapped model to `streamText()` instead of the raw model

**Integration pattern:**
```typescript
// Inside route handler when strategy is 'rag':
const retriever = createRetriever({
  documents: context.documents,
  embedding: context.embedding,
  vectorStore: context.vectorStore,
  chunkSize: context.chunkSize,
  chunkOverlap: context.chunkOverlap,
})

const ragMiddleware = createRAGMiddleware({
  retriever,
  topK: context.topK,
  rerank: context.rerank,
})

const wrappedModel = wrapLanguageModel({
  model: resolvedModel,
  middleware: ragMiddleware,
})

// Use wrappedModel in streamText()
```

### 4.6: Integration test — RAG pipeline end-to-end with mock model (2h)

**File:** `packages/ai/src/__tests__/server/rag-integration.test.ts`

- Create 20+ test documents with varied content
- Use a mock embedding adapter that returns deterministic embeddings (e.g., hash-based)
- Test full flow: index → query → retrieve → verify relevant documents returned
- Test with mock LLM model: verify RAG middleware injects context into prompt
- Test `rerank` option with mock rerank model
- Test with custom `VectorStoreAdapter` to verify adapter interface
- Verify performance: 500 documents indexed and searched within acceptable time

### 4.7: Unit tests — chunking, vector store, retriever, middleware (2–3h)

**Files:**
- `packages/ai/src/__tests__/server/vector-store.test.ts`
- `packages/ai/src/__tests__/server/embedding.test.ts`
- `packages/ai/src/__tests__/server/retriever.test.ts`
- `packages/ai/src/__tests__/server/rag-middleware.test.ts`

**Vector store tests:**
- `upsert` stores documents and embeddings
- `search` returns results sorted by score, respects `topK` and `minScore`
- `search` with empty store returns `[]`
- `delete` removes specific documents
- `clear` empties all data
- Duplicate `upsert` overwrites existing entries

**Chunking tests:**
- Short document (below chunkSize) → single chunk
- Long document → multiple chunks with correct overlap
- Paragraph-aware splitting (splits at `\n\n` boundaries)
- Single oversized paragraph → sentence-level splitting
- Chunk IDs follow `${docId}-chunk-${index}` pattern
- Metadata preserved on all chunks

**Retriever tests:**
- `search()` auto-indexes on first call
- `index()` calls `embedMany` with chunked content
- `search()` calls `embed` for query, then vector store `search`
- Custom vector store adapter is used when provided

**Middleware tests:**
- `transformParams` extracts last user message
- Retrieved context injected into prompt
- No user message → params returned unchanged
- Empty retrieval results → params returned unchanged
- Custom `formatContext` function is called with results

---

## 4. Deliverables

| File | Description |
|------|-------------|
| `packages/ai/src/server/vector-store.ts` | In-memory vector store implementing `VectorStoreAdapter` |
| `packages/ai/src/server/embedding.ts` | AI SDK embedding wrapper implementing `EmbeddingAdapter` |
| `packages/ai/src/server/retriever.ts` | Document chunking, indexing, and retrieval |
| `packages/ai/src/server/rag-middleware.ts` | `LanguageModelV3Middleware` for RAG context injection |
| `packages/ai/src/server/route-handler.ts` | Updated with RAG strategy support |
| `packages/ai/src/__tests__/server/vector-store.test.ts` | Vector store unit tests |
| `packages/ai/src/__tests__/server/embedding.test.ts` | Embedding adapter unit tests |
| `packages/ai/src/__tests__/server/retriever.test.ts` | Retriever + chunking unit tests |
| `packages/ai/src/__tests__/server/rag-middleware.test.ts` | RAG middleware unit tests |
| `packages/ai/src/__tests__/server/rag-integration.test.ts` | End-to-end RAG pipeline integration test |

---

## 5. Exit Criteria

- [ ] `createRetriever({ documents, embedding }).search("query", 5)` returns ranked `RetrievedDocument[]` with correct scores
- [ ] `createInMemoryVectorStore()` handles 500 documents with search completing in < 200ms
- [ ] RAG middleware injects retrieved context into LLM prompt via `transformParams` — verified by inspecting transformed params in tests
- [ ] `rerank` option re-orders results when provided (verified with mock rerank model)
- [ ] `createChatRouteHandler({ context: { strategy: 'rag', ... } })` produces a working POST handler that streams responses
- [ ] Chunking correctly splits documents at paragraph/sentence boundaries with configurable overlap
- [ ] All unit tests pass: `pnpm --filter @tour-kit/ai test`
- [ ] Coverage > 80% for all Phase 4 files
- [ ] No browser globals (`window`, `document`, `localStorage`) in any Phase 4 file
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with zero TypeScript errors

---

## 6. Execution Prompt

You are implementing Phase 4 (RAG Pipeline) of `@tour-kit/ai` in the tour-kit monorepo at `packages/ai/`. This phase adds document chunking, embedding, in-memory vector storage, cosine similarity search, and RAG middleware to the existing chat route handler from Phase 1.

### Data Model Rules

All types are defined in `packages/ai/src/types/`. Use these exact interfaces — do not redefine them:

```typescript
// From types/document.ts
interface Document {
  id: string
  content: string
  metadata?: DocumentMetadata
}

interface DocumentMetadata {
  source?: string
  title?: string
  tags?: string[]
  [key: string]: unknown
}

interface RetrievedDocument extends Document {
  score: number
}

// From types/adapter.ts
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

// From types/config.ts
interface RAGConfig {
  strategy: 'rag'
  documents: Document[]
  embedding: EmbeddingAdapter
  vectorStore?: VectorStoreAdapter
  topK?: number        // default: 5
  minScore?: number     // default: 0.7
  chunkSize?: number    // default: 512
  chunkOverlap?: number // default: 50
  rerank?: { model: string; topN?: number }
}

// From types/config.ts
interface RAGMiddlewareOptions {
  retriever: Retriever
  topK?: number
  rerank?: { model: string; topN?: number }
  formatContext?(docs: RetrievedDocument[]): string
}

interface RetrieverOptions {
  documents: Document[]
  embedding: EmbeddingAdapter
  vectorStore?: VectorStoreAdapter
  chunkSize?: number
  chunkOverlap?: number
}

interface Retriever {
  index(): Promise<void>
  search(query: string, topK?: number, minScore?: number): Promise<RetrievedDocument[]>
}
```

### Confirmed AI SDK 6.x APIs

These are the exact imports and API shapes to use. Do NOT guess at API surfaces.

```typescript
// Embeddings — from 'ai' package
import { cosineSimilarity, embed, embedMany } from 'ai'

// embed() — single text
const { embedding } = await embed({
  model: embeddingModel,  // AI SDK model instance
  value: 'text to embed',
})
// embedding: number[]

// embedMany() — batch
const { embeddings } = await embedMany({
  model: embeddingModel,
  values: ['text 1', 'text 2', 'text 3'],
})
// embeddings: number[][]

// cosineSimilarity() — compare two vectors
const similarity = cosineSimilarity(embeddingA, embeddingB)
// similarity: number (-1 to 1)

// Model wrapping — from 'ai' package
import { wrapLanguageModel } from 'ai'

const wrappedModel = wrapLanguageModel({
  model: baseModel,
  middleware: myMiddleware,
})

// Middleware type — from '@ai-sdk/provider'
import type { LanguageModelV3Middleware } from '@ai-sdk/provider'

// LanguageModelV3Middleware shape:
const middleware: LanguageModelV3Middleware = {
  transformParams: async ({ params }) => {
    // params.prompt is an array of { role, content } messages
    // Find last user message:
    const lastUserMsg = params.prompt.findLast(m => m.role === 'user')
    if (!lastUserMsg) return params

    // Extract text from user message content parts:
    const text = lastUserMsg.content
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map(part => part.text)
      .join(' ')

    // ... do retrieval with `text` ...

    // Inject context by adding to system message:
    return {
      ...params,
      prompt: [
        { role: 'system', content: [{ type: 'text', text: contextString }] },
        ...params.prompt,
      ],
    }
  },
}
```

### Per-File Implementation Guidance

**`server/vector-store.ts`**
```typescript
import { cosineSimilarity } from 'ai'
import type { Document, RetrievedDocument, VectorStoreAdapter } from '../types'

interface VectorStoreEntry {
  document: Document
  embedding: number[]
}

export function createInMemoryVectorStore(): VectorStoreAdapter {
  const store = new Map<string, VectorStoreEntry>()

  return {
    name: 'in-memory',

    async upsert(documents, embeddings) {
      // Zip documents with embeddings, store by document.id
      // If documents.length !== embeddings.length, throw
    },

    async search(queryEmbedding, topK, minScore = 0) {
      // Iterate store, compute cosineSimilarity(queryEmbedding, entry.embedding)
      // Filter by minScore, sort descending, slice to topK
      // Return RetrievedDocument[] (document + score)
    },

    async delete(ids) {
      // Remove entries by id
    },

    async clear() {
      store.clear()
    },
  }
}
```

**`server/embedding.ts`**
```typescript
import { embed, embedMany } from 'ai'
import type { EmbeddingAdapter } from '../types'

interface AiSdkEmbeddingOptions {
  model: string  // AI SDK model identifier, e.g. 'openai/text-embedding-3-small'
  dimensions?: number  // defaults to 1536
}

export function createAiSdkEmbedding(options: AiSdkEmbeddingOptions): EmbeddingAdapter {
  const { model, dimensions = 1536 } = options

  return {
    name: `ai-sdk:${model}`,
    dimensions,

    async embed(text) {
      const result = await embed({ model, value: text })
      return result.embedding
    },

    async embedMany(texts) {
      const result = await embedMany({ model, values: texts })
      return result.embeddings
    },
  }
}
```

**`server/retriever.ts`**
```typescript
import type { Document, EmbeddingAdapter, Retriever, RetrieverOptions, VectorStoreAdapter } from '../types'
import { createInMemoryVectorStore } from './vector-store'

// Export chunking helpers for testing
export function chunkDocument(
  document: Document,
  chunkSize: number,
  chunkOverlap: number,
): Document[] {
  // 1. Split by \n\n (paragraphs)
  // 2. Accumulate until chunkSize exceeded
  // 3. Overlap from end of previous chunk
  // 4. ID: `${document.id}-chunk-${index}`
  // 5. Preserve metadata, add chunkIndex
}

export function chunkDocuments(
  documents: Document[],
  chunkSize: number,
  chunkOverlap: number,
): Document[] {
  return documents.flatMap(doc => chunkDocument(doc, chunkSize, chunkOverlap))
}

export function createRetriever(options: RetrieverOptions): Retriever {
  const {
    documents,
    embedding,
    vectorStore = createInMemoryVectorStore(),
    chunkSize = 512,
    chunkOverlap = 50,
  } = options

  let indexed = false
  let indexingPromise: Promise<void> | null = null

  return {
    async index() {
      // Chunk documents, embedMany, upsert into vector store
      // Set indexed = true after completion
    },

    async search(query, topK = 5, minScore = 0.7) {
      // Auto-index on first search (with lock via indexingPromise)
      // Embed query, search vector store, return results
    },
  }
}
```

**`server/rag-middleware.ts`**
```typescript
import type { LanguageModelV3Middleware } from '@ai-sdk/provider'
import type { RAGMiddlewareOptions, RetrievedDocument } from '../types'

function defaultFormatContext(docs: RetrievedDocument[]): string {
  return docs
    .map((doc, i) => {
      const source = doc.metadata?.title ?? doc.metadata?.source ?? doc.id
      return `[${i + 1}] (${source}): ${doc.content}`
    })
    .join('\n\n')
}

export function createRAGMiddleware(options: RAGMiddlewareOptions): LanguageModelV3Middleware {
  const {
    retriever,
    topK = 5,
    rerank,
    formatContext = defaultFormatContext,
  } = options

  return {
    transformParams: async ({ params }) => {
      // 1. Find last user message in params.prompt
      // 2. Extract text content
      // 3. Search retriever (use topK * 2 if rerank is configured)
      // 4. If rerank, re-score and select topN
      // 5. Format context via formatContext()
      // 6. Prepend system message with context to params.prompt
      // 7. Return modified params
    },
  }
}
```

**Updating `server/route-handler.ts`**
Add a branch in `createChatRouteHandler` for `strategy: 'rag'`:
- Import `createRetriever`, `createRAGMiddleware`, `wrapLanguageModel`
- When `context.strategy === 'rag'`, create retriever + middleware, wrap model
- Memoize the retriever instance so it persists across requests (closure scope)
- First request triggers `index()` — subsequent requests reuse the indexed store

### Testing Patterns

Use vitest. Mock the embedding adapter to return deterministic embeddings:

```typescript
function createMockEmbedding(): EmbeddingAdapter {
  // Simple hash-based embedding for deterministic tests
  return {
    name: 'mock',
    dimensions: 3,
    async embed(text) {
      // Return a simple vector derived from text content
      const hash = simpleHash(text)
      return [Math.sin(hash), Math.cos(hash), Math.sin(hash * 2)]
    },
    async embedMany(texts) {
      return Promise.all(texts.map(t => this.embed(t)))
    },
  }
}
```

For middleware tests, create a mock `params` object matching the `transformParams` input shape and verify the output contains injected context.

### Constraints

- All Phase 4 code is server-only: NO `window`, `document`, `localStorage`, `navigator` references
- Import from `'ai'` for `cosineSimilarity`, `embed`, `embedMany`, `wrapLanguageModel`
- Import from `'@ai-sdk/provider'` for `LanguageModelV3Middleware` type only
- Use `async/await` — no callbacks
- All functions are named exports (no default exports)
- Follow the existing monorepo patterns: named factory functions (`create*`), interface-first design
- Run `pnpm --filter @tour-kit/ai build` and `pnpm --filter @tour-kit/ai test` after implementation

---

## Readiness Check

Before starting Phase 4, confirm:

- [ ] Phase 1 is complete: `types/config.ts`, `types/document.ts`, `types/adapter.ts` exist with all interfaces listed above
- [ ] Phase 1 is complete: `server/route-handler.ts` exists with `createChatRouteHandler` supporting CAG strategy
- [ ] Phase 2 is complete: `server/system-prompt.ts` exists with `createSystemPrompt()`
- [ ] `pnpm --filter @tour-kit/ai build` succeeds
- [ ] `pnpm --filter @tour-kit/ai test` passes all existing tests
- [ ] AI SDK 6.x dependencies are installed: `ai`, `@ai-sdk/provider` in `packages/ai/package.json`
- [ ] The `Retriever`, `RetrieverOptions`, `RAGMiddlewareOptions` interfaces exist in `types/` (or add them in task 4.3/4.4)
