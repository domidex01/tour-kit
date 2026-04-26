---
title: Package entry points (src/index.ts)
type: source
sources:
  - ../packages/core/src/index.ts
  - ../packages/react/src/index.ts
  - ../packages/hints/src/index.ts
  - ../packages/adoption/src/index.ts
  - ../packages/ai/src/index.ts
  - ../packages/ai/src/server/index.ts
  - ../packages/analytics/src/index.ts
  - ../packages/announcements/src/index.ts
  - ../packages/checklists/src/index.ts
  - ../packages/license/src/index.ts
  - ../packages/license/src/headless.ts
  - ../packages/media/src/index.ts
  - ../packages/scheduling/src/index.ts
  - ../packages/surveys/src/index.ts
updated: 2026-04-26
---

*The authoritative public-API surface for every package. Wiki pages enumerate exports; if these files change, the wiki must be updated.*

## Multi-entry packages

| Package | Entries |
|---|---|
| `@tour-kit/ai` | `.`, `./server`, `./headless`, `./tailwind` |
| `@tour-kit/license` | `.`, `./headless` |

All other packages export a single root entry point.

## Lint rules

- **Signature drift.** If a wiki page documents an export with a code-fence signature, grep the entry point to verify the export still exists with that signature.
- **New exports.** Diff the entry point against the wiki's enumerated exports. New exports → wiki update.
- **Removed exports.** Wiki page mentions a hook/component/type that no longer exists in the entry point → mark for removal.

## Re-ingest trigger

Any change to these files → update the corresponding `wiki-tech/packages/<name>.md`. Update `version:` in frontmatter if `package.json` version also bumped.

## Related

- [sources/package-claude-files.md](package-claude-files.md)
- [sources/package-manifests.md](package-manifests.md)
- [architecture/build-pipeline.md](../architecture/build-pipeline.md)
