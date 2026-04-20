---
title: Docs Site Content Map
type: source
sources:
  - ../../apps/docs/content/
  - ../../apps/docs/STYLEGUIDE.md
  - ../../apps/docs/CLAUDE.md
updated: 2026-04-19
---

*Structure map of the Fumadocs site at `../../apps/docs/`. The docs themselves are the authoritative source — don't duplicate content here; use this as a navigation index.*

## Top-level routes

```
apps/docs/content/
├── compare/          # 13 "TourKit vs X" comparison pages
└── docs/
    ├── getting-started/
    ├── core/             # @tour-kit/core reference
    ├── react/            # @tour-kit/react reference
    ├── guides/           # Integration + cross-cutting guides
    ├── examples/         # Working example apps
    ├── adoption/         # @tour-kit/adoption reference
    ├── analytics/        # @tour-kit/analytics reference
    ├── announcements/    # @tour-kit/announcements reference
    ├── checklists/       # @tour-kit/checklists reference
    ├── media/            # @tour-kit/media reference
    ├── scheduling/       # @tour-kit/scheduling reference
    ├── api/              # API reference for analytics + media
    ├── ai/               # AI integration patterns
    ├── ai-assistants/    # AI assistant setup
    ├── use-cases/        # SaaS onboarding, feature announcements
    └── licensing/
```

Each directory has `index.mdx` + `meta.json` for Fumadocs navigation.

## Compare pages (13)

All at `content/compare/tour-kit-vs-*.mdx`:

- react-joyride, shepherd-js, intro-js, driver-js, reactour, onborda, onboardjs
- appcues, userflow, userguiding, userpilot, chameleon, walkme

Each targets a specific keyword — see [gtm/seo-content-strategy.md](../gtm/seo-content-strategy.md) for priority.

## Getting started

- `index.mdx` — Overview
- `installation.mdx` — Package installation
- `quick-start.mdx` — First tour in <5 min
- `typescript.mdx` — TS setup and strict-mode notes

## Guides (cross-cutting)

- `accessibility.mdx` — WCAG 2.1 AA patterns, focus traps, aria-live
- `animations.mdx` — Motion preferences, `prefers-reduced-motion`
- `adoption-analytics.mdx` — Adoption + analytics together
- `analytics-integration.mdx` — Wiring PostHog / Mixpanel / Amplitude
- `announcements-scheduling.mdx` — Announcements with time-based scheduling
- `base-ui.mdx` — Base UI compatibility via UnifiedSlot
- `branching.mdx` — Conditional tour paths
- `checklists-tours.mdx` — Combining checklists with tours
- `nextjs.mdx` — Next.js App Router integration
- `persistence.mdx` — Storage adapters (localStorage, cookies, custom)
- `router-integration.mdx` — React Router / Next router / TanStack Router
- `troubleshooting.mdx`
- `vite.mdx` — Vite setup

## Examples

- `basic-tour.mdx` — Minimal tour
- `onboarding-flow.mdx` — Multi-step onboarding
- `headless-custom.mdx` — Headless with custom UI

## Package references

Each of the 10 packages has its own section. Structure typically:
- `index.mdx` — Overview + API
- `types.mdx` — TypeScript types (where applicable)
- Plus package-specific pages (e.g. `scheduling/presets.mdx`)

## AI sections (two separate dirs)

- `docs/ai/` — AI integration patterns: `quick-start`, `components`, `tour-integration`, `rag-guide`, `cag-guide`, `api-reference`
- `docs/ai-assistants/` — AI assistant setup

These are newer; likely tied to Pro features.

## Use cases

- `saas-onboarding.mdx` — PLG onboarding flow
- `feature-announcements.mdx`

## Syndication directory

`apps/docs/syndication/` (282 entries) — outside `content/`. Likely pre-rendered syndication feeds for articles. Investigate on deep-ingest if needed.

## Styleguide

`STYLEGUIDE.md` has the full homepage design system. See [content/styleguide.md](../content/styleguide.md) for the summary.

## CLAUDE.md at docs root

`apps/docs/CLAUDE.md` — MDX conventions, Fumadocs patterns. Consult when generating/editing docs content.

## Workflow for docs work

When asked to write or edit docs content:

1. Read `apps/docs/CLAUDE.md` for MDX conventions
2. Check `apps/docs/STYLEGUIDE.md` or [content/styleguide.md](../content/styleguide.md)
3. Apply [brand/voice.md](../brand/voice.md) rules (documentation channel)
4. After creating any MDX, update the corresponding `meta.json` / registry with `published: true` per [product/architecture.md](../product/architecture.md) content pipeline rules

## Related

- [content/styleguide.md](../content/styleguide.md) — Visual system summary
- [content/landing-pages.md](../content/landing-pages.md) — Marketing landing pages (different quality bar)
- [content/comparison-drafts.md](../content/comparison-drafts.md) — Drafts feeding compare/*.mdx
- [product/packages.md](../product/packages.md) — Packages that the reference docs cover
- [brand/voice.md](../brand/voice.md)
