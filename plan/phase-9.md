# Phase 9 — Documentation + Examples + Final Quality

**Duration:** Days 30–33 (~15h)
**Depends on:** All phases (1–8)
**Blocks:** Nothing (final phase before release)
**Risk Level:** LOW — no new architecture, primarily content creation and verification
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Ship-ready quality gate. The `@tour-kit/ai` package gets comprehensive documentation in the existing Fumadocs site, working example integrations in both the Vite and Next.js example apps, test coverage above 80%, bundle sizes within budget, and zero SSR/hydration issues.

**Success looks like:**

- A developer finds `apps/docs/content/docs/ai/` and can go from zero to working AI chat in under 30 minutes using only the docs
- Both example apps (`examples/vite-app/`, `examples/next-app/`) have working AI chat pages that build without errors
- `vitest --coverage` reports > 80% line coverage for all files in `packages/ai/src/`
- `size-limit` passes: client entry < 15KB, server entry < 8KB, markdown renderer < 3KB (gzipped)
- `pnpm build` succeeds across the entire monorepo with zero TypeScript errors
- The Next.js example app has zero hydration errors (SSR safety verified)

---

## 2. Key Design Decisions

### 2.1 Documentation structure

Follow the established pattern from other packages (`analytics/`, `checklists/`, `media/`). Each package has a directory under `apps/docs/content/docs/` with:

- `index.mdx` — overview + quick start
- Topic pages — one per major concept
- `meta.json` — navigation ordering + icon

The AI package documentation should cover both standalone usage (CAG) and tour-kit-integrated usage (RAG + tour context), since these are two distinct user journeys.

### 2.2 Example app strategy

- **Vite app** — standalone CAG chat (no `@tour-kit/core` dependency). Demonstrates the simplest integration path. Uses a Vite proxy or mock server to handle the chat API route.
- **Next.js app** — full RAG chat with tour-kit integration. Demonstrates `createChatRouteHandler()` as a Next.js API route, `useTourAssistant()` inside a `TourProvider`, and the complete data flow.

### 2.3 Bundle size measurement

Use `size-limit` with the existing monorepo configuration pattern. Three separate checks for the three entry points:

| Entry | Budget | What it measures |
|-------|--------|-----------------|
| `@tour-kit/ai` (index) | < 15KB gzipped | Client code: provider, hooks, components, styles |
| `@tour-kit/ai/server` | < 8KB gzipped | Server code: route handler, RAG middleware, system prompt |
| Markdown renderer | < 3KB gzipped | `core/markdown-renderer.tsx` standalone |

### 2.4 SSR safety

The server entry point (`packages/ai/src/server/`) must never reference `window`, `document`, `localStorage`, or other browser-only APIs. The client entry point must guard any browser API access with `typeof window !== 'undefined'` checks. Verify by:
1. Grepping for browser globals in server files
2. Building the Next.js example app (SSR build will crash on unguarded browser APIs)
3. Running the Next.js example app and checking for hydration mismatch warnings

---

## 3. Tasks

### 3.1 CLAUDE.md for `packages/ai/` (1h)

**File:** `packages/ai/CLAUDE.md` (new)

Follow the established pattern from other packages (see `packages/core/CLAUDE.md`, `packages/analytics/CLAUDE.md`). Include:

- Package overview (drop-in RAG Q&A chat widget, standalone or with tour-kit integration)
- Key architectural decisions: AI SDK 6.x wrapping, three context strategies (CAG/RAG in-memory/RAG external), optional `@tour-kit/core` peer dependency, three entry points (index/server/headless)
- Module layout summary
- Gotchas: optional peer dep pattern, SSR safety, `useChat` wrapper strategy, system prompt layering
- Commands: `build`, `typecheck`, `test`, `test --coverage`
- Related rules: `rules/hooks.md`, `rules/components.md`, `rules/accessibility.md`

### 3.2 Documentation pages — Fumadocs MDX (4–5h)

**Directory:** `apps/docs/content/docs/ai/` (new)

Create the following pages:

**`meta.json`:**
```json
{
  "title": "@tour-kit/ai",
  "icon": "Bot",
  "pages": ["index", "quick-start", "cag-guide", "rag-guide", "tour-integration", "components", "api-reference"]
}
```

