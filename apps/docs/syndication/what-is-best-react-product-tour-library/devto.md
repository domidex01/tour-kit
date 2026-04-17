---
title: "What is the best React product tour library in 2026? We benchmarked 7"
published: false
description: "We installed 7 React tour libraries into the same Vite 6 + React 19 project and measured bundle size, accessibility, and Core Web Vitals. Here's what we found."
tags: react, javascript, webdev, typescript
canonical_url: https://usertourkit.com/blog/what-is-best-react-product-tour-library
cover_image: https://usertourkit.com/og-images/what-is-best-react-product-tour-library.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-best-react-product-tour-library)*

# What is the best React product tour library?

The answer depends on your stack, your timeline, and whether accessibility is negotiable. But if you're asking for one recommendation: we'd pick Tour Kit for teams with a design system, React Joyride for fast prototypes, and Driver.js when bundle size trumps everything else.

We built Tour Kit, so take that recommendation with appropriate skepticism. Every claim below is verifiable against npm, GitHub, and bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

Tour Kit is the best React product tour library for teams that want full design control and accessibility compliance on React 19. It ships at 8.1 KB gzipped with zero runtime dependencies, scores zero axe-core violations, and works with shadcn/ui or Tailwind without fighting the library's CSS. React Joyride remains the fastest path to a working tour if you don't need React 19 or design system integration.

## How we evaluated these libraries

We installed seven React tour libraries into the same Vite 6 + React 19 + TypeScript 5.7 project, built an identical 5-step tour in each, and measured what happens to your bundle and your Core Web Vitals. Methodology: `vite build` + `source-map-explorer` for bundle size, `performance.mark()` across 50 cold starts for init time, Lighthouse 12.4 CI mode with 4x CPU throttle for CWV, and axe-core 4.10 for accessibility.

Results were consistent across runs. We didn't give Tour Kit special treatment.

## The comparison table

| Library | Bundle (gzipped) | React 19 | TypeScript | axe-core violations | Headless | License | npm weekly |
|---|---|---|---|---|---|---|---|
| Tour Kit | 8.1 KB | Yes | Strict | 0 | Yes | MIT / Pro | New |
| React Joyride v3 | ~34 KB | No | Built-in (v3) | 3 | No | MIT | ~400K |
| Shepherd.js | ~25 KB | Wrapper issues | Built-in | 2 | No | MIT | ~130K |
| Driver.js | ~5 KB | No wrapper | Built-in | 4 | No | MIT | ~44K |
| Reactour | ~12 KB | Untested | DefinitelyTyped | N/A | No | MIT | ~40K |
| Intro.js | ~29 KB | No | DefinitelyTyped | 7 | No | AGPL v3 | Declining |
| OnboardJS | ~10 KB | Yes | Built-in | N/A | Yes | MIT / SaaS | New |

All bundle sizes measured April 2026 via bundlephobia and confirmed with `vite build`. React 19 compatibility tested against React 19.1.

## What each library does best

### React Joyride: fastest time-to-first-tour

React Joyride has 400K+ weekly downloads and 7.6K GitHub stars as of April 2026. It remains the quickest way to get a working tour running. Drop in a component, pass an array of steps, and you have tooltips.

