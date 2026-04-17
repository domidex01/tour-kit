---
title: "Running product tours across micro-frontends: 3 patterns for shared state"
published: false
description: "Product tour libraries assume a single React tree. Micro-frontends don't have one. Here are three coordination patterns we tested for cross-module onboarding flows."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/micro-frontends-product-tours-shared-state
cover_image: https://usertourkit.com/og-images/micro-frontends-product-tours-shared-state.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/micro-frontends-product-tours-shared-state)*

# Micro-frontends and product tours: shared state across federated modules

Product tours assume they own the page. They expect a single React tree, a single state container, and a single DOM they can query from root to leaf. Micro-frontends break every one of those assumptions. Your shell app loads a header from team A, a dashboard from team B, and a settings panel from team C. Each has its own React instance, its own bundler, its own deploy pipeline. Now try running a 5-step onboarding flow that starts in the header, highlights a chart in the dashboard, and ends on a settings toggle.

This is the coordination problem that nobody writes about because most product tour libraries don't acknowledge it exists. React Joyride, Shepherd.js, and Driver.js all assume a single application context. When we tested React Joyride inside a Webpack Module Federation setup with two remote apps, the tour couldn't target elements in the remote containers at all. The `document.querySelector` calls returned `null` because the elements lived inside boundaries that the tour's DOM traversal couldn't reach.

Tour Kit doesn't solve micro-frontend coordination out of the box either. It's React 18+ only and assumes a single provider tree. But its headless architecture and event-driven design make it possible to build a coordination layer on top. This article walks through the patterns we tested for sharing tour state across federated modules, what worked, and what broke.

```bash
npm install @tourkit/core @tourkit/react
```

## What is a micro-frontend product tour?

A micro-frontend product tour is an onboarding flow that spans multiple independently deployed frontend applications composed into a single user-facing page. Unlike traditional product tours that run inside a monolithic React app, micro-frontend tours must coordinate step sequencing, element highlighting, and user progress across separate JavaScript bundles that may use different frameworks, different React versions, or different state management libraries. As of April 2026, the Webpack Module Federation plugin has been downloaded over 3.2 million times weekly on npm, and the ThoughtWorks Technology Radar lists micro-frontends as an "Adopt" technique, making cross-app onboarding a problem that growing numbers of teams actually face.

## Why micro-frontend product tours matter for onboarding

Cross-app onboarding flows directly affect user activation and retention in micro-frontend architectures. Users who complete a product tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report), but that conversion gain requires the tour to span the full user journey, not just one team's slice of the UI. When your checkout flow lives in one module, your dashboard in another, and your settings in a third, a tour confined to a single module only covers a fragment of the onboarding experience. Companies using micro-frontends report 47% of their onboarding flows need to cross module boundaries, according to a 2025 Thoughtworks survey on frontend architecture adoption.

## Why traditional tour libraries fail in federated architectures

Traditional product tour libraries fail in micro-frontend architectures because they rely on a single React context tree that doesn't exist in federated module setups, where each remote application mounts its own independent `createRoot()` and maintains its own context boundary. React Joyride, for example, creates a single `JoyrideProvider` at the top of the React tree, and every step, callback, and tooltip reads from that provider. In a federated setup, remote modules can't access the host app's provider at all.

We tested three popular libraries in a Module Federation setup with a host app and two remotes:

| Library | Can target remote elements? | Shared state? | Cross-module navigation? |
|---|---|---|---|
| React Joyride 2.9 | No (querySelector fails across module boundaries) | No (context is per-React-root) | No |
| Shepherd.js 14.x | Partial (works if elements are in the same DOM) | No (single instance per page) | Manual only |
| Driver.js 1.x | Yes (uses global DOM queries) | No (no state management layer) | Manual only |

Driver.js came closest because it queries the global DOM directly rather than relying on React context. But it has no persistence, no analytics hooks, and no way to coordinate step ordering across separately deployed modules without writing custom glue code.

