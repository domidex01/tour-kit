# Discoverability Phase 3 — MCP Server Core

**Duration:** Days 8–13 (~12h)
**Depends on:** Phase 0 (spikes confirmed Fumadocs source + MCP SDK work)
**Blocks:** Phase 4 (OpenAI API Routes + Plugin Manifest)
**Risk Level:** MEDIUM — MCP SDK is still maturing (v1.x); Fumadocs source may need adaptation for standalone Node.js usage outside Next.js; in-memory search must perform well enough for <500 pages
**Stack:** nextjs, typescript
**Runner:** Solo (Domi)

---

## 1. Objective + What Success Looks Like

Implement a complete MCP server at `apps/tour-kit-mcp/` with 4 tools, 2 resources, and 2 prompts — enabling Claude Desktop, Cursor, Windsurf, and any MCP-compatible client to search, browse, and retrieve Tour Kit documentation programmatically.

**Success looks like:**

- `npx @tour-kit/docs-mcp` starts in under 500ms and responds to `tools/list` via stdio transport.
- `search_docs({ query: "useTour" })` returns ranked results with title, description, URL, and relevance score.
- `get_page({ slug: "core/hooks/use-tour" })` returns the full page content as clean markdown (JSX/imports stripped).
- `list_sections()` returns all top-level doc sections with page counts matching the actual content.
- `get_code_examples({ package: "react" })` extracts and returns all code blocks from a package's documentation with language tags.
- Adding `"tour-kit-docs": { "command": "npx", "args": ["@tour-kit/docs-mcp"] }` to Claude Desktop's MCP config works out of the box.

---

## 2. Key Design Decisions

### 2.1 Architecture Overview

The MCP server wraps the Fumadocs source loader and exposes documentation through the Model Context Protocol. The server runs as a standalone Node.js process communicating over stdio.

```
┌─────────────────────────────────────────────┐
│  MCP Client (Claude Desktop / Cursor)       │
│                                             │
│    stdio transport                          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  server.ts (McpServer)                      │
│  ├── tools/search.ts       (search_docs)    │
│  ├── tools/get-page.ts     (get_page)       │
│  ├── tools/list-sections.ts                 │
│  ├── tools/code-examples.ts                 │
│  ├── resources/pages.ts    (docs://pages)   │
│  ├── resources/nav.ts      (docs://nav)     │
│  ├── prompts/explain-api.ts                 │
│  └── prompts/guide-me.ts                    │
│                                             │
│  source-adapter.ts ──► Fumadocs source      │
│  utils/mdx-stripper.ts                      │
│  utils/search-index.ts                      │
└─────────────────────────────────────────────┘
```

### 2.2 Data Model Strategy

| Concern | Pattern | Notes |
|---|---|---|
| MCP server instance | `McpServer` from `@modelcontextprotocol/server` | Single instance, registered tools/resources/prompts |
| Transport | `StdioServerTransport` | Standard for CLI-based MCP servers; no HTTP needed |
| Tool input validation | `zod/v4` schemas | MCP SDK uses Zod v4 for `inputSchema` (confirmed API) |
| Page data model | `{ slug: string, title: string, description: string, url: string, content: string, section: string }` | Derived from Fumadocs page objects; content is MDX stripped to markdown |
| Search index | In-memory array with TF-IDF-like scoring | Acceptable for <500 pages; no external dependencies |
| Source adapter | Lazy-loaded singleton wrapping Fumadocs `source` | Built once on first access, cached for server lifetime |
| MDX stripping | Regex-based removal of JSX, imports, exports | Preserves code blocks, headings, lists, and prose |

### 2.3 MCP SDK Registration Pattern

The MCP SDK uses `server.registerTool()` (not `server.tool()` or method chaining). Each tool, resource, and prompt is registered individually.

```typescript
import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

const server = new McpServer({ name: 'tour-kit-docs', version: '1.0.0' })

// Tools use registerTool with Zod v4 inputSchema
server.registerTool('search_docs', {
  description: 'Search Tour Kit documentation',
  inputSchema: z.object({ query: z.string() }),
}, async ({ query }) => {
  return { content: [{ type: 'text', text: JSON.stringify(results) }] }
})
```

### 2.4 Source Adapter Strategy

Fumadocs `source.getPages()` returns page objects with `page.data.body` (MDX content), `page.data.toc` (table of contents), and `page.data.structuredData` (search-optimized data). The source adapter:

1. Calls `source.getPages()` once at startup.
2. Strips MDX syntax from each page body using `mdx-stripper.ts`.
3. Builds an in-memory index for search.
4. Caches everything — no re-reading on each request.

