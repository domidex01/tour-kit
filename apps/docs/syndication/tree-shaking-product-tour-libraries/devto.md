---
title: "I tested tree-shaking on 5 tour libraries — the results were wild"
published: false
description: "We imported a single hook from each React tour library and measured what survived tree-shaking. React Joyride: 31KB. Tour Kit: 2.9KB. Here's why."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tree-shaking-product-tour-libraries
cover_image: https://usertourkit.com/og-images/tree-shaking-product-tour-libraries.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tree-shaking-product-tour-libraries)*

# Tree-shaking product tour libraries: what actually gets removed?

You add a product tour library to your React app, import one hook, and assume the bundler strips out everything you didn't use. Sometimes it does. Often it doesn't. The difference between a 3KB import and a 34KB import comes down to how the library was built, not how smart your bundler is.

We ran Vite's bundle analyzer against five tour libraries, importing a single component from each, and measured what survived tree-shaking. The results were uneven. React Joyride shipped 31KB of code regardless of what we imported. Tour Kit shipped 2.9KB for the same single-hook import. Driver.js landed at 5KB. Shepherd.js brought in 22KB.

We built Tour Kit, so take those numbers with appropriate skepticism. Every measurement below is reproducible using `npx vite-bundle-visualizer`. We'll show you exactly how to run the same tests.

```bash
npm install @tourkit/core @tourkit/react
```

## What is tree-shaking and why does it matter for tour libraries?

Tree-shaking is a dead-code elimination technique that bundlers like Vite, webpack, and Rollup use to strip unused exports from your production JavaScript. It analyzes the static `import`/`export` graph of ES modules, marks which exports are referenced, and drops everything else. As of April 2026, every major bundler enables tree-shaking by default, but the technique only works when the library cooperates. Tour libraries are a strong test case because most apps use a small fraction of a tour library's API.

[Smashing Magazine's tree-shaking reference guide](https://www.smashingmagazine.com/2021/05/tree-shaking-reference-guide/) explains the core mechanic well. Bundlers treat each export as a node in a dependency graph. No import path to a node? Gone. But side effects, CommonJS, and barrel files can block elimination entirely.

Why does this matter for tours specifically? Tour code loads for every user but runs for a fraction of sessions. A failed tree-shake means you pay for the positioning engine, analytics hooks, and tooltip variants you never render. Every page load. The [HTTP Archive's 2025 Web Almanac](https://almanac.httparchive.org/en/2025/javascript) reports the median page ships 509KB of JavaScript. A 34KB library that should have been 5KB wastes 5.7% of that budget.

## How tree-shaking actually works in tour libraries

Whether a tour library tree-shakes well depends on three factors that the library author controls: module format (ESM vs CJS), the `sideEffects` declaration in `package.json`, and how the library structures its exports. Get any one of these wrong and the bundler conservatively keeps everything.

### ESM is the prerequisite

Tree-shaking requires ES module syntax. `import { useTour } from '@tourkit/core'` gives the bundler a static graph to analyze. `const { useTour } = require('@tourkit/core')` does not. CommonJS `require()` is dynamic, so the bundler can't prove at build time which exports are unused.

### The sideEffects flag

The `"sideEffects": false` field in `package.json` tells the bundler: "every file in this package is pure. If you don't import from it, you can safely drop it." Without this flag, bundlers must assume any module might modify global state when loaded, so they keep everything.

[Webpack's tree-shaking documentation](https://webpack.js.org/guides/tree-shaking/) explicitly calls this out: "If all code within a module is side-effect free, we can simply mark the property as `false` to inform webpack that it can safely prune unused exports."

```json
{
  "name": "@tourkit/core",
  "sideEffects": false,
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Export structure and barrel files

A barrel file re-exports everything from a package through a single `index.ts`. When done carelessly, importing one function from a barrel pulls in the entire module graph because the bundler can't prove the other exports are side-effect free.

The fix: explicit named exports combined with `sideEffects: false`. Tour Kit's core package exports 60+ symbols through a barrel, but because every sub-module is marked side-effect free, the bundler can trace exactly which files are needed for any given import and drop the rest.

```typescript
// @tour-kit/core - src/index.ts (simplified)
export type { TourStep, TourState, TourOptions } from './types'
export { useTour, useStep, useSpotlight } from './hooks'
export { calculatePosition, scrollIntoView } from './utils'
export { TourProvider, TourKitProvider } from './context'
```

## What we measured: five libraries through Vite's analyzer

We tested five tour libraries by creating a minimal Vite 6 + React 19 + TypeScript 5.7 project, importing one hook or component from each, and running `npx vite-bundle-visualizer` to measure gzipped output.

| Library | Full bundle (gzipped) | Single-hook import (gzipped) | Tree-shaking savings | sideEffects: false | ESM build |
|---|---|---|---|---|---|
| Tour Kit (core + react) | 8.1KB | 2.9KB | 64% | Yes | Yes |
| Driver.js 1.x | 5.1KB | 5.0KB | 2% | No | Yes |
| Shepherd.js 14.x | 25KB | 22KB | 12% | No | Yes |
| React Joyride 2.x | 34KB | 31KB | 9% | No | Partial |
| Intro.js 7.x | 29KB | 27KB | 7% | No | Partial |

The pattern is clear. Libraries without `sideEffects: false` barely tree-shake at all.

## Why React Joyride resists tree-shaking

React Joyride pulls in 603K weekly downloads as of April 2026. Its architecture predates modern tree-shaking conventions, and three specific issues prevent the bundler from eliminating unused code.

First, class-based React components. Joyride ships class components whose `constructor` and `componentDidMount` lifecycle methods can contain side effects. Bundlers must assume they're impure.

Second, no `"sideEffects": false` declaration.

Third, a single entry point that bundles tooltips, scroll handling, spotlight overlay, and event system together. No subpath exports.

To be fair, Joyride was built before `sideEffects` was widely adopted. It works well for its use case.

## How Tour Kit achieves 64% tree-shaking reduction

Tour Kit eliminates 64% of its own code on a single-hook import because of four deliberate architectural decisions. The caveat: Tour Kit is React 18+ only, has no visual builder, and its community is younger than Joyride's or Shepherd's.

### Multiple entry points

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./headless": "./dist/headless.js",
    "./lazy": "./dist/lazy.js",
    "./tailwind": "./dist/tailwind/index.js"
  }
}
```

Importing from `@tourkit/react/headless` only loads the headless tour components. The styled components, Tailwind utilities, and lazy-loading wrappers never enter your bundle.

### Explicit type exports

```typescript
// These are compile-time only - zero bytes in production
export type { TourStep, TourState, TourOptions } from './types'

// These are the actual runtime code
export { useTour } from './hooks'
```

### tsup with treeshake and splitting

```typescript
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    lazy: 'src/lazy.tsx',
    'tailwind/index': 'src/tailwind/index.ts',
  },
  treeshake: true,
  splitting: true,
  format: ['cjs', 'esm'],
})
```

### Zero runtime dependencies in core

`@tour-kit/core` has no `dependencies` field at all. React and React DOM are peer dependencies. Fewer modules in the dependency graph means more effective tree-shaking.

## How to verify tree-shaking in your own project

Bundlephobia reports total package size but can't tell you what survives tree-shaking in your specific build. Here's the 3-step process we used.

### Step 1: install rollup-plugin-visualizer

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      filename: 'bundle-analysis.html',
    }),
  ],
})
```

### Step 2: build and open the treemap

```bash
npx vite build
```

This generates `bundle-analysis.html`. Each rectangle's area corresponds to its gzipped size. Find your tour library and see how much survived.

### Step 3: compare with and without your import

Comment out your tour library import, rebuild, and compare. The difference is the actual cost after tree-shaking.

## Common mistakes that break tree-shaking

### Re-exporting everything from a wrapper module

```typescript
// DON'T: This pulls in the entire library
export * from '@tourkit/react'

