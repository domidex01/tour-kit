---
title: "Adding product tours to an Astro site with React islands"
published: false
description: "Astro renders pages as static HTML and only hydrates interactive parts. Product tours are a natural fit — here's how to wire up Tour Kit as a React island with Nanostores for cross-island state."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/astro-react-product-tour
cover_image: https://usertourkit.com/og-images/astro-react-product-tour.png
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

If you don't have an Astro project yet:

```bash
npm create astro@latest my-app -- --template basics
```

## Step 1: add the React integration

Astro doesn't ship with React by default. The official `@astrojs/react` integration handles the wiring: JSX transform, React DOM renderer, and the `client:*` directive support.

```bash
npx astro add react
```

This command installs `react`, `react-dom`, and `@astrojs/react`, then updates your `astro.config.mjs` automatically. If you prefer manual setup, add the integration yourself:

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [react()],
})
```

As of April 2026, Astro's npm downloads crossed 900k per week (up from 360k in January 2025, per the [Astro Year in Review 2025](https://astro.build/blog/year-in-review-2025/)). After Cloudflare acquired the Astro team in January 2026, the framework remains MIT-licensed and open-source.

## Step 2: install Tour Kit

Tour Kit ships two packages. `@tourkit/core` contains the framework-agnostic logic (step state machine, position calculations, localStorage persistence, keyboard navigation). `@tourkit/react` adds React hooks and components. Install both.

```bash
npm install @tourkit/core @tourkit/react
```

Both packages are ESM-first with CommonJS fallbacks and ship full TypeScript declarations. Tour Kit's core bundle weighs under 8KB gzipped, so it won't bloat your island.

## Step 3: understand client directives for tour components

This is where Astro's island architecture gets interesting for product tours. Astro provides five client directives that control when and how a component hydrates:

| Directive | When it hydrates | Tour use case |
|-----------|-----------------|---------------|
| `client:load` | Immediately on page load | Tour that must be ready instantly |
| `client:idle` | After `requestIdleCallback` | Tour that can wait for the page to settle |
| `client:visible` | When the component scrolls into view | Below-the-fold feature spotlight |
| `client:only="react"` | Client-side only (skips SSR) | Best default for tour libraries |
| `client:media="(query)"` | When a CSS media query matches | Desktop-only tour |

**Use `client:only="react"` for tour components.** Tour libraries depend on browser APIs (DOM bounding rectangles, scroll position, focus management) that don't exist during server rendering. The `client:only` directive skips SSR entirely, avoiding hydration mismatches. The `"react"` hint tells Astro which renderer to use since it can't infer the framework at build time.

We hit a hydration error on our first attempt using `client:load` because Tour Kit's spotlight overlay reads `document.body` dimensions during mount. Switching to `client:only="react"` fixed it immediately. Jason Miller (Preact creator) described islands as "server-rendered HTML with placeholders for highly dynamic regions that can be hydrated on the client into small self-contained widgets." A product tour is exactly that kind of widget.

Source: [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)

## Step 4: create the tour component

Build a standard React component that wraps Tour Kit's provider and tooltip UI. This file lives in your `src/components/` directory like any other React component.

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

Notice the step targets use `data-tour` attributes instead of element IDs or class names. Data attributes survive refactors. You won't accidentally break the tour by renaming a CSS class. As Smashing Magazine noted in their [guide to product tours in React](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/), "target DOM elements via stable class selectors, not brittle IDs."

## Step 5: mount the island in your Astro page

Drop the React component into any `.astro` file with the `client:only="react"` directive. Astro treats it as an independent island with its own React root.

```html
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro'
import ProductTour from '../components/ProductTour.tsx'
---

<Layout title="Home">
  <section data-tour="hero">
    <h1>Welcome to our product</h1>
    <p>Your content here.</p>
  </section>

  <section data-tour="features">
    <h2>Features</h2>
    <!-- feature cards -->
  </section>

  <section data-tour="cta">
    <a href="/docs">Get started</a>
  </section>

  <ProductTour client:only="react" />
</Layout>
```

The `data-tour` attributes on the HTML sections are plain Astro template output. They render as static HTML. The React island queries those elements at runtime to position its tooltips. No framework boundary issues because the island reads from the DOM, not from a shared React tree.

## Step 6: share tour state across islands with Nanostores

Here's the gotcha that trips up most Astro + React developers: **React Context doesn't work across island boundaries.** Each `client:only` component creates a separate React root. If you have a nav bar island with a "Start Tour" button and a separate tour overlay island, they can't share a React context provider.

The solution is [Nanostores](https://github.com/nanostores/nanostores), a framework-agnostic state library that Astro recommends for cross-island communication. It weighs under 1KB with zero dependencies.

```bash
npm install nanostores @nanostores/react
```

Create a shared store file (outside any React component):

```ts
// src/stores/tour-store.ts
import { atom } from 'nanostores'

export const $tourActive = atom(false)
export const $currentStep = atom(0)
```

Use the store in a nav button island:

```tsx
// src/components/TourTrigger.tsx
import { useStore } from '@nanostores/react'
import { $tourActive } from '../stores/tour-store'

export default function TourTrigger() {
  const isActive = useStore($tourActive)

  return (
    <button
      onClick={() => $tourActive.set(true)}
      aria-label="Start product tour"
      disabled={isActive}
    >
      {isActive ? 'Tour in progress...' : 'Take a tour'}
    </button>
  )
}
```

Update the tour component to read from the store:

```tsx
// src/components/ProductTour.tsx
import { useStore } from '@nanostores/react'
import { $tourActive } from '../stores/tour-store'
import { TourProvider, TourStep, TourTooltip } from '@tourkit/react'

