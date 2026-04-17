## Subreddit: r/reactjs

**Title:** PSA: Shepherd.js was broken on React 19 for 13 months (Jan 2025 - Mar 2026) — here's the full timeline

**Body:**

I was researching product tour libraries for a React 19 project and found that Shepherd.js had a 13-month compatibility gap with React 19. Figured this might save others some time.

The root cause: react-shepherd accessed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`, which React 19 renamed. The issue (#3102) was open from January 2025 and wasn't fixed until March 2026 with v7.0.4.

What makes this interesting is the architecture. Shepherd.js is built in Svelte with a React wrapper. That's why it broke — the wrapper needed React internals to bridge the rendering models. The fix was reportedly just relaxing the peerDependency constraint, not a deep architectural change.

Some things I found during research:

- AGPL-3.0 license on the core package (react-shepherd is MIT, but AGPL cascades through deps)
- ~130K weekly downloads on the core, ~30K on the React wrapper (vs React Joyride at ~706K)
- Drupal is actively deprecating Shepherd.js from its core
- Accessibility: issue #198 about missing ARIA attributes has been open since 2018

The fix is live now (v15.2.2 / react-shepherd 7.0.4), so it does work with React 19. But if you're picking a tour library today, worth knowing the history.

Full writeup with comparison table and decision framework: https://usertourkit.com/blog/does-shepherd-js-work-with-react-19

Disclosure: I built Tour Kit (one of the alternatives mentioned). The article acknowledges this and every data point is verifiable on npm/GitHub.
