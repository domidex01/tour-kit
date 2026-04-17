## Thread (6 tweets)

**1/** Your product tour library ships 30-50KB of JavaScript on every page load, even when no tour fires. Here's the 10-line fix with React.lazy + Suspense:

**2/** Tour libraries are the *perfect* lazy-load candidate:
- Not needed on first render
- Execute once per session at most
- Conditional (most sessions never trigger one)
- 22-50KB gzipped depending on library

Wrap in React.lazy, remove them from your critical path.

**3/** The key trick: `webpackPrefetch: true`

This downloads the tour chunk during idle time *after* the page loads. When the user triggers the tour, it's already cached.

Result: ~180ms delay without prefetch, ~20ms with it.

**4/** Things every code-splitting tutorial skips:

- React.lazy doesn't work with SSR (use next/dynamic in Next.js)
- Error Boundaries are mandatory (deploys break old chunk URLs)
- Screen readers don't announce lazy-loaded content (WCAG 2.2 SC 2.4.3)

**5/** Don't over-split: 5 tour steps as 5 lazy chunks = 5 HTTP requests. The whole tour system should be ONE chunk.

Headless tour libraries make this cleaner because styles already exist in your bundle as part of your design system.

**6/** Full writeup with TypeScript examples, Next.js pattern, Error Boundary, and accessibility setup:

https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense
