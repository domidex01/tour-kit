# Phase 4 Test Plan — RAG Pipeline

**Package:** `@tour-kit/ai`
**Phase:** 4 — RAG Pipeline
**Phase Type:** Service (mock embedding API, test pipeline logic)
**Framework:** Vitest + TypeScript
**Date:** 2026-03-21

---

## User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a developer, I want `createRetriever().search()` to return ranked documents, so that the RAG pipeline delivers relevant context | `search()` returns `RetrievedDocument[]` sorted by score descending; results match the query semantically via mock embeddings | Unit + Integration |
| US-2 | As a developer, I want the in-memory vector store to handle 500 docs in <200ms, so that search is fast enough | Index 500 documents and run `search()` — total time < 200ms | Performance |
| US-3 | As a developer, I want chunking to preserve document metadata, so that I can trace results back to sources | Each chunk inherits parent `metadata`, has `chunkIndex`, and ID follows `${docId}-chunk-${index}` pattern | Unit |
| US-4 | As a developer, I want RAG middleware to inject context via `transformParams`, so that the LLM sees retrieved documents | `transformParams` output contains a system message with formatted retrieved context prepended to the prompt | Unit |
| US-5 | As a developer, I want lazy indexing on first search, so that startup is not blocked by embedding calls | `search()` auto-calls `index()` on first invocation; subsequent calls skip indexing; concurrent calls share the same indexing promise | Unit |

---

## Component Mock Strategy

| Dependency | Mock Type | Rationale |
|------------|-----------|-----------|
| `cosineSimilarity` from `ai` | **Real implementation** or deterministic stub | Cosine similarity is a pure math function; use real when testing vector store, stub when isolating retriever |
| `embed` / `embedMany` from `ai` | **vi.mock('ai')** | Avoid real API calls; return deterministic hash-based vectors |
| `wrapLanguageModel` from `ai` | **vi.mock('ai')** | Return identity wrapper; verify it is called with correct middleware |
| `EmbeddingAdapter` | **Fake (MockEmbeddingAdapter)** | Deterministic 3-dimension hash-based embeddings for pipeline tests |
| `VectorStoreAdapter` | **Fake (MockVectorStore)** | Spy-enabled mock implementing the full interface for retriever tests |
| `Retriever` | **Fake (MockRetriever)** | Pre-configured search results for middleware tests |
| `generateText` from `ai` | **vi.mock('ai')** | For rerank tests; return mock re-scored results |

---

## Test Tier Table

| Tier | Test Count | Scope |
|------|-----------|-------|
| Unit | ~35 | Vector store CRUD, chunking algorithm, embedding adapter, retriever logic, RAG middleware transformParams |
| Integration | ~8 | Full RAG pipeline end-to-end (index + search + middleware), route handler with RAG strategy |
| Performance | ~2 | 500-document indexing + search timing |
| **Total** | **~45** | |

---

## Fake / Mock Implementations

### `MockEmbeddingAdapter`

```typescript
// packages/ai/src/__tests__/helpers/mock-embedding.ts

import type { EmbeddingAdapter } from '../../types'

/**
 * Deterministic hash-based embedding for testing.
 * Returns 3-dimensional vectors derived from text content.
 * Same input always produces the same output.
 */
function simpleHash(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash
}

export function createMockEmbedding(): EmbeddingAdapter {
  return {
    name: 'mock-embedding',
    dimensions: 3,

    async embed(text: string): Promise<number[]> {
      const h = simpleHash(text)
      return [Math.sin(h), Math.cos(h), Math.sin(h * 2)]
    },

    async embedMany(texts: string[]): Promise<number[][]> {
      return Promise.all(texts.map((t) => this.embed(t)))
    },
  }
}
```

### `MockVectorStore`

