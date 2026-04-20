---
title: Packages
type: product
sources:
  - ../../CLAUDE.md
  - ../../marketing-strategy/tourkit-product.md
updated: 2026-04-19
---

*All 10 TourKit packages. 3 free (MIT), 7 Pro ($99 one-time).*

## Free tier (MIT licensed)

| Package | Purpose | Bundle (gzip) |
|---|---|---|
| `@tour-kit/core` | Hooks + utilities: `useTour`, `useFocusTrap`, `useKeyboard`. Framework-agnostic core logic, types, utilities | <8KB |
| `@tour-kit/react` | Pre-styled shadcn/ui components: `<Tour>`, `<TourStep>`. Router adapters, multi-tour registry, Unified Slot | <12KB |
| `@tour-kit/hints` | Contextual hints, beacons, tooltips. Hint lifecycle, dismissal patterns | <5KB |

## Pro tier ($99 one-time)

| Package | Purpose |
|---|---|
| `@tour-kit/analytics` | Plugin-based: PostHog, Mixpanel, Amplitude, custom. Plugin interface, event types |
| `@tour-kit/checklists` | Task lists with dependencies, progress tracking |
| `@tour-kit/announcements` | Modals, toasts, banners, slideouts, spotlights. Queue system, frequency rules |
| `@tour-kit/adoption` | Feature adoption tracking and nudge system. Adoption algorithms, nudge scheduler |
| `@tour-kit/media` | YouTube, Vimeo, Loom, Wistia, GIF, Lottie embeds. URL parsing, accessibility |
| `@tour-kit/scheduling` | Time-based scheduling with timezone support. Schedule evaluation, recurring patterns |
| `@tour-kit/surveys` | In-app microsurveys (NPS, CSAT, CES). Scoring engine, fatigue prevention, context awareness |

Note: `@tour-kit/scheduling` is an optional peer dependency for `@tour-kit/announcements`.

## Dependency graph

```
@tour-kit/react ────────┐
@tour-kit/hints ────────┤
@tour-kit/adoption ─────┤
@tour-kit/checklists ───┼──► @tour-kit/core
@tour-kit/analytics ────┤
@tour-kit/announcements ┤
@tour-kit/media ────────┤
@tour-kit/scheduling ───┤
@tour-kit/surveys ──────┘
```

Everything depends on `@tour-kit/core`. Turborepo handles build order automatically.

## Cross-package patterns

- **Unified Slot (Radix + Base UI)** — All UI packages share the `UnifiedSlot` component for `asChild` compatibility. Render prop = Base UI style; element cloning = Radix style. Each package has its own copy in `lib/slot.tsx` and `lib/ui-library-context.tsx`.
- **Provider architecture** — `@tour-kit/core` provides base providers (`TourProvider`, `TourKitProvider`). Each package wraps with its own context (`AdoptionProvider`, `ChecklistProvider`, etc.). All providers support optional analytics integration.

## Related

- [product/tourkit.md](tourkit.md) — Product overview
- [product/architecture.md](architecture.md) — Monorepo + build system
- [product/licensing.md](licensing.md) — Pro terms
- [gtm/launch-strategy.md](../gtm/launch-strategy.md) — Each Pro package = new launch moment
