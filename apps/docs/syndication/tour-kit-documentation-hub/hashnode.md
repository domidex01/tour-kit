---
title: "Tour Kit documentation hub: guides, tutorials, and API reference"
slug: "tour-kit-documentation-hub"
canonical: https://usertourkit.com/blog/tour-kit-documentation-hub
tags: react, typescript, web-development, documentation
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

According to Archbee's analysis, clear quickstarts reduce integration time from weeks to hours. We benchmarked the quick start path at 7 minutes in Vite and 9 minutes with Next.js App Router.

The docs run on [Fumadocs](https://www.fumadocs.dev/), the same framework behind Shadcn UI's documentation.

## Documentation structure

60+ pages organized into six sections, covering approximately 150 exported APIs:

### Getting started

| Page | What it covers | Time |
|------|---------------|------|
| [Installation](https://usertourkit.com/docs/getting-started/installation) | Package manager setup, peer dependencies | 2 min |
| [Quick start](https://usertourkit.com/docs/getting-started/quick-start) | First tour with TourProvider and step config | 5 min |
| [TypeScript setup](https://usertourkit.com/docs/getting-started/typescript) | Strict mode, type imports, generic patterns | 3 min |

### Core + React packages

The core has 12 hooks, 4 providers, 30+ TypeScript types. The React package wraps these in components like `TourStep`, `TourOverlay`, `TourTooltip` with both styled and headless variants.

### 8 Extended packages

Hints, analytics, adoption tracking, checklists, announcements, media embedding, scheduling, and surveys. Each has standalone docs.

### 12 Guides

Accessibility (WCAG 2.1 AA), persistence, animations, Next.js integration, Vite integration, router integration, analytics, adoption tracking, checklists + tours, announcements + scheduling, branching tours, and troubleshooting.

## How we document a monorepo

**Unified search**: Orama-powered, client-side, zero API calls. Indexes every page from every package.

**Cross-package linking**: 200+ internal cross-references connecting 60+ pages.

**Package-scoped navigation**: Sidebar mirrors the `packages/` directory structure.

## API reference pattern

Every exported API gets: TypeScript signatures with generics, parameter tables, return type documentation, and runnable examples.

```tsx
function useTour<TStepData = unknown>(
  config: TourConfig<TStepData>
): TourState<TStepData>;
```

## Tech stack

- **Fumadocs**: MDX, sidebar generation, TypeScript Twoslash, search
- **Next.js App Router**: 60+ statically generated pages
- **LLM-accessible**: `/llms.txt` and `/llms-full.txt` for AI tools

Full article with all details: [usertourkit.com/blog/tour-kit-documentation-hub](https://usertourkit.com/blog/tour-kit-documentation-hub)
