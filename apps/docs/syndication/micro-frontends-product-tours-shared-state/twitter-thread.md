## Thread (6 tweets)

**1/** Product tour libraries assume a single React tree. Micro-frontends don't have one. I tested React Joyride, Shepherd.js, and Driver.js inside Module Federation — here's what happened.

**2/** React Joyride's context can't span separate createRoot() boundaries. querySelector returned null for elements in remote modules. Shepherd.js partially worked. Driver.js came closest with global DOM queries, but has no state management or a11y.

**3/** Three patterns that actually work:

1. CustomEvent bus (~0.5KB) — zero deps, any framework
2. Shared Zustand singleton (~3KB) — real shared state, but version mismatches break it silently
3. Tour Kit headless hooks + events (~8KB) — built-in focus trapping and keyboard nav

**4/** The weirdest finding: DOM focus() works across module boundaries (it's a browser concept, not React). But focus *trapping* breaks because trap libraries lose track when focus moves to a different React root.

**5/** Honest take: none of these patterns are clean. If your onboarding flow can stay within a single module, keep it there. Cross-module tours are for flows that genuinely can't be scoped to one team's surface area.

**6/** Full deep-dive with TypeScript code for all 3 patterns, comparison tables, and FAQ:

https://usertourkit.com/blog/micro-frontends-product-tours-shared-state
