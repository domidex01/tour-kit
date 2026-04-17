Most product tour libraries add 25-34KB of JavaScript to your bundle. For code that runs once per user session.

We spent months getting Tour Kit down to 8.1KB gzipped with zero runtime dependencies. The five decisions that mattered most:

1. Empty dependencies field in core. Every utility hand-written in 20-50 lines.
2. ESM-first with 22 code-split chunks. Tree-shaking drops everything unused.
3. ES2020 target. No polyfills for features every modern browser supports.
4. Externalize everything: React, Floating UI, even our own core package.
5. Multiple entry points: styled (2.6KB), headless (1.7KB), lazy-loaded (1.5KB).

The honest caveat: our full barrel export is 10.4KB. The 8.1KB is with tree-shaking in a real Vite build. Our quality gate says < 8KB and we're over.

Full technical breakdown with tsup configs and a comparison table covering React Joyride, Shepherd.js, Driver.js, and Intro.js:

https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies

#react #javascript #webperformance #opensource #bundlesize
