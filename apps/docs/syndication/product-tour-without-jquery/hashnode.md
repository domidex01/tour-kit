---
title: "What product tour tool works without jQuery?"
slug: "product-tour-without-jquery"
canonical: https://usertourkit.com/blog/product-tour-without-jquery
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-without-jquery)*

# What product tour tool works without jQuery?

jQuery was the standard for a decade. But if you're building with React, Vue, or any modern framework in 2026, dragging in a 30 KB dependency for DOM manipulation you already have is a hard sell. The good news: every serious product tour library dropped jQuery years ago.

The real question isn't "which tool works without jQuery?" but which jQuery-free library fits your stack, your licensing constraints, and your performance budget.

## Short answer

Every major product tour library in 2026 works without jQuery. Driver.js, Intro.js, Shepherd.js, React Joyride, and Tour Kit all ship zero jQuery dependencies. The only libraries that still require jQuery are effectively dead: Bootstrap Tour (last meaningful update 2019) and Trip.js (archived). If you're on React, Tour Kit's core ships at under 8 KB gzipped with full TypeScript support and WCAG 2.1 AA accessibility built in.

## jQuery-free product tour libraries compared

| Library | jQuery? | Gzip size | License | React support | Accessibility |
|---------|---------|-----------|---------|---------------|---------------|
| Tour Kit | No | <8 KB (core) | MIT | Native hooks + components | WCAG 2.1 AA, focus trap, aria-live |
| Driver.js | No | ~25 KB | MIT | Manual refs + useEffect | Basic ARIA attributes |
| React Joyride v3 | No | ~37 KB | MIT | Native React component | Partial (no focus trap) |
| Intro.js | No | ~10 KB | AGPL v3 | Community wrapper | Basic ARIA attributes |
| Shepherd.js | No | ~35 KB | AGPL v3 | Community wrapper | Basic ARIA attributes |
| Reactour | No | ~15 KB | MIT | Native React component | Partial |

## The AGPL licensing trap

Intro.js and Shepherd.js are licensed under AGPL v3. If you're building closed-source SaaS (and most of us are), that means you need a commercial license.

## Decision framework

- **Vanilla JS, no framework:** Driver.js (MIT, ~25 KB gzip)
- **React, fastest setup:** React Joyride v3 (340K+ weekly downloads, ~37 KB gzip)
- **Headless, full design control:** Tour Kit (<8 KB gzip, MIT)
- **Smallest bundle, not SaaS:** Intro.js (~10 KB gzip, but AGPL)
- **SPA route-change resilience:** Tour Kit (phase-based architecture)

Full article with code examples and accessibility breakdown: [usertourkit.com/blog/product-tour-without-jquery](https://usertourkit.com/blog/product-tour-without-jquery)
