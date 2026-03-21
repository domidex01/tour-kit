# Phase 0 — Validation Gate

**Duration:** Days 1–2 (~5.5 hours)
**Depends on:** Nothing
**Blocks:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9
**Risk Level:** HIGH — binary go/no-go gate; if AI SDK 6.x doesn't work in tour-kit's build system, entire project pivots
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Phase 0 answers one question: **can AI SDK 6.x streaming, middleware composition, and in-memory vector search run correctly inside tour-kit's pnpm + Turborepo + tsup build system?**

This is not a feature phase. No production code ships. The output is a set of throwaway spikes that prove (or disprove) four technical assumptions:

1. **Build compatibility** — `tsup` can bundle a package that imports `ai`, `@ai-sdk/react`, and `@ai-sdk/provider` into 3 separate entry points (index, server, headless) without resolution errors, circular dependency issues, or broken DTS generation.
2. **Streaming works** — `streamText` + `toUIMessageStreamResponse` produces a `Response` that delivers tokens incrementally to the browser via `useChat` + `DefaultChatTransport`.
3. **Middleware composes** — `wrapLanguageModel` + a `LanguageModelV3Middleware` with `transformParams` can intercept prompts and inject retrieved context before the LLM call.
4. **Vector search works** — `embedMany` + `embed` + `cosineSimilarity` can index 50 documents in memory and return the top-3 most relevant results for a query.

**Success looks like:** All four assumptions validated, `pnpm --filter @tour-kit/ai build` exits 0, and a `plan/phase-0-status.json` file records `"decision": "proceed"`.

---

## 2. What Failure Looks Like (and what to do)

| Failure Mode | Symptom | Response |
|---|---|---|
| tsup cannot resolve AI SDK imports | Build errors referencing `ai`, `@ai-sdk/react`, or `@ai-sdk/provider` — missing modules, CJS/ESM interop failures, or DTS generation crashes | Try `noExternal: ['ai']` in tsup config. If that fails, test with unbundled (`format: ['esm']` only). If still broken: **abort** — the build system is incompatible. |
| Streaming doesn't deliver tokens incrementally | Response arrives as a single blob, or `useChat` never receives partial content | Verify `toUIMessageStreamResponse()` returns a `ReadableStream`. Check `Content-Type: text/event-stream` header. If the issue is `useChat` buffering: try `DefaultChatTransport` with explicit `api` URL. If streaming itself is broken in AI SDK 6.x: **abort**. |
| Middleware `transformParams` is never called | Context injection doesn't appear in the prompt sent to the LLM | Confirm `wrapLanguageModel` is applied correctly. Log inside `transformParams` to verify invocation. Check that the wrapped model is passed to `streamText`, not the original. If middleware API has changed from Context7 docs: **adjust** — check latest AI SDK source for correct middleware signature. |
| Vector search returns irrelevant results | Top-3 results have no semantic relationship to the query | Verify embedding model produces non-zero vectors. Check `cosineSimilarity` implementation (should return -1 to 1). If embeddings are all identical: the model may not be loading. If cosine similarity is correct but results are poor: **adjust** — try a different embedding model or increase corpus diversity. |
| WSL2-specific DTS worker crash | `tsup` hangs or crashes during `.d.ts` generation (known issue in this repo) | Use single tsup config (not array) as other packages do. Add `dts: { resolve: true }` or fall back to `dts: false` + separate `tsc --emitDeclarationOnly`. This is a **known workaround**, not a blocker. |
| AI SDK peer dependency conflicts with existing packages | pnpm install fails due to conflicting React versions or hoisting issues | Use `peerDependencies` (not `dependencies`) for `ai` and `@ai-sdk/react`. Add `.npmrc` overrides if needed. If conflicts are fundamental: **adjust** — isolate AI package with stricter peer dep ranges. |