const steps = [
  {
    id: 'hero',
    target: '[data-tour="hero"]',
    title: 'Welcome',
    content: 'This is the main landing area.',
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
    content: 'Install Tour Kit in your project.',
  },
]

export default function ProductTour() {
  const isActive = useStore($tourActive)

  if (!isActive) return null

  return (
    <TourProvider
      tourId="astro-onboarding"
      steps={steps}
      persist="localStorage"
      onComplete={() => $tourActive.set(false)}
      onClose={() => $tourActive.set(false)}
    >
      <TourStep>
        <TourTooltip />
      </TourStep>
    </TourProvider>
  )
}
```

Mount both islands in your layout:

```html
---
// src/layouts/Layout.astro
import TourTrigger from '../components/TourTrigger.tsx'
import ProductTour from '../components/ProductTour.tsx'
---

<html lang="en">
  <body>
    <nav>
      <TourTrigger client:only="react" />
    </nav>
    <slot />
    <ProductTour client:only="react" />
  </body>
</html>
```

The Nanostores atom acts as the single source of truth. When the trigger button sets `$tourActive` to `true`, the tour island picks it up and renders. When the tour completes or closes, it resets the atom. No React context required across the island boundary.

Source: [Astro Sharing State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/)

## Step 7: add keyboard navigation and accessibility

Tour Kit handles keyboard navigation out of the box: arrow keys move between steps, Escape closes the tour, Tab cycles focus within the tooltip. Since Astro pages are mostly static HTML, you need to make sure the tour doesn't trap focus away from content that a keyboard user might need.

Add `aria-live` regions so screen readers announce step changes, and provide a skip button on every step:

```tsx
// src/components/ProductTour.tsx (updated tooltip)
import { useStore } from '@nanostores/react'
import { $tourActive } from '../stores/tour-store'
import {
  TourProvider,
  TourStep,
  TourTooltip,
  useTour,
} from '@tourkit/react'

function TourControls() {
  const { currentStep, totalSteps, next, prev, close } = useTour()

  return (
    <div role="dialog" aria-label="Product tour" aria-live="polite">
      <TourTooltip />
      <div>
        <button onClick={close} aria-label="Skip tour">
          Skip
        </button>
        {currentStep > 0 && (
          <button onClick={prev}>Back</button>
        )}
        <button onClick={currentStep < totalSteps - 1 ? next : close}>
          {currentStep < totalSteps - 1 ? 'Next' : 'Done'}
        </button>
        <span aria-current="step">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>
    </div>
  )
}

// ... rest of ProductTour component using TourControls
```

Tour Kit respects `prefers-reduced-motion` by default. Spotlight transitions and tooltip animations are disabled when the user's OS requests reduced motion.

## Common issues and fixes

**Hydration mismatch with `client:load`**: Tour Kit reads DOM dimensions on mount. If you use `client:load` instead of `client:only="react"`, Astro renders the component on the server first, where `document` doesn't exist. The fix: switch to `client:only="react"`.

**Tour targets not found**: Astro renders static HTML before islands hydrate. If your tour targets are inside other React islands, those elements won't exist in the DOM until their island hydrates. Either move targets to static Astro HTML (preferred) or ensure the target island uses `client:load` so it mounts before the tour island.

**Nanostores not syncing**: The store file must be a separate `.ts` file imported by both islands. If you define the atom inside a React component, each island gets its own copy. Keep stores in a dedicated `src/stores/` directory.

**Tour persists after content changes**: Tour Kit persists completed tours to localStorage by `tourId`. If you change tour steps, update the `tourId` string (e.g., `"onboarding-v2"`) to reset completion state.

## Performance impact

The whole point of Astro's island architecture is shipping less JavaScript. Here's what this tour setup adds to your bundle:

| Package | Size (gzipped) | Notes |
|---------|---------------|-------|
| react + react-dom | ~45KB | Already present if you use any React island |
| @tourkit/core | <8KB | Framework-agnostic logic |
| @tourkit/react | <12KB | React bindings |
| nanostores + @nanostores/react | <1KB | Cross-island state |

If the tour isn't active, the `ProductTour` component returns `null` after reading the Nanostores atom. React renders nothing and the spotlight overlay adds zero DOM nodes. Pages without the tour island load zero tour-related JavaScript.

## Limitation: Tour Kit is React-only

Tour Kit requires React 18.2 or later. If your Astro site uses Svelte, Vue, or SolidJS islands alongside React, the tour can only target static HTML elements and React island contents. It can't attach tooltips to elements rendered inside a Svelte island because those live in a separate framework runtime. For sites using multiple UI frameworks, ensure all tour-target elements are in the static Astro HTML layer.

## FAQ

### Can I use Tour Kit with Astro content collections?

Yes. Content collections render as static HTML with `data-tour` attributes, and the React island queries those DOM elements at runtime. They operate on different layers with no conflict.

### Does `client:only` hurt SEO compared to server-rendered islands?

Product tours are interactive overlays with no indexable content. Search engines don't need to crawl tooltip text. Using `client:only="react"` for Tour Kit has zero SEO impact because the tour contributes no content to the page's static HTML.

### How do I prevent the tour from showing on every page load?

Set `persist="localStorage"` on the `TourProvider`. Tour Kit writes a completion flag keyed to the `tourId`. Once a user finishes or skips the tour, it won't reappear unless you change the `tourId` string or clear localStorage.

### Is Nanostores required for a single-island tour?

No. If your tour trigger and tour overlay live in the same React island, React's built-in `useState` works fine. Nanostores is only needed when multiple independent React islands need to communicate, like a nav bar button triggering a tour in the main content area.

### What Astro version introduced stable view transitions?

Astro shipped stable View Transitions in Astro 4.0 (December 2023). If you want smooth cross-page tour continuity without full reloads, upgrade to Astro 4+. As of April 2026, the latest stable release is Astro 5.16.
