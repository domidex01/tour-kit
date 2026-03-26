# Discoverability Phase 1 — Standardize llms.txt

**Duration:** Days 3–4 (~4.5h)
**Depends on:** Phase 0 (llms.txt format confirmed via research spike)
**Blocks:** Phase 6 (CI freshness pipeline regenerates llms.txt from this template)
**Risk Level:** LOW — static file authoring with known format; no runtime dependencies; all changes are additive
**Stack:** nextjs, typescript
**Runner:** `apps/docs/` (Fumadocs Next.js app)

---

## 1. Objective + What Success Looks Like

Consolidate the three existing LLM documentation files (`llms.txt`, `llm.txt`, `llm-full.txt`) into two canonical files that follow the llmstxt.org standard, and update the AI Assistants documentation page with instructions for all major LLM tools.

Currently the docs site serves three overlapping files:
- `apps/docs/public/llms.txt` (465 lines) — custom format, not llmstxt.org compliant
- `apps/docs/public/llm.txt` — legacy duplicate, causes confusion
- `apps/docs/public/llm-full.txt` (1749 lines) — comprehensive dump, non-standard filename

After Phase 1:
- `/llms.txt` follows the llmstxt.org standard: title line, blockquote summary, `## Section` headings with `- [Title](url): description` links pointing to every documentation page
- `/llms-full.txt` contains the complete documentation dump (renamed from `llm-full.txt`, with version stamp and generation date)
- `/llm.txt` is removed (or redirected to `/llms.txt`)
- The AI Assistants page (`content/docs/ai-assistants/index.mdx`) is updated with new filenames, copy-paste snippets for ChatGPT, Claude, and Gemini, and download links
- The docs site `<head>` includes `<link rel="alternate" type="text/plain" href="/llms.txt">` for discoverability

**Success looks like:**

1. `curl https://docs-site.com/llms.txt` returns a file starting with `# Tour Kit` followed by a `>` blockquote, then `## Section` headings with linked page lists
2. Every documentation page appears as a `- [Title](url): description` entry under the appropriate section
3. `curl https://docs-site.com/llms-full.txt` returns the complete documentation dump with a version/date stamp in the first line
4. `curl https://docs-site.com/llm.txt` returns 404 (file removed)
5. The AI Assistants page shows instructions for ChatGPT, Claude, Cursor, Windsurf, and Gemini
6. View source on any docs page shows `<link rel="alternate" type="text/plain" href="/llms.txt">` in the `<head>`

---

## 2. Key Design Decisions

**D1: Follow llmstxt.org format exactly — title, blockquote, sections with links.**
The llmstxt.org spec defines a clear structure: `# Title`, `> Description blockquote`, then `## Section` headings containing `- [Page Title](full-url): One-line description` entries. This is the format Phase 0 confirmed. We follow it without deviation.

**D2: Use absolute URLs (with base domain) in llms.txt links.**
Links in `llms.txt` should be full URLs (`https://tour-kit-docs.vercel.app/docs/core/hooks/use-tour`) rather than relative paths. LLMs consuming the file outside the browser need resolvable URLs. The base URL is configurable via an environment variable or hardcoded constant.

**D3: Group pages by package/section, matching the docs site navigation.**
The `## Section` headings in `llms.txt` mirror the docs sidebar: Getting Started, Core, React, Hints, Adoption, Analytics, Announcements, Checklists, Media, Scheduling, Guides, Examples, API Reference. This makes the file intuitive for both LLMs and humans.

**D4: `llms-full.txt` is the existing `llm-full.txt` content, renamed and stamped.**
The content of `llm-full.txt` (1749 lines) is already comprehensive. Rename it to `llms-full.txt` (matching the `llms-` prefix convention), add a version stamp header (`# Tour Kit vX.Y.Z — Generated YYYY-MM-DD`), and ensure it exceeds 1500 lines.

