## Title: Testing product tour libraries for SSR compatibility in Next.js 15

## URL: https://usertourkit.com/blog/best-product-tour-library-ssr

## Comment to post immediately after:

I tested five product tour libraries (React Joyride, Shepherd.js, Driver.js, Intro.js, and Tour Kit) in a Next.js 15 App Router project with React 19 and strict mode enabled.

The results weren't great for most of them. Intro.js crashes the server by accessing `document` at module level. React Joyride needs `next/dynamic` with `ssr: false` and still produces hydration warnings. Driver.js works but flickers during hydration.

The fundamental issue is that tour libraries need `getBoundingClientRect()`, `document.body`, and `localStorage` — none of which exist during server rendering. Libraries that access these at import time or during initial render will always conflict with SSR.

Full disclosure: I built one of the libraries being compared (Tour Kit). I've included specific data points (bundle sizes, license types, hydration behavior) and the testing methodology so you can verify the claims independently.
