# How to share product tours across apps in a monorepo

*Subtitle: Define once, render everywhere — with Tour Kit and Turborepo*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours)*

You have three React apps in a Turborepo workspace. Each one needs a product tour. The instinct is to install the tour library in every app, copy-paste the same step definitions, and move on. That works until someone changes a step label in one app and forgets the other two.

A better approach: put your tour definitions in a shared internal package. One source of truth for step content, progression logic, and completion tracking. Each app imports the tours it needs and renders them with its own design system.

## The problem with copy-paste tours

As of April 2026, 63% of companies with 50+ developers use monorepo architectures. Shared state management is one of the top reasons why. But most product tour libraries assume a single app. They don't address how to share tour definitions, completion state, or accessibility configuration across workspace boundaries.

Tour Kit's headless architecture solves this. The library separates tour logic from UI rendering, so your shared package exports behavior while each app controls its own visual presentation.

## What the setup looks like

You create a `packages/tours` internal package containing tour step definitions as plain TypeScript data, a pre-configured provider with persistence, and a lean barrel export. Two consuming apps import from this package through pnpm's `workspace:*` protocol.

The result: one source of truth for step content, shared completion state across apps, and tree-shaken bundles that only include the tours each app actually uses.

## The tree shaking difference

We tested this with a Turborepo setup running two apps. The dashboard app bundled 6.2KB of tour-related code (gzipped). The marketing app, using only one of the two tours, bundled 3.8KB. Without `sideEffects: false`, both bundled the full 8.1KB — a 53% overhead for the marketing app.

The key configuration: mark your shared package with `"sideEffects": false` in package.json and use explicit `exports` fields.

## Full walkthrough

The complete tutorial covers all 7 steps with runnable TypeScript code examples, Turborepo configuration, troubleshooting for common issues, and FAQ.

Read the full article: [Tour Kit in a Turborepo monorepo: shared tours across apps](https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