> **Note (validated 2026-03-23):** `llms-full.txt` is NOT part of the llmstxt.org specification — the spec only defines `llms.txt`. The `-full.txt` convention is a community practice (originated from FastHTML's `llms-ctx-full.txt`). We adopt it because it provides a complete dump for tools that want the full context in one file.

**D5: Remove `llm.txt` entirely — no redirect, just delete.**
The legacy `llm.txt` is a duplicate of `llms.txt` with fewer exports listed. Removing it eliminates confusion. Since this is a static file served from `public/`, there is no URL redirect mechanism needed — it simply returns 404.

**D6: `<link rel="alternate">` goes in the root layout, not per-page.**
The `llms.txt` file describes the entire documentation site, not individual pages. A single `<link>` tag in `apps/docs/app/layout.tsx` is sufficient for discoverability.

### Data Model Strategy

| Concern | Decision | Rationale |
|---------|----------|-----------|
| llms.txt format | llmstxt.org standard (title + blockquote + sections with links) | Confirmed in Phase 0; adopted by Vercel, Fumadocs, and others |
| URL format | Absolute URLs with configurable base domain | LLMs need resolvable URLs; base URL differs between dev and prod |
| Section grouping | Mirror docs sidebar navigation (13 sections) | Consistent with user mental model; easy to maintain |
| llms-full.txt content | Rename existing `llm-full.txt` + add version stamp header | Content is already comprehensive; no rewrite needed |
| Legacy cleanup | Delete `llm.txt`, no redirect | Static file; 404 is acceptable for a file no one should be linking to |
| Server vs Client Component | `layout.tsx` is a Server Component (already) | `<link>` tag is static HTML; no client-side logic needed |
| Zod | Not applicable | No runtime validation in this phase |

---

## 3. Tasks

### Task 1.1 — Rewrite `llms.txt` in llmstxt.org Standard Format (2h)

Rewrite `apps/docs/public/llms.txt` to follow the llmstxt.org spec. The file must list every documentation page organized by section.

**Target structure:**
```markdown
# Tour Kit

> Tour Kit is a headless onboarding and product tour library for React. It provides sequential guided tours, persistent hints, onboarding checklists, product announcements, media embeds, feature adoption tracking, analytics integration, and time-based scheduling. All components are accessible (WCAG 2.1 AA), keyboard-navigable, and work with Next.js and Vite.

## Getting Started

- [Installation](https://tour-kit-docs.vercel.app/docs/getting-started/installation): Install Tour Kit packages with pnpm, npm, or yarn
- [Quick Start](https://tour-kit-docs.vercel.app/docs/getting-started/quick-start): Create your first product tour in 5 minutes
- ...

## Core

- [useTour](https://tour-kit-docs.vercel.app/docs/core/hooks/use-tour): Hook for managing tour lifecycle — start, stop, pause, resume
- [useStep](https://tour-kit-docs.vercel.app/docs/core/hooks/use-step): Hook for accessing current step data and navigation
- ...

## React

- [Tour](https://tour-kit-docs.vercel.app/docs/react/components/tour): Main tour component with spotlight overlay
- [TourCard](https://tour-kit-docs.vercel.app/docs/react/components/tour-card): Step content card with navigation controls
- ...

(... all 13 sections ...)
```

**Implementation approach:**
1. Use `source.getPages()` (or read the docs content directory) to get all page titles, descriptions, and URLs
2. Use `source.getPageTree()` (or read `meta.json` files) to determine section grouping
3. Write the file manually or via a quick script — the output is a static file committed to `public/`

**Verification:** The file starts with `# Tour Kit`, contains a `>` blockquote, has `## Section` headings, and every page appears as a `- [Title](url): description` entry.

### Task 1.2 — Rename `llm-full.txt` to `llms-full.txt` (0.5h)

Rename the file and add a version stamp header.

**Steps:**
1. Copy `apps/docs/public/llm-full.txt` to `apps/docs/public/llms-full.txt`
2. Add a header line: `# Tour Kit v0.4.1 — Complete Documentation — Generated YYYY-MM-DD`
3. Verify the file exceeds 1500 lines
4. Update any internal references to the old filename

**Files to check for references:**
- `apps/docs/content/docs/ai-assistants/index.mdx` (mentions `llm-full.txt`)
- `apps/docs/public/llms.txt` (may link to full version)
- `CLAUDE.md` files across the repo
- Root `llms.txt` at monorepo root

### Task 1.3 — Remove Legacy `llm.txt` (0.5h)

Delete the legacy file and verify no broken references.

**Steps:**
1. Delete `apps/docs/public/llm.txt`
2. Search the codebase for any references to `/llm.txt` or `llm.txt` and update them to `/llms.txt`
3. Verify `curl http://localhost:3000/llm.txt` returns 404 when running the dev server

**Files to search:**
```bash
grep -r "llm\.txt" apps/docs/ --include="*.tsx" --include="*.ts" --include="*.mdx" --include="*.json"
grep -r "llm\.txt" CLAUDE.md
```

### Task 1.4 — Update AI Assistants Documentation Page (1h)

Rewrite `apps/docs/content/docs/ai-assistants/index.mdx` with updated filenames and instructions for all major LLM tools.

**Updated content should include:**

1. **Overview** — what files are available and what they contain
2. **llms.txt** — standard index file with links to all documentation pages
3. **llms-full.txt** — complete documentation dump for full-context usage
4. **Usage with ChatGPT** — how to paste the URL or use Custom GPTs with the file
5. **Usage with Claude** — how to reference the file in Claude Code or Claude.ai
6. **Usage with Gemini** — how Google's grounding feature may discover the file
7. **Usage with Cursor / Windsurf** — how to add the file to project context
8. **Programmatic access** — `curl` examples with the new filenames

**Target MDX:**
```mdx
---
title: AI Assistants
description: Documentation resources optimized for AI coding assistants and LLMs
icon: Bot
---

# AI Assistants

Tour Kit provides machine-readable documentation files following the [llms.txt standard](https://llmstxt.org) for AI coding assistants and LLMs.

## Available Files

### llms.txt — Documentation Index

A structured index of all Tour Kit documentation pages, following the [llmstxt.org](https://llmstxt.org) standard format. Contains section headings with links and descriptions for every page.

**URL:** [`/llms.txt`](/llms.txt)

### llms-full.txt — Complete Documentation

The full content of all Tour Kit documentation in a single file. Use this when you need the AI to have comprehensive knowledge of the entire library.

**URL:** [`/llms-full.txt`](/llms-full.txt)

## Usage with AI Tools

### ChatGPT

Paste the llms-full.txt URL into your conversation:

\`\`\`
Read https://tour-kit-docs.vercel.app/llms-full.txt and use it as context for Tour Kit questions
\`\`\`

Or create a Custom GPT with the file as a knowledge source.

### Claude

In Claude Code, reference the documentation:

\`\`\`
Fetch https://tour-kit-docs.vercel.app/llms.txt to understand the Tour Kit API
\`\`\`

In Claude.ai, paste the content of llms-full.txt into your conversation for full context.

### Cursor / Windsurf

Add the llms.txt URL to your project's AI context:

1. Download `/llms.txt` to your project root
2. Reference it in your editor's AI context settings
3. The AI will use Tour Kit's documentation for code suggestions

### Gemini

Google Gemini with grounding can discover Tour Kit documentation via search. The llms.txt file and sitemap help Gemini index our docs accurately.

### Programmatic Access

\`\`\`bash
# Documentation index (llmstxt.org format)
curl https://tour-kit-docs.vercel.app/llms.txt

# Complete documentation
curl https://tour-kit-docs.vercel.app/llms-full.txt
\`\`\`
```

### Task 1.5 — Add `<link rel="alternate">` to Docs Layout (0.5h)

Add a `<link>` tag to `apps/docs/app/layout.tsx` so browsers and crawlers can discover the llms.txt file.

**Current layout** (`apps/docs/app/layout.tsx`):
```tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body ...>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
```

**Updated layout:**
```tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Documentation Index" />
      </head>
      <body ...>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
```

**Verification:** Run `pnpm --filter docs dev`, open any docs page, view source, and confirm the `<link>` tag appears in `<head>`.

---

## 4. Deliverables

| Deliverable | Path | Lifetime |
|---|---|---|
| Standardized llms.txt | `apps/docs/public/llms.txt` | Permanent — regenerated by CI in Phase 6 |
| Renamed llms-full.txt | `apps/docs/public/llms-full.txt` | Permanent — regenerated by CI in Phase 6 |
| Legacy llm.txt removed | `apps/docs/public/llm.txt` (deleted) | N/A |
| Updated AI Assistants page | `apps/docs/content/docs/ai-assistants/index.mdx` | Permanent |
| Updated docs layout | `apps/docs/app/layout.tsx` | Permanent |

---

## 5. Exit Criteria

- [ ] `/llms.txt` follows llmstxt.org format: starts with `# Tour Kit`, has `>` blockquote description, contains `## Section` headings with `- [Title](url): description` links
- [ ] Every documentation section (Getting Started, Core, React, Hints, Adoption, Analytics, Announcements, Checklists, Media, Scheduling, Guides, Examples, API Reference) has a heading in `llms.txt`
- [ ] `/llms-full.txt` contains complete documentation (>1500 lines) with a version/date stamp header
- [ ] Legacy `/llm.txt` is deleted from `apps/docs/public/`
- [ ] AI Assistants page (`content/docs/ai-assistants/index.mdx`) documents both files and includes usage instructions for ChatGPT, Claude, Cursor, Windsurf, and Gemini
- [ ] `<link rel="alternate" type="text/plain" href="/llms.txt">` appears in the docs site `<head>` via `apps/docs/app/layout.tsx`
- [ ] `pnpm --filter docs build` completes without errors

---

## 6. Execution Prompt

> Paste this entire section into a fresh Claude Code session to implement Phase 1.

---

You are implementing **Phase 1 (Standardize llms.txt)** for the Tour Kit LLM Discoverability project. Your goal is to consolidate three existing LLM documentation files into two canonical files following the llmstxt.org standard, update the AI Assistants docs page, and add a `<link>` tag for discoverability.

### Monorepo Context

- **Root:** `/mnt/c/Users/domi/Desktop/next-playground/tour-kit/`
- **Docs site:** `apps/docs/` (Fumadocs, Next.js App Router)
- **Source loader:** `apps/docs/lib/source.ts` — `source.getPages()` returns all pages, `source.getPageTree()` returns nav tree
- **Public files directory:** `apps/docs/public/`
- **Existing files:**
  - `apps/docs/public/llms.txt` (465 lines, custom format — needs rewrite)
  - `apps/docs/public/llm.txt` (legacy duplicate — needs deletion)
  - `apps/docs/public/llm-full.txt` (1749 lines — needs rename to `llms-full.txt`)
- **AI Assistants page:** `apps/docs/content/docs/ai-assistants/index.mdx`
- **Docs layout:** `apps/docs/app/layout.tsx`
- **Docs content root:** `apps/docs/content/docs/` (sections: getting-started, core, react, hints, adoption, analytics, announcements, checklists, media, scheduling, guides, examples, api, ai-assistants, concepts, frameworks, integrations)

### llmstxt.org Standard Format

The file must follow this structure exactly:

```
# Project Name

> One-paragraph description of the project.

## Section Name

- [Page Title](https://full-url/to/page): One-line description of the page

## Another Section

- [Page Title](https://full-url/to/page): One-line description
```

Key rules:
- Title is `# Tour Kit` (H1)
- Description is a `>` blockquote (1-3 sentences)
- Sections use `## Heading` (H2)
- Each page is `- [Title](url): description` (unordered list with link + colon + description)
- URLs must be absolute (use `https://tour-kit-docs.vercel.app` as base, or a configurable constant)

### Step-by-Step Implementation

#### Step 1: Rewrite `apps/docs/public/llms.txt` (Task 1.1)

Read the docs content to enumerate all pages and their sections. You can:
- Scan `apps/docs/content/docs/` directory structure and read `meta.json` files for ordering
- Read frontmatter from each `.mdx` file for title and description
- Or use `source.getPages()` if running a script

Write a new `llms.txt` following the llmstxt.org format. Group pages under these sections:
- Getting Started
- Core (hooks, providers, utilities, types)
- React (components, headless, adapters, styling)
- Hints
- Adoption
- Analytics
- Announcements
- Checklists
- Media
- Scheduling
- Guides
- Examples
- API Reference
- AI Assistants

Use `https://tour-kit-docs.vercel.app/docs/` as the base URL for all links.

#### Step 2: Rename `llm-full.txt` to `llms-full.txt` (Task 1.2)

1. Read `apps/docs/public/llm-full.txt`
2. Add a header: `# Tour Kit v0.4.1 — Complete Documentation — Generated 2026-03-24`
3. Write to `apps/docs/public/llms-full.txt`
4. Delete `apps/docs/public/llm-full.txt`
5. Verify the new file has >1500 lines

#### Step 3: Remove legacy `llm.txt` (Task 1.3)

1. Delete `apps/docs/public/llm.txt`
2. Search for references to `llm.txt` (not `llms.txt`) in the codebase and update them
3. Check: `apps/docs/content/docs/ai-assistants/index.mdx`, any `CLAUDE.md` files, any config files

#### Step 4: Update AI Assistants page (Task 1.4)

Rewrite `apps/docs/content/docs/ai-assistants/index.mdx` with:
- Updated file names (`llms.txt` and `llms-full.txt`)
- Reference to llmstxt.org standard
- Usage instructions for: ChatGPT, Claude (Code + .ai), Cursor, Windsurf, Gemini
- `curl` examples with full URLs
- Download links

#### Step 5: Add `<link rel="alternate">` to layout (Task 1.5)

Edit `apps/docs/app/layout.tsx` to add inside the `<html>` tag:
```tsx
<head>
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Documentation Index" />
</head>
```

Place it before the `<body>` tag. In Next.js App Router, a `<head>` element inside the `<html>` tag in `layout.tsx` is valid for adding extra tags.

#### Step 6: Verify

1. Run `pnpm --filter docs build` — must complete without errors
2. Run `pnpm --filter docs dev` and verify:
   - `http://localhost:3000/llms.txt` returns the new standardized file
   - `http://localhost:3000/llms-full.txt` returns the renamed full documentation
   - `http://localhost:3000/llm.txt` returns 404
   - `http://localhost:3000/docs/ai-assistants` shows the updated page
   - View source shows the `<link rel="alternate">` tag in `<head>`

Also update the root `llms.txt` file at the monorepo root (`/mnt/c/Users/domi/Desktop/next-playground/tour-kit/llms.txt`) if it exists and is a separate file from the docs public one — check if it should be kept in sync or if it serves a different purpose (codebase context for Claude Code vs. web-served docs context for LLMs).

---

## Readiness Check

Before starting Phase 1, confirm:

- [ ] Phase 0 completed with `decision: "proceed"` or `decision: "adjust"` in `plan/phase-0-status.json`
- [ ] llmstxt.org format has been confirmed (Phase 0, Task 0.1)
- [ ] `pnpm --filter docs build` completes without errors
- [ ] `apps/docs/public/llm-full.txt` exists and has >1500 lines
- [ ] `apps/docs/content/docs/ai-assistants/index.mdx` exists
- [ ] `apps/docs/app/layout.tsx` exists
- [ ] You have confirmed the docs site base URL (e.g., `https://tour-kit-docs.vercel.app`)
