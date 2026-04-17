---
title: "Cross-framework product tours: Shepherd.js vs Driver.js vs headless alternatives"
published: false
description: "We tested every major product tour library that claims to work with both Vue and React. Here's what actually happens when you use framework-agnostic tour libraries in real projects."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/product-tour-library-vue-react
cover_image: https://usertourkit.com/og-images/product-tour-library-vue-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-library-vue-react)*

# Is there a product tour library that works with Vue and React?

If you run Vue on one product and React on another (or both in the same codebase), the standard advice is "pick Shepherd.js." That advice isn't wrong, but it skips the part where Shepherd's React and Vue wrappers are thin convenience layers over a vanilla JS core. You get cross-framework coverage, but you lose the idiomatic hooks and composability that made you choose Vue or React in the first place.

The real question isn't "does a cross-framework tour library exist?" It does. Several do. The question is whether the developer experience survives the abstraction.

We tested the major options in a Vite 6 + React 19 and a Nuxt 3 + Vue 3 project. Here's what we found.

## Short answer

As of April 2026, three product tour libraries work across both Vue and React: Shepherd.js (13.7K GitHub stars, 656 kB unpacked), Driver.js (25.5K stars, 83 kB unpacked), and Intro.js (23.8K stars, 874 kB unpacked, AGPL-licensed). All three are vanilla JavaScript cores with framework wrappers. None provides first-class Vue 3 Composition API hooks or first-class React hooks from a shared engine. For React-only teams, Tour Kit ships at under 8 kB gzipped with native hooks and WCAG 2.1 AA accessibility. A `@tour-kit/vue` package is on the roadmap.

## How cross-framework tour libraries actually work

Every library claiming "works with Vue and React" follows the same pattern: a vanilla JavaScript engine that manipulates the DOM directly, wrapped in thin framework adapters. The core calculates positions, draws overlays, manages step state. A Vue component wraps it for Vue projects. A React component wraps it for React projects.

This matters because wrapper quality varies wildly. Shepherd.js has official wrappers for React, Vue, Angular, even Ember. But the React wrapper is a class-based component that hasn't been rewritten for hooks. The Vue wrapper targets Vue 2 and Vue 3 but doesn't use the Composition API internally. You end up calling imperative methods on a ref instead of using reactive state.

Driver.js skips the wrapper question entirely. Pure vanilla JS. You call `driver.highlight()` and `driver.drive()` from inside a `useEffect` or `onMounted`. Honest, at least. You know what you're getting.

