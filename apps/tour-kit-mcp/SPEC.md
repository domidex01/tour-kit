# Tour Kit Docs MCP Server Specification

> MCP Server leveraging Fumadocs source for Tour Kit documentation

## Overview

This MCP server exposes the Tour Kit documentation as resources and tools, reusing the existing Fumadocs infrastructure from `apps/docs`. It enables AI assistants to search, browse, and retrieve documentation content.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (stdio)                       │
├─────────────────────────────────────────────────────────────┤
│  Resources          │  Tools              │  Prompts        │
│  - docs://pages     │  - search_docs      │  - explain_api  │
│  - docs://nav       │  - get_page         │  - guide_me     │
│                     │  - list_sections    │                 │
│                     │  - get_code_example │                 │
└─────────────────────┴─────────────────────┴─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Fumadocs Source Adapter                        │
├─────────────────────────────────────────────────────────────┤
│  - Parses MDX files from content/docs/                      │
│  - Extracts frontmatter (title, description)                │
│  - Strips JSX/imports, returns plain markdown               │
│  - Builds navigation tree from meta.json files              │
│  - Indexes content for full-text search                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Content Directory                              │
│              apps/docs/content/docs/                        │
├─────────────────────────────────────────────────────────────┤
│  *.mdx files        │  meta.json files                      │
│  (150+ pages)       │  (25+ navigation configs)             │
└─────────────────────┴───────────────────────────────────────┘
```

---

## Data Model

### Page

```typescript
interface DocPage {
  /** URL-safe slug path: ["core", "hooks", "use-tour"] */
  slug: string[]

  /** Full URL path: "/docs/core/hooks/use-tour" */
  url: string

  /** Frontmatter title */
  title: string

  /** Frontmatter description */
  description: string

  /** Section this page belongs to: "core" | "react" | "hints" | "guides" | etc. */
  section: string

  /** Raw MDX content (with JSX stripped for MCP consumption) */
  content: string

  /** Table of contents extracted from headings */
  toc: TableOfContentsItem[]

  /** Last modified timestamp (from git or file stat) */
  lastModified?: string
}

interface TableOfContentsItem {
  title: string
  url: string      // Anchor link: "#quick-install"
  depth: number    // Heading level: 1, 2, 3
}
```

### Navigation

```typescript
interface NavTree {
  /** Section title from meta.json */
  title: string

  /** Child pages or nested sections */
  children: (NavPage | NavSection)[]
}

interface NavPage {
  type: "page"
  title: string
  slug: string[]
  url: string
}

interface NavSection {
  type: "section"
  title: string
  children: (NavPage | NavSection)[]
}
```

### Search Result

```typescript
interface SearchResult {
  /** Page that matched */
  page: {
    title: string
    url: string
    section: string
  }

  /** Matching excerpt with context */
  excerpt: string

  /** Relevance score (0-1) */
  score: number

  /** What matched: "title" | "description" | "content" | "heading" */
  matchType: string
}
```

---

## Resources

### `docs://pages`

Returns a list of all documentation pages with metadata.

**URI Template:** `docs://pages`

**Response:**
```json
{
  "pages": [
    {
      "slug": ["getting-started", "installation"],
      "url": "/docs/getting-started/installation",
      "title": "Installation",
      "description": "Install TourKit in your React project",
      "section": "getting-started"
    }
  ],
  "total": 42
}
```

### `docs://pages/{slug}`

Returns the full content of a specific page.

**URI Template:** `docs://pages/{slug}` where slug is `/`-joined

**Example:** `docs://pages/core/hooks/use-tour`

**Response:**
```json
{
  "slug": ["core", "hooks", "use-tour"],
  "url": "/docs/core/hooks/use-tour",
  "title": "useTour",
  "description": "Access and control the current tour",
  "section": "core",
  "content": "# useTour\n\nThe `useTour` hook provides access to...",
  "toc": [
    { "title": "Usage", "url": "#usage", "depth": 2 },
    { "title": "API", "url": "#api", "depth": 2 }
  ]
}
```

### `docs://nav`

Returns the full navigation tree.

**URI Template:** `docs://nav`

**Response:**
```json
{
  "title": "Documentation",
  "children": [
    {
      "type": "section",
      "title": "Getting Started",
      "children": [
        { "type": "page", "title": "Installation", "slug": ["getting-started", "installation"], "url": "/docs/getting-started/installation" },
        { "type": "page", "title": "Quick Start", "slug": ["getting-started", "quick-start"], "url": "/docs/getting-started/quick-start" }
      ]
    }
  ]
}
```

---

## Tools

### `search_docs`

Full-text search across all documentation.

**Parameters:**
```typescript
{
  /** Search query string */
  query: string

  /** Filter to specific section(s) */
  sections?: (
    | "getting-started" | "core" | "react" | "hints"
    | "adoption" | "analytics" | "announcements" | "checklists" | "media" | "scheduling"
    | "guides" | "examples" | "api"
  )[]

  /** Maximum results to return (default: 10, max: 50) */
  limit?: number
}
```