**Decision framework:**
- All 4 spikes pass → **proceed** to Phase 1
- 1–2 spikes fail with known workarounds → **adjust** (document workarounds, re-estimate affected phases, proceed)
- Streaming or middleware fundamentally broken → **abort** (AI SDK 6.x is not viable; evaluate alternatives like raw SSE + fetch)

---

## 3. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| 3 entry points: `index`, `server`, `headless` | Match `@tour-kit/react` pattern with multiple tsup entries | Client code (`useChat`, components) must not import server-only modules (`streamText`, embeddings). Separate entry points enable tree-shaking and prevent "server-only" errors in Next.js App Router. |
| `ai` + `@ai-sdk/react` as peer dependencies | Not bundled into dist | Consumers likely already have AI SDK installed. Bundling would cause duplicate instances and version conflicts. Peer deps let pnpm hoist a single copy. |
| `@ai-sdk/provider` as dev dependency only | Types imported with `import type` | `LanguageModelV3Middleware` is a type-only import used in the server entry. No runtime code from `@ai-sdk/provider` is needed. |
| In-memory vector store (not external DB) | Array of `{ embedding: number[], document: string }` with linear cosine similarity scan | Phase 0 validates feasibility for < 500 docs. External adapters (Pinecone, pgvector) come in Phase 4 via `VectorStoreAdapter` interface. Linear scan is O(n) but n < 500 is fast enough (< 200ms target). |
| Spike code lives in `packages/ai/src/__spikes__/` | Throwaway, not exported | Keeps spike code out of the public API but inside the package so it builds with the same tsup config. Deleted after Phase 0. |
| Use `examples/next-app/` for browser verification | Existing Next.js app in the monorepo | No new example app needed. Add a temporary `/api/chat-spike` route and `/spike` page. Removed after Phase 0. |

---

## 4. Tasks

### Task 0.1 — Scaffold `packages/ai/` (1–2h)

Create the package skeleton with tsup config, tsconfig, and package.json. The build must produce 3 entry points (index, server, headless) with ESM + CJS + DTS.

**Files to create:**
- `packages/ai/package.json` — name `@tour-kit/ai`, type `module`, 3 export paths, peer deps for `react`, `ai`, `@ai-sdk/react`
- `packages/ai/tsconfig.json` — extends `../../tooling/tsconfig/react-library.json`
- `packages/ai/tsup.config.ts` — 3 entry points, externalize react + ai SDK packages
- `packages/ai/src/index.ts` — placeholder export
- `packages/ai/src/server/index.ts` — placeholder export
- `packages/ai/src/headless.ts` — placeholder export

**Verification:** `pnpm install && pnpm --filter @tour-kit/ai build` exits 0. `dist/` contains `index.js`, `index.cjs`, `server/index.js`, `server/index.cjs`, `headless.js`, `headless.cjs` plus `.d.ts` and `.d.cts` files.

### Task 0.2 — Spike: Streaming (1–2h)

Prove `streamText` + `toUIMessageStreamResponse` streams tokens to the browser via `useChat`.

**Server side:** Create a test route handler in `examples/next-app/src/app/api/chat-spike/route.ts` that uses `streamText` with a hardcoded system prompt and returns `result.toUIMessageStreamResponse()`.

**Client side:** Create a test page at `examples/next-app/src/app/spike/page.tsx` that uses `useChat` with `DefaultChatTransport` pointing at `/api/chat-spike`. Render messages with a simple `<pre>` tag.

**Verification:** Open `http://localhost:3000/spike`, send a message, observe tokens appearing one-by-one (not as a single blob). Check browser DevTools Network tab for `text/event-stream` content type.

### Task 0.3 — Spike: Middleware Composition (1–2h)

Prove `wrapLanguageModel` + `LanguageModelV3Middleware` with `transformParams` can inject context into the LLM prompt.

**Implementation:** In `packages/ai/src/__spikes__/middleware-spike.ts`, create a middleware that prepends `"[INJECTED CONTEXT: This is a test]"` to the last user message. Wrap a model with `wrapLanguageModel` and pass it to the route handler from Task 0.2.