"Most teams severely underestimate the work involved: handling async DOM updates, keyboard navigation, accessibility, responsive behavior on mobile, animations, and tour state management," notes [Chameleon's Vue product tours guide](https://www.chameleon.io/blog/vuejs-product-tours). The wrapper approach pushes all of that complexity onto you.

## Detailed comparison

| Feature | Shepherd.js | Driver.js | Intro.js | Tour Kit |
|---------|------------|-----------|----------|----------|
| React support | Official wrapper | Vanilla JS (manual) | Community wrapper | Native hooks |
| Vue support | Official wrapper | Vanilla JS (manual) | Community wrapper | Roadmap |
| Bundle size (unpacked) | 656 kB | 83 kB | 874 kB | Core: ~20 kB, React: ~30 kB |
| Bundle size (gzipped) | ~25 kB | ~5 kB | ~30 kB | Core: <8 kB, React: <12 kB |
| TypeScript | Yes | Yes (built in TS) | Types available | Yes (strict mode) |
| License | MIT | MIT | AGPL-3.0 / Commercial | MIT (core) / Commercial (extended) |
| WCAG 2.1 AA | Partial (keyboard nav) | No explicit compliance | No explicit compliance | Yes (focus trap, ARIA, reduced motion) |
| React 19 compatible | Wrapper untested | Yes (no React dep) | Wrapper untested | Yes |
| Analytics built-in | No | No | No | Yes (@tourkit/analytics) |
| Last npm publish | ~17 days ago | ~4 months ago | ~9 months ago | Pre-release |
| GitHub stars | 13,716 | 25,538 | 23,850 | New |
| Best for | Multi-framework teams | Lightweight spotlights | Quick prototyping (check AGPL) | React headless composability |

Data sourced from npm, GitHub, and bundlephobia as of April 2026.

## What about Vue-only options?

Vue Tour (pulsardev) was the go-to Vue tour library for years. It hit 2,443 GitHub stars and ~20K weekly npm downloads. But its last publish was over five years ago. It doesn't support Vue 3's Composition API natively, and there's no TypeScript support.

VueJS Tour by GlobalHive targets Vue 3 with Composition API support, but adoption is limited. v-onboarding is lightweight and Composition API-ready, though it lacks accessibility features or analytics.

The Vue tour ecosystem has a maintenance problem.

## The wrapper tradeoff you should understand

Here's the pattern with framework-agnostic libraries. You install Shepherd.js in a React project:

```tsx
// src/components/TourButton.tsx
import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';

export function TourButton() {
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'shepherd-theme-arrows',
      },
    });

    tour.addStep({
      id: 'welcome',
      text: 'Welcome to the dashboard.',
      attachTo: { element: '#dashboard-header', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tourRef.current = tour;
    return () => tour.cancel();
  }, []);

  return <button onClick={() => tourRef.current?.start()}>Start tour</button>;
}
```

You're managing tour state imperatively through refs. No reactive step tracking. No access to current step index through React state. No composition with other hooks.

Compare that with a React-native approach:

```tsx
// src/components/ProductTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { id: 'welcome', target: '#dashboard-header', content: 'Welcome to the dashboard.' },
  { id: 'sidebar', target: '#sidebar-nav', content: 'Navigate between sections here.' },
];

function TourControls() {
  const { currentStep, totalSteps, next, back, isActive } = useTour();
  if (!isActive) return null;

  return (
    <div role="dialog" aria-label={`Tour step ${currentStep + 1} of ${totalSteps}`}>
      <p>{steps[currentStep].content}</p>
      <button onClick={back} disabled={currentStep === 0}>Back</button>
      <button onClick={next}>{currentStep === totalSteps - 1 ? 'Finish' : 'Next'}</button>
    </div>
  );
}

export function ProductTour() {
  return (
    <TourProvider steps={steps}>
      <TourControls />
    </TourProvider>
  );
}
```

Reactive state. Composable. Accessible by default. But React-only. That's the tradeoff.

## Decision framework: which library fits your stack?

**If your entire frontend is Vue 3:** Use v-onboarding for simple tours or VueJS Tour for Composition API support. Accept that neither has accessibility compliance or analytics.

**If your entire frontend is React 18+:** Use Tour Kit for headless composability with built-in accessibility, or React Joyride (~400K weekly downloads) if you want opinionated styling out of the box.

**If you need one library across Vue and React:** Use Shepherd.js. Widest framework support, active maintenance, built-in keyboard navigation. Accept the 656 kB unpacked size and imperative wrapper DX. For lighter needs, Driver.js at 83 kB covers tours and spotlights.

**If you're migrating from Vue to React:** Start with a framework-agnostic library during the migration. Once you've settled on a single framework, evaluate framework-native options.

**If accessibility is a hard requirement:** Tour Kit is the only library making explicit WCAG 2.1 AA compliance claims. Shepherd.js has partial keyboard navigation. Everything else requires manual implementation.

## What about web components?

CSS anchor positioning is worth watching. [CSS-Tricks documented a `<hand-hold>` web component](https://css-tricks.com/one-of-those-onboarding-uis-with-anchor-positioning/) using native CSS `anchor-name` and `position-area` properties to position tour tooltips without JavaScript position calculations. It works in Chromium 125+ today.

Web components work everywhere. A `<tour-step>` custom element would render in React, Vue, Angular, Svelte, or plain HTML without wrappers. We're not there yet (Chromium-only, polyfills add weight), but in 12-18 months, this approach could make the "which framework" question irrelevant for tour positioning.

## What we recommend

We built Tour Kit, so take this with appropriate skepticism. Every claim is verifiable against npm, GitHub, and bundlephobia.

For React teams, Tour Kit's headless architecture means you render your own components, compose with your own hooks, keep full control over styling. Core ships under 8 kB gzipped with zero runtime dependencies. WCAG 2.1 AA accessibility without configuration.

Tour Kit doesn't support Vue today. The core is framework-agnostic by design, and a `@tour-kit/vue` package is on the roadmap. Honest limitations: no visual builder, React 18+ only, smaller community than Shepherd.js or React Joyride.

If you need cross-framework support today, Shepherd.js or Driver.js are your practical options.

---

*Disclosure: We built Tour Kit. Data points sourced from npm, GitHub, and bundlephobia. Tour Kit is MIT-licensed (core) with commercial extended packages.*
