# Discoverability Phase 2 — Crawler Infrastructure

**Duration:** Days 5–7 (~6h)
**Depends on:** Nothing (independent of Phase 0/1)
**Blocks:** Phase 7 (Gemini-Specific Optimization)
**Risk Level:** LOW — uses stable Next.js App Router APIs (robots.ts, sitemap.ts) and well-documented JSON-LD schemas; no novel integrations
**Stack:** nextjs, typescript
**Runner:** Solo (Domi)

---

## 1. Objective + What Success Looks Like

Add robots.txt, sitemap.xml, and structured data (JSON-LD) to the Fumadocs documentation site so that Gemini, ChatGPT web search, and other LLM crawlers can index Tour Kit docs properly.

**Success looks like:**

- `GET /robots.txt` returns a well-formed file that explicitly allows GPTBot, ClaudeBot, Google-Extended, and Bingbot, and points to `/sitemap.xml`.
- `GET /sitemap.xml` returns entries for all MDX doc pages with accurate `lastModified` dates derived from git history.
- Every documentation page under `/docs/` includes a `<script type="application/ld+json">` tag with a valid `TechArticle` schema.
- The Getting Started and Installation pages additionally include `FAQPage` structured data.
- Google Rich Results Test passes for at least 3 sample pages.

---

## 2. Key Design Decisions

### 2.1 Next.js Route Handler Convention for robots.ts and sitemap.ts

Next.js App Router supports `app/robots.ts` and `app/sitemap.ts` as special route files that generate `/robots.txt` and `/sitemap.xml` respectively. These are the canonical approach — no manual static files or API routes needed.

| Decision | Choice | Rationale |
|---|---|---|
| robots.txt generation | `app/robots.ts` exporting `MetadataRoute.Robots` | Next.js convention; auto-served at `/robots.txt`; type-safe |
| sitemap.xml generation | `app/sitemap.ts` exporting `MetadataRoute.Sitemap` | Next.js convention; auto-served at `/sitemap.xml`; supports `lastModified` |
| Last-modified source | `git log --format=%cI` per MDX file | Git is the source of truth for content changes; avoids needing a CMS timestamp |
| JSON-LD injection | React component `<StructuredData />` rendered in docs layout | Keeps structured data co-located with the page it describes; server component for zero client JS |
| Schema types | `TechArticle` for all docs, `SoftwareSourceCode` for API reference, `FAQPage` for getting-started | Most specific schema.org types for developer documentation |
| JSON-LD component architecture | Single `lib/structured-data.tsx` exporting multiple components | One file, multiple named exports — keeps imports clean |

### 2.2 Data Model Strategy

| Concern | Pattern | Notes |
|---|---|---|
| `robots.ts` return type | `MetadataRoute.Robots` from `next` | Object with `rules` array and `sitemap` string |
| `sitemap.ts` return type | `MetadataRoute.Sitemap` (array) from `next` | Each entry: `{ url, lastModified, changeFrequency, priority }` |
| Page metadata for JSON-LD | Read from Fumadocs `page.data` + frontmatter | `title`, `description`, `structuredData` available on each page object |
| FAQ entries | Defined in MDX frontmatter as `faq` array | Each item: `{ question: string, answer: string }` |
| Git dates | Resolved at build time via `execSync` | Cached per-file; falls back to `new Date()` if git fails |

### 2.3 Bot Allow-List Strategy

Explicitly allow AI-related crawlers that respect `robots.txt`:

```
User-agent: GPTBot        # OpenAI / ChatGPT web search
User-agent: ClaudeBot     # Anthropic
User-agent: Google-Extended # Gemini grounding
User-agent: Bingbot       # Microsoft Copilot
User-agent: *             # All other crawlers
```

All are allowed full access to `/docs/` paths. Only `/_next/`, `/api/`, and other internal paths are disallowed.

---

## 3. Tasks

### 3.1 Create `app/robots.ts` — bot allow-list + sitemap reference (0.5h)

**File:** `apps/docs/app/robots.ts`

Next.js App Router convention: export a default function returning `MetadataRoute.Robots`.

```typescript
import type { MetadataRoute } from 'next'

const SITE_URL = 'https://tourkit.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Bingbot', '*'],
        allow: '/',
        disallow: ['/_next/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

**Verification:** `pnpm --filter docs dev`, then `curl http://localhost:3000/robots.txt` returns well-formed robots.txt with all specified user-agents.

---

### 3.2 Create `app/sitemap.ts` — dynamic sitemap from Fumadocs source (1.5h)

**File:** `apps/docs/app/sitemap.ts`

