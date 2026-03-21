# Phase 0 — Test Plan: Validation Gate

**Package:** `@tour-kit/ai`
**Phase Type:** Research / validation — the spikes ARE the tests. No fakes needed.
**Framework:** Vitest + `@testing-library/react`
**Date:** 2026-03-21

---

## User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a developer, I want `pnpm --filter @tour-kit/ai build` to exit 0, so that the AI SDK integrates with our build system | Build produces 3 entry points (index, server/index, headless) with ESM + CJS + DTS | Unit |
| US-2 | As a developer, I want streaming to deliver tokens incrementally, so that the chat UX is responsive | `streamText` + `toUIMessageStreamResponse` streams tokens; `Content-Type: text/event-stream` | Integration (requires OPENAI_API_KEY) |
| US-3 | As a developer, I want middleware `transformParams` to intercept prompts, so that RAG context injection works | `wrapLanguageModel` middleware is invoked; injected text appears in LLM response | Integration (requires OPENAI_API_KEY) |
| US-4 | As a developer, I want in-memory vector search to return relevant results in <200ms, so that the retrieval strategy is viable | Top-3 results are semantically relevant; cosine similarity scores in [-1, 1]; search < 200ms | Integration (requires OPENAI_API_KEY) |

---

## Component Mock Strategy

**Key Pattern:** Phase 0 is a validation gate. No fakes — the real dependency IS what's being tested. Only the build output verification tests are pure unit tests with no external dependencies.

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| tsup build output | Direct filesystem assertions | We need to verify the REAL build output files exist and export correctly |
| `streamText` / `toUIMessageStreamResponse` | Real API call | The spike tests the actual AI SDK streaming behavior; mocking would defeat the purpose |
| `wrapLanguageModel` / `LanguageModelV3Middleware` | Real API call | Testing real middleware composition is the point of the spike |
| `embedMany` / `embed` / `cosineSimilarity` | Real API call for embeddings; pure function for cosine similarity | Embedding requires the real API; cosine similarity is a pure math function that can be unit-tested |

---

## Test Tier Table

| Test File | Tier | US | External Deps | Skip Condition |
|-----------|------|----|---------------|----------------|
| `build-output.test.ts` | Unit | US-1 | Filesystem (post-build) | None — always runs |
| `entry-exports.test.ts` | Unit | US-1 | Compiled dist modules | None — always runs |
| `cosine-similarity.test.ts` | Unit | US-4 | None (pure math) | None — always runs |
| `streaming-spike.integration.test.ts` | Integration | US-2 | OPENAI_API_KEY | `!process.env.OPENAI_API_KEY` |
| `middleware-spike.integration.test.ts` | Integration | US-3 | OPENAI_API_KEY | `!process.env.OPENAI_API_KEY` |
| `vector-spike.integration.test.ts` | Integration | US-4 | OPENAI_API_KEY | `!process.env.OPENAI_API_KEY` |

---

## Fake/Mock Implementations

Phase 0 uses **no fakes** for spike tests. Only build verification tests use filesystem checks.

### Helper: `assertFileExists`

```typescript
// packages/ai/src/__tests__/helpers/fs-assertions.ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_DIR = resolve(__dirname, '../../../dist')

export function distPath(...segments: string[]): string {
  return resolve(DIST_DIR, ...segments)
}

export function assertDistFileExists(relativePath: string): void {
  const fullPath = distPath(relativePath)
  if (!existsSync(fullPath)) {
    throw new Error(`Expected dist file not found: ${relativePath} (resolved: ${fullPath})`)
  }
}
```

### Helper: `skipWithoutApiKey`

```typescript
// packages/ai/src/__tests__/helpers/skip-conditions.ts
export const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY

export function describeWithApiKey(name: string, fn: () => void) {
  if (HAS_OPENAI_KEY) {
    describe(name, fn)
  } else {
    describe.skip(`${name} (OPENAI_API_KEY not set)`, fn)
  }
}
```

---

## Test File List

```
packages/ai/src/__tests__/
├── helpers/
│   ├── fs-assertions.ts          ← Dist file existence helpers
│   └── skip-conditions.ts        ← API key skip guard
├── build/
│   ├── build-output.test.ts      ← US-1: Verify dist/ file structure
│   └── entry-exports.test.ts     ← US-1: Verify each entry point exports
├── spikes/
│   ├── cosine-similarity.test.ts                ← US-4: Pure unit test for cosine math
│   ├── streaming-spike.integration.test.ts      ← US-2: Token streaming (requires key)
│   ├── middleware-spike.integration.test.ts      ← US-3: Middleware composition (requires key)
│   └── vector-spike.integration.test.ts         ← US-4: In-memory vector search (requires key)
```

