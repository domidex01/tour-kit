---
title: Package manifests (package.json)
type: source
sources:
  - ../packages/core/package.json
  - ../packages/react/package.json
  - ../packages/hints/package.json
  - ../packages/adoption/package.json
  - ../packages/ai/package.json
  - ../packages/analytics/package.json
  - ../packages/announcements/package.json
  - ../packages/checklists/package.json
  - ../packages/license/package.json
  - ../packages/media/package.json
  - ../packages/scheduling/package.json
  - ../packages/surveys/package.json
updated: 2026-04-26
---

*Authoritative source for versions, dependencies, peer deps, and exports fields. The `version:` frontmatter field on `wiki-tech/packages/*.md` pages must mirror these.*

## Lint rule

When linting the wiki, parse each `package.json` `"version"` and compare against the corresponding wiki page's frontmatter `version`. Mismatch → "Version drift" finding.

## Versions snapshot (2026-04-26)

| Package | Version |
|---|---|
| `@tour-kit/core` | 0.5.0 |
| `@tour-kit/react` | 0.5.0 |
| `@tour-kit/hints` | 0.5.0 |
| `@tour-kit/license` | 1.0.2 |
| `@tour-kit/adoption` | 0.0.6 |
| `@tour-kit/ai` | 0.0.4 |
| `@tour-kit/analytics` | 0.1.5 |
| `@tour-kit/announcements` | 0.2.0 |
| `@tour-kit/checklists` | 0.1.5 |
| `@tour-kit/media` | 0.1.4 |
| `@tour-kit/scheduling` | 0.1.4 |
| `@tour-kit/surveys` | 0.1.3 |

## Re-ingest trigger

Any version bump (typically via `pnpm version-packages`) → re-ingest [architecture/dependency-graph.md](../architecture/dependency-graph.md) and the changed package's wiki page.

## Related

- [architecture/dependency-graph.md](../architecture/dependency-graph.md)
- [architecture/build-pipeline.md](../architecture/build-pipeline.md)