Uses the existing Fumadocs `source.getPages()` to enumerate all MDX pages. Resolves `lastModified` from git history at build time.

```typescript
import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'
import { execSync } from 'node:child_process'
import path from 'node:path'

const SITE_URL = 'https://tourkit.dev'
const CONTENT_DIR = path.resolve(process.cwd(), 'content/docs')

function getGitLastModified(filePath: string): Date {
  try {
    const result = execSync(
      `git log -1 --format=%cI -- "${filePath}"`,
      { encoding: 'utf-8' }
    ).trim()
    return result ? new Date(result) : new Date()
  } catch {
    return new Date()
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages()

  const docEntries: MetadataRoute.Sitemap = pages.map((page) => {
    // Reconstruct the file path from the slug
    const slugPath = page.slugs.join('/')
    const mdxPath = path.join(CONTENT_DIR, `${slugPath}.mdx`)
    const indexPath = path.join(CONTENT_DIR, slugPath, 'index.mdx')

    // Try both file conventions
    let lastModified: Date
    try {
      lastModified = getGitLastModified(mdxPath)
    } catch {
      lastModified = getGitLastModified(indexPath)
    }

    return {
      url: `${SITE_URL}${page.url}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: page.slugs.length === 0 ? 1.0 : page.slugs.length === 1 ? 0.8 : 0.6,
    }
  })

  // Add the landing page
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    ...docEntries,
  ]
}
```

**Implementation notes:**
- `source.getPages()` returns all pages from the Fumadocs loader (confirmed API from Context7).
- Each page has `page.slugs` (string array) and `page.url` (string with base URL prefix).
- `execSync` is acceptable here because sitemap generation runs at build time, not per-request in production (Next.js caches the result).
- Priority is tiered: root = 1.0, top-level sections = 0.8, nested pages = 0.6.

**Verification:** `curl http://localhost:3000/sitemap.xml` returns XML with entries for all doc pages, each with a `<lastmod>` date.

---

### 3.3 Create `lib/structured-data.tsx` — JSON-LD components (1.5h)

**File:** `apps/docs/lib/structured-data.tsx`

A server component that renders a `<script type="application/ld+json">` tag. Exports separate functions for different schema types.

```typescript
import type { ReactNode } from 'react'

const SITE_URL = 'https://tourkit.dev'

// ── Types ──

interface TechArticleProps {
  title: string
  description: string
  url: string
  dateModified?: string
  /** Section within docs (e.g., "Core", "React", "Guides") */
  section?: string
}

interface FAQItem {
  question: string
  answer: string
}

interface SoftwareSourceCodeProps {
  title: string
  description: string
  url: string
  programmingLanguage: string
  runtimePlatform?: string
}

// ── Components ──

export function TechArticleJsonLd({
  title,
  description,
  url,
  dateModified,
  section,
}: TechArticleProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: `${SITE_URL}${url}`,
    ...(dateModified && { dateModified }),
    ...(section && { articleSection: section }),
    author: {
      '@type': 'Organization',
      name: 'TourKit',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TourKit',
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'TourKit Documentation',
      url: `${SITE_URL}/docs`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function FAQJsonLd({ items }: { items: FAQItem[] }): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function SoftwareSourceCodeJsonLd({
  title,
  description,
  url,
  programmingLanguage,
  runtimePlatform,
}: SoftwareSourceCodeProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
    programmingLanguage,
    ...(runtimePlatform && { runtimePlatform }),
    codeRepository: 'https://github.com/domidex01/tour-kit',
    license: 'https://opensource.org/licenses/MIT',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

**Implementation notes:**
- All components are server components (no `'use client'` directive) — zero client-side JS.
- `dangerouslySetInnerHTML` is safe here because we control the data entirely (no user input).
- Each component is independently importable for different page contexts.

**Verification:** Render `<TechArticleJsonLd title="Test" description="Test desc" url="/docs/test" />` and inspect the HTML output for a valid `<script type="application/ld+json">` tag.

---

### 3.4 Add JSON-LD to docs layout — per-page structured data (1h)

**File:** `apps/docs/app/docs/[[...slug]]/page.tsx` (update)

Inject `<TechArticleJsonLd />` into every doc page using data from the Fumadocs page object.

The existing `[[...slug]]/page.tsx` already has access to the page object via `source.getPage(params.slug)`. Add the JSON-LD component alongside the existing page content.

```typescript
import { TechArticleJsonLd } from '@/lib/structured-data'

// Inside the page component, after getting the page object:
<TechArticleJsonLd
  title={page.data.title}
  description={page.data.description ?? ''}
  url={page.url}
  section={page.slugs[0]} // e.g., "core", "react", "guides"
