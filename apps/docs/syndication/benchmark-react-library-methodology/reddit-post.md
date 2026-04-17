## Subreddit: r/reactjs

**Title:** We built a 5-axis framework for benchmarking React libraries. Here's the full methodology.

**Body:**

I've been frustrated by library benchmark articles that run a single `vite build`, screenshot the output, and call it a comparison. No confidence intervals, no controlled environment, no reproducible setup.

So we documented the exact protocol we use when comparing React libraries. Five measurement axes:

1. **Bundle weight** — gzipped production size after tree-shaking (source-map-explorer, not just bundlephobia numbers)
2. **Runtime performance** — init time, INP impact, memory, re-render cost (Tachometer for statistical significance, 4x CPU throttling)
3. **Accessibility** — axe-core + manual keyboard/screen reader testing (Lighthouse only catches 30-50%)
4. **Developer experience** — time-to-first-component (stopwatch, 3 runs, report median), LOC for equivalent functionality, TS coverage
5. **Maintenance health** — commit frequency, issue response time, React 19 compatibility

The biggest takeaway: single-run benchmarks are meaningless. GC timing alone shifts results 10-30% between identical runs. We require a 2-sample t-test with p < 0.05 before accepting any claim, same standard the Node.js project uses.

Common mistakes we made along the way:
- Benchmarking dev builds (React dev mode adds timing instrumentation that inflates numbers)
- One library looked 40% slower because our test page had a layout shift causing unrelated re-renders
- Trusting bundlephobia numbers that didn't match actual tree-shaken production builds

We use this to benchmark product tour libraries specifically, but the methodology applies to any React library evaluation.

Full article with code examples and reproducible test environment spec: https://usertourkit.com/blog/benchmark-react-library-methodology

Disclosure: we built Tour Kit (a product tour library), so we have skin in the game. Publishing the methodology is how we keep ourselves honest.
