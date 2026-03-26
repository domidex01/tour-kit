# Discoverability Phase 0 — Validation Gate

**Duration:** Days 1–2 (~5h)
**Depends on:** Nothing
**Blocks:** Phase 1, Phase 3
**Risk Level:** HIGH — research/spike; binary go/no-go gate; if Fumadocs source cannot be extracted outside Next.js or the llms.txt standard is fragmented across LLM vendors, the architecture must pivot
**Stack:** nextjs, typescript
**Runner:** `apps/docs/` (Fumadocs source), standalone Node scripts for spikes

---

## 1. Objective + What Success Looks Like

Phase 0 answers three questions before any production code is written:

1. **Does the llms.txt standard have a single, authoritative format that major LLMs actually consume?** — ChatGPT, Claude, and Gemini may each expect different file structures. If the llmstxt.org spec is the canonical reference, we standardize on it. If vendors diverge, we need to know before committing to Phase 1.
2. **Can Fumadocs `source.getPages()` be called outside the Next.js runtime?** — The MCP server (Phase 3) and the CI generation script (Phase 6) both need to extract page data from a standalone Node process. If Fumadocs requires the Next.js request context, we need a fallback (raw MDX parsing with gray-matter + remark).
3. **Does the MCP SDK (`@modelcontextprotocol/server`) work with stdio transport in our monorepo's Node environment?** — A minimal server must start and respond to `tools/list` before we commit to the full MCP implementation in Phase 3.

This is not a feature phase. No production code ships. The outputs are throwaway spike scripts and a documented go/no-go decision.

**Success looks like:**

1. llms.txt format confirmed with at least 2 independent sources (llmstxt.org spec + one real-world example from a major library like Vercel, Tailwind, or shadcn)
2. `source.getPages()` returns an array of page objects with `title`, `description`, and `body` fields when called from a standalone `tsx` script (not inside a Next.js route)
3. `source.getPage(['getting-started', 'installation'])` returns a single page object for a known slug
4. `source.getPageTree()` returns a navigation tree that can be serialized to JSON
5. A minimal MCP server starts, responds to `tools/list` with one registered tool, and exits cleanly
6. Next.js API routes at `apps/docs/app/api/` can import `source` and serve page content as JSON (confirming runtime compatibility for Phase 4)
7. `plan/phase-0-status.json` records the decision with evidence for each spike

---

## 2. What Failure Looks Like (and what to do)

| Failure Mode | Symptom | Response |
|---|---|---|
| llms.txt standard is fragmented | llmstxt.org spec exists but ChatGPT ignores it in favor of a different format; Claude and Gemini each expect different structures | **Adjust** — serve both `llms.txt` (llmstxt.org format) and `llms-full.txt` (complete dump). The standard format is our primary target; the full dump is the fallback. Document which LLMs consume which file. |
| llmstxt.org spec is abandoned or draft-only | Site is down, spec has not been updated in 6+ months, no major libraries have adopted it | **Adjust** — adopt the most common convention from real-world examples (Vercel, Tailwind, shadcn). Document the chosen format and rationale. Phase 1 proceeds with the pragmatic format. |
| Fumadocs `source` requires Next.js runtime | Importing `source` from a standalone Node script throws errors about missing request context, `next/headers`, or `__next_internal_*` globals | **Adjust** — fall back to parsing raw MDX files with `gray-matter` for frontmatter + `remark` for markdown body. This adds ~1h to Phase 3 and Phase 6 but is a known, reliable path. |
| Fumadocs `getPages()` returns incomplete data | Pages exist but `body` or `structuredData` fields are missing or empty | **Adjust** — check if body requires a separate `page.data.load()` call. If data is lazy-loaded, add the loader step. If fields genuinely don't exist outside Next.js, fall back to raw MDX parsing. |
| MCP SDK fails to start with stdio transport | `McpServer` constructor throws, `server.connect(transport)` hangs, or `tools/list` request times out | **Adjust** — verify Node.js version (>= 18 required). Check if MCP SDK requires ESM-only invocation. Try running with `--experimental-vm-modules` flag. If fundamentally broken: evaluate `@anthropic-ai/sdk` direct tool use as an alternative to the MCP protocol. |
| MCP SDK peer dependency conflicts | `pnpm install` fails due to conflicting versions when `@modelcontextprotocol/server` is added to the monorepo | **Adjust** — install MCP SDK in a dedicated `apps/tour-kit-mcp/` workspace with isolated dependencies. Use `.npmrc` overrides if needed. |
| Next.js API routes cannot import Fumadocs source | Route handler throws "Module not found" or "Server Component" errors when importing from `@/.source/server` | **Adjust** — the source loader may need to be re-exported from a server-only module. Try importing from `apps/docs/lib/source.ts` which already wraps the loader. |