**`index.mdx` — Overview (1h):**
- What `@tour-kit/ai` is and when to use it
- Three context strategies with decision table (CAG vs RAG in-memory vs RAG external)
- Architecture diagram (simplified from spec)
- Link to quick start

**`quick-start.mdx` — Quick Start (0.5h):**
- Install command (`pnpm add @tour-kit/ai`)
- Minimal CAG setup: `AiChatProvider` + `AiChatPanel` + `AiChatBubble` client-side
- `createChatRouteHandler()` server-side (Next.js App Router)
- Working code in under 30 lines

**`cag-guide.mdx` — Context-Augmented Generation Guide (1h):**
- When to use CAG (< 50K tokens of content)
- Preparing documents: `Document[]` format, metadata, tags
- `createChatRouteHandler()` with `strategy: 'context-stuffing'`
- System prompt customization: `instructions`, `tone`, `boundaries`
- Example with product FAQ

**`rag-guide.mdx` — Retrieval-Augmented Generation Guide (1h):**
- When to use RAG (50K+ tokens, 500+ documents)
- Setting up embedding: `createAiSdkEmbedding()`
- In-memory vector store: `createInMemoryVectorStore()`
- RAG middleware: `createRAGMiddleware()`
- Custom `VectorStoreAdapter` for external stores (Pinecone, pgvector)
- Chunking strategy configuration

**`tour-integration.mdx` — Tour-Kit Integration (0.5h):**
- When to use `useTourAssistant()` vs `useAiChat()`
- Setting up `tourContext: true` with `TourKitProvider`
- `askAboutStep()` and `askForHelp()` usage
- How tour context appears in the system prompt
- Fallback behavior when `@tour-kit/core` is not installed

**`components.mdx` — Component Reference (0.5h):**
- `AiChatPanel` — modes (slideout, popover, inline), props
- `AiChatBubble` — trigger button, unread count
- `AiChatMessage` — message rendering, markdown, rating
- `AiChatInput` — text input, keyboard shortcuts
- `AiChatSuggestions` — suggestion chips
- Headless variants overview

**`api-reference.mdx` — API Reference (0.5h):**
- All exported hooks with full type signatures
- All exported components with props tables
- Server exports with options tables
- Type definitions: `AiChatConfig`, `Document`, `VectorStoreAdapter`, etc.

Also update `apps/docs/content/docs/meta.json` to include the `ai` section in the navigation order.

### 3.3 Example: standalone CAG chat in Vite app (2h)

**Files:**
- `examples/vite-app/src/pages/AiChatPage.tsx` (new)
- `examples/vite-app/src/mocks/chat-handler.ts` (new — mock server for Vite)

Implement a standalone CAG chat page:

```tsx
// AiChatPage.tsx — simplified structure
import { AiChatProvider, AiChatPanel, AiChatBubble } from '@tour-kit/ai'

const FAQ_DOCS = [
  { id: 'pricing', content: 'Our Pro plan is $29/mo...', metadata: { title: 'Pricing' } },
  { id: 'export', content: 'To export data, go to Settings > Export...', metadata: { title: 'Data Export' } },
  // ... 5-10 FAQ documents
]

export function AiChatPage() {
  return (
    <AiChatProvider config={{
      endpoint: '/api/chat',
      suggestions: { static: ['What plans are available?', 'How do I export?'] },
    }}>
      <div className="p-8">
        <h1>AI Help Chat (Standalone)</h1>
        <p>Click the chat bubble to ask questions about our product.</p>
      </div>
      <AiChatBubble />
      <AiChatPanel mode="slideout" />
    </AiChatProvider>
  )
}
```

For Vite, either:
- Use a Vite dev server proxy to a mock endpoint
- Create a simple Express server (in `examples/vite-app/server.ts`) that uses `createChatRouteHandler()`
- Or use MSW (Mock Service Worker) to intercept the API call for demo purposes

Add the page to the Vite app's router.

### 3.4 Example: RAG chat with tour-kit integration in Next.js app (2–3h)

**Files:**
- `examples/next-app/src/app/ai-chat/page.tsx` (new)
- `examples/next-app/src/app/api/chat/route.ts` (new)

