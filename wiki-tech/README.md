# wiki-tech

A persistent, LLM-maintained knowledge base for the Tour Kit **codebase** (the `packages/` directory).

The marketing/GTM brain lives at [`../wiki/`](../wiki/). This is the engineering brain.

## Why this exists

When an LLM is asked an engineering question — "what does `useTourState` return?", "why does `@tour-kit/announcements` peer-depend on `@tour-kit/scheduling`?" — the naive flow is to grep the source and re-derive the answer. That works but doesn't accumulate. This wiki sits between the LLM and the raw source: questions are answered against the wiki first; the source is consulted only when the wiki is insufficient. Every answer that's worth keeping is filed back into the wiki.

The pattern is from Andrej Karpathy's [LLM Wiki](https://github.com/karpathy/LLM-wiki) idea, adapted from a personal knowledge base to a codebase one.

## Layout

```
wiki-tech/
├── CLAUDE.md           # Schema. Read first.
├── index.md            # Catalog of every page
├── log.md              # Chronological record of operations
├── overview.md         # What is Tour Kit, package map
├── packages/           # One page per @tour-kit/* package
├── architecture/       # Cross-cutting: monorepo, build, providers, slots
├── concepts/           # Reusable abstractions: positioning, storage, focus trap
└── sources/            # Per-source summaries pointing back to the source path
```

## Workflow

- Add a source → run "ingest" (see `CLAUDE.md`).
- Ask a question → run "query".
- Health check → run "lint".

The schema in `CLAUDE.md` is authoritative. If this README disagrees, follow the schema.