**Verification:** The LLM response references or acknowledges the injected context. Console log inside `transformParams` confirms it was called. The middleware does not break streaming.

### Task 0.4 — Spike: In-Memory Vector Search (1h)

Prove `embedMany` + `embed` + `cosineSimilarity` can index and search a 50-document corpus in memory.

**Implementation:** In `packages/ai/src/__spikes__/vector-spike.ts`, create a script/test that:
1. Defines 50 short text documents about different topics (product features, billing, support, etc.)
2. Embeds all 50 with `embedMany`
3. Embeds a query with `embed`
4. Computes `cosineSimilarity` for each document
5. Returns top-3 sorted by similarity score

**Verification:** Top-3 results are semantically related to the query (not random). Search completes in < 200ms for 50 documents. Similarity scores are between -1 and 1.

### Task 0.5 — Go/No-Go Decision (0.5h)

Document results of all 4 spikes and make the proceed/adjust/abort decision.

**Output:** Create `plan/phase-0-status.json` with:
```json
{
  "date": "YYYY-MM-DD",
  "decision": "proceed | adjust | abort",
  "spikes": {
    "build": { "status": "pass | fail", "notes": "..." },
    "streaming": { "status": "pass | fail", "notes": "..." },
    "middleware": { "status": "pass | fail", "notes": "..." },
    "vectorSearch": { "status": "pass | fail", "notes": "..." }
  },
  "adjustments": [],
  "blockers": []
}
```

---

## 5. Deliverables

| Deliverable | Path | Lifetime |
|---|---|---|
| Package scaffold | `packages/ai/` (package.json, tsconfig.json, tsup.config.ts, placeholder sources) | Permanent — becomes the real package |
| Build output | `packages/ai/dist/` (3 entry points, ESM + CJS + DTS) | Permanent |
| Streaming spike | `examples/next-app/src/app/api/chat-spike/route.ts`, `examples/next-app/src/app/spike/page.tsx` | Temporary — delete after Phase 0 |
| Middleware spike | `packages/ai/src/__spikes__/middleware-spike.ts` | Temporary — delete after Phase 0 |
| Vector search spike | `packages/ai/src/__spikes__/vector-spike.ts` | Temporary — delete after Phase 0 |
| Decision document | `plan/phase-0-status.json` | Permanent — audit trail |

---

## 6. Exit Criteria

- [ ] `pnpm --filter @tour-kit/ai build` produces 3 entry points (`index`, `server/index`, `headless`) with ESM + CJS + DTS and no errors
- [ ] Streaming response renders token-by-token in browser (verified visually at `http://localhost:3000/spike`)
- [ ] Middleware `transformParams` is called and successfully injects context into the LLM prompt (verified via console log + LLM response content)
- [ ] In-memory vector search returns top-3 semantically relevant documents from a 50-document corpus in < 200ms
- [ ] `plan/phase-0-status.json` exists with a `decision` field set to `proceed`, `adjust`, or `abort`

---

## 7. Execution Prompt

> Paste this entire section into a fresh Claude Code session to implement Phase 0.

---

You are implementing **Phase 0 (Validation Gate)** for `@tour-kit/ai` — a drop-in RAG Q&A chat widget package in the tour-kit monorepo.

**Your goal:** Scaffold `packages/ai/`, run 3 technical spikes (streaming, middleware, vector search), and produce a go/no-go decision. This is throwaway validation code — correctness matters, polish does not.

### Monorepo Context

- **Root:** `/mnt/c/Users/domi/Desktop/next-playground/tour-kit/`
- **Package manager:** pnpm (workspace), Turborepo for build orchestration
- **Build tool:** tsup (ESM + CJS + DTS)
- **TypeScript config:** all packages extend `../../tooling/tsconfig/react-library.json`
- **Existing Next.js example app:** `examples/next-app/` (App Router)
- **Known WSL2 issue:** Use single tsup config object (not array) to avoid DTS worker crashes

### What to Measure