**Client page:**

```tsx
// page.tsx
'use client'
import { TourKitProvider } from '@tour-kit/core'
import { AiChatProvider, AiChatPanel, AiChatBubble } from '@tour-kit/ai'
import { useTourAssistant } from '@tour-kit/ai'

export default function AiChatPage() {
  return (
    <TourKitProvider config={tourConfig}>
      <AiChatProvider config={{
        endpoint: '/api/chat',
        tourContext: true,
        suggestions: { static: ['How do I get started?'], dynamic: true },
        persistence: 'local',
      }}>
        <PageContent />
        <AiChatBubble />
        <AiChatPanel mode="slideout" />
      </AiChatProvider>
    </TourKitProvider>
  )
}

function PageContent() {
  const { tourContext, askAboutStep, askForHelp } = useTourAssistant()

  return (
    <div className="p-8">
      <h1>AI Chat with Tour Integration</h1>
      {tourContext.activeTour && (
        <div>
          <p>Current tour: {tourContext.activeTour.name} (step {tourContext.activeTour.currentStep + 1}/{tourContext.activeTour.totalSteps})</p>
          <button onClick={askAboutStep}>Ask about this step</button>
          <button onClick={() => askForHelp('navigation')}>Help with navigation</button>
        </div>
      )}
    </div>
  )
}
```

**API route:**

```typescript
// route.ts
import { createChatRouteHandler } from '@tour-kit/ai/server'
import { openai } from '@ai-sdk/openai'

const handler = createChatRouteHandler({
  model: openai('gpt-4o-mini'),
  context: {
    strategy: 'rag',
    documents: productDocs,
    embedding: createAiSdkEmbedding(openai.embedding('text-embedding-3-small')),
  },
  instructions: {
    productName: 'Tour Kit Demo',
    tone: 'friendly',
    boundaries: ['Only answer questions about Tour Kit and its features'],
  },
  rateLimit: { maxRequests: 20, windowMs: 60000 },
})

export const POST = handler
```

Add `.env.example` entries for `OPENAI_API_KEY` in the Next.js example app.

### 3.5 Fill test coverage gaps to > 80% (3–4h)

Run coverage report:

```bash
pnpm --filter @tour-kit/ai test -- --coverage
```

Identify files below 80% line coverage. Priority order for gap-filling:

1. **`hooks/`** — `use-ai-chat.ts`, `use-tour-assistant.ts`, `use-suggestions.ts`, `use-persistence.ts`
2. **`server/`** — `route-handler.ts`, `system-prompt.ts`, `rag-middleware.ts`, `retriever.ts`
3. **`core/`** — `markdown-renderer.tsx`, `suggestion-engine.ts`, `rate-limiter.ts`
4. **`components/`** — styled and headless components (render + interaction tests)
5. **`context/`** — `ai-chat-provider.tsx`

For each file below 80%, add tests for uncovered branches:
- Error paths (network failures, invalid config)
- Edge cases (empty documents, null values, missing optional fields)
- Boundary conditions (rate limit threshold, empty message, max length)

### 3.6 Bundle size verification (1h)

**File:** `packages/ai/.size-limit.json` (new) or add to existing monorepo `size-limit` config

```json
[
  {
    "name": "@tour-kit/ai (client)",
    "path": "dist/index.mjs",
    "limit": "15 kB",
    "gzip": true
  },
  {
    "name": "@tour-kit/ai (server)",
    "path": "dist/server.mjs",
    "limit": "8 kB",
    "gzip": true
  },
  {
    "name": "@tour-kit/ai (markdown)",
    "path": "dist/markdown-renderer.mjs",
    "limit": "3 kB",
    "gzip": true,
    "import": "{ MarkdownRenderer }"
  }
]
```

Run:
```bash
pnpm --filter @tour-kit/ai size-limit
```

If any entry exceeds budget:
- Check for accidental imports pulling in large dependencies
- Verify server code is not leaking into the client entry
- Ensure `react-markdown` or similar heavy libs are not bundled (use built-in renderer)
- Check that `@ai-sdk/react` is marked as a peer dependency (not bundled)

### 3.7 SSR safety check (1h)