If Fumadocs source cannot run outside Next.js (Phase 0 risk), the fallback is to parse raw MDX files with `gray-matter` + a remark pipeline.

### 2.5 Search Scoring Algorithm

| Field | Weight | Rationale |
|---|---|---|
| Title exact match | 10 | Highest signal — user searched for a specific page |
| Title partial match | 5 | Title contains the query term |
| Description match | 3 | Description is a curated summary |
| Heading match (h2/h3) | 2 | Section headings indicate topic coverage |
| Body content match | 1 | Full-text match, lowest signal due to noise |

Results are sorted by total weighted score, capped at `limit` (default 10, max 50).

---

## 3. Tasks

### 3.1 Scaffold `apps/tour-kit-mcp/` package (1h)

**Files to create:**

```
apps/tour-kit-mcp/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── bin/
│   └── tour-kit-docs         # Shebang script: #!/usr/bin/env node
└── src/
    ├── index.ts               # Entry point — stdio transport
    └── server.ts              # McpServer setup (placeholder)
```

**`package.json`:**

```json
{
  "name": "@tour-kit/docs-mcp",
  "version": "0.1.0",
  "description": "MCP server for Tour Kit documentation",
  "type": "module",
  "bin": {
    "tour-kit-docs": "./bin/tour-kit-docs"
  },
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/server": "^1.0.0",
    "zod": "^3.25.0",
    "fumadocs-core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

**`tsup.config.ts`:**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  sourcemap: true,
})
```

**`bin/tour-kit-docs`:**

```bash
#!/usr/bin/env node
import '../dist/index.js'
```

**`src/index.ts` (placeholder):**

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/server'
import { createServer } from './server.js'

const server = createServer()
const transport = new StdioServerTransport()
await server.connect(transport)
```

**Verification:** `pnpm install && pnpm --filter @tour-kit/docs-mcp build` exits 0. `node apps/tour-kit-mcp/dist/index.js` starts without crashing (exits waiting for stdin).

---

### 3.2 Implement `source-adapter.ts` — Fumadocs wrapper (2h)

**File:** `apps/tour-kit-mcp/src/source-adapter.ts`

Wraps the Fumadocs source loader and transforms page data into a format suitable for MCP tools.

```typescript
import { source } from '../../docs/lib/source'  // Import from docs app
import { stripMdx } from './utils/mdx-stripper.js'

export interface DocPage {
  slug: string
  title: string
  description: string
  url: string
  content: string       // MDX stripped to plain markdown
  section: string       // Top-level directory (e.g., 'core', 'react')
  headings: string[]    // h2/h3 headings extracted from content
}

export interface DocSection {
  name: string
  slug: string
  pageCount: number
  description: string
}

let cachedPages: DocPage[] | null = null
let cachedSections: DocSection[] | null = null

export function getAllPages(): DocPage[] {
  if (cachedPages) return cachedPages

  const rawPages = source.getPages()
  cachedPages = rawPages.map((page) => {
    const content = stripMdx(/* extract body content from page */)
    const headings = extractHeadings(content)
    return {
      slug: page.slugs.join('/'),
      title: page.data.title,
      description: page.data.description ?? '',
      url: page.url,
      content,
      section: page.slugs[0] ?? 'root',
      headings,
    }
  })

  return cachedPages
}

export function getPage(slug: string): DocPage | undefined {
  return getAllPages().find((p) => p.slug === slug)
}

export function getSections(): DocSection[] {
  if (cachedSections) return cachedSections

  const pages = getAllPages()
  const sectionMap = new Map<string, DocPage[]>()

  for (const page of pages) {
    const existing = sectionMap.get(page.section) ?? []
    existing.push(page)
    sectionMap.set(page.section, existing)
  }

  cachedSections = Array.from(sectionMap.entries()).map(([name, sectionPages]) => ({
    name,
    slug: name,
    pageCount: sectionPages.length,
    description: `Documentation for ${name}`,
  }))

  return cachedSections
}

