---
title: Package dependency graph
type: architecture
sources:
  - ../CLAUDE.md
  - ../packages/*/package.json
updated: 2026-04-26
---

*Who depends on whom across the 12 `@tour-kit/*` packages. Helps reason about install size and breakage radius.*

## ASCII graph

```
                      @tour-kit/core
                       ▲   ▲   ▲   ▲
        ┌──────────────┘   │   │   └────────────────────┐
        │                  │   │                        │
@tour-kit/react   @tour-kit/hints                       │
        │                  │                            │
        │     @tour-kit/adoption ──┐                    │
        │     @tour-kit/checklists ┤                    │
        │     @tour-kit/announcements ──optional──► @tour-kit/scheduling
        │     @tour-kit/surveys ──optional──┐
        │     @tour-kit/analytics ──┘       │           │
        │     @tour-kit/media (no core dep) │           │
        │     @tour-kit/ai (core optional) ─┘           │
        │                                               │
        └────────────► all Pro packages depend on @tour-kit/license
```

## Dependency table

| Package | Hard deps on Tour Kit pkgs | Optional / peer Tour Kit deps |
|---|---|---|
| `@tour-kit/core` | — | — |
| `@tour-kit/react` | `core` | — |
| `@tour-kit/hints` | `core` | — |
| `@tour-kit/adoption` | `core`, `license` | `analytics` (peer optional) |
| `@tour-kit/ai` | `license` | `core` (peer optional) |
| `@tour-kit/analytics` | `core`, `license` | — |
| `@tour-kit/announcements` | `core`, `license` | `scheduling` (peer optional) |
| `@tour-kit/checklists` | `core`, `license` | — |
| `@tour-kit/license` | — | — |
| `@tour-kit/media` | `license` | — (no core dep) |
| `@tour-kit/scheduling` | `license` | — (no core dep) |
| `@tour-kit/surveys` | `core`, `license` | `scheduling` (peer optional) |

## Tier split

| Free (MIT) | Pro (license-gated) |
|---|---|
| `@tour-kit/core` | `@tour-kit/adoption` |
| `@tour-kit/react` | `@tour-kit/ai` |
| `@tour-kit/hints` | `@tour-kit/analytics` |
| | `@tour-kit/announcements` |
| | `@tour-kit/checklists` |
| | `@tour-kit/license` (infra) |
| | `@tour-kit/media` |
| | `@tour-kit/scheduling` |
| | `@tour-kit/surveys` |

Free packages **must not** import from Pro packages. The license boundary is enforced by package dep declarations.

## Third-party dep summary

| Dep | Used by |
|---|---|
| `@floating-ui/react` | `react`, `hints`, `announcements`, `checklists`, `surveys` |
| `@radix-ui/react-slot` | `react`, `hints`, `adoption`, `announcements`, `checklists`, `media` |
| `@radix-ui/react-dialog` | `announcements`, `surveys` |
| `class-variance-authority` | every UI package |
| `clsx` + `tailwind-merge` | every UI package |
| `zod` | `license` |

## Build order

Turborepo's `dependsOn: ["^build"]` rule ensures correct ordering. With 20-way concurrency:

1. `core`, `license` (no Tour Kit deps) — built first, in parallel
2. `react`, `hints`, `analytics`, `scheduling`, `media` — built next (depend only on core/license)
3. `adoption`, `ai`, `announcements`, `checklists`, `surveys` — built last (depend on more)

## Related

- [architecture/monorepo.md](monorepo.md)
- [architecture/build-pipeline.md](build-pipeline.md)
- [packages/core.md](../packages/core.md)
- [packages/license.md](../packages/license.md)