**Step 1:** Grep for browser globals in server files:

```bash
grep -rn "window\|document\|localStorage\|sessionStorage\|navigator\|location\b" packages/ai/src/server/
```

Any matches must be removed or guarded.

**Step 2:** Grep for unguarded browser globals in client files:

```bash
grep -rn "window\.\|document\.\|localStorage\.\|sessionStorage\." packages/ai/src/ --include="*.ts" --include="*.tsx" | grep -v "typeof window" | grep -v "__tests__" | grep -v "server/"
```

Any matches must be wrapped in `typeof window !== 'undefined'` checks.

**Step 3:** Build and start the Next.js example app:

```bash
pnpm --filter next-app build
pnpm --filter next-app start
```

Open the AI chat page. Check browser console for:
- Hydration mismatch warnings
- "window is not defined" errors
- "document is not defined" errors

### 3.8 Changeset + README (1h)

**File:** `packages/ai/README.md` (new)

Standard README with:
- Package description (1 paragraph)
- Install command
- Quick start code (CAG, 15 lines)
- Link to full documentation
- Feature list (bullet points)
- License

**Verify `package.json` `files` array** includes `["dist", "README.md", "CHANGELOG.md", "styles"]` — matching the pattern from all other tour-kit packages. `CHANGELOG.md` is auto-generated by changesets on version bump, but must be listed in `files` to be included in the published package.

**Changeset:**

```bash
pnpm changeset
```

Select `@tour-kit/ai` with `minor` version bump. Message:

```
feat(ai): add @tour-kit/ai package — drop-in RAG Q&A chat widget for React

- CAG and RAG context strategies for document-grounded AI chat
- shadcn-style components with headless variants
- Built-in lightweight markdown renderer
- Optional tour-kit integration via useTourAssistant hook
- Server-side route handler for Next.js App Router
- Client and server rate limiting
- Chat persistence (localStorage or custom adapter)
- WCAG 2.1 AA accessible
```

---

## 4. Deliverables

| File/Directory | Type | Description |
|---|---|---|
| `packages/ai/CLAUDE.md` | New | Package-specific dev guidance for Claude Code |
| `packages/ai/README.md` | New | Public-facing README with install + quick start |
| `apps/docs/content/docs/ai/` | New directory | 7 MDX pages + `meta.json` |
| `apps/docs/content/docs/meta.json` | Modified | Add `ai` to navigation ordering |
| `examples/vite-app/src/pages/AiChatPage.tsx` | New | Standalone CAG chat example |
| `examples/next-app/src/app/ai-chat/page.tsx` | New | RAG + tour integration example |
| `examples/next-app/src/app/api/chat/route.ts` | New | Next.js API route handler |
| `examples/next-app/.env.example` | Modified | Add `OPENAI_API_KEY` |
| `packages/ai/src/__tests__/**` | New/Modified | Additional tests to reach > 80% coverage |
| `packages/ai/.size-limit.json` | New | Bundle size budget configuration |
| `.changeset/*.md` | New | Changeset for release |

---

## 5. Exit Criteria

- [ ] `packages/ai/CLAUDE.md` exists and follows the established pattern from other packages
- [ ] `apps/docs/content/docs/ai/` contains: `meta.json`, `index.mdx`, `quick-start.mdx`, `cag-guide.mdx`, `rag-guide.mdx`, `tour-integration.mdx`, `components.mdx`, `api-reference.mdx`
- [ ] `apps/docs/content/docs/meta.json` includes the `ai` section
- [ ] Docs site builds without errors: `pnpm --filter docs build`
- [ ] Vite example app builds with AI chat page: `pnpm --filter vite-app build`
- [ ] Next.js example app builds with AI chat page and API route: `pnpm --filter next-app build`
- [ ] `vitest --coverage` reports > 80% line coverage for `packages/ai/src/`
- [ ] `size-limit` passes all three budgets: client < 15KB, server < 8KB, markdown < 3KB (gzipped)
- [ ] `pnpm build` succeeds across the entire monorepo with zero TypeScript errors
- [ ] No hydration errors in the Next.js example app's AI chat page
- [ ] No `window`/`document`/`localStorage` references in `packages/ai/src/server/` files
- [ ] `packages/ai/README.md` exists with install instructions and quick start
- [ ] Changeset is created for `@tour-kit/ai` minor release
- [ ] `packages/ai/package.json` `files` array includes `["dist", "README.md", "CHANGELOG.md", "styles"]`
- [ ] `packages/ai/package.json` exports include `./tailwind` entry point (matching other UI packages)

