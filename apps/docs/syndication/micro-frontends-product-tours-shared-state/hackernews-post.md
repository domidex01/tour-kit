## Title: Product tours across micro-frontends: shared state patterns for Module Federation

## URL: https://usertourkit.com/blog/micro-frontends-product-tours-shared-state

## Comment to post immediately after:

I tested React Joyride, Shepherd.js, and Driver.js inside a Webpack Module Federation setup with a host app and two remotes. None of them handle cross-module tours out of the box because they all assume a single React context tree or single application instance.

Three coordination patterns emerged from the testing:

1. CustomEvent bus on window (~0.5KB overhead) — works across any framework, no shared dependencies
2. Shared Zustand singleton via MF's shared scope (~3KB) — real shared state but version mismatches break it silently
3. Independent tour library instances per module with event-based coordination (~8KB per module)

The most interesting finding was around accessibility: DOM focus() works across module boundaries, but focus trapping breaks because trap libraries lose track when focus moves to a different React root. The workaround is deactivating the trap, moving focus at the DOM level, then re-activating in the receiving module.

The article includes full TypeScript implementations for all three patterns. Honest about tradeoffs — I built Tour Kit (the library used in pattern 3), so the comparison might be biased despite my best efforts.
