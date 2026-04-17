## Thread (6 tweets)

**1/** Most React library benchmarks are theater. Single-run `vite build`, screenshot the size, declare victory. We built a 5-axis framework that actually produces reliable results.

**2/** Axis 1: Bundle weight. Bundlephobia is a rough estimate. source-map-explorer on your actual production build tells you what the library really costs after tree-shaking. We've seen 8KB packages contribute 15KB to the real bundle.

**3/** Axis 2: Runtime. GC timing alone shifts results 10-30% between identical runs. We use Tachometer (Google Chrome team) — it auto-determines sample size and launches fresh browser profiles per iteration. 2-sample t-test, p < 0.05.

**4/** Axis 3: Accessibility. Lighthouse catches 30-50% of real issues. We add axe-core in Playwright + manual keyboard/screen reader testing. A fast, tiny library that breaks focus management isn't better.

**5/** Axes 4-5: DX (time-to-first-component with a stopwatch, 3 runs per library) and Maintenance health (commit frequency, React 19 support, breaking changes/year). No library wins all five.

**6/** Full methodology with code examples, tools table, and reproducible test environment spec:

https://usertourkit.com/blog/benchmark-react-library-methodology
