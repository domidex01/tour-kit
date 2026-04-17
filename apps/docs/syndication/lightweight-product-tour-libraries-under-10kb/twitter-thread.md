## Thread (6 tweets)

**1/** React Joyride adds ~50KB to your bundle. Shepherd.js is 30KB + Floating UI. For code that runs once per user session, that's a lot of JavaScript eating your Core Web Vitals.

I tested 10+ tour libraries. Only 5 stay under 10KB gzipped.

**2/** The lineup:

- Driver.js: ~5KB, zero deps, vanilla JS
- Intro.js: ~4-5KB, zero deps, AGPL (!)
- Tour Kit: <8KB, headless, WCAG 2.1 AA
- Onborda: ~8KB, Next.js only, needs Framer Motion
- OnboardJS: ~8-10KB, flow orchestration only

**3/** Biggest surprise: Intro.js has the smallest bundle but the biggest hidden cost. AGPL-3.0 means you must open-source your app or buy a commercial license. Multiple teams have discovered this after shipping to production.

**4/** No tour library markets tree-shaking support. Most ship monolithic bundles without `sideEffects: false`. You get the full library even if you use 10% of it.

Only Tour Kit and OnboardJS ship proper ESM with tree-shaking.

**5/** Zero product tour libraries claim WCAG 2.1 AA compliance. Focus trapping, ARIA live regions, `prefers-reduced-motion` — all missing from the marketing pages.

This is an accessibility gap across the entire category.

**6/** Full comparison with table, licensing breakdown, React 19 compat, and tree-shaking analysis:

https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb

(Disclosure: I built Tour Kit. Tried to be fair — you can verify every number against npm and bundlephobia.)