For each spike, measure and record:

1. **Build (Task 0.1):** Does `pnpm --filter @tour-kit/ai build` exit 0? Does `dist/` contain all 6 JS files + 6 DTS files?
2. **Streaming (Task 0.2):** Do tokens appear incrementally in the browser? Is the response content type `text/event-stream`?
3. **Middleware (Task 0.3):** Is `transformParams` called? Does the injected context appear in the LLM response?
4. **Vector Search (Task 0.4):** Are the top-3 results semantically relevant? Is search time < 200ms for 50 documents?

### How to Run the Experiment

#### Step 1: Scaffold `packages/ai/`

Create `packages/ai/package.json`:
```json
{
  "name": "@tour-kit/ai",
  "version": "0.0.0",
  "description": "AI-powered RAG Q&A chat widget for React apps",
  "author": "Tour Kit Team",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./server": {
      "import": {
        "types": "./dist/server/index.d.ts",
        "default": "./dist/server/index.js"
      },
      "require": {
        "types": "./dist/server/index.d.cts",
        "default": "./dist/server/index.cjs"
      }
    },
    "./headless": {
      "import": {
        "types": "./dist/headless.d.ts",
        "default": "./dist/headless.js"
      },
      "require": {
        "types": "./dist/headless.d.cts",
        "default": "./dist/headless.cjs"
      }
    },
    "./tailwind": {
      "import": {
        "types": "./dist/tailwind/index.d.ts",
        "default": "./dist/tailwind/index.js"
      },
      "require": {
        "types": "./dist/tailwind/index.d.cts",
        "default": "./dist/tailwind/index.cjs"
      }
    },
    "./styles.css": "./dist/styles/variables.css",
    "./styles/variables.css": "./dist/styles/variables.css",
    "./styles/components.css": "./dist/styles/components.css",
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md", "CHANGELOG.md", "styles"],
  "sideEffects": false,
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "ai": "^6.0.0",
    "@ai-sdk/react": "^2.0.0"
  },
  "devDependencies": {
    "@ai-sdk/provider": "^2.0.0",
    "@ai-sdk/react": "^2.0.0",
    "@ai-sdk/openai": "^2.0.0",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "ai": "^6.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

Create `packages/ai/tsconfig.json`:
```json
{
  "extends": "../../tooling/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Create `packages/ai/tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'server/index': 'src/server/index.ts',
    headless: 'src/headless.ts',
    'tailwind/index': 'src/tailwind/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'ai',
    '@ai-sdk/react',
    '@ai-sdk/provider',
    '@ai-sdk/openai',
    '@tour-kit/core',
  ],
  treeshake: true,
  splitting: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
})
```

Create `packages/ai/src/index.ts`:
```typescript
// @tour-kit/ai — client entry point
// Phase 0: placeholder exports for build validation

export const AI_PACKAGE_VERSION = '0.0.0' as const
```

Create `packages/ai/src/server/index.ts`:
```typescript
// @tour-kit/ai/server — server entry point
// Phase 0: placeholder exports for build validation

export const SERVER_ENTRY = true as const
```

Create `packages/ai/src/headless.ts`:
```typescript
// @tour-kit/ai/headless — headless entry point
// Phase 0: placeholder exports for build validation

export const HEADLESS_ENTRY = true as const
```

Run:
```bash
cd /mnt/c/Users/domi/Desktop/next-playground/tour-kit
pnpm install
pnpm --filter @tour-kit/ai build
```

Verify `packages/ai/dist/` contains: `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, `server/index.js`, `server/index.cjs`, `server/index.d.ts`, `server/index.d.cts`, `headless.js`, `headless.cjs`, `headless.d.ts`, `headless.d.cts`.

#### Step 2: Streaming Spike

Create `examples/next-app/src/app/api/chat-spike/route.ts`:
```typescript
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a helpful product assistant. Keep answers concise.',
    messages: convertToModelMessages(messages),
    maxTokens: 500,
  })

  return result.toUIMessageStreamResponse()
}
```

