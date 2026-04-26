---
title: Tour Kit codebase overview
type: overview
sources:
  - ../CLAUDE.md
  - ../packages
updated: 2026-04-26
---

*One-page synthesis of the entire Tour Kit package library. Start here when you don't know which page to read first.*

## What Tour Kit is

A headless onboarding and product-tour library for React. Designed for shadcn/ui-style composition — small focused components plus hooks that own the state.

## Package map

| Package | Tier | Version | Role |
|---|---|---|---|
| [`@tour-kit/core`](packages/core.md) | Free | 0.5.0 | Framework-agnostic foundation: types, context, hooks, utilities |
| [`@tour-kit/react`](packages/react.md) | Free | 0.5.0 | React components, router adapters, MultiTourKitProvider |
| [`@tour-kit/hints`](packages/hints.md) | Free | 0.5.0 | Persistent hints / hotspots (non-sequential) |
| [`@tour-kit/license`](packages/license.md) | Infra | 1.0.2 | Polar.sh license validation; gates Pro packages |
| [`@tour-kit/adoption`](packages/adoption.md) | Pro | 0.0.6 | Feature adoption tracking + nudge scheduler |
| [`@tour-kit/ai`](packages/ai.md) | Pro | 0.0.4 | AI chat with CAG/RAG context strategies |
| [`@tour-kit/analytics`](packages/analytics.md) | Pro | 0.1.5 | Plugin-based tracking (PostHog, Mixpanel, Amplitude, GA4, console, custom) |
| [`@tour-kit/announcements`](packages/announcements.md) | Pro | 0.2.0 | Modal/Slideout/Banner/Toast/Spotlight + queue + frequency |
| [`@tour-kit/checklists`](packages/checklists.md) | Pro | 0.1.5 | Onboarding checklists with task dependencies |
| [`@tour-kit/media`](packages/media.md) | Pro | 0.1.4 | Embeds (YouTube, Vimeo, Loom, Wistia, native, GIF, Lottie) |
| [`@tour-kit/scheduling`](packages/scheduling.md) | Pro | 0.1.4 | Time-based gating: date range, blackouts, business hours, recurring |
| [`@tour-kit/surveys`](packages/surveys.md) | Pro | 0.1.3 | NPS / CSAT / CES / custom + fatigue prevention |

## Core principles

1. **Headless first.** Logic lives in `@tour-kit/core`. UI packages are thin wrappers.
2. **Composition over configuration.** Small focused components compose into rich UIs.
3. **Type safety.** Strict TypeScript, end-to-end coverage.
4. **Accessibility first.** WCAG 2.1 AA, focus management, keyboard nav, reduced motion, RTL.
5. **Progressive enhancement.** SSR-safe, respects user preferences.

## Quality gates

- Bundle: `core < 8 KB`, `react < 12 KB`, `hints < 5 KB` (gzipped)
- Test coverage > 80%
- Lighthouse Accessibility: 100
- Strict TS, no implicit any

## Key cross-cutting patterns

- [Unified Slot](concepts/unified-slot.md) — Radix UI + Base UI composition support
- [Provider architecture](architecture/provider-architecture.md) — layered providers, optional analytics
- [Storage adapters](concepts/storage-adapters.md) — pluggable persistence via `Storage` interface
- [Focus trap](concepts/focus-trap.md) — accessibility primitive used across modals/cards/panels
- [Positioning engine](concepts/positioning-engine.md) — core math + floating-ui in UI packages
- [License gating](concepts/license-gating.md) — Polar-backed validation with anti-bypass render key
- [Queue & frequency](concepts/queue-and-frequency.md) — shared model in announcements + surveys
- [Plugin system](concepts/plugin-system.md) — analytics plugin interface, custom destinations

## How to navigate this wiki

- **Engineering question about a specific package** → start at `packages/<name>.md`
- **Cross-cutting "how does X work?"** → `concepts/`
- **"How is the codebase organized?"** → `architecture/`
- **"Where did this fact come from?"** → trace via `sources:` frontmatter to `sources/` then to the actual code path

## Related

- [CLAUDE.md](CLAUDE.md) — schema for maintaining this wiki
- [index.md](index.md) — full page catalog
- [log.md](log.md) — chronological wiki operations log