---

## 6. Execution Prompt

You are implementing Phase 9 of the `@tour-kit/ai` package: **Documentation + Examples + Final Quality**. This is the final phase before release. All feature code (Phases 1–8) is complete.

### Context

- **Monorepo:** pnpm + Turborepo at `/tour-kit/`
- **Package:** `packages/ai/` — drop-in RAG Q&A chat widget for React
- **Docs site:** `apps/docs/` — Fumadocs with MDX, dev server at `pnpm --filter docs dev`
- **Example apps:** `examples/vite-app/`, `examples/next-app/`
- **Test runner:** Vitest with `@testing-library/react`
- **Bundle checker:** `size-limit`

### Documentation conventions (Fumadocs)

Every MDX page needs frontmatter:
```mdx
---
title: Page Title
description: One-line description
---
```

Each directory needs `meta.json` for navigation:
```json
{
  "title": "@tour-kit/ai",
  "icon": "Bot",
  "pages": ["index", "quick-start", ...]
}
```

Use code blocks with language hints for syntax highlighting. Use relative links for internal navigation.

Reference existing docs for style: `apps/docs/content/docs/analytics/`, `apps/docs/content/docs/checklists/`.

### Task execution order

Execute in this order (dependencies flow downward):

1. **CLAUDE.md** (no dependencies)
2. **Documentation pages** (no code dependencies, just knowledge of the API)
3. **Vite example** (depends on understanding the API)
4. **Next.js example** (depends on understanding the API + server exports)
5. **Test coverage gaps** (depends on all feature code being final)
6. **Bundle size verification** (depends on build being stable)
7. **SSR safety check** (depends on Next.js example existing)
8. **Changeset + README** (last — captures everything)

### File-by-file implementation guide

**1. `packages/ai/CLAUDE.md`** — New file. Follow the pattern from `packages/core/CLAUDE.md`:
- Overview paragraph
- Key architectural decisions (4–5 bullets with explanations)
- Module layout (`src/types/`, `src/context/`, `src/hooks/`, `src/components/`, `src/server/`, `src/core/`, `src/lib/`)
- Gotchas section (optional peer dep, SSR, `useChat` wrapping, three entry points)
- Commands section (`build`, `typecheck`, `test`, `test --coverage`)
- Related rules

**2. `apps/docs/content/docs/ai/meta.json`** — New file:
```json
{
  "title": "@tour-kit/ai",
  "icon": "Bot",
  "pages": ["index", "quick-start", "cag-guide", "rag-guide", "tour-integration", "components", "api-reference"]
}
```

**3. `apps/docs/content/docs/ai/index.mdx`** — Overview page:
- What the package does (2–3 paragraphs)
- Decision table: when to use CAG vs RAG
- Simplified architecture diagram (text-based, no mermaid)
- Installation: `pnpm add @tour-kit/ai`
- Links to quick start and guides

**4. `apps/docs/content/docs/ai/quick-start.mdx`** — Minimal setup:
- Client: `AiChatProvider` + `AiChatPanel` + `AiChatBubble` (10 lines)
- Server: `createChatRouteHandler()` with CAG (10 lines)
- "You now have a working AI chat" — done in 20 lines

**5. `apps/docs/content/docs/ai/cag-guide.mdx`** — Deep dive on CAG:
- Preparing documents (`Document[]` interface)
- System prompt customization (`instructions`, `tone`, `boundaries`)
- Custom strings (`AiChatStrings`)
- Full working example with FAQ docs

**6. `apps/docs/content/docs/ai/rag-guide.mdx`** — Deep dive on RAG:
- Setting up embedding adapter
- In-memory vector store
- RAG middleware with `wrapLanguageModel`
- Custom `VectorStoreAdapter` interface
- Chunking and `topK`/`minScore` tuning