```typescript
// packages/ai/src/__tests__/helpers/mock-vector-store.ts

import type { Document, RetrievedDocument, VectorStoreAdapter } from '../../types'

export function createMockVectorStore(): VectorStoreAdapter & {
  upsertCalls: Array<{ documents: Document[]; embeddings: number[][] }>
  searchCalls: Array<{ embedding: number[]; topK: number; minScore?: number }>
} {
  let storedResults: RetrievedDocument[] = []
  const upsertCalls: Array<{ documents: Document[]; embeddings: number[][] }> = []
  const searchCalls: Array<{ embedding: number[]; topK: number; minScore?: number }> = []

  return {
    name: 'mock-vector-store',
    upsertCalls,
    searchCalls,

    async upsert(documents: Document[], embeddings: number[][]): Promise<void> {
      upsertCalls.push({ documents, embeddings })
    },

    async search(
      embedding: number[],
      topK: number,
      minScore?: number,
    ): Promise<RetrievedDocument[]> {
      searchCalls.push({ embedding, topK, minScore })
      return storedResults.slice(0, topK)
    },

    async delete(_ids: string[]): Promise<void> {},
    async clear(): Promise<void> {
      storedResults = []
    },
  }
}
```

### `MockRetriever`

```typescript
// packages/ai/src/__tests__/helpers/mock-retriever.ts

import type { Retriever, RetrievedDocument } from '../../types'

export function createMockRetriever(
  results: RetrievedDocument[] = [],
): Retriever & { indexCalled: boolean } {
  return {
    indexCalled: false,

    async index(): Promise<void> {
      this.indexCalled = true
    },

    async search(
      _query: string,
      topK = 5,
      _minScore?: number,
    ): Promise<RetrievedDocument[]> {
      return results.slice(0, topK)
    },
  }
}
```

### Test Document Factory

```typescript
// packages/ai/src/__tests__/helpers/factories.ts

import type { Document } from '../../types'

export function createTestDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    content: 'This is test document content about product features.',
    metadata: { source: 'test', title: 'Test Document' },
    ...overrides,
  }
}

export function createTestDocuments(count: number, prefix = 'doc'): Document[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    content: `Document ${i} content about topic ${i % 5}. This has enough text to be meaningful for chunking tests.`,
    metadata: { source: `source-${i}`, title: `Document ${i}`, tags: [`tag-${i % 3}`] },
  }))
}
```

---

## Test File List

| # | File | Tests | Tier | US Coverage |
|---|------|-------|------|-------------|
| 1 | `packages/ai/src/__tests__/server/vector-store.test.ts` | ~10 | Unit | US-1, US-2 |
| 2 | `packages/ai/src/__tests__/server/embedding.test.ts` | ~5 | Unit | US-1 |
| 3 | `packages/ai/src/__tests__/server/retriever.test.ts` | ~12 | Unit | US-1, US-3, US-5 |
| 4 | `packages/ai/src/__tests__/server/rag-middleware.test.ts` | ~8 | Unit | US-4 |
| 5 | `packages/ai/src/__tests__/server/rag-integration.test.ts` | ~8 | Integration + Performance | US-1, US-2, US-3, US-4, US-5 |
| 6 | `packages/ai/src/__tests__/helpers/mock-embedding.ts` | — | Helper | — |
| 7 | `packages/ai/src/__tests__/helpers/mock-vector-store.ts` | — | Helper | — |
| 8 | `packages/ai/src/__tests__/helpers/mock-retriever.ts` | — | Helper | — |
| 9 | `packages/ai/src/__tests__/helpers/factories.ts` | — | Helper | — |

---

## Helpers Structure

```
packages/ai/src/__tests__/
├── helpers/
│   ├── mock-embedding.ts        # MockEmbeddingAdapter (hash-based, 3D)
│   ├── mock-vector-store.ts     # MockVectorStore with call tracking
│   ├── mock-retriever.ts        # MockRetriever with preset results
│   └── factories.ts             # createTestDocument, createTestDocuments
└── server/
    ├── vector-store.test.ts
    ├── embedding.test.ts
    ├── retriever.test.ts
    ├── rag-middleware.test.ts
    └── rag-integration.test.ts
```

---

## Key Testing Decisions

1. **Real `cosineSimilarity` in vector store tests.** The in-memory vector store uses `cosineSimilarity` from `ai` — we test with real cosine similarity and deterministic vectors to validate correct sorting and filtering behavior. Only mock it when isolating retriever logic.

