---
title: "The architecture of a 10-package composable tour library"
slug: "composable-tour-library-architecture"
canonical: https://usertourkit.com/blog/composable-tour-library-architecture
tags: react, typescript, monorepo, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/composable-tour-library-architecture)*

# The architecture of a 10-package composable tour library

Most product tour libraries ship as a single npm package. React Joyride is one bundle. Shepherd.js is one bundle. Driver.js is one bundle. You install the whole thing whether you need tooltips, analytics, scheduling, or surveys. If you only want step sequencing and a tooltip, you still pay for everything else in your bundle.

Tour Kit takes a different approach. It ships 10 separate packages, each published independently, each tree-shakeable, each with its own TypeScript declarations. A basic tour pulls in `@tour-kit/core` (under 8KB gzipped) and `@tour-kit/react`. You don't pay for what you don't use.

This article is a building-in-public walkthrough of how that architecture works, why certain boundaries exist where they do, and what went wrong along the way. I built Tour Kit as a solo developer, so take the architectural opinions with that context.

[Full article continues at usertourkit.com...](https://usertourkit.com/blog/composable-tour-library-architecture)

Key topics covered:

- **Why composable architecture matters** — React Joyride adds 37KB gzipped. Tour Kit's core is under 8KB.
- **The dependency graph** — All 10 packages depend on core. None depend on each other as hard dependencies.
- **Tree-shaking configuration** — tsup, ESM output, `sideEffects: false`, and the gotchas we hit with code splitting.
- **Turborepo build pipeline** — 36-line turbo.json that builds 10 packages with caching and parallelism.
- **Package boundary decisions** — Why each package maps to a user intent, not a technical layer.
- **Accessibility architecture** — Focus traps and keyboard navigation centralized in core, inherited by all packages.
- **Common mistakes** — Splitting by layer, required cross-package deps, and skipping bundle budgets.

```bash
npm install @tourkit/core @tourkit/react
```
