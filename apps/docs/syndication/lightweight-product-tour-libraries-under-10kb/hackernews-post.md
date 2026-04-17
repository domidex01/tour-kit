## Title: Product tour libraries under 10KB gzipped – only 5 out of 10+ qualify

## URL: https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb

## Comment to post immediately after:

I got curious about the bundle weight of product tour libraries after noticing React Joyride adds ~50KB to a production bundle for code that runs once per user.

Tested 10+ libraries in a Vite 6 + React 19 + TypeScript 5.7 project using bundlephobia and the Vite build analyzer. Only five stayed under 10KB gzipped: Driver.js (~5KB), Intro.js (~4-5KB, but AGPL-licensed), Tour Kit (<8KB, my project), Onborda (~8KB, Next.js only + Framer Motion dep), and OnboardJS (~8-10KB, flow orchestration without DOM highlighting).

Two things surprised me: (1) Intro.js's AGPL license is a bigger practical constraint than its bundle size for most commercial projects, and (2) no library in this space markets tree-shaking support or connects their bundle size to Core Web Vitals metrics, which is the actual reason performance-focused teams care.

The comparison table in the article covers gzipped size, dependencies, React 19 compatibility, TypeScript support, licensing, and accessibility. All numbers are verifiable against npm and bundlephobia.

Full disclosure: I built Tour Kit, so I've tried to be transparent about that and fair with the other entries. Interested in feedback on whether I succeeded.