---

## Helpers Structure

No `conftest.py` equivalent. Shared utilities live in `packages/ai/src/__tests__/helpers/`.

| File | Purpose |
|------|---------|
| `helpers/fs-assertions.ts` | `distPath()`, `assertDistFileExists()` — filesystem helpers for build verification |
| `helpers/skip-conditions.ts` | `HAS_OPENAI_KEY`, `describeWithApiKey()` — conditional test execution |

---

## Key Testing Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| No mocks for spike tests | Real API calls | Phase 0 validates that real AI SDK 6.x APIs work in the tour-kit build system. Mocking would test nothing. |
| Build tests run post-build | Filesystem assertions on `dist/` | Tests assert that `pnpm --filter @tour-kit/ai build` produced the expected file structure. Must run after build. |
| Integration tests are skippable | `describeWithApiKey` guard | CI may not have OPENAI_API_KEY. Build verification tests always run; integration tests require the key. |
| Cosine similarity is unit-tested separately | Pure function, no API needed | `cosineSimilarity` from `ai` is a pure math function — test it deterministically without API calls. |
| No React component tests | No UI in Phase 0 | Phase 0 has no React components — only build output and spike functions. |
| Test timeout for integration tests | 30s per test | LLM API calls can be slow; default 5s timeout would cause flaky failures. |

---

## Example Test Cases

### Build Output Verification (Unit)

```typescript
// packages/ai/src/__tests__/build/build-output.test.ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIST = resolve(__dirname, '../../../dist')

const EXPECTED_FILES = [
  // Client entry
  'index.js',
  'index.cjs',
  'index.d.ts',
  'index.d.cts',
  // Server entry
  'server/index.js',
  'server/index.cjs',
  'server/index.d.ts',
  'server/index.d.cts',
  // Headless entry
  'headless.js',
  'headless.cjs',
  'headless.d.ts',
  'headless.d.cts',
]

describe('Build Output — US-1', () => {
  it.each(EXPECTED_FILES)('dist/%s exists', (file) => {
    const fullPath = resolve(DIST, file)
    expect(existsSync(fullPath)).toBe(true)
  })

  it('dist/ contains no unexpected top-level directories', () => {
    // Ensure only expected output, not leaked spike code
    const { readdirSync } = require('node:fs')
    const entries = readdirSync(DIST)
    expect(entries).not.toContain('__spikes__')
  })
})
```

### Entry Point Exports (Unit)

```typescript
// packages/ai/src/__tests__/build/entry-exports.test.ts
import { describe, expect, it } from 'vitest'

describe('Entry Point Exports — US-1', () => {
  it('client entry exports AI_PACKAGE_VERSION', async () => {
    const clientModule = await import('../../index')
    expect(clientModule.AI_PACKAGE_VERSION).toBe('0.0.0')
  })

  it('server entry exports SERVER_ENTRY', async () => {
    const serverModule = await import('../../server/index')
    expect(serverModule.SERVER_ENTRY).toBe(true)
  })

  it('headless entry exports HEADLESS_ENTRY', async () => {
    const headlessModule = await import('../../headless')
    expect(headlessModule.HEADLESS_ENTRY).toBe(true)
  })
})
```

### Cosine Similarity (Unit)

```typescript
// packages/ai/src/__tests__/spikes/cosine-similarity.test.ts
import { cosineSimilarity } from 'ai'
import { describe, expect, it } from 'vitest'

describe('cosineSimilarity — US-4 (pure math)', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 0, 0, 1]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
  })

  it('returns -1 for opposite vectors', () => {
    const a = [1, 0]
    const b = [-1, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5)
  })

  it('returns 0 for orthogonal vectors', () => {
    const a = [1, 0]
    const b = [0, 1]
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5)
  })

  it('returns a value between -1 and 1 for arbitrary vectors', () => {
    const a = [0.5, 0.3, 0.9, 0.1]
    const b = [0.2, 0.8, 0.4, 0.6]
    const result = cosineSimilarity(a, b)
    expect(result).toBeGreaterThanOrEqual(-1)
    expect(result).toBeLessThanOrEqual(1)
  })
})
```

### Streaming Spike (Integration)

```typescript
// packages/ai/src/__tests__/spikes/streaming-spike.integration.test.ts
import { describe, expect, it } from 'vitest'
import { describeWithApiKey } from '../helpers/skip-conditions'

describeWithApiKey('Streaming Spike — US-2', () => {
  it('streamText produces a ReadableStream response', async () => {
    const { streamText, convertToModelMessages } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: convertToModelMessages([
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Say hello in 5 words.' }], createdAt: new Date() },
      ]),
      maxTokens: 50,
    })

    const response = result.toUIMessageStreamResponse()
    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    // Verify the body is a ReadableStream
    expect(response.body).toBeInstanceOf(ReadableStream)

    // Read at least one chunk to confirm streaming works
    const reader = response.body!.getReader()
    const { value, done } = await reader.read()
    expect(done).toBe(false)
    expect(value).toBeDefined()
    reader.releaseLock()
  }, 30_000)
})
```