/>
```

**Implementation notes:**
- The `page.data` object contains frontmatter fields (`title`, `description`) from the MDX file.
- The `section` is derived from the first slug segment, which maps to the top-level directory name.
- For API reference pages (slugs starting with `api`), also render `<SoftwareSourceCodeJsonLd />`.

**Verification:** View source on any doc page — a `<script type="application/ld+json">` tag with `TechArticle` schema should be present in the HTML.

---

### 3.5 Add FAQ structured data to Getting Started and Installation pages (1h)

**Files to update:**
- `content/docs/getting-started/index.mdx` (or equivalent)
- `content/docs/getting-started/installation.mdx` (or equivalent)

Add FAQ frontmatter to these high-traffic pages, then render `<FAQJsonLd />` conditionally when `faq` is present in the page data.

**FAQ content for Getting Started:**

```yaml
faq:
  - question: "What is Tour Kit?"
    answer: "Tour Kit is a headless onboarding and product tour library for React. It provides hooks and components for building step-by-step guides, tooltips, and interactive walkthroughs."
  - question: "Does Tour Kit work with Next.js?"
    answer: "Yes, Tour Kit fully supports Next.js App Router and Pages Router. It works with both server and client components."
  - question: "Is Tour Kit accessible?"
    answer: "Yes, Tour Kit is built with WCAG 2.1 AA compliance. It includes ARIA attributes, focus management, keyboard navigation, and respects prefers-reduced-motion."
  - question: "Can I use Tour Kit with Tailwind CSS?"
    answer: "Yes, Tour Kit is headless by design and works with any styling solution including Tailwind CSS, CSS Modules, styled-components, and shadcn/ui."
```

**FAQ content for Installation:**

```yaml
faq:
  - question: "How do I install Tour Kit?"
    answer: "Install with pnpm: pnpm add @tour-kit/core @tour-kit/react. You can also use npm or yarn."
  - question: "What are Tour Kit's peer dependencies?"
    answer: "Tour Kit requires React 18+ and React DOM 18+. TypeScript is recommended but optional."
  - question: "Does Tour Kit support TypeScript?"
    answer: "Yes, Tour Kit is written in TypeScript and ships with full type definitions. Strict mode is supported."
```

**Conditional rendering in page.tsx:**

```typescript
import { FAQJsonLd } from '@/lib/structured-data'

// If the page frontmatter includes faq data:
{page.data.faq && <FAQJsonLd items={page.data.faq} />}
```

**Implementation notes:**
- Fumadocs reads frontmatter from MDX files. The `faq` field needs to be added to the frontmatter schema if Fumadocs uses Zod validation (check `source.config.ts` or equivalent).
- If Fumadocs does not support custom frontmatter fields, define the FAQ data inline in the page component instead.

**Verification:** `curl http://localhost:3000/docs/getting-started` and search for `FAQPage` in the response HTML.

---

### 3.6 Verify with Google Rich Results Test and Schema.org validator (0.5h)

**Manual verification steps:**

