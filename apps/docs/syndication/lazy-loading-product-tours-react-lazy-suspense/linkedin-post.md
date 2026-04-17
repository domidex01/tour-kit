Most React apps bundle their product tour library into the initial JavaScript payload. That's 30-50KB of code that competes with the actual UI for parse time on every page load, even when no tour fires during the session.

The fix takes about 10 lines of code: wrap the tour in React.lazy + Suspense and add a webpackPrefetch hint.

The result: tour code loads during idle time after the page renders, and appears instantly when triggered. In testing, this cut tour appearance latency from ~180ms to ~20ms.

A few production nuances that aren't in the typical tutorials:
- Next.js App Router requires next/dynamic instead of React.lazy (SSR conflict)
- Error Boundaries are mandatory because deploys invalidate chunk URLs
- Screen readers need aria-live + focus management for dynamically loaded UI (WCAG 2.2)

Real-world code splitting data from a case study: main chunk from 1.4MB to 800KB, TTI from 3.5s to 1.9s, Lighthouse from 52 to 89.

Full writeup with TypeScript code examples: https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense

#react #javascript #webperformance #frontend #webdevelopment
