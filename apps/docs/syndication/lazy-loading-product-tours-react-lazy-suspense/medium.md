# Lazy loading product tours with React.lazy and Suspense

## How to remove 30-50KB from your initial bundle by deferring tour code

*Originally published at [usertourkit.com](https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense)*

Your product tour library ships zero value on first paint. Users don't need onboarding tooltips while the page is still rendering, yet most React apps bundle the entire tour system into the initial chunk. That's 30-50KB of JavaScript competing with your actual UI for parse time and main thread access.

React.lazy and Suspense fix this by splitting tour components into a separate chunk that loads only when needed.

## Why tour libraries are ideal for lazy loading

Tour libraries have four properties that make them perfect candidates for code splitting:

**They aren't needed on initial render.** A user's first interaction is never "start the tour." They need the page to load first.

**They're surprisingly heavy.** React Joyride ships at ~35KB gzipped. Shepherd.js runs ~50KB. Even lightweight headless libraries add weight you don't need until tour time.

**They execute once per session at most.** After onboarding completes, that JavaScript sits idle.

**They're conditional.** Many sessions never trigger a tour at all. You're shipping JavaScript that most page loads never execute.

## The pattern

Wrap your tour component in React.lazy, then use Suspense to handle loading:

```
import { lazy, Suspense } from 'react';

const ProductTour = lazy(() => import('./ProductTour'));

export function LazyProductTour({ shouldShow }) {
  if (!shouldShow) return null;
  return (
    <Suspense fallback={null}>
      <ProductTour />
    </Suspense>
  );
}
```

When shouldShow flips to true, React downloads the tour chunk and renders it. Until that moment, zero tour bytes hit the browser.

## Make it feel instant with prefetching

Without prefetching, there's a 100-500ms delay. With Webpack's magic comment, the browser downloads the tour during idle time:

```
const ProductTour = lazy(
  () => import(/* webpackPrefetch: true */ './ProductTour')
);
```

We tested this in a Vite 6 + React 19 project: without prefetch, ~180ms delay. With prefetch, ~20ms. Zero perceptible wait.

## The Next.js catch

React.lazy doesn't work with server-side rendering. For Next.js App Router, use next/dynamic with ssr: false. This gives you the same code-splitting benefits with correct server handling.

## What everyone forgets: Error Boundaries

After a new deployment, old chunk URLs go stale. Without an Error Boundary, the tour silently breaks. The fix: catch ChunkLoadError, retry or fail gracefully. A broken tour should never crash your app.

## And accessibility

When a lazy-loaded tour suddenly appears in the DOM, screen readers have no idea. You need aria-live="polite" and manual focus management (useEffect + ref.focus) to comply with WCAG 2.2 SC 2.4.3.

## The numbers

Real-world code splitting data: main chunk from 1.4MB to 800KB, TTI from 3.5s to 1.9s, Lighthouse from 52 to 89. Tours alone won't give you these gains, but they're one more chunk removed from the critical path.

Full article with complete TypeScript code examples: [usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense](https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