**Decision framework:**
- All 3 spikes pass --> **proceed** to Phase 1
- 1–2 spikes fail with documented workarounds --> **adjust** (record workarounds, re-estimate affected phases, proceed)
- Fumadocs extraction fundamentally impossible AND no fallback works --> **abort** MCP server approach; pivot to static-only llms.txt generation from raw MDX files

---

## 3. Key Design Decisions

**D1: Spike code lives in `spike/` at the monorepo root, not inside any package.**
Spike scripts are throwaway validation code. Placing them at `spike/` keeps them out of any package's build pipeline and makes cleanup obvious.

**D2: Fumadocs extraction spike imports directly from `apps/docs/lib/source.ts`.**
This is the same source loader the docs site uses. If it works in a standalone script, it will work in the MCP server and CI scripts. If it fails, we know immediately that an alternative extraction path is needed.

**D3: MCP hello spike uses `@modelcontextprotocol/server` with `StdioServerTransport`.**
This is the canonical SDK entry point confirmed via Context7. The spike registers one dummy tool and validates the full lifecycle: server creation, tool registration, transport connection, and request handling.

**D4: No external API keys required for any spike.**
The Fumadocs extraction and MCP hello spikes are purely local. No OpenAI or Anthropic API keys are needed. This keeps Phase 0 zero-cost and runnable offline.

### Data Model Strategy

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Source extraction | Import `source` from `apps/docs/lib/source.ts` | Reuses existing Fumadocs loader; validates runtime compatibility |
| Fallback extraction | `gray-matter` + `remark` on raw `.mdx` files | Proven approach if Fumadocs requires Next.js runtime |
| MCP SDK version | `@modelcontextprotocol/server@latest` | Pin to exact version after spike succeeds |
| Spike output format | Console logs + `plan/phase-0-status.json` | No UI needed; terminal output is sufficient for validation |
| Zod usage | `zod/v4` for MCP tool input schemas (per MCP SDK API) | MCP SDK requires Zod v4 for `inputSchema` parameter |

---

## 4. Tasks

### Task 0.1 — Research llmstxt.org Spec (1h)

Confirm the llms.txt standard format by examining the spec and real-world adoption.

**What to research:**
1. Read the llmstxt.org specification — document the required structure (title line, blockquote description, `## Section` headings, `- [Title](url): description` link format)
2. Find 3+ real-world `llms.txt` files from major libraries (check: Vercel/Next.js, Tailwind CSS, shadcn/ui, Fumadocs itself, Stripe, Supabase)
3. Verify whether ChatGPT, Claude, and Gemini auto-fetch `/llms.txt` or if it requires explicit user action
4. Document the relationship between `llms.txt` (index) and `llms-full.txt` (complete content)

**Output:** Research notes in `plan/phase-0-status.json` under the `llmstxt` spike entry.

### Task 0.2 — Spike: Fumadocs Source Extraction (1.5h)

Prove that `source.getPages()`, `source.getPage(slug)`, and `source.getPageTree()` return usable data from a standalone Node script.

**Implementation:** Create `spike/fumadocs-extract.ts`:

```typescript
import { source } from '../apps/docs/lib/source'

async function main() {
  // Test 1: getPages() returns all pages
  const pages = source.getPages()
  console.log(`[fumadocs-extract] Total pages: ${pages.length}`)
  console.log(`[fumadocs-extract] First page:`, {
    title: pages[0]?.data?.title,
    description: pages[0]?.data?.description,
    slug: pages[0]?.slugs,
  })

  // Test 2: getPage() returns a specific page
  const page = source.getPage(['getting-started', 'installation'])
  if (page) {
    console.log(`[fumadocs-extract] getPage() found:`, {
      title: page.data.title,
      description: page.data.description,
      url: page.url,
    })
  } else {
    console.error('[fumadocs-extract] getPage() returned null — slug may be wrong')
  }

  // Test 3: getPageTree() returns navigation tree
  const tree = source.getPageTree()
  console.log(`[fumadocs-extract] Page tree root children:`, tree.children?.length ?? 0)
  console.log(`[fumadocs-extract] Tree structure (first 3):`, JSON.stringify(tree.children?.slice(0, 3), null, 2))

  // Test 4: Extract 5 pages as plain text samples
  const samplePages = pages.slice(0, 5)
  for (const p of samplePages) {
    console.log(`\n--- ${p.data.title} (${p.url}) ---`)
    console.log(`Description: ${p.data.description ?? '(none)'}`)
    console.log(`Slug: ${p.slugs.join('/')}`)
  }
}

main().catch((err) => {
  console.error('[fumadocs-extract] FAILED:', err.message)
  process.exit(1)
})
```

**Run:**
```bash
cd /mnt/c/Users/domi/Desktop/next-playground/tour-kit
npx tsx spike/fumadocs-extract.ts
```

**What to measure:**
- Does the script run without Next.js-specific errors?
- Does `getPages()` return all ~150+ pages?
- Does each page have `title`, `description`, and `slugs` fields?
- Does `getPage()` return a single page for a known slug?
- Does `getPageTree()` return a tree structure with children?

**If it fails:** Try importing the raw Fumadocs source (`docs.toFumadocsSource()`) instead of the wrapped `source` loader. If that also fails, test raw MDX parsing with `gray-matter`:

```typescript
import matter from 'gray-matter'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const docsDir = 'apps/docs/content/docs'
// ... parse .mdx files directly
```

### Task 0.3 — Spike: MCP Hello Server (1.5h)

Prove the MCP SDK starts, registers a tool, and responds to `tools/list` via stdio transport.

**Implementation:** Create `spike/mcp-hello.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

const server = new McpServer({
  name: 'tour-kit-docs-spike',
  version: '0.0.1',
})

// Register one dummy tool
server.registerTool('hello', {
  description: 'Returns a hello message — Phase 0 validation only',
  inputSchema: z.object({
    name: z.string().describe('Name to greet'),
  }),
}, async ({ name }) => {
  return {
    content: [{ type: 'text', text: `Hello, ${name}! Tour Kit docs MCP server is working.` }],
  }
})

async function main() {
  const transport = new StdioServerTransport()
  console.error('[mcp-hello] Starting MCP server on stdio...')
  await server.connect(transport)
  console.error('[mcp-hello] Server connected and ready.')
}

main().catch((err) => {
  console.error('[mcp-hello] FAILED:', err.message)
  process.exit(1)
})
```

**Run:**
```bash
cd /mnt/c/Users/domi/Desktop/next-playground/tour-kit
pnpm add -D @modelcontextprotocol/server zod -w
npx tsx spike/mcp-hello.ts
```

**What to measure:**
- Does the server start without errors?
- Can you send a JSON-RPC `tools/list` request via stdin and get a response listing the `hello` tool?
- Does the `hello` tool respond correctly when invoked?

