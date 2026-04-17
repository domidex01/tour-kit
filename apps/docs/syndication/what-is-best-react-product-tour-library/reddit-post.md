## Subreddit: r/reactjs

**Title:** I benchmarked 7 React tour libraries on bundle size, React 19 support, and accessibility — here's what I found

**Body:**

I've been building a product tour library (Tour Kit) and wanted to see how it stacks up against the competition. So I installed React Joyride, Shepherd.js, Driver.js, Intro.js, Reactour, OnboardJS, and Tour Kit into the same Vite 6 + React 19 + TS 5.7 project and ran the same 5-step tour through each.

The biggest surprise: React Joyride (400K weekly downloads) and Shepherd's React wrapper are both broken on React 19. Joyride hasn't had an npm release in about 9 months. If you're starting a new project today on React 19, your options are more limited than you'd think.

On accessibility, most libraries have axe-core violations out of the box. Intro.js scored 7 violations (missing ARIA labels, no focus trap, buttons as links). Driver.js had 4. Only Tour Kit scored zero, which was the result we were designing for but still felt worth validating independently.

Bundle sizes ranged from ~5 KB (Driver.js, but no React wrapper) to ~34 KB (React Joyride). Tour Kit landed at 8.1 KB gzipped for core + React.

Full article with the comparison table, methodology, and code examples: https://usertourkit.com/blog/what-is-best-react-product-tour-library

Bias disclosure: I built Tour Kit. Every number is verifiable against npm, GitHub, and bundlephobia. Happy to answer questions about methodology or tradeoffs.
