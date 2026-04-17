## Thread (6 tweets)

**1/** shadcn/ui has 75K+ GitHub stars and no Tour component.

Issue #999 asked for one in 2023. Closed without implementation. Radix UI has the same gap — Discussion #1199 from 2022.

I compared 7 tour libraries for shadcn/ui compatibility. Here's what I found:

**2/** Three architecture patterns exist:

- Own-CSS (Joyride, Shepherd, Driver.js) — import their CSS, fight specificity
- shadcn wrappers (shadcn/tour, Onborda) — look right, but locked structure
- Headless (Tour Kit, OnboardJS) — bring your own shadcn components

**3/** The surprising part: none of the established libraries (Joyride, Shepherd, Driver.js, Intro.js) make explicit WCAG 2.1 AA accessibility claims.

Focus trapping, keyboard nav, screen reader support — the stuff that makes tours accessible — isn't documented.

**4/** Bundle sizes (gzipped):
- Driver.js: ~5KB (smallest, own CSS)
- Tour Kit core: <8KB (headless)
- Joyride: ~12-15KB (own CSS)
- Intro.js: ~15KB (most opinionated)
- Shepherd: ~25KB (heaviest)

**5/** The decision is really about styling philosophy.

If your app uses shadcn/ui + Tailwind, you want a library that lets you render with YOUR components. Not one that ships tooltips you override.

That's the headless approach.

**6/** Full comparison table with 7 libraries, code example using shadcn/ui Card + Tour Kit hooks, and decision framework:

https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library

(Disclosure: I built Tour Kit. Every data point is verifiable against npm/bundlephobia.)