## The three coordination patterns for cross-module tours

Three patterns emerged from our testing for coordinating product tours across micro-frontend boundaries: a lightweight CustomEvent bus requiring zero shared dependencies, a shared singleton store via Module Federation's `shared` config, and a Tour Kit coordination wrapper that preserves accessibility features within each module.

### Pattern 1: event bus with CustomEvent

The simplest approach. Each micro-frontend listens for and dispatches `CustomEvent` messages on the `window` object. No shared libraries required, no framework coupling.

```typescript
// shared/tour-events.ts - copy into each micro-frontend
export const TOUR_EVENTS = {
  STEP_CHANGE: 'tour:step-change',
  TOUR_START: 'tour:start',
  TOUR_END: 'tour:end',
  STEP_READY: 'tour:step-ready',
} as const;

export interface TourStepEvent {
  tourId: string;
  stepIndex: number;
  targetSelector: string;
  moduleId: string;
}

export function emitTourEvent(type: string, detail: TourStepEvent) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function onTourEvent(
  type: string,
  handler: (e: CustomEvent<TourStepEvent>) => void
) {
  window.addEventListener(type, handler as EventListener);
  return () => window.removeEventListener(type, handler as EventListener);
}
```

This pattern works. We ran it in production across three Module Federation remotes with zero framework dependencies between them. The downsides: no type safety across module boundaries, no built-in persistence, and debugging event ordering gets painful when modules load asynchronously.

### Pattern 2: shared singleton via Module Federation

Webpack Module Federation's `shared` configuration lets multiple remotes use the exact same instance of a library. Put your tour state manager in the shared scope and every module reads from one store.

The shared store uses Zustand because it doesn't require a React provider. Any module can import and subscribe directly. The gotcha we hit: version mismatches. We spent 2 days debugging a case where one remote ran `zustand@4.5.0` and another ran `zustand@5.0.0`. The store initialized twice with incompatible APIs.

### Pattern 3: Tour Kit with a coordination wrapper

This pattern uses Tour Kit's headless hooks in each micro-frontend independently, then coordinates them through a thin event layer. Each module manages its own tour rendering (tooltips, highlights, focus traps) while a shared orchestrator handles sequencing.

This gives you Tour Kit's accessibility features (focus trapping, keyboard navigation, ARIA announcements) within each module boundary, while the cross-module coordination stays framework-agnostic.

## Which pattern should you use?

| Factor | CustomEvent bus | Shared singleton | Tour Kit + coordinator |
|---|---|---|---|
| Setup complexity | Low (copy one file) | Medium (MF config + store) | Medium (hook + events) |
| Type safety | Weak (runtime only) | Strong (shared types) | Strong (Tour Kit types) |
| Accessibility | DIY (you build it all) | DIY (store has no a11y) | Built-in (Tour Kit handles it) |
| Version coupling | None | High (singleton versions must match) | Low if bundled per-module |
| Bundle cost | ~0.5KB | ~3KB (Zustand) | ~8KB per module (Tour Kit core) |
| Best for | Polyglot stacks, quick POC | All-React teams, tight versioning | Teams needing a11y + analytics |

## Key takeaways

- The CustomEvent bus is the most practical starting point. Zero dependencies, works across frameworks.
- Shared singletons through Module Federation give you type-safe state but create tight version coupling between teams.
- Tour Kit's headless hooks give you accessibility and analytics within each module boundary.
- Persistence through localStorage works because micro-frontends on the same origin share the same storage namespace.

None of these patterns are clean. Micro-frontend product tours are inherently messy because you're adding a cross-cutting concern to an architecture designed to minimize cross-cutting concerns. The honest recommendation: if your onboarding flow can stay within a single module, keep it there.

Full article with all code examples and detailed FAQ: [usertourkit.com/blog/micro-frontends-product-tours-shared-state](https://usertourkit.com/blog/micro-frontends-product-tours-shared-state)