**7. `apps/docs/content/docs/ai/tour-integration.mdx`** — Tour-kit integration:
- `useTourAssistant()` hook API
- `tourContext: true` config option
- `askAboutStep()` and `askForHelp()` usage
- How context flows to the LLM
- Graceful fallback when `@tour-kit/core` is not installed

**8. `apps/docs/content/docs/ai/components.mdx`** — Component reference:
- Props tables for each component
- Mode options for `AiChatPanel`
- Headless variants with render props
- Styling with CSS variables
- Accessibility features

**9. `apps/docs/content/docs/ai/api-reference.mdx`** — Complete API:
- All hook signatures with return types
- All server function signatures with options
- Type definitions (full interfaces)
- Events list

**10. `apps/docs/content/docs/meta.json`** — Add `"ai"` to the pages array, after existing packages.

**11. `examples/vite-app/src/pages/AiChatPage.tsx`** — Standalone CAG page:
- Self-contained with inline FAQ documents
- Uses `AiChatProvider`, `AiChatPanel`, `AiChatBubble`
- Add route to the Vite app's router

**12. `examples/next-app/src/app/ai-chat/page.tsx`** — Tour-integrated page:
- `'use client'` directive
- Wraps in `TourKitProvider` + `AiChatProvider`
- Uses `useTourAssistant()` to show context and convenience buttons
- Links to `/api/chat` route

**13. `examples/next-app/src/app/api/chat/route.ts`** — API route:
- Uses `createChatRouteHandler()` with RAG strategy
- Reads `OPENAI_API_KEY` from env
- Includes `instructions` config

**14. Test coverage** — Run `pnpm --filter @tour-kit/ai test -- --coverage`, identify files below 80%, add targeted tests for uncovered branches.

**15. `packages/ai/.size-limit.json`** — Bundle size config with three entries (client, server, markdown). Run `pnpm --filter @tour-kit/ai size-limit` to verify.

**16. SSR check** — Grep for unguarded browser globals, build and run Next.js app, verify zero hydration errors.

**17. `packages/ai/README.md`** — Standard package README.

**18. Changeset** — `pnpm changeset`, select `@tour-kit/ai`, minor bump, descriptive message.

### Commands to verify

```bash
# Full monorepo build
pnpm build

# Docs site
pnpm --filter docs build

# Example apps
pnpm --filter vite-app build
pnpm --filter next-app build

# Test coverage
pnpm --filter @tour-kit/ai test -- --coverage

# Bundle size
pnpm --filter @tour-kit/ai size-limit

# Type check everything
pnpm typecheck

# SSR safety — grep server files for browser globals
grep -rn "window\|document\|localStorage\|sessionStorage" packages/ai/src/server/
```

### Acceptance checks

After implementation, verify all exit criteria:
1. Docs build: `pnpm --filter docs build` — zero errors
2. Both examples build: `pnpm --filter vite-app build && pnpm --filter next-app build`
3. Coverage: `pnpm --filter @tour-kit/ai test -- --coverage` reports > 80%
4. Bundle: `pnpm --filter @tour-kit/ai size-limit` — all three pass
5. Full build: `pnpm build` — zero TypeScript errors
6. SSR: `pnpm --filter next-app build` — no hydration warnings in output
7. Changeset exists in `.changeset/` directory

---

## Readiness Check

Before starting Phase 9, confirm:

- [ ] All feature phases (1–8) are complete and passing
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with three entry points (index, server, headless)
- [ ] `pnpm --filter @tour-kit/ai test` passes all existing tests
- [ ] `pnpm --filter @tour-kit/ai typecheck` passes
- [ ] The docs site runs locally: `pnpm --filter docs dev`
- [ ] Both example apps run locally: `pnpm --filter vite-app dev`, `pnpm --filter next-app dev`
- [ ] You have read `apps/docs/content/docs/analytics/` or `apps/docs/content/docs/checklists/` to understand the documentation pattern
- [ ] You have read `apps/docs/content/docs/meta.json` to understand the navigation structure
- [ ] `size-limit` is available: `pnpm --filter @tour-kit/ai size-limit --help` (install if needed: `pnpm --filter @tour-kit/ai add -D size-limit @size-limit/preset-small-lib`)
