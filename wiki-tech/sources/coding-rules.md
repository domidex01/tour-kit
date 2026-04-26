---
title: Coding rules
type: source
sources:
  - ../tour-kit/rules/typescript.md
  - ../tour-kit/rules/react.md
  - ../tour-kit/rules/hooks.md
  - ../tour-kit/rules/components.md
  - ../tour-kit/rules/accessibility.md
  - ../tour-kit/rules/testing.md
  - ../tour-kit/rules/architecture.md
  - ../tour-kit/rules/performance.md
updated: 2026-04-26
---

*Project-wide coding standards live at `tour-kit/rules/*.md`. The root `CLAUDE.md` cites them as authoritative.*

## Files

| File | Coverage |
|---|---|
| `typescript.md` | Strict mode, type patterns, generics |
| `react.md` | Component patterns, JSX conventions |
| `hooks.md` | Custom hook design and implementation |
| `components.md` | Component architecture and composition |
| `accessibility.md` | WCAG 2.1 AA compliance |
| `testing.md` | Testing standards and coverage |
| `architecture.md` | Package structure and dependencies |
| `performance.md` | Bundle budgets and optimization |

## When to consult

- **`typescript.md`** — adding new types, especially complex generics or branded types
- **`react.md` + `components.md`** — designing a new component
- **`hooks.md`** — adding a new hook (especially one with subscriptions or async logic)
- **`accessibility.md`** — every interactive component
- **`testing.md`** — writing tests; covers Vitest patterns and coverage thresholds
- **`architecture.md`** — adding a package or changing dep direction
- **`performance.md`** — touching anything in the bundle-budget hot path

## Re-ingest trigger

Rule changes are infrequent but high-impact. When a rule file changes, lint the wiki for any pages that explain coding patterns and re-align them to the new rule.

## Related

- [CLAUDE.md](../CLAUDE.md) — wiki schema
- [architecture/build-pipeline.md](../architecture/build-pipeline.md) — cites the budget rule
- [architecture/accessibility.md](../architecture/accessibility.md) — cites the a11y rule
