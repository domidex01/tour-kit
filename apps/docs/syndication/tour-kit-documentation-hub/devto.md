---
title: "How we document a 10-package React monorepo (Tour Kit)"
published: false
description: "Tour Kit ships 10 packages, 60+ doc pages, and 150 exported APIs. Here's how we structured the documentation so developers find what they need in under 10 minutes."
tags: react, typescript, webdev, opensource
canonical_url: https://usertourkit.com/blog/tour-kit-documentation-hub
cover_image: https://usertourkit.com/og-images/tour-kit-documentation-hub.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-documentation-hub)*

# Tour Kit documentation hub: guides, tutorials, and API reference

Most React libraries ship a README and call it documentation. Tour Kit takes a different approach. Ten packages, each with its own API surface, means a README won't cut it. You need structured guides, typed API references, runnable examples, and search that actually works across the entire surface area.

This page maps every piece of Tour Kit documentation. Whether you're installing for the first time, wiring up analytics, or building a fully custom onboarding flow, start here.

```bash
npm install @tourkit/core @tourkit/react
```

Explore the full docs at [usertourkit.com](https://usertourkit.com/) or keep reading for a guided tour of what's available.

## What is Tour Kit?

Tour Kit is a headless, composable product tour library for React that ships as 10 independent packages. You install only what you need. The `@tourkit/core` package weighs 7.2KB gzipped with zero runtime dependencies, while the full `@tourkit/react` layer adds another 11.8KB. Compare that to React Joyride at 37KB or Shepherd.js at 28KB (bundlephobia, April 2026).

"Headless" means Tour Kit handles positioning, step sequencing, keyboard navigation, focus management, and ARIA attributes. You bring the UI. Works with shadcn/ui, Radix, Tailwind, or any design system.

React 18 and 19 are both supported. TypeScript strict mode is enabled across all packages with full type exports.

## Why documentation matters for a 10-package library

Tour Kit's 10-package monorepo creates a documentation challenge that most libraries never face. Each package exports its own hooks, components, providers, and types. The core alone has 12 exported hooks, 4 providers, and over 30 TypeScript types.

According to Archbee's analysis of developer documentation patterns, clear quickstarts reduce integration time from weeks to hours. For Tour Kit, that means going from `npm install` to a working 5-step tour in under 10 minutes. We benchmarked the quick start path at 7 minutes in a fresh Vite project and 9 minutes with Next.js App Router.

The docs run on [Fumadocs](https://www.fumadocs.dev/), the same framework behind Shadcn UI's documentation.

## Documentation structure

Tour Kit's documentation spans 60+ pages organized into six sections, covering approximately 150 exported APIs across all 10 packages.

### Getting started

| Page | What it covers | Time to complete |
|------|---------------|-----------------|
| [Installation](https://usertourkit.com/docs/getting-started/installation) | Package manager setup, peer dependencies, framework adapters | 2 minutes |
| [Quick start](https://usertourkit.com/docs/getting-started/quick-start) | First tour with TourProvider, step config, and basic rendering | 5 minutes |
| [TypeScript setup](https://usertourkit.com/docs/getting-started/typescript) | Strict mode config, type imports, generic patterns | 3 minutes |

### Core package API

The `@tourkit/core` package contains all framework-agnostic logic:

- **Hooks**: `useTour()`, `useStep()`, `useTourHighlight()`, plus 9 additional hooks
- **Providers**: `TourProvider` and `TourKitProvider` configuration, nesting rules
- **Types**: all 30+ TypeScript exports including `TourConfig`, `StepConfig`, `TourState`
- **Utilities**: position engine, storage adapters, helper functions

### Extended packages

| Package | What it does |
|---------|-------------|
| `@tourkit/hints` | Hotspot beacons, pulsing indicators, contextual tips |
| `@tourkit/analytics` | Plugin-based analytics: PostHog, Mixpanel, Amplitude |
| `@tourkit/adoption` | Feature adoption tracking, nudge scheduling |
| `@tourkit/checklists` | Onboarding checklists with task dependencies |
| `@tourkit/announcements` | Modals, toasts, banners, slideouts, spotlights |
| `@tourkit/media` | YouTube, Vimeo, Loom, Wistia, GIF, Lottie embedding |
| `@tourkit/scheduling` | Time-based scheduling with timezone support |
| `@tourkit/surveys` | NPS, CSAT, CES microsurveys with fatigue prevention |

### Guides (12 cross-cutting guides)

- [Accessibility](https://usertourkit.com/docs/guides/accessibility): WCAG 2.1 AA, focus trapping, screen reader announcements
- [Persistence](https://usertourkit.com/docs/guides/persistence): saving tour progress to localStorage or a backend API
- [Animations](https://usertourkit.com/docs/guides/animations): CSS transitions, Framer Motion, motion preferences
- [Next.js integration](https://usertourkit.com/docs/guides/nextjs): App Router setup, Server Component boundaries
- [Router integration](https://usertourkit.com/docs/guides/router-integration): cross-page tours with Next.js, React Router, TanStack Router
- [Troubleshooting](https://usertourkit.com/docs/guides/troubleshooting): common issues, error messages, debugging patterns

## How Tour Kit documents a monorepo

**Unified search across all packages.** Orama-powered search indexes every page, runs client-side with zero API calls.

**Cross-package linking.** Over 200 internal cross-references connect the 60+ documentation pages into a connected graph.

**Package-scoped navigation.** The sidebar organizes by package, each expandable independently.

## API reference patterns

Tour Kit documents approximately 150 exported APIs. Every entry includes:

- TypeScript signatures with generics (actual signatures, not pseudocode)
- Parameter tables with types, defaults, and descriptions
- Return type documentation with every property documented individually
- At least one runnable code example

```tsx
// packages/core/src/hooks/use-tour.ts
function useTour<TStepData = unknown>(
  config: TourConfig<TStepData>
): TourState<TStepData>;
```

## Tools behind the docs

- **Fumadocs**: MDX processing, sidebar generation, TypeScript Twoslash, search indexing
- **Next.js App Router**: all 60+ pages statically generated at build time
- **LLM-accessible docs**: `/llms.txt` and `/llms-full.txt` for AI tools

88% of companies reported regular AI use in documentation workflows by Q4 2025 (McKinsey, via Fluid Topics). Making docs AI-readable isn't optional anymore.

## FAQ

**Where do I find Tour Kit's API documentation?**
At [usertourkit.com/docs](https://usertourkit.com/). Every exported hook, component, provider, and TypeScript type is documented with signatures, parameter tables, and runnable code examples covering all 10 packages.

**Does Tour Kit have TypeScript documentation?**
Tour Kit is written in TypeScript with strict mode enabled across every package. A dedicated TypeScript setup guide covers generic patterns, type imports, and strict configuration.

**Can AI tools access Tour Kit's documentation?**
Tour Kit generates `/llms.txt` and `/llms-full.txt` files with structured, AI-readable documentation for ChatGPT, Claude, and Perplexity.

**Does Tour Kit have accessibility documentation?**
A dedicated accessibility guide covers WCAG 2.1 AA compliance, focus trapping, screen reader announcements, keyboard navigation, and `prefers-reduced-motion` support. Lighthouse Accessibility score: 100.