function extractHeadings(content: string): string[] {
  const headingRegex = /^#{2,3}\s+(.+)$/gm
  const headings: string[] = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim())
  }
  return headings
}
```

**Implementation notes:**
- The import path to `docs/lib/source` may need adjustment based on Phase 0 findings. If Fumadocs source cannot be imported directly, fall back to reading raw MDX files from `apps/docs/content/docs/`.
- Caching is critical: `getAllPages()` is called by every tool, so it must only parse once.
- `page.data.body` or equivalent contains the raw MDX — the exact property name depends on Fumadocs internals (confirm in Phase 0 spike output).

**Verification:** Import `getAllPages()` in a test script and confirm it returns an array of `DocPage` objects with non-empty `content` fields.

---

### 3.3 Implement `utils/mdx-stripper.ts` — strip JSX/imports from MDX (1h)

**File:** `apps/tour-kit-mcp/src/utils/mdx-stripper.ts`

Converts MDX content to clean markdown by removing JSX components, import/export statements, and other MDX-specific syntax while preserving code blocks, headings, lists, and prose.

```typescript
/**
 * Strip MDX-specific syntax from content, producing clean markdown.
 * Preserves: headings, paragraphs, lists, code blocks (fenced), links, bold/italic.
 * Removes: import/export statements, JSX components, MDX expressions.
 */
export function stripMdx(mdxContent: string): string {
  let result = mdxContent

  // Step 1: Protect fenced code blocks from being modified
  const codeBlocks: string[] = []
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  // Step 2: Remove import statements
  result = result.replace(/^import\s+.*$/gm, '')

  // Step 3: Remove export statements (but keep export default content)
  result = result.replace(/^export\s+(?!default\s).*$/gm, '')
  result = result.replace(/^export\s+default\s+/gm, '')

  // Step 4: Remove self-closing JSX tags (e.g., <Component prop="value" />)
  result = result.replace(/<[A-Z][a-zA-Z]*\s*[^>]*\/>/g, '')

  // Step 5: Remove JSX block elements (opening + closing tags with content)
  // Handle nested by running multiple passes
  for (let i = 0; i < 3; i++) {
    result = result.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '')
  }

  // Step 6: Remove MDX expressions {/* comments */} and {expressions}
  result = result.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  result = result.replace(/\{[^}]*\}/g, '')

  // Step 7: Remove frontmatter (if present)
  result = result.replace(/^---[\s\S]*?---\n*/m, '')

  // Step 8: Restore code blocks
  result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[parseInt(index, 10)]
  })

  // Step 9: Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}
```

**Implementation notes:**
- The code block protection step is critical — without it, JSX inside code examples would be stripped.
- The multi-pass JSX removal handles up to 3 levels of nesting, which is sufficient for documentation.
- This is a regex-based approach, not an AST parser. It handles 95%+ of cases for documentation MDX. A full remark/rehype pipeline would be more correct but adds significant dependencies.

**Verification:** Feed a sample MDX file containing imports, JSX components, and code blocks. Confirm imports are removed, JSX is removed, but code blocks are preserved intact.

---

### 3.4 Implement `utils/search-index.ts` — in-memory search with scoring (1.5h)

**File:** `apps/tour-kit-mcp/src/utils/search-index.ts`

Builds an in-memory search index over all doc pages with weighted field scoring.

```typescript
import type { DocPage } from '../source-adapter.js'

interface SearchResult {
  page: DocPage
  score: number
  matchedFields: string[]
}

interface SearchOptions {
  query: string
  section?: string
  limit?: number
}

const WEIGHTS = {
  titleExact: 10,
  titlePartial: 5,
  description: 3,
  heading: 2,
  content: 1,
} as const

export class SearchIndex {
  private pages: DocPage[]

  constructor(pages: DocPage[]) {
    this.pages = pages
  }

  search({ query, section, limit = 10 }: SearchOptions): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim()
    const queryTerms = normalizedQuery.split(/\s+/)

    let candidates = this.pages
    if (section) {
      candidates = candidates.filter((p) => p.section === section)
    }

    const results: SearchResult[] = []

