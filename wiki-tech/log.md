# wiki-tech log

Append-only. Each entry header: `## [YYYY-MM-DD] <op> | <subject>`. Use `grep "^## \[" log.md | tail` for a quick timeline.

Operations: `ingest`, `query`, `lint`, `scaffold`.

---

## [2026-04-26] scaffold | initial wiki-tech build

Bootstrapped `wiki-tech/` mirroring the existing `wiki/` Karpathy-style schema, but for the codebase domain (raw sources = `packages/`).

Created:

- `CLAUDE.md` — schema with sources table, ingest/query/lint workflows, lint rules tuned for technical drift (version drift, signature drift, broken refs)
- `README.md`, `index.md`, `overview.md`, `log.md`
- `packages/` — 12 pages, one per `@tour-kit/*` package, sourced from each package's `CLAUDE.md`, `package.json`, and `src/index.ts`
- `architecture/` — 6 cross-cutting pages: monorepo, dependency-graph, build-pipeline, provider-architecture, accessibility, client-server-split
- `concepts/` — 12 pages: unified-slot, positioning-engine, storage-adapters, focus-trap, license-gating, queue-and-frequency, audience-targeting, router-adapters, plugin-system, schedule-evaluation, url-parsing, rag-pipeline
- `sources/` — 4 source-pointer pages: package CLAUDE.md files, package manifests, entry points, coding rules

Notable findings during ingest:

- `../packages/core/CLAUDE.md` claims core uses `@floating-ui/react`. **Verified false** — core's `dependencies: []`. `@floating-ui/react` is in UI packages only. Documented in `sources/package-claude-files.md` under "Known stale claims" and reflected accurately in `packages/core.md`.
- `@tour-kit/media` and `@tour-kit/scheduling` do **not** depend on `@tour-kit/core` — they're standalone Pro packages, only `@tour-kit/license` is required.
- `@tour-kit/ai` has the optional-peer relationship to `@tour-kit/core` (chat works standalone; `useTourAssistant` only needs core when wiring to live tour state).
- `@tour-kit/announcements` and `@tour-kit/surveys` declare `@tour-kit/scheduling` as an optional peer — same pattern.

No conflicts vs existing `wiki/` directory: it's marketing-domain, this is engineering-domain. The two wikis are deliberately not cross-linked.
