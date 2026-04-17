---
title: "How to add a product tour to an Astro site with React islands"
slug: "astro-react-product-tour"
canonical: https://usertourkit.com/blog/astro-react-product-tour
tags: react, javascript, web-development, astro, tutorial
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/astro-react-product-tour)*

# How to add a product tour to an Astro site with React islands

Astro renders pages as static HTML and only hydrates the parts that need interactivity. Product tours fit this model perfectly because they are interactive overlays on otherwise static content. This tutorial shows you how to install Tour Kit in an Astro project, create a React island that runs the tour, share tour state across multiple islands with Nanostores, and handle the gotchas around client directives and SSR. The result is a product tour that adds zero JavaScript to pages where it isn't active.

```bash
npm install @tourkit/core @tourkit/react
```

[View the Tour Kit documentation](https://usertourkit.com/docs) for full API reference and examples.

## What you'll build

You'll wire up a three-step product tour that highlights elements across an Astro page. The tour component lives in a single React island, hydrated only on the client. A separate nav island shares tour state through Nanostores so a "Start Tour" button in the header can trigger the overlay. When the tour completes, progress persists to localStorage and the tour won't reappear on the next visit.

We tested this on Astro 5.16 with React 19 and TypeScript 5.7. The setup works on any Astro 3+ project with the React integration enabled.

## Prerequisites

- Astro 3.0+ project (Astro 5 recommended)
- React 18.2+ (React 19 works out of the box)
- TypeScript 5.0+ (optional but recommended)
- A page with a few interactive elements to tour

## Step 1: add the React integration

```bash
npx astro add react
```

This command installs `react`, `react-dom`, and `@astrojs/react`, then updates your `astro.config.mjs` automatically. As of April 2026, Astro's npm downloads crossed 900k per week ([Astro Year in Review 2025](https://astro.build/blog/year-in-review-2025/)).

## Step 2: install Tour Kit

```bash
npm install @tourkit/core @tourkit/react
```

Tour Kit's core bundle weighs under 8KB gzipped. Both packages are ESM-first with full TypeScript declarations.

## Step 3: pick the right client directive

**Use `client:only="react"` for tour components.** Tour libraries depend on browser APIs (DOM bounding rectangles, scroll position, focus management) that don't exist during server rendering. The `client:only` directive skips SSR entirely, avoiding hydration mismatches.

| Directive | When it hydrates | Tour use case |
|-----------|-----------------|---------------|
| `client:load` | Immediately on page load | Tour that must be ready instantly |
| `client:idle` | After `requestIdleCallback` | Tour that can wait for the page to settle |
| `client:visible` | When the component scrolls into view | Below-the-fold feature spotlight |
| `client:only="react"` | Client-side only (skips SSR) | Best default for tour libraries |
| `client:media="(query)"` | When a CSS media query matches | Desktop-only tour |

## Step 4: create the tour component

```tsx
// src/components/ProductTour.tsx
import { TourProvider, TourStep, TourTooltip } from '@tourkit/react'

const steps = [
  {
    id: 'hero',
    target: '[data-tour="hero"]',
    title: 'Welcome',
    content: 'This is the main landing area. Scroll down to explore features.',
  },
  {
    id: 'features',
    target: '[data-tour="features"]',
    title: 'Feature grid',
    content: 'Each card links to detailed documentation.',
  },
  {
    id: 'cta',
    target: '[data-tour="cta"]',
    title: 'Get started',
    content: 'Click here to install Tour Kit in your own project.',
  },
]

export default function ProductTour() {
  return (
    <TourProvider tourId="astro-onboarding" steps={steps} persist="localStorage">
      <TourStep>
        <TourTooltip />
      </TourStep>
    </TourProvider>
  )
}
```

## Step 5: mount the island

```html
<ProductTour client:only="react" />
```

Add `data-tour` attributes to the static HTML elements you want to target. The React island queries those elements at runtime.

## Step 6: share state across islands with Nanostores

**React Context doesn't work across island boundaries.** Each `client:only` component creates a separate React root. Use [Nanostores](https://github.com/nanostores/nanostores) (under 1KB, zero deps) for cross-island communication.

```bash
npm install nanostores @nanostores/react
```

```ts
// src/stores/tour-store.ts
import { atom } from 'nanostores'
export const $tourActive = atom(false)
```

```tsx
// In any React island
import { useStore } from '@nanostores/react'
import { $tourActive } from '../stores/tour-store'
const isActive = useStore($tourActive)
```

Full code examples in the [original article](https://usertourkit.com/blog/astro-react-product-tour).

## Performance impact

| Package | Size (gzipped) |
|---------|---------------|
| react + react-dom | ~45KB (shared across all islands) |
| @tourkit/core | <8KB |
| @tourkit/react | <12KB |
| nanostores | <1KB |

Pages without the tour island load zero tour-related JavaScript.

## FAQ

**Can I use Tour Kit with Astro content collections?** Yes. Content collections render as static HTML, and the React island queries those DOM elements at runtime.

**Does `client:only` hurt SEO?** No. Product tours are interactive overlays with no indexable content.

**Is Nanostores required?** Only when multiple independent React islands need to communicate.

Read the full tutorial with accessibility patterns and troubleshooting at [usertourkit.com/blog/astro-react-product-tour](https://usertourkit.com/blog/astro-react-product-tour).