Create `examples/next-app/src/app/spike/page.tsx`:
```tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const transport = new DefaultChatTransport({ api: '/api/chat-spike' })

export default function SpikePage() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    transport,
  })

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Phase 0 — Streaming Spike</h1>
      <p>Status: {status}</p>

      <div style={{ border: '1px solid #ccc', padding: '1rem', minHeight: 200, marginBottom: '1rem' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{m.role}:</strong>
            {m.parts.map((part, i) =>
              part.type === 'text' ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" disabled={status === 'streaming'}>
          Send
        </button>
      </form>
    </div>
  )
}
```

Run:
```bash
# Ensure OPENAI_API_KEY is set in examples/next-app/.env.local
cd /mnt/c/Users/domi/Desktop/next-playground/tour-kit
pnpm --filter next-app dev
```

Open `http://localhost:3000/spike`. Send "What is TypeScript?" and verify tokens appear incrementally.

#### Step 3: Middleware Spike

Create `packages/ai/src/__spikes__/middleware-spike.ts`:
```typescript
import type { LanguageModelV3Middleware } from '@ai-sdk/provider'

/**
 * Test middleware that injects a static context string into the last user message.
 * This validates that wrapLanguageModel + transformParams works in our build system.
 */
export const testRagMiddleware: LanguageModelV3Middleware = {
  transformParams: async ({ params }) => {
    console.log('[middleware-spike] transformParams called')

    const lastUserMessage = params.prompt.findLast(
      (msg) => msg.role === 'user'
    )

    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      console.log('[middleware-spike] No user message found, skipping injection')
      return params
    }

    // Inject test context as a text part at the beginning of the last user message
    const injectedContext = {
      type: 'text' as const,
      text: '\n\n[INJECTED CONTEXT FROM MIDDLEWARE]\nProduct name: Tour Kit\nVersion: 0.4.1\nDescription: A headless onboarding and product tour library for React.\nFeatures: Step-by-step tours, hints, checklists, announcements.\n[END INJECTED CONTEXT]\n\nPlease reference the above context in your response.',
    }

    return {
      ...params,
      prompt: params.prompt.map((msg) => {
        if (msg === lastUserMessage && msg.role === 'user') {
          return {
            ...msg,
            content: [injectedContext, ...msg.content],
          }
        }
        return msg
      }),
    }
  },
}
```

Update `examples/next-app/src/app/api/chat-spike/route.ts` to use the middleware:
```typescript
import { convertToModelMessages, streamText, wrapLanguageModel, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { testRagMiddleware } from '@tour-kit/ai/__spikes__/middleware-spike'
// NOTE: If the import above doesn't resolve (since __spikes__ isn't exported),
// copy the middleware inline or add a temporary export from the server entry.
// Alternative: import directly via relative path:
// import { testRagMiddleware } from '../../../../packages/ai/src/__spikes__/middleware-spike'

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const wrappedModel = wrapLanguageModel({
    model: openai('gpt-4o-mini'),
    middleware: testRagMiddleware,
  })

  const result = streamText({
    model: wrappedModel,
    system: 'You are a helpful product assistant. Always reference any injected context you receive.',
    messages: convertToModelMessages(messages),
    maxTokens: 500,
  })

  return result.toUIMessageStreamResponse()
}
```