    for (const page of candidates) {
      let score = 0
      const matchedFields: string[] = []

      const titleLower = page.title.toLowerCase()
      const descLower = page.description.toLowerCase()
      const contentLower = page.content.toLowerCase()

      // Title exact match
      if (titleLower === normalizedQuery) {
        score += WEIGHTS.titleExact
        matchedFields.push('title:exact')
      }
      // Title partial match
      else if (queryTerms.every((term) => titleLower.includes(term))) {
        score += WEIGHTS.titlePartial
        matchedFields.push('title:partial')
      }

      // Description match
      if (queryTerms.some((term) => descLower.includes(term))) {
        score += WEIGHTS.description
        matchedFields.push('description')
      }

      // Heading match
      for (const heading of page.headings) {
        if (queryTerms.some((term) => heading.toLowerCase().includes(term))) {
          score += WEIGHTS.heading
          matchedFields.push('heading')
          break // Count heading match once per page
        }
      }

      // Content match
      if (queryTerms.some((term) => contentLower.includes(term))) {
        score += WEIGHTS.content
        matchedFields.push('content')
      }

      if (score > 0) {
        results.push({ page, score, matchedFields })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(limit, 50))
  }
}
```

**Implementation notes:**
- This is a simple weighted term-matching index, not TF-IDF. For <500 pages, this is fast and predictable.
- Query terms are split on whitespace and matched independently. All terms must match for title partial match; any term matching suffices for other fields.
- The `limit` parameter is capped at 50 to prevent excessive output to the LLM.
- No stemming or fuzzy matching — keep it simple for v1. Can be enhanced later with `fuse.js` or similar.

**Verification:** Create a `SearchIndex` with 5 mock pages. Verify that searching for a page title returns it as the top result with `score >= 10`.

---

### 3.5 Implement `resources/pages.ts` and `resources/nav.ts` (1h)

**File:** `apps/tour-kit-mcp/src/resources/pages.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import { getAllPages } from '../source-adapter.js'

export function registerPagesResource(server: McpServer): void {
  server.registerResource('docs://pages', {
    description: 'List of all Tour Kit documentation pages with titles, descriptions, and URLs',
  }, async () => {
    const pages = getAllPages()
    const listing = pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      url: p.url,
      section: p.section,
    }))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(listing, null, 2),
      }],
    }
  })
}
```

**File:** `apps/tour-kit-mcp/src/resources/nav.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import { getSections } from '../source-adapter.js'

export function registerNavResource(server: McpServer): void {
  server.registerResource('docs://nav', {
    description: 'Navigation tree of Tour Kit documentation sections with page counts',
  }, async () => {
    const sections = getSections()

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(sections, null, 2),
      }],
    }
  })
}
```

**Implementation notes:**
- Resources are read-only data endpoints. They return static or slowly-changing data.
- The `docs://pages` resource returns a compact listing (no body content) to keep the payload small.
- The `docs://nav` resource is useful for LLMs to understand the doc structure before diving into specific pages.
- The MCP SDK's `registerResource` method takes a URI, metadata object, and async handler (confirm exact signature against SDK version in Phase 0).

**Verification:** Start the server, send a `resources/list` request, confirm both `docs://pages` and `docs://nav` appear. Read each and verify JSON output.

---

### 3.6 Implement `tools/search.ts` — search_docs (1h)

**File:** `apps/tour-kit-mcp/src/tools/search.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { getAllPages } from '../source-adapter.js'
import { SearchIndex } from '../utils/search-index.js'

let searchIndex: SearchIndex | null = null

function getSearchIndex(): SearchIndex {
  if (!searchIndex) {
    searchIndex = new SearchIndex(getAllPages())
  }
  return searchIndex
}

export function registerSearchTool(server: McpServer): void {
  server.registerTool('search_docs', {
    description: 'Search Tour Kit documentation by keyword. Returns ranked results with title, description, URL, and relevance score. Use this to find relevant documentation pages.',
    inputSchema: z.object({
      query: z.string().describe('Search query (e.g., "useTour hook", "focus trap", "announcement modal")'),
      section: z.string().optional().describe('Filter by section (e.g., "core", "react", "guides")'),
      limit: z.number().optional().default(10).describe('Max results to return (default 10, max 50)'),
    }),
  }, async ({ query, section, limit }) => {
    const index = getSearchIndex()
    const results = index.search({ query, section, limit })

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No results found for "${query}"${section ? ` in section "${section}"` : ''}. Try broader search terms or remove the section filter.`,
        }],
      }
    }

    const formatted = results.map((r, i) => ({
      rank: i + 1,
      title: r.page.title,
      description: r.page.description,
      url: r.page.url,
      section: r.page.section,
      score: r.score,
      matchedFields: r.matchedFields,
    }))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(formatted, null, 2),
      }],
    }
  })
}
```

**Verification:** Call `search_docs({ query: "useTour" })` and confirm it returns results with the `useTour` hook page ranked first.

---

### 3.7 Implement `tools/get-page.ts` (0.5h)

**File:** `apps/tour-kit-mcp/src/tools/get-page.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { getPage } from '../source-adapter.js'

