---
title: "Your product tour library is slowing down every page load (here's the fix)"
published: false
description: "Product tour libraries ship 30-50KB of JavaScript that competes with your UI on first paint. React.lazy + Suspense moves them off the critical path with ~10 lines of code."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense
cover_image: https://usertourkit.com/og-images/lazy-loading-product-tours-react-lazy-suspense.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense)*

# Lazy loading product tours with React.lazy and Suspense

Your product tour library ships zero value on first paint. Users don't need onboarding tooltips while the page is still rendering, yet most React apps bundle the entire tour system into the initial chunk. That's 30-50KB of JavaScript competing with your actual UI for parse time and main thread access.

React.lazy and Suspense fix this by splitting tour components into a separate chunk that loads only when needed. The result: faster Time-to-Interactive on every page load, and a tour that still feels instant when it triggers.

```bash
npm install @tourkit/core @tourkit/react
```

## What is lazy loading in the context of product tours?

Lazy loading a product tour means deferring the download and parse of all tour-related JavaScript until the moment a user actually needs it. Instead of bundling your tour library, its step definitions, and any animation dependencies into your main chunk, you wrap the tour in `React.lazy()` so the browser fetches it as a separate chunk on demand. As of April 2026, this technique removes 12-50KB (gzipped) from initial page loads depending on which tour library you use, directly improving Time-to-Interactive and Lighthouse performance scores.

Unlike route-based code splitting (which loads code per page), lazy loading a product tour is interaction-triggered. The import fires when a user clicks "Start tour," logs in for the first time, or encounters a new feature flag.

## Why it matters

Every kilobyte of JavaScript in your main bundle has a cost: download time, parse time, and compilation time that blocks the main thread before your app becomes interactive. For mobile users on mid-range devices, a 50KB tour library adds 200-400ms to Time-to-Interactive, even if the tour never fires during that session.

| Library | Gzipped size | Used on initial render? | Lazy-load savings |
|---|---|---|---|
| React Joyride | ~35KB | No | 35KB removed from main chunk |
| Shepherd.js | ~50KB | No | 50KB removed from main chunk |
| Tour Kit (@tour-kit/react) | <12KB | No | 12KB removed from main chunk |
| Intro.js | ~22KB | No | 22KB removed from main chunk |

## The basic pattern

```tsx
// src/components/LazyProductTour.tsx
import { lazy, Suspense } from 'react';

const ProductTour = lazy(() => import('./ProductTour'));

interface LazyProductTourProps {
  shouldShow: boolean;
}

export function LazyProductTour({ shouldShow }: LazyProductTourProps) {
  if (!shouldShow) return null;

  return (
    <Suspense fallback={null}>
      <ProductTour />
    </Suspense>
  );
}
```

```tsx
// src/components/ProductTour.tsx
import { TourProvider, TourStep } from '@tourkit/react';

const steps: TourStep[] = [
  { target: '#welcome-header', content: 'Welcome to the app' },
  { target: '#sidebar-nav', content: 'Navigate between sections here' },
  { target: '#create-button', content: 'Create your first project' },
];

export default function ProductTour() {
  return (
    <TourProvider steps={steps} defaultOpen>
      {/* Your tour UI components */}
    </TourProvider>
  );
}
```

The `fallback={null}` is deliberate. A loading spinner before a product tour would be confusing.

## Prefetching: making lazy tours feel instant

Webpack magic comments let you prefetch the tour chunk during idle time:

```tsx
const ProductTour = lazy(
  () => import(/* webpackPrefetch: true */ './ProductTour')
);
```

The browser inserts a `<link rel="prefetch">` tag after the main bundle finishes loading. When the user triggers the tour, the chunk is already cached. We tested this with Tour Kit in a Vite 6 + React 19 project: without prefetch, ~180ms delay. With prefetch, ~20ms.

## The Next.js caveat

React.lazy throws during server-side rendering. For Next.js App Router, use `next/dynamic`:

```tsx
import dynamic from 'next/dynamic';

const ProductTour = dynamic(() => import('./ProductTour'), {
  ssr: false,
  loading: () => null,
});
```

## Error boundaries for production

After a deployment, old chunk URLs go stale. Without an Error Boundary, the tour silently fails:

```tsx
export class TourErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.name === 'ChunkLoadError') {
      window.location.reload();
      return;
    }
    console.error('Tour failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
```

## Accessibility: don't forget focus management

When a lazy-loaded tour mounts, screen readers don't know it appeared. WCAG 2.2 SC 2.4.3 requires focus management:

```tsx
export default function ProductTour() {
  const tourRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tourRef.current?.focus();
  }, []);

  return (
    <div ref={tourRef} tabIndex={-1} role="dialog" aria-label="Product tour" aria-live="polite">
      <TourProvider steps={steps} defaultOpen>
        {/* Tour UI */}
      </TourProvider>
    </div>
  );
}
```

## Common mistakes

1. **Don't lazy-load tours that show on every page.** Persistent help beacons shouldn't be lazy.
2. **Don't over-split.** Individual tour steps as separate chunks = too many HTTP requests. One chunk for the whole tour system.
3. **Don't assume React Compiler handles this.** As of React 19, the Compiler speeds up rendering but does NOT automate code splitting.
4. **Don't skip the Error Boundary.** Stale chunks after deploys cause silent failures.

## Measuring the impact

Real-world code splitting data from a DEV Community case study: main chunk from 1.4MB to 800KB, TTI from 3.5s to 1.9s, Lighthouse scores from 52 to 89. Tours alone won't give you those numbers, but they're one more chunk removed from the critical path.

Full article with all code examples, the Next.js pattern, and accessibility details: [usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense](https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense)
