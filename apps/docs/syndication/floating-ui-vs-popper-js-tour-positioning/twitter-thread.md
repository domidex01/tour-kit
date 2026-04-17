## Thread (6 tweets)

**1/** Popper.js still gets 8.7M weekly npm downloads but hasn't shipped a release since 2022.

Floating UI replaced it at half the bundle size with better TypeScript and React 19 support.

Here's the full breakdown for tooltip/tour positioning in 2026:

**2/** The core change: Popper.js uses monolithic modifiers (~7kB gzipped, no tree-shaking). Floating UI uses composable middleware (~3kB gzipped, import only what you need).

Same creator, completely different architecture.

**3/** Which tour libraries use which engine:

- React Joyride v3 → Floating UI
- Shepherd.js → Floating UI (bundled)
- Reactour → still on Popper.js
- Driver.js → custom math (no dependency)

Your tour library choice determines your positioning engine.

**4/** CSS Anchor Positioning (Chrome 125+) could replace both... eventually.

But no Safari support, no programmatic update control, no custom middleware.

Not ready for product tours in 2026.

**5/** Three positioning mistakes we see in production:

1. Forgetting autoUpdate() cleanup → memory leaks
2. Using position:absolute instead of transform → layout thrashing
3. Hardcoding placement without flip() → broken responsive layouts

**6/** Full comparison with code examples, migration table, and React integration patterns:

https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning
