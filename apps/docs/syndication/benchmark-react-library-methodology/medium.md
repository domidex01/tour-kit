# How we benchmark React libraries: methodology and tools

## A 5-axis framework for evaluating React libraries with statistical rigor

*Originally published at [usertourkit.com](https://usertourkit.com/blog/benchmark-react-library-methodology)*

Most library benchmarks are theater. Someone runs a single build, screenshots the output size, and declares victory. No confidence intervals. No controlled environment. No mention of what they actually measured.

We got tired of benchmarks that hand-wave through methodology. So we built a protocol: five measurement axes, statistical significance requirements, and reproducible test setups that anyone can run.

## Why single-run benchmarks fail

Running a build once and comparing output sizes tells you almost nothing. JavaScript engines apply JIT optimizations that vary between runs. Background processes steal CPU cycles. Garbage collection timing shifts results by 10-30% across identical executions on the same machine.

Nolan Lawson, who built Google's Tachometer benchmarking tool, catalogs the common traps: "Measuring unintended code paths, confirmation bias ('got the answer you wanted, so you stopped looking'), cached performance skewing results, JavaScript engine optimizations eliminating test code, inadequate sample sizes."

The fix: run enough iterations for statistical significance, interleave tests, report confidence intervals instead of averages. The Node.js project requires a 2-sample t-test with p < 0.05 before accepting any benchmark claim.

## The five-axis framework

We evaluate every React library across five axes:

**1. Bundle weight** — Gzipped production size after tree-shaking, measured via source-map-explorer (not just the bundlephobia number).

**2. Runtime performance** — Initialization time, INP impact, memory allocation, re-render cost. Measured with Tachometer (auto-determines sample size, launches fresh browser profiles between runs) and 4x CPU throttling.

**3. Accessibility** — axe-core violations plus manual keyboard navigation and screen reader testing. Lighthouse catches only 30-50% of real issues.

**4. Developer experience** — Time-to-first-component (measured with a stopwatch, three times per library), lines of code for equivalent functionality, TypeScript coverage.

**5. Maintenance health** — Last commit date, open issue response time, React 19 compatibility, breaking change frequency.

No library wins all five. That's the point of measuring all five.

## The mistakes we made (so you don't have to)

**Benchmarking development builds.** React's dev mode adds instrumentation, StrictMode double-renders, and console warnings that don't exist in production. Always benchmark production builds.

**Measuring the wrong thing.** One library looked 40% slower until we realized our test page had a layout shift triggering extra re-renders unrelated to the library under test.

**Ignoring tree-shaking.** A library reporting 8KB on bundlephobia can contribute 15KB to your actual bundle if it doesn't tree-shake well with your bundler.

**Skipping accessibility.** A library scoring perfectly on bundle and runtime while shipping inaccessible overlays isn't actually better. We learned this one the hard way.

## The tools

We use source-map-explorer for bundle analysis, Tachometer for statistically significant runtime benchmarks, axe-core via Playwright for accessibility audits, and Chrome DevTools with React Performance Tracks (19.2+) for profiling.

Tachometer is the key differentiator. It runs iterations until statistical significance is reached and interleaves test scenarios to remove environment-specific variance. Built by Google's Chrome team.

The full article includes our reproducible test environment spec, code examples for both bundle analysis and accessibility auditing, and a complete tools table with selection criteria.

Read the full article: [usertourkit.com/blog/benchmark-react-library-methodology](https://usertourkit.com/blog/benchmark-react-library-methodology)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
