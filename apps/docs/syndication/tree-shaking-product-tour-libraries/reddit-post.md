## Subreddit: r/reactjs

**Title:** I tested tree-shaking on 5 React tour libraries — the difference between sideEffects: false and no declaration is massive

**Body:**

I've been working on bundle optimization for a product tour library and got curious: how well do the popular tour libraries actually tree-shake?

Set up a minimal Vite 6 + React 19 project, imported a single hook from each library, and ran `rollup-plugin-visualizer`. Here's what survived after tree-shaking (all gzipped):

- **React Joyride** — 34KB full → 31KB with one import (9% reduction)
- **Shepherd.js** — 25KB full → 22KB (12%)
- **Intro.js** — 29KB full → 27KB (7%)
- **Driver.js** — 5.1KB full → 5.0KB (2%, but it's small enough that it doesn't matter)
- **Tour Kit** — 8.1KB full → 2.9KB (64%)

The single biggest factor was whether the library declares `"sideEffects": false` in its package.json. Without that flag, Vite/webpack assume every module might modify global state, so they keep everything.

Other things that mattered: ESM vs CJS (CJS can't tree-shake at all), whether the library has subpath exports, and whether type exports use `export type` (which gets compiled away completely).

If you want to check your own dependencies, `rollup-plugin-visualizer` with `gzipSize: true` is the fastest way. Comment out the import, rebuild, compare totals.

Full writeup with code examples and tsup config details: https://usertourkit.com/blog/tree-shaking-product-tour-libraries

Disclosure: I built Tour Kit, so the comparison obviously favors it architecturally. But the methodology is reproducible — you can run the same tests on any library.
