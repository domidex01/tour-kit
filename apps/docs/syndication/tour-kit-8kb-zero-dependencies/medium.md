# How a React library stays under 8KB with zero dependencies

### The architecture decisions behind Tour Kit's bundle size

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies)*

Most product tour libraries don't publish their bundle sizes. React Joyride ships around 34KB gzipped. Shepherd.js comes in at 25KB. For a feature that runs once per user session, that's a lot of JavaScript.

Tour Kit ships at 8.1KB gzipped for core + React combined. Zero runtime dependencies. Here's how.

## The core has zero dependencies. Literally.

Tour Kit's core package has an empty `dependencies` field. React 18 or 19 is the only peer dependency. Every hook, utility, and type is written from scratch. No external packages at runtime.

React Joyride pulls in five runtime dependencies: react-floater, deep-diff, tree-changes, is-lite, and scroll-doc. Each adds weight and transitive dependencies.

## Where the bytes go

The full core barrel export measures 10.4KB gzipped. But nobody imports everything. A typical 5-step tour uses useTour, TourProvider, and a few components. The tree-shaken total in a production Vite build: 8.1KB.

Tour Kit separates logic from UI. The core handles step sequencing, keyboard navigation, focus trapping, and persistence. The React package wraps those hooks into components and externalizes Floating UI, Radix Slot, and CVA so they never get bundled.

## Five decisions that make this possible

**Peer dependencies.** Tour Kit externalizes React, Floating UI, and even the core package itself. Your bundler deduplicates instead of shipping copies.

**ESM-first with code splitting.** The dist contains 22 chunks. Unused ones never ship.

**ES2020 target.** No polyfills for features every modern browser supports.

**Write it yourself.** lodash.throttle adds 1.3KB for 15 lines of code. Tour Kit writes its own scroll management, DOM utilities, and throttle functions.

**Multiple entry points.** Styled components (2.6KB), headless (1.7KB), lazy-loaded (1.5KB), and a Tailwind plugin. The lazy entry loads zero bytes until the tour triggers.

## The honest part

The full barrel export is 10.4KB, not 8KB. Tour Kit's quality gate says core should be under 8KB. It's currently 2.4KB over. The 8.1KB number comes from tree-shaking in a real Vite build.

Tour Kit also has no visual builder. You need React developers to write tour code. For teams without frontend engineers, tools like Appcues let product managers build tours in a GUI.

## Reproduce it yourself

Clone the repo, run pnpm install && pnpm build, and use gzip -c against the dist files. Every number in this article is verifiable.

Full article with tsup configs, code examples, and comparison tables: [usertourkit.com/blog/tour-kit-8kb-zero-dependencies](https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
