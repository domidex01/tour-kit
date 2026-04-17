Most React library "benchmarks" run a single build, screenshot the number, and call it a comparison.

We've been publishing comparison articles for product tour libraries, and we got tired of the low bar. So we documented our full methodology: a 5-axis evaluation framework covering bundle weight, runtime performance, accessibility, developer experience, and maintenance health.

The biggest lesson: single-run benchmarks are statistically meaningless. Garbage collection timing alone shifts results 10-30% between identical executions. We now require a 2-sample t-test with p < 0.05 before accepting any benchmark claim — the same standard the Node.js project uses.

Two other findings that surprised us:
- Lighthouse accessibility scores catch only 30-50% of real issues. Manual keyboard and screen reader testing is required.
- A library reporting 8KB on bundlephobia can contribute 15KB to your production bundle if it doesn't tree-shake well with your bundler.

Full methodology with code examples and reproducible test environment spec: https://usertourkit.com/blog/benchmark-react-library-methodology

#react #javascript #webdevelopment #performance #opensource
