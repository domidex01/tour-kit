---
title: "How I split a React tour library into 10 tree-shakeable packages"
published: false
description: "A building-in-public walkthrough of Tour Kit's composable monorepo architecture. Dependency graphs, bundle budgets, tsup + Turborepo config, and the mistakes I made along the way."
tags: react, typescript, opensource, webdev
canonical_url: https://usertourkit.com/blog/composable-tour-library-architecture
cover_image: https://usertourkit.com/og-images/composable-tour-library-architecture.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/composable-tour-library-architecture)*

# How I split a React tour library into 10 tree-shakeable packages

Most product tour libraries ship as a single npm package. React Joyride is one bundle. Shepherd.js is one bundle. Driver.js is one bundle. You install the whole thing whether you need tooltips, analytics, scheduling, or surveys. If you only want step sequencing and a tooltip, you still pay for everything else in your bundle.

Tour Kit takes a different approach. It ships 10 separate packages, each published independently, each tree-shakeable, each with its own TypeScript declarations. A basic tour pulls in `@tour-kit/core` (under 8KB gzipped) and `@tour-kit/react`. Need in-app surveys? Add `@tour-kit/surveys`. Need analytics? Add `@tour-kit/analytics` with a PostHog or Mixpanel plugin. You don't pay for what you don't use.

This article is a building-in-public walkthrough of how that architecture works, why certain boundaries exist where they do, and what went wrong along the way. I built Tour Kit as a solo developer, so take the architectural opinions with that context.

```bash
npm install @tourkit/core @tourkit/react
```

## What is a composable library architecture?

A composable library architecture is a design pattern where a software library is split into multiple independent packages that share a common core but can be installed and used separately. Unlike monolithic libraries that bundle all features into a single import, composable libraries let consumers pick only the pieces they need. As of April 2026, Gartner reports that 70% of organizations have adopted composable technology patterns, with early adopters achieving 80% faster feature deployment. Tour Kit applies this pattern specifically to product tours, splitting functionality across 10 packages that total around 530 source files.

## Why composable architecture matters for product tours

Monolithic product tour libraries force every user to download code for features they never touch. When we measured React Joyride's impact on a production Next.js app, it added 37KB gzipped to the client bundle, including tooltips, callbacks, and event handling for features most projects never enable. Users who complete an onboarding tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report), but that conversion gain disappears if the tour library itself degrades page load.

Tour Kit's core package targets under 8KB gzipped. The React rendering layer adds another 12KB. Checklists, surveys, announcements, analytics, media embeds, and scheduling are features that maybe 20% of users actually need. Forcing the other 80% to download that code felt wrong.

The split also forces cleaner abstractions. When `@tour-kit/analytics` can't reach into `@tour-kit/core`'s internals, the public API has to be good enough. Package boundaries are honesty tests for your interfaces.

## Why split into exactly 10 packages?

Bundle size budgets drove the initial split, but the number 10 emerged from mapping distinct user intents to package boundaries. Nobody installs a tour library thinking "I need timezone scheduling." They think "I want onboarding checklists" or "I want NPS surveys after step 5." Each of those intents maps to a separate install decision, a separate bundle cost, and a separate mental model. We measured which features clustered together in real usage and drew lines where the coupling was weakest.

Here's what the dependency graph actually looks like:

```
@tour-kit/core <- foundation, no tour-kit dependencies
  |-- @tour-kit/react (styled components + hooks)
  |-- @tour-kit/hints (hotspots + persistent hints)
  |-- @tour-kit/analytics (plugin system)
  |-- @tour-kit/adoption (feature tracking + nudges)
  |-- @tour-kit/announcements (5 display variants)
  |-- @tour-kit/checklists (task dependencies)
  |-- @tour-kit/media (video embeds)
  |-- @tour-kit/scheduling (timezone-aware scheduling)
  +-- @tour-kit/surveys (NPS, CSAT, CES)
```

Every extended package depends on `@tour-kit/core`. None of them depend on each other as hard dependencies. `@tour-kit/announcements` can optionally use `@tour-kit/scheduling` for time-based rules, but it works without it.

## The core package: where all the logic lives