Run the Next.js dev server and send "Tell me about this product" at `http://localhost:3000/spike`. Verify:
1. Console logs `[middleware-spike] transformParams called`
2. LLM response mentions "Tour Kit", "0.4.1", or "headless onboarding" (proving context was injected)
3. Streaming still works token-by-token (middleware doesn't break streaming)

#### Step 4: Vector Search Spike

Create `packages/ai/src/__spikes__/vector-spike.ts`:
```typescript
import { cosineSimilarity, embed, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'

/** 50 test documents covering diverse product topics */
const TEST_DOCUMENTS = [
  'Tour Kit is a headless onboarding library for React applications.',
  'The useTour hook manages tour lifecycle including start, stop, and navigation.',
  'Steps can be configured with custom content, placement, and spotlighting.',
  'The TourProvider component wraps your app and manages tour state.',
  'Hints are small beacons that draw attention to UI elements.',
  'Checklists help users track onboarding progress with task dependencies.',
  'The analytics package supports plugin-based event tracking.',
  'Announcements can be displayed as modals, banners, toasts, or slideouts.',
  'The media package supports YouTube, Vimeo, Loom, and Wistia embeds.',
  'Scheduling allows time-based content delivery with timezone support.',
  'Installation requires pnpm add @tour-kit/core @tour-kit/react.',
  'TypeScript strict mode is enabled across all packages.',
  'Bundle size budgets: core < 8KB, react < 12KB gzipped.',
  'WCAG 2.1 AA accessibility compliance is a core requirement.',
  'The spotlight effect highlights target elements during tours.',
  'Keyboard navigation supports Escape to close and Tab for focus.',
  'CSS custom properties allow theming without Tailwind CSS.',
  'The headless API exposes render props for custom component styling.',
  'Tour branching allows conditional step navigation based on user choices.',
  'Persistence stores tour progress in localStorage or custom adapters.',
  'The useStep hook provides current step data and navigation methods.',
  'Focus trapping keeps keyboard focus within the active tour step.',
  'Animations use CSS transitions respecting prefers-reduced-motion.',
  'The createTour utility validates and normalizes tour configuration.',
  'Multiple tours can be registered and triggered by ID.',
  'Tour events include onStart, onComplete, onStepChange, and onDismiss.',
  'The overlay component dims the background during active tours.',
  'Progress indicators show completion percentage during tours.',
  'The close button component handles tour dismissal with cleanup.',
  'Route change detection pauses tours during navigation.',
  'The TourCard component renders step content with navigation controls.',
  'Floating UI handles tooltip positioning and collision detection.',
  'The throttle utility prevents excessive event handler calls.',
  'Changeset-based versioning manages package releases.',
  'The monorepo uses Turborepo for build orchestration.',
  'ESM and CJS dual format builds are generated by tsup.',
  'React 18 and 19 are both supported via peer dependencies.',
  'The adoption package tracks feature usage and triggers nudges.',
  'Rate limiting prevents API abuse in server-side handlers.',
  'The system prompt is assembled from three layers: defaults, config, custom.',
  'CAG (context-augmented generation) stuffs all docs into the system prompt.',
  'RAG retrieval uses cosine similarity to find relevant document chunks.',
  'Vector stores can be in-memory or external (Pinecone, pgvector).',
  'The markdown renderer produces React elements without dangerouslySetInnerHTML.',
  'Suggestion chips provide quick follow-up questions after AI responses.',
  'Chat persistence survives page reload via localStorage adapter.',
  'The beforeSend hook allows filtering user messages before processing.',
  'Error boundaries catch and display rendering failures gracefully.',
  'The AI chat panel supports slideout, popover, and inline display modes.',
  'Token streaming uses Server-Sent Events for real-time delivery.',
]

/**
 * Run the vector search spike.
 * Usage: npx tsx packages/ai/src/__spikes__/vector-spike.ts
 * Requires: OPENAI_API_KEY environment variable
 */
export async function runVectorSearchSpike(query: string) {
  const embeddingModel = openai.embedding('text-embedding-3-small')

  console.log(`[vector-spike] Embedding ${TEST_DOCUMENTS.length} documents...`)
  const startEmbed = performance.now()

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: TEST_DOCUMENTS,
  })

  const embedTime = performance.now() - startEmbed
  console.log(`[vector-spike] Embedding took ${embedTime.toFixed(0)}ms`)

  // Build in-memory store
  const db = TEST_DOCUMENTS.map((doc, i) => ({
    document: doc,
    embedding: embeddings[i],
  }))

  console.log(`[vector-spike] Searching for: "${query}"`)
  const startSearch = performance.now()

  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  })

  const results = db
    .map((item) => ({
      document: item.document,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)

  const searchTime = performance.now() - startSearch
  console.log(`[vector-spike] Search took ${searchTime.toFixed(0)}ms`)

  console.log('\n[vector-spike] Top 3 results:')
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.similarity.toFixed(4)}] ${r.document}`)
  })

  return { results, searchTime, embedTime }
}

