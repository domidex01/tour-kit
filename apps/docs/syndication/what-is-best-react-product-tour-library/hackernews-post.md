## Title: React tour library benchmark: React 19 broke the two most popular options

## URL: https://usertourkit.com/blog/what-is-best-react-product-tour-library

## Comment to post immediately after:

I build Tour Kit, a headless product tour library for React, so I have an obvious bias here. But I wanted real data instead of just marketing claims.

I installed 7 tour libraries into the same Vite 6 + React 19 + TypeScript 5.7 project and measured bundle size, init time, CWV impact, and accessibility (axe-core). The headline finding: React Joyride (400K weekly downloads) and Shepherd's React wrapper are both broken on React 19. Joyride hasn't published an npm release in about 9 months.

On the accessibility side, Intro.js scored 7 axe-core violations (missing ARIA labels, no focus trap, buttons implemented as links). Driver.js had 4. Tour Kit scored zero, which was the design goal but worth verifying.

Bundle sizes: Driver.js at ~5KB is smallest but has no React wrapper. Tour Kit at 8.1KB. React Joyride at ~34KB.

The honest limitation of Tour Kit: smaller community, no visual builder, requires React developers. If your product team needs to create tours without engineering, you need a SaaS platform like Appcues, not an open-source library.

Every number is verifiable against npm, GitHub, and bundlephobia. Methodology is in the article.
