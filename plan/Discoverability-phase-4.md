# Discoverability Phase 4 — Docs REST API + OpenAPI Spec

**Duration:** Days 14–17 (~6.5h)
**Depends on:** Phase 3 (reuses query patterns from MCP server's source adapter and search logic)
**Blocks:** Nothing
**Risk Level:** LOW — standard Next.js API routes with JSON responses; OpenAPI spec is declarative
**Stack:** nextjs, typescript
**Runner:** `apps/docs/` (Fumadocs Next.js app)

> **Note (validated 2026-03-23):** The original big-plan.md referenced `ai-plugin.json` (the old ChatGPT Plugin manifest). OpenAI **deprecated GPT Plugins in early 2024**. Custom GPTs now use "Actions" where you paste an OpenAPI spec directly into the GPT builder — no `ai-plugin.json` needed. This phase has been revised: the `ai-plugin.json` task is removed, and the focus is on the REST API + OpenAPI spec (which is what GPT Actions actually consume).

---

## 1. Objective + What Success Looks Like

Create three REST API endpoints that expose Tour Kit documentation as structured JSON, plus an OpenAPI 3.1 specification. ChatGPT Custom GPTs consume the OpenAPI spec directly via the GPT builder's Actions UI (no plugin manifest needed).

**Success looks like:**

- `GET /api/docs/search?q=useTour` returns relevant search results as JSON in under 200ms
- `GET /api/docs/page/core/hooks/use-tour` returns the full page content (title, description, markdown body, table of contents)
- `GET /api/docs/examples/react` returns all code examples from the react package docs
- `/openapi.json` is a valid OpenAPI 3.1 spec that passes Swagger Editor validation
- CORS headers allow requests from `https://chat.openai.com` and `https://chatgpt.com`
- A ChatGPT Custom GPT with the OpenAPI spec pasted via Actions can search and retrieve Tour Kit docs

---

## 2. Key Design Decisions

**D1: Shared query logic in `lib/docs-api.ts`, not duplicated per route.**
All three routes import from a single `docs-api.ts` module that wraps the Fumadocs `source` loader. This mirrors the source-adapter pattern from the MCP server (Phase 3) but runs inside the Next.js runtime instead of a standalone Node process.

**D2: Search uses Fumadocs `structuredData` for content indexing.**
Each page's `page.data.structuredData` provides pre-parsed headings and content sections. The search endpoint scores matches against title, description, headings, and body text — same scoring logic as the MCP server's `search-index.ts`.

**D3: Page endpoint returns markdown, not HTML.**
LLMs consume markdown far more effectively than HTML. The `/api/docs/page/[...slug]` route returns the raw markdown body (`page.data.body`) along with structured metadata (title, description, TOC). This keeps responses clean and token-efficient.

**D4: Examples endpoint filters by package name, returns code blocks with language tags.**
The `/api/docs/examples/[pkg]` route scans all pages under the given package's documentation section, extracts fenced code blocks, and returns them as `{ language, code, source }[]`. This gives LLMs copy-paste-ready examples.

**D5: Rate limiting is simple in-memory sliding window, not a third-party service.**
A lightweight rate limiter (10 requests/second per IP) is implemented as middleware using a `Map<string, number[]>` with timestamp arrays. This avoids adding dependencies for a docs API that will see low traffic.

**D6: CORS is restrictive — only allow known AI tool origins.**
The CORS middleware allows `https://chat.openai.com`, `https://chatgpt.com`, and `https://platform.openai.com`. All other cross-origin requests are rejected. Same-origin requests from the docs site itself are always allowed.

### Data Model Strategy

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Query layer | `apps/docs/lib/docs-api.ts` wrapping Fumadocs `source` | Runs inside Next.js runtime; no separate server needed |
| Search scoring | Title (3x) > description (2x) > headings (1.5x) > body (1x) | Matches MCP server scoring from Phase 3 |
| Response format | JSON with `{ results, total, query }` / `{ title, description, body, toc }` | Standard REST patterns; body as markdown |
| Code extraction | Regex on raw markdown for fenced blocks | Simple, no AST parsing needed for code block extraction |
| Rate limiting | In-memory sliding window per IP | Stateless deploys on Vercel reset on cold start — acceptable for docs API |
| Caching | `Cache-Control: s-maxage=60, stale-while-revalidate=300` | Docs change infrequently; 60s freshness with 5min stale tolerance |
| OpenAPI spec | Static JSON file at `public/openapi.json` | Generated once, updated manually when routes change; pasted into GPT builder Actions UI |

---

## 3. Tasks

### 4.1: Create `lib/docs-api.ts` — shared query logic (1.5h)

**File:** `apps/docs/lib/docs-api.ts`

- Import `source` from `./source`
- `searchDocs(query: string, options?: { section?: string; limit?: number }): SearchResult[]`
  - Calls `source.getPages()` to get all pages
  - Filters by section prefix if `section` is provided (e.g., `section=core` matches slugs starting with `core/`)
  - Scores each page against the query using title/description/heading/body weights
  - Returns top `limit` results (default 10, max 50)
- `getDocPage(slug: string[]): DocPage | null`
  - Calls `source.getPage(slug)`
  - Returns `{ title, description, body, toc, lastModified, slug }` or null
- `getCodeExamples(pkg: string): CodeExample[]`
  - Gets all pages under the package's docs section
  - Extracts fenced code blocks using regex: ` ```(\w+)?\n([\s\S]*?)``` `
  - Returns `{ language, code, sourceSlug, sourceTitle }[]`
- `getNavTree(): NavSection[]`
  - Calls `source.getPageTree()`
  - Flattens into sections with page counts

**Types:**

```typescript
interface SearchResult {
  title: string
  description: string
  slug: string
  url: string
  score: number
  section: string
  highlights: string[]
}

interface DocPage {
  title: string
  description: string
  body: string
  toc: TocEntry[]
  slug: string
  url: string
}

interface TocEntry {
  title: string
  depth: number
  url: string
}

interface CodeExample {
  language: string
  code: string
  sourceSlug: string
  sourceTitle: string
}
```

### 4.2: Implement `GET /api/docs/search` route (1h)

**File:** `apps/docs/app/api/docs/search/route.ts`

- Parse query params: `q` (required), `section` (optional), `limit` (optional, default 10, max 50)
- Return 400 if `q` is missing or empty
- Call `searchDocs(q, { section, limit })`
- Return `{ results, total, query, section }` with status 200
- Add CORS headers via helper
- Add `Cache-Control: s-maxage=60, stale-while-revalidate=300`

### 4.3: Implement `GET /api/docs/page/[...slug]` route (0.5h)

**File:** `apps/docs/app/api/docs/page/[...slug]/route.ts`

- Extract slug segments from dynamic route params
- Call `getDocPage(slug)`
- Return 404 with `{ error: "Page not found" }` if null
- Return page data with status 200
- Add CORS headers and cache headers

### 4.4: Implement `GET /api/docs/examples/[pkg]` route (0.5h)

**File:** `apps/docs/app/api/docs/examples/[pkg]/route.ts`

- Extract `pkg` from route params
- Validate against known package names: `['core', 'react', 'hints', 'adoption', 'analytics', 'announcements', 'checklists', 'media', 'scheduling']`
- Return 400 if unknown package
- Call `getCodeExamples(pkg)`
- Return `{ package: pkg, examples, count }` with status 200
- Add CORS headers and cache headers

### 4.5: Write OpenAPI 3.1 spec (1.5h)

**File:** `apps/docs/public/openapi.json`

- OpenAPI version: `3.1.0`
- Info: title "Tour Kit Documentation API", version matching package version, description explaining the API purpose
- Servers: `[{ url: "https://tour-kit.dev" }]` (production URL)
- Three paths: `/api/docs/search`, `/api/docs/page/{slug}`, `/api/docs/examples/{pkg}`
- Full request/response schemas for each endpoint
- Error response schemas (400, 404, 429)
- Component schemas for `SearchResult`, `DocPage`, `CodeExample`
- Validate with Swagger Editor before committing

### 4.6: Add CORS headers and rate limiting (1h)

**File:** `apps/docs/lib/api-middleware.ts`

- `withCors(response: NextResponse): NextResponse` — adds CORS headers for allowed origins
- `corsPreflightResponse(): NextResponse` — handles OPTIONS requests
- `withRateLimit(request: NextRequest): { allowed: boolean; response?: NextResponse }` — sliding window rate limiter (10 req/s per IP)
- All three API route files import and use these helpers
- Each route exports an `OPTIONS` handler for CORS preflight

**Implementation notes:**
- Rate limit state lives in a module-level `Map<string, number[]>` — resets on cold start, which is acceptable
- IP extracted from `x-forwarded-for` header (standard on Vercel) or `request.ip`
- Rate limit response: 429 with `{ error: "Rate limit exceeded", retryAfter: number }`

### 4.7: Test with ChatGPT Custom GPT Actions (1h)

- Create a test Custom GPT in ChatGPT
- In the GPT builder, go to "Configure" → "Actions" → paste the OpenAPI spec JSON (or provide the URL to `/openapi.json`)
- Run 5 test queries:
  1. "Search for useTour hook" → verify search results
  2. "Get the page for installation" → verify page content
  3. "Show me react package examples" → verify code examples
  4. "How do I create a product tour?" → verify search handles natural language
  5. "What components does the hints package export?" → verify cross-package search
- Document results and any issues in a test log

---

## 4. Deliverables

```
apps/docs/
├── lib/
│   ├── docs-api.ts              # Shared query logic wrapping Fumadocs source
│   └── api-middleware.ts         # CORS headers + rate limiting helpers
├── app/
│   ├── api/docs/
│   │   ├── search/
│   │   │   └── route.ts         # GET /api/docs/search?q=&section=&limit=
│   │   ├── page/
│   │   │   └── [...slug]/
│   │   │       └── route.ts     # GET /api/docs/page/{slug}
│   │   └── examples/
│   │       └── [pkg]/
│   │           └── route.ts     # GET /api/docs/examples/{pkg}
└── public/
    └── openapi.json             # OpenAPI 3.1 specification
```

---

## 5. Exit Criteria

- [ ] `GET /api/docs/search?q=useTour` returns JSON with relevant results in <200ms
- [ ] `GET /api/docs/page/core/hooks/use-tour` returns full page content with title, description, markdown body, and TOC
- [ ] `GET /api/docs/examples/react` returns code examples with language tags from the react package docs
- [ ] `/openapi.json` validates with Swagger Editor (no errors)
- [ ] CORS headers present on all API responses; OPTIONS preflight returns 200 for allowed origins
- [ ] Rate limiting returns 429 after 10 requests/second from the same IP
- [ ] ChatGPT Custom GPT with Actions configured can search and retrieve Tour Kit docs (5 test queries pass)

---

## 6. Execution Prompt

You are implementing Discoverability Phase 4 (Docs REST API + OpenAPI Spec) for the Tour Kit docs site at `apps/docs/` in the tour-kit monorepo. This phase creates three REST API endpoints that expose documentation as structured JSON, plus an OpenAPI 3.1 spec that can be pasted into ChatGPT's Custom GPT Actions builder.

> **Important context:** OpenAI deprecated the `ai-plugin.json` plugin manifest in early 2024. Custom GPTs now consume OpenAPI specs directly via the GPT builder's Actions UI. Do NOT create an `ai-plugin.json` file.

### Project Context

Tour Kit is a headless React onboarding/product tour library. The docs site uses Fumadocs (Next.js App Router). The Fumadocs source loader is already configured at `apps/docs/lib/source.ts`:

```typescript
import { docs } from '@/.source/server'
import { loader } from 'fumadocs-core/source'
export const source = loader({ baseUrl: '/docs', source: docs.toFumadocsSource() })
```

Key Fumadocs APIs:
- `source.getPages()` — returns all pages (each has `data.title`, `data.description`, `data.body`, `data.toc`, `data.structuredData`, `slugs`, `url`)
- `source.getPage(['core', 'hooks', 'use-tour'])` — returns a single page by slug segments
- `source.getPageTree()` — returns the navigation tree

There are 9 packages: core, react, hints, adoption, analytics, announcements, checklists, media, scheduling. Documentation content is at `content/docs/` with subdirectories matching package names.

### Per-File Implementation Guidance

**`lib/docs-api.ts`**

```typescript
import { source } from './source'

// Search scoring weights
const WEIGHTS = { title: 3, description: 2, heading: 1.5, body: 1 } as const

export function searchDocs(
  query: string,
  options: { section?: string; limit?: number } = {}
): SearchResult[] {
  const { section, limit = 10 } = options
  const pages = source.getPages()
  const normalizedQuery = query.toLowerCase()
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  const scored = pages
    .filter(page => !section || page.slugs[0] === section)
    .map(page => {
      const title = (page.data.title ?? '').toLowerCase()
      const description = (page.data.description ?? '').toLowerCase()
      // Score based on term matches in title, description, body
      let score = 0
      for (const term of terms) {
        if (title.includes(term)) score += WEIGHTS.title
        if (description.includes(term)) score += WEIGHTS.description
        // Check structuredData headings and content
        // ...
      }
      return { page, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, 50))

  return scored.map(({ page, score }) => ({
    title: page.data.title ?? '',
    description: page.data.description ?? '',
    slug: page.slugs.join('/'),
    url: page.url,
    score,
    section: page.slugs[0] ?? '',
    highlights: [], // Extract matching snippets
  }))
}

export function getDocPage(slug: string[]): DocPage | null {
  const page = source.getPage(slug)
  if (!page) return null
  return {
    title: page.data.title ?? '',
    description: page.data.description ?? '',
    body: page.data.body ?? '',
    toc: (page.data.toc ?? []).map(entry => ({
      title: entry.title,
      depth: entry.depth,
      url: entry.url,
    })),
    slug: slug.join('/'),
    url: page.url,
  }
}

export function getCodeExamples(pkg: string): CodeExample[] {
  const pages = source.getPages().filter(p => p.slugs[0] === pkg)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const examples: CodeExample[] = []

  for (const page of pages) {
    const body = page.data.body ?? ''
    let match: RegExpExecArray | null
    while ((match = codeBlockRegex.exec(body)) !== null) {
      examples.push({
        language: match[1] ?? 'text',
        code: match[2].trim(),
        sourceSlug: page.slugs.join('/'),
        sourceTitle: page.data.title ?? '',
      })
    }
  }

  return examples
}
```

**`lib/api-middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://chat.openai.com',
  'https://chatgpt.com',
  'https://platform.openai.com',
]

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT = 10 // requests per second
const WINDOW_MS = 1000

export function withCors(response: NextResponse, origin?: string | null): NextResponse {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }
  return response
}

export function corsPreflightResponse(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  return withCors(response, origin)
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) ?? []
  const recent = timestamps.filter(t => now - t < WINDOW_MS)

  if (recent.length >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 1 },
      { status: 429 }
    )
  }

  recent.push(now)
  rateLimitMap.set(ip, recent)
  return null
}
```

**Route handler pattern (all three routes follow this):**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { searchDocs } from '@/lib/docs-api'
import { withCors, corsPreflightResponse, checkRateLimit } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit(request)
  if (rateLimited) return rateLimited

  const origin = request.headers.get('origin')
  // ... route-specific logic ...
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  return withCors(response, origin)
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get('origin'))
}
```

### Constraints

- All files live under `apps/docs/` — no changes to packages
- Use `next/server` imports only (`NextRequest`, `NextResponse`) — no Express patterns
- All route handlers export named `GET` and `OPTIONS` functions (App Router convention)
- The OpenAPI spec must be valid OpenAPI 3.1.0 — use `https://editor.swagger.io/` to validate
- Do NOT create an `ai-plugin.json` file — OpenAI deprecated this in 2024. ChatGPT Actions consume the OpenAPI spec directly.
- Do NOT add external dependencies — use only Next.js built-ins and the Fumadocs source loader
- Responses must include `Content-Type: application/json` (handled by `NextResponse.json`)
- Run `pnpm --filter docs build` after implementation to verify no build errors
- Run `pnpm --filter docs dev` and manually test each endpoint with curl

---

## Readiness Check

Before starting Discoverability Phase 4, confirm:

- [ ] Phase 3 (MCP Server) is complete and the source-adapter/search-index patterns are available for reference
- [ ] `apps/docs/lib/source.ts` exports the Fumadocs `source` loader
- [ ] `source.getPages()` returns page objects with `data.title`, `data.description`, `data.body`, `data.toc`, `slugs`, `url`
- [ ] `source.getPage(slugArray)` returns a single page or undefined
- [ ] `pnpm --filter docs build` succeeds
- [ ] `pnpm --filter docs dev` starts the dev server without errors
- [ ] The docs site has content under `content/docs/` for all 9 packages