// Run if executed directly
const query = process.argv[2] || 'How do I install the library?'
runVectorSearchSpike(query).catch(console.error)
```

Run:
```bash
cd /mnt/c/Users/domi/Desktop/next-playground/tour-kit
OPENAI_API_KEY=your-key npx tsx packages/ai/src/__spikes__/vector-spike.ts "How do I install the library?"
```

Verify:
1. Top-3 results relate to installation (e.g., the "Installation requires pnpm add..." document)
2. Similarity scores are between -1 and 1
3. Search time (excluding embedding API call) is < 200ms for 50 documents

Try additional queries to validate:
```bash
npx tsx packages/ai/src/__spikes__/vector-spike.ts "What accessibility features are supported?"
npx tsx packages/ai/src/__spikes__/vector-spike.ts "How does the analytics tracking work?"
```

#### Step 5: Record Decision

After all 4 spikes, create `plan/phase-0-status.json`:
```json
{
  "date": "YYYY-MM-DD",
  "decision": "proceed",
  "spikes": {
    "build": {
      "status": "pass",
      "notes": "tsup produced all 3 entry points with ESM + CJS + DTS. No resolution errors."
    },
    "streaming": {
      "status": "pass",
      "notes": "Tokens render incrementally via useChat + DefaultChatTransport. Content-Type is text/event-stream."
    },
    "middleware": {
      "status": "pass",
      "notes": "transformParams called successfully. Injected context appeared in LLM response. Streaming unaffected."
    },
    "vectorSearch": {
      "status": "pass",
      "notes": "Top-3 results semantically relevant. Search time Xms for 50 docs. Cosine similarity scores in valid range."
    }
  },
  "adjustments": [],
  "blockers": []
}
```

Update the `status` and `notes` fields with actual results. If any spike fails, set `decision` to `"adjust"` or `"abort"` and document the failure in `blockers`.

### Go/No-Go Decision

| Outcome | Criteria | Action |
|---|---|---|
| **Proceed** | All 4 spikes pass | Move to Phase 1. Keep scaffold, delete spike files and temporary routes. |
| **Adjust** | 1–2 spikes fail with known workarounds | Document workarounds in `adjustments`. Re-estimate affected phase hours. Proceed with caution. |
| **Abort** | Streaming or middleware fundamentally broken | Stop. Evaluate alternatives (raw SSE, different AI framework). Update `plan/ai-package-plan.md` with findings. |

### Cleanup After Decision

If decision is `proceed` or `adjust`:
1. Delete `packages/ai/src/__spikes__/` directory
2. Delete `examples/next-app/src/app/api/chat-spike/` directory
3. Delete `examples/next-app/src/app/spike/` directory
4. Keep `packages/ai/` scaffold (it becomes the real package in Phase 1)
5. Commit `plan/phase-0-status.json`

---

## Readiness Check

Before starting Phase 0, confirm:

- [ ] `OPENAI_API_KEY` is available (set in environment or `examples/next-app/.env.local`)
- [ ] `pnpm install` runs successfully at the monorepo root
- [ ] `pnpm build` completes for all existing packages (no pre-existing build failures)
- [ ] `examples/next-app/` starts with `pnpm --filter next-app dev` (Next.js dev server works)
- [ ] Node.js >= 18 is installed (required for AI SDK 6.x)
- [ ] The `ai-package-plan.md` and `ai-package-spec.md` files in `plan/` have been reviewed
- [ ] You understand that Phase 0 output is throwaway — only the scaffold and decision document persist
