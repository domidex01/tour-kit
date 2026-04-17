# Tree-Shaking Product Tour Libraries: What Actually Gets Removed?

## Most React tour libraries don't tree-shake. We tested five to find out why.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tree-shaking-product-tour-libraries)*

You add a product tour library to your React app, import one hook, and assume the bundler strips out everything you didn't use. Sometimes it does. Often it doesn't.

We ran Vite's bundle analyzer against five tour libraries, importing a single component from each, and measured what survived tree-shaking. React Joyride shipped 31KB regardless of what we imported. Tour Kit shipped 2.9KB for the same single-hook import. Driver.js: 5KB. Shepherd.js: 22KB.

We built Tour Kit, so take those numbers with appropriate skepticism. Every measurement is reproducible.

## Why the difference?

Three things determine whether a library tree-shakes well:

**Module format.** Tree-shaking requires ES module syntax. CommonJS `require()` is dynamic — the bundler can't prove which exports are unused.

**The sideEffects flag.** The `"sideEffects": false` field in `package.json` tells the bundler every file is pure. Without it, bundlers keep everything.

**Export structure.** Barrel files that re-export everything can pull in the entire module graph. The fix: explicit named exports combined with `sideEffects: false`.

## The results

We tested in a minimal Vite 6 + React 19 + TypeScript 5.7 project. All measurements are gzipped, production mode, April 2026:

- **Tour Kit** — 8.1KB full, 2.9KB single-hook (64% savings)
- **Driver.js** — 5.1KB full, 5.0KB single-hook (2% savings)
- **Shepherd.js** — 25KB full, 22KB single-hook (12% savings)
- **React Joyride** — 34KB full, 31KB single-hook (9% savings)
- **Intro.js** — 29KB full, 27KB single-hook (7% savings)

Libraries without `sideEffects: false` barely tree-shake at all.

## How to verify tree-shaking yourself

Don't trust library authors (including us). Install `rollup-plugin-visualizer`, add it to your Vite config, and run `npx vite build`. You'll get a treemap showing exactly what survived in your bundle.

Then comment out your tour library import, rebuild, and compare the total. The difference is the actual cost after tree-shaking.

## The three mistakes that break tree-shaking

Even with a well-structured library, your code can undo the optimization:

1. **Wildcard re-exports** — `export * from '@tourkit/react'` pulls in everything. Use named exports.
2. **Full-package dynamic imports** — Import from subpaths instead: `import('@tourkit/react/headless')`
3. **Missing sideEffects in your own code** — If your wrapper has side effects, declare them explicitly.

## What to look for before installing

Check the library's `package.json` for five signals:

1. `"sideEffects": false`
2. `"type": "module"` with an `exports` map
3. Multiple entry points (subpath exports)
4. Zero or minimal runtime dependencies
5. Separate `export type` declarations

The full article includes code examples, tsup configuration details, and a step-by-step guide to running your own bundle analysis.

[Read the complete deep-dive](https://usertourkit.com/blog/tree-shaking-product-tour-libraries)

---

*Measurements taken April 2026 using Vite 6.2, React 19.2, TypeScript 5.7.*

**Suggested Medium publications:** JavaScript in Plain English, Bits and Pieces, Better Programming