Tour Kit follows what Martin Fowler calls the [headless component pattern](https://martinfowler.com/articles/headless-component.html): "a component responsible solely for logic and state management without prescribing any specific UI." The `@tour-kit/core` package contains 62 source files exporting hooks, utilities, types, and context providers. Zero UI. Zero CSS. Zero opinions about how your tour looks.

The core exports fall into four categories:

**Hooks** handle state and behavior. `useTour()` manages the step state machine. `useSpotlight()` calculates overlay cutout positions. `useFocusTrap()` traps keyboard focus inside the active step. `useKeyboardNavigation()` handles arrow keys, Escape, and Tab. `usePersistence()` saves progress to localStorage or cookies.

**Utilities** are pure functions. Position calculations, element queries, scroll management, and storage adapters. These are individually importable and tree-shake cleanly because they have no side effects.

**Types** are exported separately with explicit `type` keyword imports so TypeScript strips them at compile time. Tour Kit exports over 30 named types.

**Context providers** (`TourProvider`, `TourKitProvider`) handle React's context layer.

```tsx
// src/components/MyTour.tsx
import { useTour, useStep, useSpotlight } from '@tourkit/core';

function MyCustomTooltip() {
  const { currentStep, next, previous, stop } = useTour();
  const { targetRect } = useSpotlight();
  const step = useStep();

  // Render whatever UI you want. Tour Kit doesn't care.
  return (
    <div style={{ position: 'absolute', top: targetRect.bottom + 8 }}>
      <h3>{step.title}</h3>
      <p>{step.content}</p>
      <button onClick={previous}>Back</button>
      <button onClick={next}>Next</button>
      <button onClick={stop}>Skip</button>
    </div>
  );
}
```

## How tree-shaking works across 10 packages

Tree-shaking isn't automatic. It requires deliberate library design decisions that most tutorial articles skip over. Carl Rippon's [tree-shaking guide](https://carlrippon.com/how-to-make-your-react-component-library-tree-shakeable/) explains the core requirement: "The `sideEffects: false` flag signals to bundlers that all files in the component library are pure and free from side effects."

Tour Kit uses tsup (version 8.5.1) to bundle each package with these settings:

| Configuration | Value | Why it matters |
|---|---|---|
| Output formats | ESM + CJS | ESM enables static analysis for tree-shaking; CJS provides Node.js compatibility |
| Tree-shaking | Enabled | tsup marks pure functions with `/*#__PURE__*/` annotations |
| Code splitting | Enabled (most packages) | Preserves module boundaries so bundlers can drop unused chunks |
| Minification | Enabled | Reduces transfer size without affecting tree-shaking |
| Target | ES2020 | Modern syntax ships smaller code; supported by all current browsers |
| Source maps | Enabled | Debugging without sacrificing production bundle size |

Some packages use multiple entry points. `@tour-kit/react` exposes four: `index` (styled components), `headless` (unstyled render-prop components), `lazy` (code-split loading), and `tailwind/index` (Tailwind plugin). If you import from `@tourkit/react/headless`, you don't load styled component code.

The gotcha we hit: tsup's `splitting: true` option interacts poorly with packages that re-export from dependencies. `@tour-kit/analytics` re-exports types from `@tour-kit/core`, and enabling splitting caused duplicate chunks in consumer bundles. We disabled splitting for analytics and adoption packages specifically.

## The build pipeline: Turborepo in practice

Building 10 interdependent packages requires a build orchestrator that understands the dependency graph, caches aggressively, and runs independent work in parallel. Tour Kit uses Turborepo with pnpm workspaces:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

`"dependsOn": ["^build"]` means "build my dependencies before building me." Turborepo handles the topological sort and runs independent packages in parallel. With `concurrency: 20`, a full clean build completes in seconds.

Turborepo's cache is the real win. After the first build, subsequent runs only rebuild packages whose source files changed. Change a file in `@tour-kit/surveys`? Only surveys rebuilds. The other 9 packages serve cached output.

## Package boundaries: where to draw the lines

Drawing package boundaries is the single hardest design decision in a composable architecture. Split too aggressively and you create dependency hell. Split too conservatively and you're back to a monolith wearing a trenchcoat.

The boundaries reflect different extension patterns:

- **Core + React + Hints** are the foundation. MIT licensed.
- **Analytics** uses a plugin architecture with 5 built-in plugins (PostHog, Mixpanel, Amplitude, GA4, console).
- **Announcements and Surveys** share a queue system pattern but target different UI intents.
- **Scheduling** is pure logic with zero UI components.

One decision I'd reconsider: `@tour-kit/media` probably should have been part of `@tour-kit/announcements`. Media embeds are almost exclusively used inside announcement content. But package boundaries, once published to npm, are hard to undo.

## Accessibility as an architectural concern

Accessibility in a multi-package library is an architecture problem, not a component problem. Tour Kit centralizes all accessibility logic in `@tour-kit/core`. Focus trap management, keyboard navigation, screen reader announcements, and ARIA attribute generation all live in core hooks. UI packages inherit these behaviors through shared hooks.

This means consistent accessibility across all 10 packages without re-implementing focus traps. We target Lighthouse Accessibility 100 and WCAG 2.1 AA compliance.

## Common mistakes when splitting a library into packages

These are patterns we hit during development that wasted time:

- **Splitting by technical layer instead of user intent.** An early prototype had `@tour-kit/hooks`, `@tour-kit/components`, and `@tour-kit/utils`. Users don't think in layers. They think in features.
- **Making every cross-package dependency required.** Use optional peer dependencies and feature-detect at runtime.
- **Sharing too much through a utility package.** Copy small utilities instead.
- **Forgetting that package boundaries are public API.** Once published to npm, your package names and import paths are contracts.
- **Skipping bundle size budgets.** We enforce core < 8KB, react < 12KB gzipped as CI checks that fail the build.

## What this architecture makes hard

A 10-package composable architecture adds real costs:

- **Cross-package features require coordination.** Context-aware surveys needed a bridge to read tour state.
- **Version management is a constant tax.** A breaking change in core bumps all 10 packages.
- **Testing multiplies.** Each package has its own test suite and mocks.
- **Local development needs the full graph.** `pnpm install && pnpm build` on fresh clone takes longer.

Tour Kit is React 18+ only and has no visual builder. You need React developers to use it.

## Applying this pattern to your own library

1. **Start with one package.** Split only when users want subsets.
2. **Put logic in core, UI in wrappers.** The headless pattern forces clean interfaces.
3. **Use tsup + Turborepo + pnpm workspaces.** Handles ESM/CJS dual output, incremental builds, and workspace linking.
4. **Set bundle size budgets and enforce them.** CI checks, not aspirations.
5. **Accept the duplication tax.** Some shared code belongs in each package.

---

Full article with code examples and dependency graph: [usertourkit.com/blog/composable-tour-library-architecture](https://usertourkit.com/blog/composable-tour-library-architecture)