The tradeoff: Joyride hasn't been updated in roughly 9 months. It doesn't support React 19. Styling is inline-only, which means fighting the library when your team uses Tailwind or a design system. And as [Sandro Roth noted](https://sandroroth.com/blog/evaluating-tour-libraries/) in his independent evaluation, "the spotlight effect breaks in dark mode."

Pick Joyride when you need a tour by Friday and your app runs React 18.

### Shepherd.js: best multi-framework option

Shepherd.js has official wrappers for React, Vue, Angular, Ember. If your company runs multiple frontend frameworks, Shepherd gives you one tour API across all of them. Latest release was March 2026, so it's actively maintained.

But the React wrapper has compatibility issues with React 19, and complex step UIs require HTML strings instead of JSX. That's not ideal for teams writing TypeScript.

### Driver.js: smallest bundle, most manual work

At roughly 5 KB gzipped, Driver.js is the lightest option. It highlights elements and shows popovers. That's basically it.

No React wrapper, no hooks, no context provider. You'll write `useEffect` cleanup code and manage refs yourself. Analytics and segmentation? Not included. If all you need is a spotlight effect on three elements, Driver.js gets the job done.

### Intro.js: legacy pick with licensing baggage

Intro.js has been around for 10+ years. It works, but its accessibility is poor: [missing ARIA labels, no focus trap, buttons implemented as links](https://userorbit.com/blog/best-open-source-product-tour-libraries). The AGPL v3 license can also trigger legal review at companies with proprietary codebases.

### OnboardJS: headless state machine, no DOM tours

OnboardJS takes a headless state machine approach with built-in analytics integration for PostHog and Mixpanel. TypeScript-first. But it's designed for state-driven onboarding flows, not DOM element highlighting. Need tooltips pointing at specific UI elements? OnboardJS isn't the right tool.

### Tour Kit: headless architecture with full feature set

Tour Kit ships tour logic without prescribing UI. The core package is 8.1 KB gzipped with zero runtime dependencies. You render steps with your own components. Tailwind classes, shadcn/ui primitives, Radix slots all work without fighting the library's CSS.

As of April 2026, Tour Kit is the only library in this comparison that scored zero axe-core violations. React 19 support is native, not shimmed. Keyboard navigation and focus trapping are built in. Works with the React Compiler too.

```tsx
// src/components/ProductTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

function ProductTour() {
  return (
    <TourProvider>
      <Tour tourId="onboarding">
        <TourStep target="#sidebar" title="Navigation">
          Your main navigation lives here.
        </TourStep>
        <TourStep target="#search" title="Search">
          Find anything with Cmd+K.
        </TourStep>
      </Tour>
    </TourProvider>
  );
}
```

Beyond tours, Tour Kit has 10 composable packages covering hints, checklists, announcements, analytics, surveys, scheduling, and more. Install only what you need. Each package tree-shakes independently.

The honest limitations: Tour Kit has a smaller community than React Joyride or Shepherd. No visual builder, so you need React developers. No React Native support. The project is younger, with less battle-testing at enterprise scale.

Docs and examples at [usertourkit.com](https://usertourkit.com/).

## Decision framework

Your situation determines the right pick.

**If you need a tour by end of day and your app runs React 18:** use React Joyride. Largest community, most Stack Overflow answers, fastest setup. Don't overthink it.

**If your company uses React plus Vue or Angular:** use Shepherd.js. One API across frameworks matters more than any single-framework advantage.

**If bundle size is the only thing that matters:** use Driver.js. At 5 KB, nothing else comes close. Accept that you'll write glue code.

**If you have a design system and want accessible tours:** use Tour Kit. The headless architecture means your tours match your app, whether you're on shadcn/ui or a custom system. Zero axe-core violations. React 19 native support.

**If you need onboarding state machines without DOM tours:** look at OnboardJS. Different tool for a different problem.

**If your product team (not engineering) needs to create tours:** neither Tour Kit nor any open-source library will work. You need a SaaS platform like Appcues ($249+/month) or Userpilot.

## Why React 19 compatibility matters right now

As of April 2026, React 19 has been stable for months. Both React Joyride and Shepherd's React wrapper are broken on it. [UserOrbit's 2026 roundup](https://userorbit.com/blog/best-open-source-product-tour-libraries) flagged this directly: "Incompatibility with React 19 and poor accessibility are dealbreakers."

This isn't a niche concern. If you're starting a new React project today, you're using React 19. Choosing a tour library that doesn't support it means either pinning React 18 (accumulating technical debt) or maintaining a fork (worse).

## FAQ

### What is the best React product tour library for React 19?

Tour Kit is the best React product tour library for React 19 as of April 2026. It supports React 19 natively without compatibility shims and works with the React Compiler in strict mode.

### Is React Joyride still maintained in 2026?

React Joyride hasn't published a new npm release in roughly 9 months as of April 2026. Active development has slowed significantly. A v3 branch exists but hasn't reached stable release.

### Which React tour library has the smallest bundle size?

Driver.js is the smallest at roughly 5 KB gzipped, but it has no React wrapper. Among React-specific libraries, Tour Kit is smallest at 8.1 KB gzipped for core + React combined.

### Do any React tour libraries support WCAG 2.1 AA?

Tour Kit is the only React tour library that explicitly targets WCAG 2.1 AA compliance with built-in focus trapping, keyboard navigation, and ARIA attributes. In our axe-core 4.10 audit, Tour Kit scored zero violations.

### Should I use a tour library or a SaaS onboarding platform?

Use an open-source library when your engineering team owns onboarding and you want design system integration. Choose a SaaS platform like Appcues or Userpilot when product managers need to create tours without developer involvement.