2. **Hash-based mock embeddings.** The `MockEmbeddingAdapter` uses a deterministic `simpleHash` function to produce 3-dimensional vectors. This ensures the same text always maps to the same vector, allowing us to write assertions about which documents score highest for a given query. The 3-dimension size is minimal but sufficient for cosine similarity to distinguish different texts.

3. **No real API calls.** All tests mock `embed`, `embedMany`, and `generateText` from `ai`. The `createAiSdkEmbedding` adapter tests mock the `ai` module entirely. Pipeline tests use `MockEmbeddingAdapter` directly.

4. **Performance tests use real in-memory store.** The 500-document performance test uses the actual `createInMemoryVectorStore()` with `MockEmbeddingAdapter` to validate the <200ms target. This is a real timing assertion, not a mock.

5. **Middleware tested in isolation.** RAG middleware `transformParams` tests use `MockRetriever` with predetermined results. The middleware receives a fake `params` object matching the `LanguageModelV3Middleware` input shape and we assert on the output prompt structure.

6. **Chunking tested as pure functions.** `chunkDocument` and `chunkDocuments` are exported pure functions — tested with deterministic inputs and exact output assertions. No mocks needed.

7. **Lazy indexing tested with concurrent access.** Use multiple simultaneous `search()` calls to verify the indexing lock prevents duplicate `embedMany` calls.

---

## Example Test Case

```typescript
// packages/ai/src/__tests__/server/vector-store.test.ts

import { describe, expect, it } from 'vitest'
import { createInMemoryVectorStore } from '../../server/vector-store'
import type { Document } from '../../types'

describe('createInMemoryVectorStore', () => {
  describe('search', () => {
    it('returns results sorted by cosine similarity descending', async () => {
      const store = createInMemoryVectorStore()

      const documents: Document[] = [
        { id: 'doc-a', content: 'about cats' },
        { id: 'doc-b', content: 'about dogs' },
        { id: 'doc-c', content: 'about birds' },
      ]

      // Deterministic embeddings where doc-a is closest to query
      const embeddings = [
        [1, 0, 0],   // doc-a
        [0, 1, 0],   // doc-b
        [0, 0, 1],   // doc-c
      ]

      await store.upsert(documents, embeddings)

      // Query vector closest to doc-a
      const results = await store.search([0.9, 0.1, 0], 3)

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('doc-a')
      expect(results[0].score).toBeGreaterThan(results[1].score)
      expect(results[1].score).toBeGreaterThan(results[2].score)
    })

    it('filters results below minScore', async () => {
      const store = createInMemoryVectorStore()

      const documents: Document[] = [
        { id: 'doc-a', content: 'relevant' },
        { id: 'doc-b', content: 'irrelevant' },
      ]

      const embeddings = [
        [1, 0, 0],   // doc-a — will be close to query
        [0, 0, 1],   // doc-b — will be far from query
      ]

      await store.upsert(documents, embeddings)

      const results = await store.search([1, 0, 0], 10, 0.9)

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-a')
      expect(results[0].score).toBeGreaterThanOrEqual(0.9)
    })
  })
})
```

---

## Detailed Test Outlines

### 1. `vector-store.test.ts`

```typescript
describe('createInMemoryVectorStore', () => {
  describe('upsert', () => {
    it('stores documents and embeddings by document ID')
    it('throws when documents.length !== embeddings.length')
    it('overwrites existing entries on duplicate upsert')
  })

  describe('search', () => {
    it('returns results sorted by cosine similarity descending')
    it('respects topK limit')
    it('filters results below minScore')
    it('returns empty array when store is empty')
    it('defaults minScore to 0 when not provided')
  })

  describe('delete', () => {
    it('removes documents by ID')
    it('ignores IDs that do not exist')
  })

  describe('clear', () => {
    it('empties all stored data')
  })
})
```

### 2. `embedding.test.ts`

```typescript
vi.mock('ai', () => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}))

describe('createAiSdkEmbedding', () => {
  it('returns an EmbeddingAdapter with correct name and dimensions')
  it('calls ai.embed() and returns the embedding vector')
  it('calls ai.embedMany() and returns the embedding vectors')
  it('uses default dimensions of 1536 when not specified')
  it('propagates errors from the embedding API with descriptive messages')
})
```