export function registerGetPageTool(server: McpServer): void {
  server.registerTool('get_page', {
    description: 'Retrieve the full content of a Tour Kit documentation page by its slug. Returns the page title, description, and complete markdown content. Use search_docs first to find the correct slug.',
    inputSchema: z.object({
      slug: z.string().describe('Page slug (e.g., "core/hooks/use-tour", "getting-started/installation")'),
    }),
  }, async ({ slug }) => {
    const page = getPage(slug)

    if (!page) {
      return {
        content: [{
          type: 'text',
          text: `Page not found: "${slug}". Use search_docs to find the correct slug, or list_sections to browse available sections.`,
        }],
      }
    }

    const output = [
      `# ${page.title}`,
      '',
      page.description ? `> ${page.description}` : '',
      '',
      `**URL:** ${page.url}`,
      `**Section:** ${page.section}`,
      '',
      '---',
      '',
      page.content,
    ].filter(Boolean).join('\n')

    return {
      content: [{
        type: 'text',
        text: output,
      }],
    }
  })
}
```

**Verification:** Call `get_page({ slug: "core/hooks/use-tour" })` and confirm it returns the full page content as clean markdown.

---

### 3.8 Implement `tools/list-sections.ts` and `tools/code-examples.ts` (1h)

**File:** `apps/tour-kit-mcp/src/tools/list-sections.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import { getSections } from '../source-adapter.js'

export function registerListSectionsTool(server: McpServer): void {
  server.registerTool('list_sections', {
    description: 'List all sections of the Tour Kit documentation with page counts. Use this to understand the documentation structure before searching or browsing.',
    inputSchema: {},
  }, async () => {
    const sections = getSections()

    const formatted = sections.map((s) => ({
      name: s.name,
      slug: s.slug,
      pageCount: s.pageCount,
      description: s.description,
    }))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(formatted, null, 2),
      }],
    }
  })
}
```

**File:** `apps/tour-kit-mcp/src/tools/code-examples.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { getAllPages } from '../source-adapter.js'

interface CodeExample {
  language: string
  code: string
  pageTitle: string
  pageSlug: string
}

function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: Array<{ language: string; code: string }> = []
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] ?? 'text',
      code: match[2].trim(),
    })
  }

  return blocks
}

