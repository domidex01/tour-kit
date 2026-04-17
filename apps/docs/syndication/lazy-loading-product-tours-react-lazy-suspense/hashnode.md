---
title: "Lazy loading product tours with React.lazy and Suspense"
slug: "lazy-loading-product-tours-react-lazy-suspense"
canonical: https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense
tags: react, javascript, web-development, performance
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense)*

# Lazy loading product tours with React.lazy and Suspense

Your product tour library ships zero value on first paint. Users don't need onboarding tooltips while the page is still rendering, yet most React apps bundle the entire tour system into the initial chunk. That's 30-50KB of JavaScript competing with your actual UI for parse time and main thread access.

React.lazy and Suspense fix this by splitting tour components into a separate chunk that loads only when needed. The result: faster Time-to-Interactive on every page load, and a tour that still feels instant when it triggers.

```bash
npm install @tourkit/core @tourkit/react
```

## What is lazy loading in the context of product tours?

Lazy loading a product tour means deferring the download and parse of all tour-related JavaScript until the moment a user actually needs it. Instead of bundling your tour library, step definitions, and animation dependencies into the main chunk, you wrap the tour in `React.lazy()` so the browser fetches it as a separate chunk on demand. As of April 2026, this removes 12-50KB (gzipped) from initial page loads.

## Why it matters

Every kilobyte in your main bundle costs download time, parse time, and compilation time that blocks the main thread. A 50KB tour library adds 200-400ms to Time-to-Interactive on mid-range mobile devices, even if the tour never fires. Users who complete onboarding tours are 2.5x more likely to convert to paid (Appcues 2024 Benchmark), but that conversion lift disappears if the tour's JavaScript slows down the first impression.

| Library | Gzipped size | Lazy-load savings |
|---|---|---|
| React Joyride | ~35KB | 35KB removed from main chunk |
| Shepherd.js | ~50KB | 50KB removed from main chunk |
| Tour Kit | <12KB | 12KB removed from main chunk |
| Intro.js | ~22KB | 22KB removed from main chunk |

## The basic pattern

```tsx
import { lazy, Suspense } from 'react';

const ProductTour = lazy(() => import('./ProductTour'));

export function LazyProductTour({ shouldShow }: { shouldShow: boolean }) {
  if (!shouldShow) return null;
  return (
    <Suspense fallback={null}>
      <ProductTour />
    </Suspense>
  );
}
```

The `fallback={null}` is deliberate. No loading spinner needed before a product tour.

## Prefetching for zero-delay tours

```tsx
const ProductTour = lazy(
  () => import(/* webpackPrefetch: true */ './ProductTour')
);
```

The browser downloads the tour chunk during idle time. When the user triggers the tour, it's already cached. We tested: ~180ms without prefetch, ~20ms with it.

## Next.js: use next/dynamic instead

React.lazy throws during SSR. For Next.js App Router:

```tsx
import dynamic from 'next/dynamic';

const ProductTour = dynamic(() => import('./ProductTour'), {
  ssr: false,
  loading: () => null,
});
```

## Error boundaries for stale chunks

After deployment, old chunk URLs break. An Error Boundary catches the failure gracefully and either retries or fails silently (a broken tour is never a critical error).

## Accessibility matters

When a lazy-loaded tour mounts, screen readers don't announce it. Use `aria-live="polite"` and move focus to the tour container with `useEffect` + `ref.focus()`. WCAG 2.2 SC 2.4.3 requires this for dynamically added interactive content.

## Common mistakes

1. Don't lazy-load tours that appear on every page (persistent beacons)
2. Don't split individual tour steps into separate chunks
3. Don't assume React Compiler automates code splitting (it doesn't, as of React 19)
4. Don't skip the Error Boundary

Full article with complete code examples, the Next.js pattern, Error Boundary implementation, and accessibility setup: [usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense](https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense)
