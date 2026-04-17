## Subreddit: r/reactjs

**Title:** I benchmarked 5 React tour libraries on bundle size, CWV impact, and accessibility. Here's the data.

**Body:**

I've been evaluating product tour libraries for a React 19 project and got frustrated that every library claims "lightweight" but none publish actual performance data. So I built a benchmark.

I installed React Joyride v3, Shepherd.js, Tour Kit, Driver.js, and Intro.js into the same Vite 6 + React 19 + TS 5.7 project, built an identical 5-step tour in each, and measured gzipped bundle size, init time (median of 50 cold starts), Total Blocking Time delta, and axe-core accessibility violations.

Quick results:

- **Driver.js:** 5 KB gzipped, 1.2 ms init, +3 ms TBT, 4 axe-core violations, no React wrapper
- **Tour Kit:** 8.1 KB, 1.8 ms init, +2 ms TBT, 0 violations, headless/composable
- **Shepherd.js:** 25 KB, 3.6 ms init, +12 ms TBT, 2 violations, multi-framework
- **Intro.js:** 29 KB, 5.1 ms init, +22 ms TBT, 7 violations, AGPL license
- **React Joyride v3:** 34 KB, 4.2 ms init, +18 ms TBT, 3 violations, largest community

The accessibility gap surprised me most. Three of five libraries have ARIA violations that would fail a WCAG 2.1 AA audit. Intro.js was the worst with 7 violations (missing aria-labelledby, buttons-as-links, no focus trap).

React 19 compatibility was the other pain point. React Joyride v2 was broken (deprecated ReactDOM APIs), v3 fixed it. Shepherd's React wrapper had issues. Intro.js wrapper hasn't been updated.

Bias disclosure: I'm the developer behind Tour Kit. I tried to be fair and the methodology is documented. Every number is verifiable against bundlephobia and npm.

Full writeup with comparison table and methodology: https://usertourkit.com/blog/react-tour-library-benchmark-2026

Curious what tour library others are using and whether anyone has seen different numbers.