export function registerCodeExamplesTool(server: McpServer): void {
  server.registerTool('get_code_examples', {
    description: 'Extract code examples from Tour Kit documentation for a specific package. Returns code blocks with language tags, source page, and context. Useful for finding usage patterns and implementation examples.',
    inputSchema: z.object({
      package: z.string().describe('Package name to get examples for (e.g., "core", "react", "hints", "adoption")'),
      language: z.string().optional().describe('Filter by language (e.g., "typescript", "tsx", "bash")'),
      limit: z.number().optional().default(20).describe('Max examples to return (default 20)'),
    }),
  }, async ({ package: pkg, language, limit }) => {
    const pages = getAllPages().filter((p) => p.section === pkg)

    if (pages.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No documentation found for package "${pkg}". Use list_sections to see available packages.`,
        }],
      }
    }

    let examples: CodeExample[] = []

    for (const page of pages) {
      const blocks = extractCodeBlocks(page.content)
      for (const block of blocks) {
        if (language && block.language !== language) continue
        examples.push({
          ...block,
          pageTitle: page.title,
          pageSlug: page.slug,
        })
      }
    }

    examples = examples.slice(0, Math.min(limit ?? 20, 100))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          package: pkg,
          totalExamples: examples.length,
          examples: examples.map((e) => ({
            language: e.language,
            code: e.code,
            source: `${e.pageTitle} (${e.pageSlug})`,
          })),
        }, null, 2),
      }],
    }
  })
}
```

**Verification:** Call `list_sections()` and confirm it returns sections matching the `content/docs/` directory structure. Call `get_code_examples({ package: "react" })` and confirm it returns TypeScript/TSX code blocks.

---

### 3.9 Implement `prompts/explain-api.ts` and `prompts/guide-me.ts` (1h)

**File:** `apps/tour-kit-mcp/src/prompts/explain-api.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

export function registerExplainApiPrompt(server: McpServer): void {
  server.registerPrompt('explain-api', {
    description: 'Generate a prompt that asks Claude to explain a Tour Kit API (hook, component, or utility) with examples, parameters, and common patterns.',
    inputSchema: z.object({
      api: z.string().describe('API name to explain (e.g., "useTour", "TourCard", "TourProvider")'),
      detail: z.enum(['brief', 'detailed']).optional().default('detailed').describe('Level of detail'),
    }),
  }, async ({ api, detail }) => {
    const detailInstructions = detail === 'brief'
      ? 'Give a concise explanation (2-3 paragraphs max). Focus on what it does and a single usage example.'
      : 'Give a thorough explanation including: purpose, all parameters/props with types, return values, a basic usage example, an advanced usage example, and common pitfalls.'

    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Explain the Tour Kit API: \`${api}\`.`,
            '',
            detailInstructions,
            '',
            'Use the search_docs and get_page tools to find the official documentation for this API before answering. Base your explanation on the actual documentation, not general knowledge.',
          ].join('\n'),
        },
      }],
    }
  })
}
```

**File:** `apps/tour-kit-mcp/src/prompts/guide-me.ts`

```typescript
import type { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

export function registerGuideMePrompt(server: McpServer): void {
  server.registerPrompt('guide-me', {
    description: 'Generate a prompt that asks Claude to guide the user through implementing a specific Tour Kit feature step by step.',
    inputSchema: z.object({
      goal: z.string().describe('What the user wants to achieve (e.g., "create a multi-step onboarding tour", "add hint beacons to my app")'),
      framework: z.enum(['next-app-router', 'next-pages-router', 'vite', 'remix', 'other']).optional().default('next-app-router').describe('Target framework'),
      experience: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate').describe('User experience level with Tour Kit'),
    }),
  }, async ({ goal, framework, experience }) => {
    const frameworkNote = framework === 'other'
      ? 'The user is using a React framework not listed. Provide generic React instructions.'
      : `The user is using ${framework}.`

    const experienceNote = {
      beginner: 'Assume the user has never used Tour Kit before. Start from installation.',
      intermediate: 'Assume Tour Kit is already installed. Focus on the implementation.',
      advanced: 'Skip basics. Focus on advanced patterns, optimization, and edge cases.',
    }[experience]

    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Guide me through: ${goal}`,
            '',
            `${frameworkNote} ${experienceNote}`,
            '',
            'Use the search_docs, get_page, and get_code_examples tools to find relevant documentation and examples. Provide a step-by-step implementation guide with code snippets from the official docs.',
          ].join('\n'),
        },
      }],
    }
  })
}
```

**Implementation notes:**
- Prompts in MCP are templates that generate pre-filled messages for the LLM. They reference the server's own tools, creating a self-contained workflow.
- The `registerPrompt` method takes a name, metadata with optional `inputSchema`, and an async handler returning `{ messages }`.
- Confirm the exact `registerPrompt` API signature against the MCP SDK version. The handler may need to return a different shape than shown here.

**Verification:** List prompts via MCP client. Select `explain-api` with `{ api: "useTour" }` and confirm it generates a well-formed user message.

---

### 3.10 Wire everything in `server.ts` and `index.ts` (1h)

**File:** `apps/tour-kit-mcp/src/server.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/server'
import { registerPagesResource } from './resources/pages.js'
import { registerNavResource } from './resources/nav.js'
import { registerSearchTool } from './tools/search.js'
import { registerGetPageTool } from './tools/get-page.js'
import { registerListSectionsTool } from './tools/list-sections.js'
import { registerCodeExamplesTool } from './tools/code-examples.js'
import { registerExplainApiPrompt } from './prompts/explain-api.js'
import { registerGuideMePrompt } from './prompts/guide-me.js'

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'tour-kit-docs',
    version: '0.1.0',
  })

  // Register resources
  registerPagesResource(server)
  registerNavResource(server)

  // Register tools
  registerSearchTool(server)
  registerGetPageTool(server)
  registerListSectionsTool(server)
  registerCodeExamplesTool(server)

  // Register prompts
  registerExplainApiPrompt(server)
  registerGuideMePrompt(server)

  return server
}
```

**File:** `apps/tour-kit-mcp/src/index.ts` (update from placeholder)

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/server'
import { createServer } from './server.js'

async function main() {
  const startTime = performance.now()

  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)

  const elapsed = performance.now() - startTime
  // Log to stderr (not stdout — stdout is the MCP transport)
  console.error(`tour-kit-docs MCP server started in ${elapsed.toFixed(0)}ms`)
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error)
  process.exit(1)
})
```

**Implementation notes:**
- All logging goes to `stderr` — `stdout` is reserved for the MCP stdio transport.
- The `createServer()` factory pattern makes the server testable: you can create an instance and call tools directly in tests without starting the transport.
- The startup time measurement in `index.ts` validates the <500ms exit criterion.

**Verification:** `pnpm --filter @tour-kit/docs-mcp build && node apps/tour-kit-mcp/dist/index.js` starts and logs startup time to stderr.

---

### 3.11 Test with Claude Desktop (1h)

**Manual testing steps:**

1. Add to Claude Desktop MCP config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "tour-kit-docs": {
      "command": "node",
      "args": ["/absolute/path/to/apps/tour-kit-mcp/dist/index.js"]
    }
  }
}
```

2. Restart Claude Desktop. Verify `tour-kit-docs` appears in the MCP server list.

3. Test each tool with these queries:

| Tool | Query | Expected Result |
|---|---|---|
| `search_docs` | `{ "query": "useTour" }` | Returns page for `useTour` hook at rank 1 |
| `search_docs` | `{ "query": "focus trap" }` | Returns accessibility-related pages |
| `search_docs` | `{ "query": "announcement modal" }` | Returns announcements package pages |
| `get_page` | `{ "slug": "core/hooks/use-tour" }` | Returns full markdown content |
| `get_page` | `{ "slug": "nonexistent" }` | Returns helpful error message |
| `list_sections` | `{}` | Returns all sections with correct page counts |
| `get_code_examples` | `{ "package": "react" }` | Returns TSX code blocks from react docs |

4. Test with Cursor MCP config (similar setup, `.cursor/mcp.json`).

5. Verify startup time is under 500ms from the stderr log.

**Pass criteria:** All 7 test queries return correct results. Server starts in <500ms. Works in both Claude Desktop and Cursor.

---

## 4. Deliverables

```
apps/tour-kit-mcp/
├── package.json                        # Task 3.1 — NEW
├── tsconfig.json                       # Task 3.1 — NEW
├── tsup.config.ts                      # Task 3.1 — NEW
├── bin/
│   └── tour-kit-docs                   # Task 3.1 — NEW (shebang entry)
└── src/
    ├── index.ts                        # Task 3.1, 3.10 — NEW (stdio entry)
    ├── server.ts                       # Task 3.10 — NEW (McpServer setup)
    ├── source-adapter.ts               # Task 3.2 — NEW (Fumadocs wrapper)
    ├── resources/
    │   ├── pages.ts                    # Task 3.5 — NEW (docs://pages)
    │   └── nav.ts                      # Task 3.5 — NEW (docs://nav)
    ├── tools/
    │   ├── search.ts                   # Task 3.6 — NEW (search_docs)
    │   ├── get-page.ts                 # Task 3.7 — NEW (get_page)
    │   ├── list-sections.ts            # Task 3.8 — NEW (list_sections)
    │   └── code-examples.ts            # Task 3.8 — NEW (get_code_examples)
    ├── prompts/
    │   ├── explain-api.ts              # Task 3.9 — NEW
    │   └── guide-me.ts                 # Task 3.9 — NEW
    └── utils/
        ├── mdx-stripper.ts             # Task 3.3 — NEW
        └── search-index.ts             # Task 3.4 — NEW
```

---

## 5. Exit Criteria

Exit criteria are 1:1 with deliverables:

- [ ] `npx @tour-kit/docs-mcp` (or `node apps/tour-kit-mcp/dist/index.js`) starts in <500ms and logs startup time to stderr
- [ ] `search_docs` returns relevant ranked results for "useTour", "focus trap", and "announcement modal"
- [ ] `get_page` returns full markdown content for any valid slug (e.g., `core/hooks/use-tour`)
- [ ] `get_page` returns a helpful error message for invalid slugs
- [ ] `list_sections` returns all documentation sections with correct page counts matching `source.getPages()` totals
- [ ] `get_code_examples` extracts code blocks with correct language tags from package documentation
- [ ] `docs://pages` resource returns a JSON listing of all pages with slug, title, description, URL, and section
- [ ] `docs://nav` resource returns all sections with page counts
- [ ] `explain-api` and `guide-me` prompts generate well-formed user messages referencing the server's own tools
- [ ] Server works in Claude Desktop MCP config: tools appear and return correct results
- [ ] Server works in Cursor MCP config (`.cursor/mcp.json`)
- [ ] `pnpm --filter @tour-kit/docs-mcp build` succeeds with zero TypeScript errors
- [ ] MDX stripping preserves code blocks while removing imports, JSX components, and MDX expressions

---

## 6. Execution Prompt

You are implementing Discoverability Phase 3 of the Tour Kit project — the MCP server. This phase creates a standalone MCP server at `apps/tour-kit-mcp/` that exposes Tour Kit documentation to Claude Desktop, Cursor, Windsurf, and any MCP-compatible client.

### Context

- **Monorepo:** pnpm + Turborepo. New package at `apps/tour-kit-mcp/`.
- **Docs source:** Fumadocs source loader at `apps/docs/lib/source.ts`. Content lives in `apps/docs/content/docs/`.
- **Phase 0 confirmed:** Fumadocs `source.getPages()` returns page data outside Next.js runtime; MCP SDK responds to `tools/list` via stdio.
- **Target runtime:** Node.js 20+, ESM only.
- **Build:** tsup, single entry point (`src/index.ts`), ESM output.

### Confirmed MCP SDK API (from Context7, 2026-03-23)

```typescript
import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

const server = new McpServer({ name: 'my-server', version: '1.0.0' })

// Register a tool
server.registerTool('tool-name', {
  description: 'Tool description',
  inputSchema: z.object({ query: z.string() }),
}, async ({ query }) => {
  return { content: [{ type: 'text', text: 'result' }] }
})

// Connect transport
const transport = new StdioServerTransport()
await server.connect(transport)
```

### Confirmed Fumadocs Source API (from Context7, 2026-03-23)

```typescript
import { source } from '@/lib/source'

source.getPages()                            // all pages
source.getPage(['getting-started', 'installation'])  // specific page
source.getPageTree()                         // navigation tree

// Each page has:
// page.slugs         — string[] (e.g., ['core', 'hooks', 'use-tour'])
// page.url           — string (e.g., '/docs/core/hooks/use-tour')
// page.data.title    — string
// page.data.description — string | undefined
// page.data.body     — MDX content
// page.data.toc      — table of contents array
// page.data.structuredData — search-optimized object
```

### Data Model Rules

1. All types use TypeScript `interface` (not `type`) except for unions.
2. No `any` — use `unknown` or generics.
3. All tool handlers return `{ content: [{ type: 'text', text: string }] }`.
4. All logging goes to `stderr` (stdout is the MCP transport).
5. Source adapter uses lazy-loaded singleton pattern — build index once, cache for server lifetime.
6. Search scoring: title exact (10), title partial (5), description (3), heading (2), content (1).
7. Zod v4 for all input schemas (`import * as z from 'zod/v4'`).

### Implementation Order

1. **Scaffold package** (Task 3.1) — package.json, tsconfig, tsup, bin entry.
2. **MDX stripper** (Task 3.3) — no dependencies, can test in isolation.
3. **Source adapter** (Task 3.2) — depends on MDX stripper; wraps Fumadocs.
4. **Search index** (Task 3.4) — depends on source adapter for page data.
5. **Resources** (Task 3.5) — depends on source adapter.
6. **Tools** (Tasks 3.6, 3.7, 3.8) — depend on source adapter + search index.
7. **Prompts** (Task 3.9) — standalone, no dependencies.
8. **Wire server** (Task 3.10) — imports and registers everything.
9. **Manual test** (Task 3.11) — Claude Desktop + Cursor.

### Verification Commands

```bash
# Build the MCP server
pnpm --filter @tour-kit/docs-mcp build

# Start the server (should log startup time to stderr)
node apps/tour-kit-mcp/dist/index.js

# Test with MCP Inspector (if available)
npx @modelcontextprotocol/inspector node apps/tour-kit-mcp/dist/index.js
```

### Fallback: If Fumadocs Source Cannot Be Imported Directly

If the `source` object from `apps/docs/lib/source.ts` cannot be imported in a standalone Node.js process (due to Next.js runtime dependencies), use this fallback:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const CONTENT_DIR = path.resolve('apps/docs/content/docs')

function loadPages(): DocPage[] {
  // Recursively read all .mdx files
  // Parse frontmatter with gray-matter
  // Strip MDX with mdx-stripper
  // Build DocPage objects from filesystem
}
```

Add `gray-matter` as a dependency if using this fallback.

---

## Readiness Check

Before starting Discoverability Phase 3, confirm:

- [ ] Phase 0 spike complete: Fumadocs `source.getPages()` returns page data in a standalone Node.js script (or the fallback approach is confirmed)
- [ ] Phase 0 spike complete: MCP SDK starts and responds to `tools/list` via stdio transport
- [ ] `@modelcontextprotocol/server` package is available on npm at version `^1.0.0`
- [ ] `zod` version `^3.25.0` is available (provides `zod/v4` import path)
- [ ] `apps/docs/content/docs/` directory exists and contains MDX files
- [ ] `pnpm install` works at the monorepo root
- [ ] Node.js 20+ is installed (`node --version` confirms)
- [ ] Claude Desktop is installed for manual testing (Task 3.11)
- [ ] The `apps/tour-kit-mcp/` directory does not exist yet (will be scaffolded in Task 3.1)

Phase 3 is ready to begin when all boxes are checked.
