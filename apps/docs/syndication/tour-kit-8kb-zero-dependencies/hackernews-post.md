## Title: How Tour Kit ships at 8KB gzipped with zero runtime dependencies

## URL: https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies

## If Show HN:
Show HN: Tour Kit – headless React tour library, 8KB gzipped, zero runtime deps

## Comment to post immediately after:

I built Tour Kit because existing product tour libraries shipped more JavaScript than I could justify for a feature that runs once per user session. React Joyride comes in at ~34KB gzipped with 5 runtime dependencies. Shepherd.js is ~25KB with @floating-ui/dom bundled. I wanted to see how small a full-featured tour library could be.

The core package has literally zero entries in its dependencies field. React 18/19 is the only peer dependency. Everything else (scroll management, focus trapping, keyboard navigation, storage adapters) is written from scratch in 20-50 line functions. The math was simple: lodash.throttle adds 1.3KB for something that takes 15 lines.

The honest caveat: the full barrel export of core is 10.4KB gzipped, not 8KB. The 8.1KB number is with tree-shaking in a real Vite production build. Our quality gate says core < 8KB and we're over that target. Also, there's no visual builder. You need React developers to write tour code.

The article walks through the tsup config, the core/UI architecture boundary, the five specific decisions that account for most of the size difference, and a comparison table against React Joyride, Shepherd, Driver.js, and Intro.js. All numbers are reproducible by cloning the repo and building.
