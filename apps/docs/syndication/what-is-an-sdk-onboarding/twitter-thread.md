## Thread (6 tweets)

**1/** "SDK" gets name-dropped on every developer tools page. But what does it actually mean — and how is it different from an API or a library?

I wrote a glossary breakdown. Here's the short version:

**2/** An API is a contract (endpoints, function signatures you call).

A library solves one problem.

An SDK bundles multiple libraries + types + docs + tooling into one coordinated package.

The key word: coordinated. Types are shared. Versioning is synced.

**3/** In the JS ecosystem, the SDK pattern usually follows layers:

Core (framework-agnostic logic)
-> Framework adapter (React hooks, Vue composables)
-> Optional extensions (analytics, scheduling)

You install what you need. The rest tree-shakes away.

**4/** For onboarding specifically:

A tour "library" = step-by-step tours
An onboarding "SDK" = tours + tooltips + checklists + announcements + analytics

Building just the tour part from scratch takes ~40-60 hours for a 5-step flow.

**5/** Bundle sizes across onboarding SDKs:

- Driver.js: 5KB (vanilla JS)
- Tour Kit core: <8KB (React, headless)
- Shepherd.js: 31KB (multi-framework)
- React Joyride: 37KB (React, styled)

Tradeoffs everywhere: bundle size vs features vs framework coupling.

**6/** Full breakdown with an SDK vs API comparison table and working React code examples:

https://usertourkit.com/blog/what-is-an-sdk-onboarding