**Returns:** `SearchResult[]`

**Examples:**
```json
// Search core hooks
{
  "query": "focus trap",
  "sections": ["core"],
  "limit": 5
}

// Search extended packages
{
  "query": "feature adoption nudge",
  "sections": ["adoption"],
  "limit": 10
}

// Search announcements
{
  "query": "modal frequency once",
  "sections": ["announcements"],
  "limit": 5
}

// Cross-package search
{
  "query": "scheduling business hours",
  "sections": ["scheduling", "announcements"],
  "limit": 10
}
```

**Response:**
```json
[
  {
    "page": {
      "title": "useFocusTrap",
      "url": "/docs/core/hooks/use-focus-trap",
      "section": "core"
    },
    "excerpt": "...The **useFocusTrap** hook manages keyboard focus within the tour card, preventing focus from escaping...",
    "score": 0.95,
    "matchType": "title"
  }
]
```

---

### `get_page`

Retrieve a specific documentation page by slug or URL.

**Parameters:**
```typescript
{
  /** Slug as array or string */
  slug: string | string[]
}
```

**Returns:** `DocPage`

**Example:**
```json
{ "slug": "react/components/tour-card" }
// or
{ "slug": ["react", "components", "tour-card"] }
```

---

### `list_sections`

List all available documentation sections with page counts.

**Parameters:** None

**Returns:**
```typescript
{
  sections: {
    name: string
    title: string
    pageCount: number
    pages: { title: string; url: string }[]
  }[]
}
```

**Response:**
```json
{
  "sections": [
    {
      "name": "core",
      "title": "Core",
      "pageCount": 15,
      "pages": [
        { "title": "Overview", "url": "/docs/core" },
        { "title": "useTour", "url": "/docs/core/hooks/use-tour" }
      ]
    },
    {
      "name": "react",
      "title": "React",
      "pageCount": 14,
      "pages": [...]
    }
  ]
}
```

---

### `get_code_examples`

Extract code blocks from documentation pages.

**Parameters:**
```typescript
{
  /** Filter by page slug (optional, returns all if omitted) */
  slug?: string

  /** Filter by language: "tsx", "typescript", "bash", "json" */
  language?: string

  /** Maximum examples to return */
  limit?: number
}
```

**Returns:**
```typescript
{
  examples: {
    code: string
    language: string
    page: { title: string; url: string }
    /** Context: heading above the code block */
    context?: string
  }[]
}
```

**Example:**
```json
{ "slug": "getting-started/installation", "language": "bash" }
```

**Response:**
```json
{
  "examples": [
    {
      "code": "pnpm add @tour-kit/react",
      "language": "bash",
      "page": { "title": "Installation", "url": "/docs/getting-started/installation" },
      "context": "Quick Install"
    }
  ]
}
```

---

## Prompts

### `explain_api`

Generate an explanation of a Tour Kit API.

**Arguments:**
```typescript
{
  /** API name: "useTour", "TourCard", "TourProvider", etc. */
  name: string
}
```

**Generated Prompt:**
```
You are explaining the Tour Kit API "{name}".

Use the following documentation:
{page.content}

Provide:
1. A one-sentence summary
2. When to use it
3. Key parameters/props
4. A minimal code example
```

---

### `guide_me`

Interactive guidance prompt for implementing tours.

**Arguments:**
```typescript
{
  /** What the user wants to achieve */
  goal: string

  /** User's tech stack context */
  framework?: "nextjs" | "vite" | "remix" | "cra"
}
```

**Generated Prompt:**
```
Help the user implement "{goal}" with Tour Kit.

User's framework: {framework}

Relevant documentation sections:
{searchResults}

Guide them step by step, referencing specific docs pages.
```

---

## Implementation Notes

### MDX Processing

The Fumadocs source provides compiled MDX. For MCP consumption, we need plain text:

```typescript
function stripMdxToMarkdown(mdxContent: string): string {
  return mdxContent
    // Remove import statements
    .replace(/^import\s+.*$/gm, '')
    // Remove JSX components, keep children text
    .replace(/<(\w+)[^>]*>([\s\S]*?)<\/\1>/g, '$2')
    // Remove self-closing JSX
    .replace(/<\w+[^/>]*\/>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
```

### Reusing Fumadocs Loader

The key insight is that `fumadocs-core/source` loader can work outside Next.js:

```typescript
// Standalone usage (no React/Next.js required)
import { docs } from '../apps/docs/.source/server'

// Get all pages
const pages = docs.getPages()

// Get single page
const page = docs.getPage(['core', 'hooks', 'use-tour'])

// Access data
page.data.title       // "useTour"
page.data.description // "Access and control the current tour"
page.data.body        // Compiled MDX (needs stripping)
page.slugs            // ["core", "hooks", "use-tour"]
page.url              // "/docs/core/hooks/use-tour"
```