// DO: Export only what you use
export { TourProvider, useTour } from '@tourkit/react'
```

### Dynamic imports that reference the full package

```typescript
// DON'T
const TourLib = await import('@tourkit/react')

// DO
const { TourProvider } = await import('@tourkit/react/headless')
```

### Missing sideEffects in your own code

```json
{
  "sideEffects": ["*.css", "./src/setup.ts"]
}
```

## The 10-package architecture advantage

The most reliable form of tree-shaking isn't tree-shaking at all. It's never downloading the code in the first place. Tour Kit splits its functionality across 10 independent npm packages, each with its own `package.json` and `sideEffects: false`. If you only need tours, install `@tourkit/core` and `@tourkit/react`. Checklists, surveys, analytics, and announcements stay out of `node_modules` entirely.

## FAQ

### Does tree-shaking work with CommonJS modules?

Tree-shaking does not work with CommonJS (`require()`) modules. It requires static `import`/`export` syntax so the bundler can determine unused exports at build time.

### How much does sideEffects: false actually save?

The `sideEffects: false` flag was the single largest factor in our tests. Libraries without it showed 2-12% reduction. Tour Kit showed 64% reduction for a single-hook import.

### Can I tree-shake React Joyride by importing specific modules?

React Joyride doesn't expose subpath exports. The entire 34KB library enters your bundle. Dynamic imports with `React.lazy()` defer loading but don't eliminate code.

### What's the difference between tree-shaking and code splitting?

Tree-shaking removes code you never use anywhere. Code splitting loads code in separate chunks at different times. They're complementary.

### How do I check if a library tree-shakes well before installing it?

Open the library's `package.json` on npm. Look for `sideEffects: false`, `type: module`, and an `exports` map with subpath entries.

---

*Measurements taken April 2026 using Vite 6.2, React 19.2, TypeScript 5.7, on an M2 MacBook Air.*
