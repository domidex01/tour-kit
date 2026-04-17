## Title: A 5-axis framework for benchmarking React libraries with statistical rigor

## URL: https://usertourkit.com/blog/benchmark-react-library-methodology

## Comment to post immediately after:

We publish comparison articles for React product tour libraries and got tired of the state of "benchmarking" in the ecosystem. Most articles run a single build, screenshot the output, and declare a winner.

This is the methodology we now use for every benchmark we publish. Five axes (bundle weight, runtime performance, accessibility, developer experience, maintenance health), statistical significance requirements (2-sample t-test, p < 0.05), and a reproducible Vite test environment.

Key findings from building this:

- GC timing alone shifts JS benchmark results by 10-30% between identical runs on the same machine. Single-run benchmarks are noise.
- Tachometer (Google Chrome team) handles this by auto-determining sample size and interleaving test scenarios to remove environment drift.
- Lighthouse accessibility scores catch maybe 30-50% of real issues. Manual keyboard/screen reader testing is required.
- A library reporting 8KB on bundlephobia can contribute 15KB to your actual build if it doesn't tree-shake well. source-map-explorer on your production build is more accurate.

Disclosure: we built one of the libraries we benchmark (Tour Kit). Publishing the methodology is how we address the inherent bias.
