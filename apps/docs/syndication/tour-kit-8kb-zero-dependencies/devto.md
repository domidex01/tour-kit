---
title: "How we keep a React tour library at 8KB gzipped (zero runtime deps)"
published: false
description: "A technical breakdown of tsup config, tree-shaking, code splitting, and the core/UI boundary that keeps Tour Kit under 8.1KB. All measurements reproducible."
tags: react, javascript, webdev, typescript
canonical_url: https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies
cover_image: https://usertourkit.com/og-images/tour-kit-8kb-zero-dependencies.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies)*

# How Tour Kit ships at 8KB gzipped with zero runtime dependencies

Most product tour libraries don't publish their bundle sizes. When you check bundlephobia yourself, the numbers are jarring: React Joyride lands around 34KB gzipped, Shepherd.js at 25KB, Intro.js at 29KB. For a feature that typically runs once per user session, that's a lot of JavaScript competing for your INP budget.

Tour Kit ships a complete 5-step tour at 8.1KB gzipped (core + React, measured via `vite build` in April 2026). No runtime dependencies. React and React DOM are the only peer dependencies.

We built Tour Kit, so take this with appropriate skepticism. Every measurement below is reproducible.

```bash
npm install @tourkit/core @tourkit/react
```

## What is product tour library bundle size?

Product tour library bundle size is the total gzipped JavaScript a tour library adds to your production build after tree-shaking. As of April 2026, tour libraries range from 5KB (Driver.js) to 34KB (React Joyride), a 7x spread for roughly the same feature. Measuring this number matters because tour code loads for every user but typically runs only once per session.

Google's [Core Web Vitals research](https://web.dev/articles/vitals) demonstrates that JavaScript bundle size directly affects Interaction to Next Paint (INP). The HTTP Archive's 2025 State of JavaScript report found the median page ships 509KB of JavaScript. Adding 34KB for a tour is 6.7% of that budget. Adding 8KB is 1.6%.

## What does "zero runtime dependencies" mean?

Tour Kit's core package (`@tour-kit/core`) has zero entries in its `dependencies` field. Not "few." Zero. The only requirement is React 18 or 19 as a peer dependency.

```json
// packages/core/package.json
{
  "dependencies": {},
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

Compare that to React Joyride, which pulls in `react-floater`, `deep-diff`, `tree-changes`, `is-lite`, and `scroll-doc` as runtime dependencies.

## Where the bytes go

| Entry point | Minified | Gzipped | Purpose |
|---|---|---|---|
| @tour-kit/core (full) | 33 KB | 10.4 KB | All hooks, utils, types |
| @tour-kit/react/headless | 4.1 KB | 1.7 KB | Logic-only components |
| @tour-kit/react (index) | 7 KB | 2.6 KB | Styled components |
| @tour-kit/hints | - | 2.8 KB | Hint/beacon system |

A typical tour uses `useTour`, `TourProvider`, a couple of positioning utilities, and a few components. The tree-shaken total in a real Vite build: 8.1KB gzipped.

## The core/UI split

Tour Kit separates business logic into `@tour-kit/core` and keeps UI rendering in `@tour-kit/react`. The core exports hooks and utilities with no components, no CSS, no styling opinions.

The React package wraps core hooks into components and externalizes all dependencies:

```ts
// packages/react/tsup.config.ts
export default defineConfig({
  external: [
    'react', 'react-dom',
    '@tour-kit/core',
    '@floating-ui/react',
    'tailwindcss',
  ],
  treeshake: true,
  splitting: true,
  minify: true,
  target: 'es2020',
})
```

## Five decisions that keep it small

**1. Peer deps instead of bundled deps.** React Joyride bundles `react-floater` into its output. Tour Kit externalizes everything. Your bundler deduplicates shared dependencies.

**2. ESM-first with code splitting.** The `dist/` contains 22 ESM chunks. Import only what you need; unused chunks never ship.

**3. ES2020 target.** No polyfills for optional chaining, nullish coalescing, or dynamic `import()`. Every browser above 1% market share supports them.

**4. Write it yourself.** `lodash.throttle` adds 1.3KB for 15 lines of code. `scroll-into-view-if-needed` adds 2.2KB for native browser behavior. If it's under 50 lines, don't add a dep.

**5. Multiple entry points.** Four exports: styled (2.6KB), headless (1.7KB), lazy (1.5KB), Tailwind plugin. The `/lazy` entry loads zero bytes until the tour triggers.

## How it compares

| Library | Gzipped | Runtime deps | Tree-shakeable | React integration |
|---|---|---|---|---|
| Tour Kit | 8.1 KB | 0 | Yes (ESM + splitting) | Native hooks + components |
| Driver.js | ~5 KB | 0 | Partial | No React wrapper |
| Shepherd.js | ~25 KB | @floating-ui/dom | Limited | Wrapper package |
| Intro.js | ~29 KB | 0 | No (single bundle) | Separate wrapper |
| React Joyride | ~34 KB | 5+ | No | Native |

## The honest part

The full core barrel export is 10.4KB gzipped, not 8KB. Our quality gate says core < 8KB. We're 2.4KB over. The 8.1KB number comes from tree-shaking in a real Vite build.

Tour Kit also doesn't have a visual builder. You need React developers to set up tours in code. It's a library, not a platform.

## Reproduce it yourself

```bash
git clone https://github.com/DomiDex/tour-kit.git
cd tour-kit
pnpm install && pnpm build

gzip -c packages/core/dist/index.js | wc -c
gzip -c packages/react/dist/index.js | wc -c
gzip -c packages/react/dist/headless.js | wc -c
```

Full article with all the details: [usertourkit.com/blog/tour-kit-8kb-zero-dependencies](https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies)