1. Deploy to a preview URL (Vercel preview deployment).
2. Test 3 pages with [Google Rich Results Test](https://search.google.com/test/rich-results):
   - `/docs` (landing page — TechArticle)
   - `/docs/getting-started` (TechArticle + FAQPage)
   - `/docs/core/hooks/use-tour` (TechArticle — deep page)
3. Validate JSON-LD with [Schema.org Validator](https://validator.schema.org/).
4. Verify `/robots.txt` serves correctly with expected user-agent rules.
5. Verify `/sitemap.xml` lists all doc pages with `<lastmod>` dates.
6. Spot-check 5 random sitemap URLs to confirm they resolve to real pages.

**Pass criteria:** Zero errors in Rich Results Test, zero errors in Schema.org validator, all sitemap URLs resolve.

---

## 4. Deliverables

```
apps/docs/
├── app/
│   ├── robots.ts                          # Task 3.1 — NEW
│   ├── sitemap.ts                         # Task 3.2 — NEW
│   └── docs/
│       └── [[...slug]]/
│           └── page.tsx                   # Task 3.4, 3.5 — UPDATE (add JSON-LD)
├── lib/
│   └── structured-data.tsx                # Task 3.3 — NEW
└── content/docs/
    └── getting-started/
        ├── index.mdx                      # Task 3.5 — UPDATE (add FAQ frontmatter)
        └── installation.mdx               # Task 3.5 — UPDATE (add FAQ frontmatter)
```

---

## 5. Exit Criteria

Exit criteria are 1:1 with deliverables:

- [ ] `/robots.txt` serves with `Allow: /` for GPTBot, ClaudeBot, Google-Extended, Bingbot, and `*`; disallows `/_next/` and `/api/`; includes `Sitemap:` directive
- [ ] `/sitemap.xml` lists all MDX doc pages (match count from `source.getPages().length`) with `<lastmod>` dates from git history
- [ ] `<script type="application/ld+json">` with `TechArticle` schema present on every doc page under `/docs/`
- [ ] Getting Started page has `FAQPage` JSON-LD with at least 3 FAQ items
- [ ] Installation page has `FAQPage` JSON-LD with at least 3 FAQ items
- [ ] Google Rich Results Test passes with zero errors for 3 sample pages (docs landing, getting-started, one deep page)
- [ ] Schema.org validator reports zero errors on all JSON-LD output
- [ ] `pnpm --filter docs build` succeeds with zero errors

---

## 6. Execution Prompt

You are implementing Discoverability Phase 2 of the Tour Kit documentation site — crawler infrastructure. This phase adds robots.txt, sitemap.xml, and JSON-LD structured data so LLM web crawlers (GPTBot, ClaudeBot, Google-Extended) can index docs properly.

### Context

- **Monorepo:** pnpm + Turborepo. Docs site lives at `apps/docs/`.
- **Framework:** Next.js App Router with Fumadocs.
- **Source loader:** `apps/docs/lib/source.ts` — uses `fumadocs-core/source` loader.
- **Content:** MDX files in `content/docs/` with subdirectories for core/, react/, hints/, guides/, examples/, api/.
- **Existing layout:** `apps/docs/app/docs/layout.tsx` wraps all doc pages.
- **Page route:** `apps/docs/app/docs/[[...slug]]/page.tsx` renders individual doc pages.

### Confirmed APIs (from Fumadocs Source, Context7 2026-03-23)

```typescript
import { source } from '@/lib/source'

// Get all pages — returns array of page objects
const pages = source.getPages()

// Each page object has:
// page.slugs    — string[] (e.g., ['core', 'hooks', 'use-tour'])
// page.url      — string (e.g., '/docs/core/hooks/use-tour')
// page.data     — { title: string, description?: string, body: MDX, toc: TOC[], structuredData: object }

// Get single page by slug array
const page = source.getPage(['getting-started', 'installation'])

// Get navigation tree
const tree = source.getPageTree()
```

### Confirmed APIs (Next.js MetadataRoute)

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
    sitemap: 'https://tourkit.dev/sitemap.xml',
  }
}

// app/sitemap.ts
import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://tourkit.dev', lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 }]
}
```

### Data Model Rules

1. All structured data follows schema.org vocabulary exactly.
2. JSON-LD components are server components — no `'use client'` directive.
3. Site URL (`https://tourkit.dev`) is defined as a constant, not hardcoded in multiple places.
4. Git date resolution uses `execSync` with try/catch fallback to `new Date()`.
5. FAQ data lives in MDX frontmatter when Fumadocs supports custom fields, otherwise inline in components.

### Implementation Order

1. **Start with `robots.ts`** (Task 3.1) — simplest file, immediate verification with `curl`.
2. **Then `sitemap.ts`** (Task 3.2) — depends on `source.getPages()`, verify with browser.
3. **Then `structured-data.tsx`** (Task 3.3) — pure component, can be tested in isolation.
4. **Then update page.tsx** (Task 3.4) — wire JSON-LD into existing page route.
5. **Then FAQ frontmatter** (Task 3.5) — update 2 MDX files + conditional rendering.
6. **Finally verify** (Task 3.6) — deploy preview, run Rich Results Test.

### Verification Commands

```bash
# Build the docs site
pnpm --filter docs build

# Dev mode for manual testing
pnpm --filter docs dev

# Check robots.txt
curl http://localhost:3000/robots.txt

# Check sitemap.xml
curl http://localhost:3000/sitemap.xml

# Check JSON-LD in page source
curl -s http://localhost:3000/docs/getting-started | grep 'application/ld+json'
```

---

## Readiness Check

Before starting Discoverability Phase 2, confirm:

- [ ] `apps/docs/` builds successfully: `pnpm --filter docs build` exits 0
- [ ] Fumadocs source loader is working: `source.getPages()` returns page objects
- [ ] `apps/docs/app/docs/[[...slug]]/page.tsx` exists and renders doc pages
- [ ] `apps/docs/content/docs/getting-started/` directory exists with MDX content
- [ ] Git history is available in the working directory (`git log` works)
- [ ] The docs site domain (e.g., `tourkit.dev`) is confirmed for use in sitemap and structured data URLs

Phase 2 is ready to begin when all boxes are checked.