**Testing with Claude Desktop (optional):**
Add to Claude Desktop MCP config (`~/.config/claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "tour-kit-spike": {
      "command": "npx",
      "args": ["tsx", "/mnt/c/Users/domi/Desktop/next-playground/tour-kit/spike/mcp-hello.ts"]
    }
  }
}
```

### Task 0.4 — Verify Next.js API Routes (0.5h)

Confirm that Next.js API route handlers can import and use the Fumadocs `source` loader.

**Implementation:** Temporarily create `apps/docs/app/api/docs-spike/route.ts`:

```typescript
import { source } from '@/lib/source'
import { NextResponse } from 'next/server'

export async function GET() {
  const pages = source.getPages()
  return NextResponse.json({
    totalPages: pages.length,
    sampleTitles: pages.slice(0, 5).map((p) => p.data.title),
  })
}
```

**Run:**
```bash
cd /mnt/c/Users/domi/Desktop/next-playground/tour-kit
pnpm --filter docs dev
# Then: curl http://localhost:3000/api/docs-spike
```

**What to measure:**
- Does the route return JSON with the correct page count?
- Are there any "server-only" or module resolution errors?

### Task 0.5 — Go/No-Go Decision (0.5h)

Document results of all spikes and make the proceed/adjust/abort decision.

**Output:** Create `plan/phase-0-status.json`:
```json
{
  "phase": "Discoverability-0",
  "date": "YYYY-MM-DD",
  "decision": "proceed | adjust | abort",
  "spikes": {
    "llmstxt": {
      "status": "pass | fail",
      "notes": "llmstxt.org spec confirmed. Format: title, blockquote, ## sections with - [Title](url): description links.",
      "sources": ["llmstxt.org", "example-library-1", "example-library-2"]
    },
    "fumadocsExtract": {
      "status": "pass | fail",
      "notes": "getPages() returned N pages. getPage() and getPageTree() work outside Next.js.",
      "pageCount": 0,
      "fieldsAvailable": ["title", "description", "slugs", "url"]
    },
    "mcpHello": {
      "status": "pass | fail",
      "notes": "MCP server started on stdio. tools/list responded with 1 tool. Tool invocation returned correct response."
    },
    "nextjsApiRoutes": {
      "status": "pass | fail",
      "notes": "API route at /api/docs-spike returned JSON with page count."
    }
  },
  "adjustments": [],
  "blockers": []
}
```

---

## 5. Deliverables

| Deliverable | Path | Lifetime |
|---|---|---|
| Fumadocs extraction spike | `spike/fumadocs-extract.ts` | Temporary — delete after Phase 0 |
| MCP hello spike | `spike/mcp-hello.ts` | Temporary — delete after Phase 0 |
| API route spike | `apps/docs/app/api/docs-spike/route.ts` | Temporary — delete after Phase 0 |
| Decision document | `plan/phase-0-status.json` | Permanent — audit trail |

---

## 6. Exit Criteria

- [ ] llms.txt standard format confirmed with at least 2 independent sources (llmstxt.org spec + 1 real-world example)
- [ ] Fumadocs `source.getPages()` returns page data outside the Next.js runtime (or fallback path documented)
- [ ] Fumadocs `source.getPage(slug)` returns a single page for a known slug
- [ ] Fumadocs `source.getPageTree()` returns a serializable navigation tree
- [ ] MCP server starts and responds to `tools/list` via stdio with 1 registered tool
- [ ] Next.js API route successfully imports and queries Fumadocs `source`
- [ ] `plan/phase-0-status.json` exists with a `decision` field set to `proceed`, `adjust`, or `abort`

---

## 7. Execution Prompt

> Paste this entire section into a fresh Claude Code session to run Phase 0.

---

You are running **Phase 0 (Validation Gate)** for the Tour Kit LLM Discoverability project. Your goal is to validate three technical assumptions before any production code is written.

### Monorepo Context

- **Root:** `/mnt/c/Users/domi/Desktop/next-playground/tour-kit/`
- **Package manager:** pnpm (workspace), Turborepo for build orchestration
- **Docs site:** `apps/docs/` — Fumadocs (Next.js App Router)
- **Source loader:** `apps/docs/lib/source.ts` — exports `source` from `fumadocs-core/source`
- **Existing llms.txt files:** `apps/docs/public/llms.txt` (465 lines), `apps/docs/public/llm.txt` (legacy), `apps/docs/public/llm-full.txt` (1749 lines)

### What to Measure

For each spike, measure and record:

1. **llms.txt Research (Task 0.1):** Is there a single canonical format at llmstxt.org? Do major libraries follow it? Do LLMs auto-fetch it?
2. **Fumadocs Extraction (Task 0.2):** Does `source.getPages()` return all pages from a standalone Node script? Does each page have title, description, slugs, url? Does `getPage()` work for a known slug? Does `getPageTree()` return a tree?
3. **MCP Hello (Task 0.3):** Does `McpServer` start with `StdioServerTransport`? Does `tools/list` return the registered tool? Does the tool respond correctly?
4. **Next.js API Route (Task 0.4):** Can an API route import `source` from `@/lib/source` and return page data as JSON?

### How to Run the Experiment

#### Step 1: Research llms.txt (Task 0.1)

Use web search to:
1. Read the llmstxt.org specification and document the required format
2. Find 3+ real-world `llms.txt` files (try: `https://nextjs.org/llms.txt`, `https://tailwindcss.com/llms.txt`, `https://ui.shadcn.com/llms.txt`, `https://fumadocs.vercel.app/llms.txt`, `https://supabase.com/llms.txt`)
3. Check whether the format matches llmstxt.org or if vendors deviate
4. Note whether `llms-full.txt` is part of the standard or a convention

Record findings in your notes. The key output is: "Does a single canonical format exist? YES/NO. What is it?"

#### Step 2: Fumadocs Extraction Spike (Task 0.2)

Create `spike/fumadocs-extract.ts` that imports `source` from `../apps/docs/lib/source` and calls:
- `source.getPages()` — log total count and first page's fields
- `source.getPage(['getting-started', 'installation'])` — log the result (try alternate slugs if this one fails)
- `source.getPageTree()` — log root children count and first 3 entries

Run with: `npx tsx spike/fumadocs-extract.ts`

If import fails (Next.js runtime dependency), try the fallback:
```typescript
import matter from 'gray-matter'
import { readFileSync } from 'fs'
import { glob } from 'glob'

const files = glob.sync('apps/docs/content/docs/**/*.mdx')
const pages = files.map(f => {
  const { data, content } = matter(readFileSync(f, 'utf-8'))
  return { path: f, title: data.title, description: data.description, content }
})
```

#### Step 3: MCP Hello Spike (Task 0.3)

Install MCP SDK: `pnpm add -D @modelcontextprotocol/server zod -w`

Create `spike/mcp-hello.ts` using this confirmed API:
```typescript
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

const server = new McpServer({ name: 'tour-kit-docs-spike', version: '0.0.1' })

server.registerTool('hello', {
  description: 'Returns a hello message',
  inputSchema: z.object({ name: z.string() }),
}, async ({ name }) => {
  return { content: [{ type: 'text', text: `Hello, ${name}!` }] }
})

const transport = new StdioServerTransport()
await server.connect(transport)
```

Run with: `npx tsx spike/mcp-hello.ts`

The server should start and wait for JSON-RPC input on stdin. Send a `tools/list` request to verify.

#### Step 4: Next.js API Route (Task 0.4)

Create `apps/docs/app/api/docs-spike/route.ts`:
```typescript
import { source } from '@/lib/source'
import { NextResponse } from 'next/server'

export async function GET() {
  const pages = source.getPages()
  return NextResponse.json({
    totalPages: pages.length,
    sampleTitles: pages.slice(0, 5).map(p => p.data.title),
  })
}
```

Run the docs dev server and `curl http://localhost:3000/api/docs-spike`.

#### Step 5: Record Decision (Task 0.5)

Create `plan/phase-0-status.json` with the results of all 4 spikes. Set `decision` to:
- `"proceed"` if all spikes pass
- `"adjust"` if 1-2 spikes fail with known workarounds (document in `adjustments`)
- `"abort"` if Fumadocs extraction is impossible AND fallback parsing fails

### Go/No-Go Decision

| Outcome | Criteria | Action |
|---|---|---|
| **Proceed** | All 4 spikes pass | Move to Phase 1. Delete spike files. |
| **Adjust** | 1-2 spikes fail with workarounds | Document workarounds. Re-estimate affected phases. Proceed. |
| **Abort** | Cannot extract docs content by any method | Stop. Evaluate manual-only llms.txt approach. |

### Cleanup After Decision

1. Delete `spike/` directory
2. Delete `apps/docs/app/api/docs-spike/` directory
3. Keep `plan/phase-0-status.json` (permanent audit trail)

---

## Readiness Check

Before starting Phase 0, confirm:

- [ ] `pnpm install` runs successfully at the monorepo root
- [ ] `pnpm --filter docs build` completes (docs site builds without pre-existing errors)
- [ ] `apps/docs/lib/source.ts` exists and exports `source`
- [ ] `apps/docs/content/docs/` contains MDX documentation files
- [ ] Node.js >= 18 is installed
- [ ] Internet access is available (for llms.txt research in Task 0.1)
- [ ] You understand that Phase 0 output is throwaway — only the decision document persists
