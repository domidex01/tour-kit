## Thread (6 tweets)

**1/** Shepherd.js has 221K weekly npm downloads and uses AGPL-3.0 for its core. If your SaaS product ships it, you either open-source your frontend or buy a commercial license. Here's what I found when I dug into it:

**2/** The React wrapper (`react-shepherd`) is MIT-licensed, which looks safe. But it depends on `shepherd.js` core, which is AGPL. AGPL cascades through dependencies. Google bans AGPL internally. Most enterprise legal teams do the same.

**3/** There's also a technical issue: `react-shepherd` broke on React 19 for months because it accessed React's internal `__SECRET_INTERNALS` API. Issue #3102 was open from mid-2025 through January 2026. Teams were blocked from upgrading.

**4/** I wrote a step-by-step migration guide for replacing Shepherd.js with Tour Kit (MIT, headless, <8KB gzipped). The key architectural difference: Tour Kit uses native React hooks and context instead of wrapping a vanilla JS library.

**5/** The migration covers:
- Converting step definitions (imperative → declarative)
- Migrating event callbacks
- Multi-page tour persistence
- Cleanup and bundle savings (~6KB net reduction)

**6/** Full guide with before/after code examples: https://usertourkit.com/blog/migrate-shepherd-js-tour-kit

Disclosure: I built Tour Kit. Every data point is verifiable on npm/GitHub/bundlephobia.
