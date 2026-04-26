---
title: wiki-tech schema
type: schema
updated: 2026-04-26
---

*Tells Claude (and other LLM agents) how to maintain the **technical** wiki for the Tour Kit codebase. Read this before ingesting a source, answering a query, or running a lint pass.*

## Purpose

`wiki-tech/` is the **codebase brain** of Tour Kit. It exists so an LLM crawling this directory can answer questions about the package library without re-reading every file in `packages/`.

It is **not** the marketing wiki — that lives at `../wiki/`. This wiki is for engineering questions:

- "What does `useTourState` return and where is it defined?"
- "Why does `@tour-kit/announcements` peer-depend on `@tour-kit/scheduling`?"
- "How does the Unified Slot pattern reconcile Radix UI and Base UI?"
- "Which packages bundle `@floating-ui/react`?"

The wiki is the *answer*; `packages/` is the *evidence*.

## Sources (read-only)

Never modify. Ingest from them.

| Source | Location | What's there |
|---|---|---|
| Package code | `../packages/<name>/src/` | TypeScript source for every `@tour-kit/*` package |
| Package CLAUDE.md | `../packages/<name>/CLAUDE.md` | Per-package architectural notes from package authors |
| Package manifests | `../packages/<name>/package.json` | Versions, deps, peer deps, exports field |
| Public API entry points | `../packages/<name>/src/index.ts` | Authoritative export list |
| Build config | `../packages/<name>/tsup.config.ts`, `../turbo.json` | Bundle outputs and build graph |
| Project root CLAUDE.md | `../CLAUDE.md` | Monorepo conventions, coding rules, quality gates |
| Coding rules | `../tour-kit/rules/*.md` | TypeScript, React, hooks, components, a11y, testing, architecture, performance |

## Directory layout

```
wiki-tech/
├── CLAUDE.md           # This file (schema)
├── README.md           # Short human-facing intro
├── index.md            # Catalog of every page (content-oriented)
├── log.md              # Chronological log (append-only)
├── overview.md         # Top-level synthesis: what is Tour Kit, package map
├── packages/           # One page per @tour-kit/* package
├── architecture/       # Cross-cutting: monorepo, build, providers, slots, a11y
├── concepts/           # Reusable abstractions: positioning, storage, focus trap, licensing
└── sources/            # Per-source summaries citing the original path
```

One-level subdirs only. Don't nest deeper.

## Page structure

Every page starts with YAML frontmatter:

```yaml
---
title: "@tour-kit/core"
type: package | architecture | concept | source | overview
package: "@tour-kit/core"   # only for type: package
version: 0.5.0              # only for type: package; mirror packages/<name>/package.json
sources:
  - ../packages/core/CLAUDE.md
  - ../packages/core/src/index.ts
  - ../packages/core/package.json
updated: 2026-04-26
---
```

After frontmatter:

1. **One-line summary** in italics — what this page covers.
2. **Body** — short sections, scannable, heavy on tables, code fences for signatures and exports.
3. **Related** section at the bottom — links to 3-7 other wiki pages.

### Style rules

- **Numbers beat adjectives.** "<8KB gzip" not "lightweight". `useTourState() => { step, isOpen, ... }` not "returns tour state".
- **Tables > prose** when comparing packages, exports, or APIs.
- **Code fences for every public signature.** A reader should be able to copy the type from a wiki page without opening the source.
- **Cite every claim in `sources:` frontmatter** — every fact on the page must trace back to one of those files.
- **No banned words** (carries over from `../wiki/brand/voice.md`): revolutionary, game-changing, seamless, robust, leverage, blazingly fast, supercharge.
- **No emojis** in wiki pages.

## Linking

Use relative markdown links: `[useTourState](../concepts/hooks.md#usetourstate)`. Not Obsidian-style `[[wikilinks]]` — portability over ergonomics.

Every page links to at least 2 others. Orphan pages are a lint failure.

## Workflows

### Ingest a source

Triggered when package code changes, or when a reader spots a gap.

1. Read the source end-to-end (typically `packages/<name>/src/index.ts` plus `packages/<name>/CLAUDE.md`).
2. Identify which wiki pages are affected:
   - New package → new page in `packages/`.
   - New public export, hook, or component → update the relevant package page.
   - New cross-cutting pattern → new page in `architecture/` or `concepts/`.
3. Edit affected pages. Add the source path to each page's `sources:` frontmatter list.
4. Bump `version:` in frontmatter if `package.json` version changed.
5. Update `updated:` to today's date.
6. Update `index.md` if pages were created or removed.
7. Append a log entry to `log.md`.
8. If a source contradicts an existing claim, flag inline:
   `> **Conflict (2026-04-26):** Older note said X, source now says Y. Reconciled to Y because [reason].`

### Answer a query

1. Read `index.md` to find relevant pages.
2. Read those pages. Read source files only if the wiki is insufficient.
3. Synthesize. Cite wiki pages by path: `wiki-tech/packages/core.md`.
4. **If the answer is valuable, file it back into the wiki.** A new comparison, a tricky interaction between two packages — create a page in `concepts/` so the work compounds.

### Lint the wiki

Periodically (or on request):

- **Version drift** — page `version:` differs from `packages/<name>/package.json` `"version"`.
- **Source drift** — files in `sources:` have changed since `updated:`.
- **Broken refs** — a page mentions a hook/component/file that no longer exists in the source. Grep before trusting.
- **Orphans** — pages with no inbound links.
- **Gaps** — concepts referenced but lacking their own page.
- **Signature drift** — a code fence on a wiki page no longer matches the actual export.

Output a checklist of findings. Fix or file follow-ups.

## index.md format

`index.md` is a catalog, organized by section matching the directory layout. Each entry:

```
- [Title](path/file.md) — one-line summary
```

Alphabetical within each section. Update on every ingest that creates or deletes a page.

## log.md format

Append-only. Each entry starts with `## [YYYY-MM-DD] <op> | <subject>` so `grep "^## \[" log.md | tail` gives a quick timeline.

Operations: `ingest`, `query`, `lint`, `scaffold`.

Body: 2-5 lines. What happened, which pages changed, anything surprising.

## Maintenance principles

- **The wiki is the artifact, chat is transient.** Anything worth remembering goes in the wiki.
- **Cite sources in frontmatter.** Every page must be traceable to code or rules.
- **Update in place.** Don't create `core-v2.md`. Edit the existing page; the log preserves history.
- **Keep pages short.** If a page passes ~250 lines, split it into a `packages/<name>.md` + a `concepts/<topic>.md` companion.
- **Code first, prose second.** Wiki pages are technical references, not essays.
- **Mirror reality, don't editorialize.** If the package has 3 hooks, list 3. Don't invent a fourth that "would be useful".

## Difference from `../wiki/`

| | `wiki/` | `wiki-tech/` |
|---|---|---|
| Domain | Marketing, brand, GTM, audience | Codebase, packages, APIs |
| Sources | `marketing-strategy/`, `apps/docs/` | `packages/`, `tour-kit/rules/`, `CLAUDE.md` |
| Voice | TourKit brand voice (see `wiki/brand/voice.md`) | Technical reference: code fences, tables, numbers |
| Audience | Future humans drafting content | Future LLMs answering engineering questions |
| Frontmatter `type` | `product`, `brand`, `audience`, ... | `package`, `architecture`, `concept`, `source` |

The two wikis don't link to each other. They're separate brains for separate jobs.
