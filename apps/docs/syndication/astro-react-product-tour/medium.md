# How to add a product tour to an Astro site with React islands

## Interactive onboarding on static pages, without shipping unnecessary JavaScript

*Originally published at [usertourkit.com](https://usertourkit.com/blog/astro-react-product-tour)*

Astro renders pages as static HTML and only hydrates the parts that need interactivity. Product tours fit this model perfectly because they are interactive overlays on otherwise static content.

This tutorial walks through installing Tour Kit in an Astro project, creating a React island for the tour, sharing tour state across multiple islands with Nanostores, and handling the gotchas around client directives and SSR. The result is a product tour that adds zero JavaScript to pages where it isn't active.

## Why Astro's islands architecture is a natural fit for product tours

Product tours are quintessential "islands." They are interactive overlays sitting on top of static content pages. As of April 2026, Astro's npm downloads crossed 900k per week, up from 360k in January 2025. After Cloudflare acquired the Astro team in January 2026, the framework remains MIT-licensed and open-source.

The key insight: use `client:only="react"` for tour components. Tour libraries depend on browser APIs (DOM bounding rectangles, scroll position, focus management) that don't exist during server rendering. This directive skips SSR entirely, avoiding hydration mismatches.

## The setup

Install the React integration and Tour Kit:

    npx astro add react
    npm install @tourkit/core @tourkit/react

Tour Kit's core bundle weighs under 8KB gzipped. Both packages are ESM-first with full TypeScript declarations.

## Create the tour component

Build a standard React component that wraps Tour Kit's provider and tooltip UI:

    // src/components/ProductTour.tsx
    import { TourProvider, TourStep, TourTooltip } from '@tourkit/react'

    const steps = [
      {
        id: 'hero',
        target: '[data-tour="hero"]',
        title: 'Welcome',
        content: 'This is the main landing area.',
      },
      // ... more steps
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

Mount it in any `.astro` file with `<ProductTour client:only="react" />`. Add `data-tour` attributes to the static HTML elements you want to target.

## The cross-island state problem

Here's the gotcha that trips up most Astro + React developers: React Context doesn't work across island boundaries. Each `client:only` component creates a separate React root.

The solution is Nanostores, a framework-agnostic state library (under 1KB, zero dependencies) that Astro recommends for cross-island communication:

    npm install nanostores @nanostores/react

Create a shared store outside any React component:

    // src/stores/tour-store.ts
    import { atom } from 'nanostores'
    export const $tourActive = atom(false)

Both your nav button island and tour overlay island import the same store. When the trigger sets `$tourActive` to `true`, the tour island picks it up and renders.

## Performance impact

| Package | Size (gzipped) |
| --- | --- |
| react + react-dom | ~45KB (shared across all islands) |
| @tourkit/core | <8KB |
| @tourkit/react | <12KB |
| nanostores | <1KB |

Pages without the tour island load zero tour-related JavaScript. If the tour isn't active, the component returns `null` and adds zero DOM nodes.

## One limitation to know

Tour Kit requires React 18.2 or later. If your Astro site uses Svelte, Vue, or SolidJS islands alongside React, the tour can only target static HTML elements and React island contents. It can't attach tooltips to elements rendered inside a Svelte island because those live in a separate framework runtime.

The full tutorial with accessibility patterns, keyboard navigation setup, troubleshooting tips, and multi-page tour configuration is at [usertourkit.com/blog/astro-react-product-tour](https://usertourkit.com/blog/astro-react-product-tour).

---

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
*Import via medium.com/p/import to set canonical URL automatically.*
