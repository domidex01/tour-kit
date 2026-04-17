## Thread (6 tweets)

**1/** Shepherd.js was broken on React 19 for 13 months.

Jan 2025: React 19 ships, Shepherd crashes.
Mar 2026: Fix finally lands.

I traced the full timeline. Here's what happened and what it means for picking a tour library today.

**2/** Root cause: react-shepherd accessed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`.

React 19 renamed it. Hard crash. The "DO_NOT_USE" part was right there in the name.

**3/** The fix (v7.0.4) was a peerDependency relaxation, not an architectural change.

Shepherd is built in Svelte. The React wrapper bridges two rendering models. That's why it broke — and why it could break again with React 20.

**4/** Other things I found while researching:

- AGPL-3.0 license (react-shepherd is MIT, but AGPL cascades)
- Drupal is actively deprecating Shepherd.js from core
- Accessibility issue #198 about missing ARIA has been open since 2018
- ~30K weekly downloads on the React wrapper vs Joyride at ~706K

**5/** For React 19 projects, React-native libraries avoid this entire category of risk:

- React Joyride: 706K weekly downloads, MIT
- Tour Kit: headless-first, <8KB, MIT, WCAG 2.1 AA
- Driver.js: lightweight, MIT

None of them needed patches for React 19.

**6/** Full writeup with comparison table, AGPL licensing breakdown, and decision framework:

https://usertourkit.com/blog/does-shepherd-js-work-with-react-19

(Disclosure: I built Tour Kit. All data points are verifiable on npm/GitHub.)