### Vector Search Spike (Integration)

```typescript
// packages/ai/src/__tests__/spikes/vector-spike.integration.test.ts
import { describe, expect, it } from 'vitest'
import { describeWithApiKey } from '../helpers/skip-conditions'

describeWithApiKey('Vector Search Spike — US-4', () => {
  it('returns top-3 semantically relevant results in < 200ms', async () => {
    const { embed, embedMany, cosineSimilarity } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const docs = [
      'Tour Kit is a headless onboarding library for React applications.',
      'Installation requires pnpm add @tour-kit/core @tour-kit/react.',
      'The analytics package supports plugin-based event tracking.',
      'WCAG 2.1 AA accessibility compliance is a core requirement.',
      'Keyboard navigation supports Escape to close and Tab for focus.',
    ]

    const embeddingModel = openai.embedding('text-embedding-3-small')

    const { embeddings } = await embedMany({ model: embeddingModel, values: docs })
    expect(embeddings).toHaveLength(docs.length)

    const query = 'How do I install the library?'
    const { embedding: queryEmbedding } = await embed({ model: embeddingModel, value: query })

    const startSearch = performance.now()
    const results = docs
      .map((doc, i) => ({ document: doc, similarity: cosineSimilarity(queryEmbedding, embeddings[i]) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
    const searchTime = performance.now() - startSearch

    // Search (excluding embedding API calls) should be < 200ms
    expect(searchTime).toBeLessThan(200)

    // All similarity scores in valid range
    for (const r of results) {
      expect(r.similarity).toBeGreaterThanOrEqual(-1)
      expect(r.similarity).toBeLessThanOrEqual(1)
    }

    // Top result should be the installation doc
    expect(results[0].document).toContain('install')
  }, 30_000)
})
```

---

## Execution Prompt

> Paste this into a Claude Code session to implement Phase 0 tests.

You are writing **Phase 0 tests** for `@tour-kit/ai`. Phase 0 is a validation gate — the spikes ARE the tests. No fakes needed.

### What to implement

1. Create `packages/ai/src/__tests__/helpers/fs-assertions.ts` — filesystem helpers for dist verification
2. Create `packages/ai/src/__tests__/helpers/skip-conditions.ts` — API key guard for integration tests
3. Create `packages/ai/src/__tests__/build/build-output.test.ts` — verify all 12 expected dist files exist
4. Create `packages/ai/src/__tests__/build/entry-exports.test.ts` — verify each entry point exports the expected symbols
5. Create `packages/ai/src/__tests__/spikes/cosine-similarity.test.ts` — pure math unit tests
6. Create `packages/ai/src/__tests__/spikes/streaming-spike.integration.test.ts` — verify `streamText` produces a `ReadableStream` (requires OPENAI_API_KEY)
7. Create `packages/ai/src/__tests__/spikes/middleware-spike.integration.test.ts` — verify `wrapLanguageModel` + `transformParams` intercepts the prompt (requires OPENAI_API_KEY)
8. Create `packages/ai/src/__tests__/spikes/vector-spike.integration.test.ts` — verify in-memory vector search returns relevant results in < 200ms (requires OPENAI_API_KEY)

### Conventions

- Use `describe/it/expect` from `vitest` (explicit imports, not global)
- Use `beforeEach/afterEach` for setup/teardown
- Integration tests use 30s timeout: `it('...', async () => { ... }, 30_000)`
- Integration tests are wrapped with `describeWithApiKey()` to skip when OPENAI_API_KEY is missing
- File extension: `.test.ts` for non-React, `.test.tsx` for React
- No conftest — shared helpers go in `__tests__/helpers/`

---

## Run Commands

```bash
# Build first (build tests require dist/)
pnpm --filter @tour-kit/ai build

# Run unit tests only (no API key needed)
pnpm --filter @tour-kit/ai test -- --run

# Run all tests including integration (requires OPENAI_API_KEY)
OPENAI_API_KEY=sk-... pnpm --filter @tour-kit/ai test -- --run

# Run with coverage
pnpm --filter @tour-kit/ai test -- --run --coverage

# Run a specific test file
pnpm --filter @tour-kit/ai test -- --run src/__tests__/build/build-output.test.ts
```