### Search Implementation

Simple but effective approach using pre-built index:

```typescript
interface SearchIndex {
  pages: {
    slug: string[]
    title: string
    description: string
    headings: string[]
    content: string  // Stripped markdown
  }[]
}

function search(index: SearchIndex, query: string): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/)

  return index.pages
    .map(page => {
      let score = 0
      let matchType = 'content'

      // Title match (highest weight)
      if (terms.some(t => page.title.toLowerCase().includes(t))) {
        score += 10
        matchType = 'title'
      }

      // Description match
      if (terms.some(t => page.description.toLowerCase().includes(t))) {
        score += 5
        matchType = matchType === 'content' ? 'description' : matchType
      }

      // Heading match
      if (page.headings.some(h => terms.some(t => h.toLowerCase().includes(t)))) {
        score += 3
        matchType = matchType === 'content' ? 'heading' : matchType
      }

      // Content match
      const contentLower = page.content.toLowerCase()
      terms.forEach(term => {
        const matches = (contentLower.match(new RegExp(term, 'g')) || []).length
        score += matches * 0.1
      })

      return { page, score, matchType }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
}
```

---

## File Structure

```
apps/docs-mcp/
├── package.json
├── tsconfig.json
├── SPEC.md                 # This file
├── src/
│   ├── index.ts            # Entry point, stdio transport
│   ├── server.ts           # MCP server setup
│   ├── source-adapter.ts   # Wraps Fumadocs source
│   ├── resources/
│   │   ├── pages.ts        # docs://pages resource
│   │   └── nav.ts          # docs://nav resource
│   ├── tools/
│   │   ├── search.ts       # search_docs tool
│   │   ├── get-page.ts     # get_page tool
│   │   ├── list-sections.ts
│   │   └── code-examples.ts
│   ├── prompts/
│   │   ├── explain-api.ts
│   │   └── guide-me.ts
│   └── utils/
│       ├── mdx-stripper.ts # MDX → Markdown conversion
│       └── search-index.ts # Search indexing
└── bin/
    └── tour-kit-docs       # CLI entry point
```

---

## Package Configuration

```json
{
  "name": "@tour-kit/docs-mcp",
  "version": "0.1.0",
  "description": "MCP server for Tour Kit documentation",
  "type": "module",
  "bin": {
    "tour-kit-docs": "./bin/tour-kit-docs"
  },
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "fumadocs-core": "^16.4.1",
    "zod": "^3.23.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## Usage

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "tour-kit-docs": {
      "command": "npx",
      "args": ["@tour-kit/docs-mcp"]
    }
  }
}
```

### Local Development

```json
{
  "mcpServers": {
    "tour-kit-docs": {
      "command": "node",
      "args": ["./apps/docs-mcp/dist/index.js"]
    }
  }
}
```

---

## Content Inventory

Current documentation pages (150+ total):

| Section | Pages | Key Content |
|---------|-------|-------------|
| Getting Started | 4 | Installation, Quick Start, TypeScript |
| Core | 15 | Hooks (10), Providers (2), Utilities (9), Types (3) |
| React | 14 | Components (7), Headless (4), Adapters (4), Styling (3) |
| Hints | 4+ | Components, Hooks, Persistence, Headless |
| Adoption | 16 | Provider, Hooks (3), Components (4), Dashboard (5), Analytics, Types |
| Analytics | 15 | Provider, Hooks (2), Plugins (6), Custom Plugin, Types |
| Announcements | 21 | Provider, Hooks (3), Components (6), Headless (6), Config (3), Types |
| Checklists | 26 | Provider, Hooks (4), Components (5), Headless (2), Utilities (4), Types |
| Media | 21 | Components (9), Headless, Hooks (3), Utilities (2), Types |
| Scheduling | 18 | Hooks (3), Utilities (9), Types, Presets |
| Guides | 14 | Framework integration, A11y, Analytics, Persistence |
| Examples | 3 | Basic tour, Onboarding flow, Headless custom |
| API | 10 | All package API references |

---

## Future Enhancements

1. **Semantic Search** - Embed pages with OpenAI/local model for better relevance
2. **Live Reload** - Watch `content/docs/` for changes, rebuild index
3. **Version Support** - Serve docs for multiple Tour Kit versions
4. **Interactive Examples** - Return runnable code sandboxes
5. **Cross-Reference Resolution** - Resolve `@see` and internal links

---

## Success Criteria

- [ ] All 150+ doc pages accessible via resources
- [ ] Search returns relevant results for common queries
- [ ] Extended package searches work correctly (adoption, analytics, announcements, checklists, media, scheduling)
- [ ] Code examples extracted with proper language tagging
- [ ] Navigation tree matches sidebar structure
- [ ] Prompts generate useful context for AI assistants
- [ ] Server starts in < 500ms
- [ ] Full index builds in < 5s (accounting for larger content)
