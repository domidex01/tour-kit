---
title: Per-package CLAUDE.md files
type: source
sources:
  - ../packages/core/CLAUDE.md
  - ../packages/react/CLAUDE.md
  - ../packages/hints/CLAUDE.md
  - ../packages/adoption/CLAUDE.md
  - ../packages/ai/CLAUDE.md
  - ../packages/analytics/CLAUDE.md
  - ../packages/announcements/CLAUDE.md
  - ../packages/checklists/CLAUDE.md
  - ../packages/license/CLAUDE.md
  - ../packages/media/CLAUDE.md
  - ../packages/scheduling/CLAUDE.md
  - ../packages/surveys/CLAUDE.md
updated: 2026-04-26
---

*Each `@tour-kit/*` package ships a `CLAUDE.md` with package-author notes — gotchas, key files, domain concepts. These are the load-bearing source for `wiki-tech/packages/*.md`.*

## Files

| Source | Wiki page |
|---|---|
| `../packages/core/CLAUDE.md` | [packages/core.md](../packages/core.md) |
| `../packages/react/CLAUDE.md` | [packages/react.md](../packages/react.md) |
| `../packages/hints/CLAUDE.md` | [packages/hints.md](../packages/hints.md) |
| `../packages/adoption/CLAUDE.md` | [packages/adoption.md](../packages/adoption.md) |
| `../packages/ai/CLAUDE.md` | [packages/ai.md](../packages/ai.md) |
| `../packages/analytics/CLAUDE.md` | [packages/analytics.md](../packages/analytics.md) |
| `../packages/announcements/CLAUDE.md` | [packages/announcements.md](../packages/announcements.md) |
| `../packages/checklists/CLAUDE.md` | [packages/checklists.md](../packages/checklists.md) |
| `../packages/license/CLAUDE.md` | [packages/license.md](../packages/license.md) |
| `../packages/media/CLAUDE.md` | [packages/media.md](../packages/media.md) |
| `../packages/scheduling/CLAUDE.md` | [packages/scheduling.md](../packages/scheduling.md) |
| `../packages/surveys/CLAUDE.md` | [packages/surveys.md](../packages/surveys.md) |

## Known stale claims

- `../packages/core/CLAUDE.md` says core uses `@floating-ui/react` for positioning. **It does not** — `@floating-ui/react` is a dep of UI packages (`react`, `hints`, `announcements`, `checklists`, `surveys`), not core. Core implements positioning math directly in `utils/position.ts`. Reflected accurately in [packages/core.md](../packages/core.md).

## Re-ingest trigger

Any time these files change, re-ingest the corresponding `wiki-tech/packages/<name>.md` page.

## Related

- [CLAUDE.md](../CLAUDE.md) — wiki schema
- [sources/package-manifests.md](package-manifests.md)
- [sources/package-entry-points.md](package-entry-points.md)
