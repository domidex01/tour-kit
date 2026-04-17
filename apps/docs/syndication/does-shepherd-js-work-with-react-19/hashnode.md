---
title: "Does Shepherd.js work with React 19?"
slug: "does-shepherd-js-work-with-react-19"
canonical: https://usertourkit.com/blog/does-shepherd-js-work-with-react-19
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/does-shepherd-js-work-with-react-19)*

# Does Shepherd.js work with React 19?

Shepherd.js broke on React 19 the day it shipped and stayed broken for thirteen months. The react-shepherd wrapper depended on `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`, a React internal that React 19 renamed. Hard crash: `TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')`.

Teams that upgraded between January 2025 and March 2026 had no working Shepherd tour until version 7.0.4 landed. Here's the full picture for anyone evaluating Shepherd.js on React 19 today.

## Short answer

Shepherd.js technically works with React 19 as of react-shepherd 7.0.4, released March 11, 2026. But the fix was a peer dependency relaxation, not an architectural change. Shepherd's core is written in Svelte, and the React wrapper remains a thin layer around vanilla JavaScript. For React 19 projects, libraries built natively for React (Tour Kit at under 8KB gzipped with an MIT license, or React Joyride) avoid the wrapper indirection entirely.

## The 13-month compatibility gap

Here's what happened, with dates from [GitHub issue #3102](https://github.com/shipshapecode/shepherd/issues/3102):

| Date | Event |
|------|-------|
| January 23, 2025 | Issue #3102 opened: React 19 crashes Shepherd with TypeError |
| February 7, 2025 | A developer who purchased Shepherd Pro reports it doesn't work with React 19 either |
| July 31, 2025 | "This library is also preventing us from migrating React 19" (@salimkanoun) |
| September 10, 2025 | Same developer migrates away to a different library |
| October 30, 2025 | Community criticizes the lack of maintainer response |
| January 28, 2026 | Maintainer's first public response: "Are we able to support 18 and 19 if we relax the peerDep?" |
| March 11, 2026 | v7.0.4 released with the fix (PR #3339) |

Thirteen months is a long time to block a React upgrade. React 19 went stable in December 2024, so this wasn't a niche early-adopter problem.

## Why this happened (and could happen again)

Shepherd.js is built in Svelte. The React integration is a wrapper, not a React-native implementation. That architecture means the library depends on React internals to bridge the gap between Svelte's rendering model and React's component lifecycle.

The React 19 fix was reportedly just relaxing the `peerDependencies` constraint from `"react": "^18.2.0"` to accept React 19. React's internal APIs change between majors, so the same pattern could repeat with React 20.

## Comparison: Shepherd.js vs React-native alternatives

| Feature | Shepherd.js 15.2.2 | Tour Kit | React Joyride |
|---------|-------------------|----------|---------------|
| Core language | Svelte (vanilla JS wrapper) | TypeScript (React-native) | TypeScript (React-native) |
| React 19 support | Fixed March 2026 (13-month gap) | Day-one support | Supported |
| License | AGPL-3.0 (commercial license required) | MIT (core packages) | MIT |
| Headless mode | No (opinionated styling) | Yes (headless-first) | Partial |
| Accessibility | Partial ARIA, no focus trap | WCAG 2.1 AA, focus trap | Basic ARIA |

Downloads as of April 2026 via [npm trends](https://npmtrends.com/intro.js-vs-react-joyride-vs-reactour-vs-shepherd.js).

## What we'd recommend

We built Tour Kit, so take this with appropriate skepticism. Every claim is verifiable on [npm](https://www.npmjs.com/), [GitHub](https://github.com/shipshapecode/shepherd/issues/3102), and [bundlephobia](https://bundlephobia.com/).

For React 19 projects, a React-native tour library removes an entire category of risk. React Joyride (~706K weekly downloads) is the established choice. Tour Kit is newer but ships headless, accessible, and modular from the start.

Full article with decision framework and FAQ: [https://usertourkit.com/blog/does-shepherd-js-work-with-react-19](https://usertourkit.com/blog/does-shepherd-js-work-with-react-19)
