## Title: Benchmarking React product tour libraries: bundle size, CWV, and accessibility (2026)

## URL: https://usertourkit.com/blog/react-tour-library-benchmark-2026

## Comment to post immediately after:

I got frustrated that every product tour library claims "lightweight" without publishing numbers, so I ran a benchmark.

Setup: Vite 6 + React 19 + TS 5.7, identical 5-step tour in each library, measured gzipped bundle size, init time (median of 50 cold starts in Chrome), Lighthouse TBT/LCP delta, and axe-core violations.

The accessibility results were the most interesting finding. Three of five libraries ship ARIA violations that would fail WCAG 2.1 AA. Intro.js had 7 violations (missing aria-labelledby, buttons implemented as anchor tags, no focus trap). React 19 compatibility was the other major differentiator: React Joyride v2 broke due to deprecated ReactDOM APIs, and Shepherd's React wrapper had issues.

Disclosure: I built Tour Kit, which is one of the five libraries tested. I've documented the methodology and every number is verifiable against bundlephobia and npm. Happy to answer questions about the testing setup.