### 3. `retriever.test.ts`

```typescript
describe('chunkDocument', () => {
  it('returns single chunk for short document below chunkSize')
  it('splits long document into multiple chunks with correct overlap')
  it('splits at paragraph boundaries (\\n\\n)')
  it('falls back to sentence splitting for oversized paragraphs')
  it('hard-splits at chunkSize when no sentence boundary found')
  it('generates chunk IDs as ${docId}-chunk-${index}')
  it('preserves parent document metadata on all chunks')
  it('adds chunkIndex to each chunk metadata')
})

describe('chunkDocuments', () => {
  it('chunks all documents and returns flat array')
})

describe('createRetriever', () => {
  describe('index', () => {
    it('chunks documents and calls embedMany on chunk contents')
    it('upserts chunks and embeddings into vector store')
    it('uses default in-memory vector store when none provided')
    it('uses custom vector store when provided')
  })

  describe('search', () => {
    it('embeds query and searches vector store')
    it('returns RetrievedDocument[] from vector store results')
    it('auto-indexes on first search if not yet indexed')
    it('does not re-index on subsequent searches')
    it('concurrent search calls share the same indexing promise')
    it('uses default topK=5 and minScore=0.7 when not specified')
  })
})
```

### 4. `rag-middleware.test.ts`

```typescript
describe('createRAGMiddleware', () => {
  it('returns a LanguageModelV3Middleware with transformParams')

  describe('transformParams', () => {
    it('extracts text from the last user message')
    it('searches retriever with extracted text')
    it('injects formatted context as a system message prepended to prompt')
    it('returns params unchanged when no user message found')
    it('returns params unchanged when retriever returns empty results')
    it('uses custom formatContext function when provided')
    it('uses default formatContext with numbered list and source metadata')
    it('retrieves topK * 2 results when rerank is configured')
  })
})
```

### 5. `rag-integration.test.ts`

```typescript
describe('RAG Pipeline Integration', () => {
  it('indexes documents and retrieves relevant results for a query')
  it('RAG middleware injects retrieved context into LLM prompt')
  it('end-to-end: index → query → retrieve → verify ranked results')
  it('works with custom VectorStoreAdapter')
  it('handles rerank option with mock rerank model')
  it('lazy indexes on first search — no upfront blocking')

  describe('Performance', () => {
    it('indexes and searches 500 documents in < 200ms')
    it('subsequent searches after indexing complete in < 50ms')
  })
})
```

---

## Execution Prompt

You are writing tests for Phase 4 (RAG Pipeline) of `@tour-kit/ai`. Use Vitest with TypeScript. All test files use `.test.ts` extension.

**Setup:**
1. Create the helper files first: `mock-embedding.ts`, `mock-vector-store.ts`, `mock-retriever.ts`, `factories.ts`
2. Write unit tests for each module in isolation
3. Write integration tests last, composing the real implementations with mock embedding

**Conventions:**
- Import `{ describe, expect, it, vi, beforeEach, afterEach }` from `'vitest'`
- Use `vi.mock('ai')` to mock AI SDK functions; use `vi.mocked()` for typed access
- Use factory functions for test data (see helpers)
- Each `describe` block matches a function or method
- Test names start with a verb: "returns", "throws", "calls", "filters"
- Use `beforeEach` to reset mocks: `vi.clearAllMocks()`
- Performance tests use `performance.now()` for timing assertions
- No `any` types — use proper TypeScript types or `unknown`

**Run command:**
```bash
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/
```

---

## Run Commands

```bash
# Run all Phase 4 tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/

# Run individual test files
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/vector-store.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/embedding.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/retriever.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/rag-middleware.test.ts
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/rag-integration.test.ts

# Run with coverage for Phase 4 files
pnpm --filter @tour-kit/ai test -- --run --coverage src/__tests__/server/

# Run only performance tests
pnpm --filter @tour-kit/ai test -- --run -t "Performance" src/__tests__/server/rag-integration.test.ts
```
