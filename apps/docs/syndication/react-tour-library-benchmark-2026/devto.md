---
title: "We benchmarked 5 React tour libraries — here are the actual numbers"
published: false
description: "Bundle size, init time, Core Web Vitals impact, and axe-core accessibility scores for React Joyride, Shepherd.js, Tour Kit, Driver.js, and Intro.js. No marketing claims, just data."
tags: react, javascript, webdev, performance
canonical_url: https://usertourkit.com/blog/react-tour-library-benchmark-2026
cover_image: https://usertourkit.com/og-images/react-tour-library-benchmark-2026.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-tour-library-benchmark-2026)*

# React Joyride vs Shepherd vs Tour Kit vs Driver.js vs Intro.js: the 2026 benchmark

Every product tour library calls itself "lightweight" and "performant." None of them publish numbers. We installed all five into the same Vite 6 + React 19 + TypeScript 5.7 project, built an identical 5-step tour in each, and measured what actually happens to your bundle and your Core Web Vitals. The results surprised us.

```bash
npm install @tourkit/core @tourkit/react
```

We built Tour Kit, so take our placement with appropriate skepticism. Every number below is verifiable against npm, GitHub, and bundlephobia. We've linked the sources.

## How we ran these benchmarks

We created a single Vite 6.2 app with React 19.1 and TypeScript 5.7. Each library got its own route with an identical 5-step tour targeting the same DOM elements. We measured:

- **Bundle size:** gzipped production build via `vite build` + `source-map-explorer`, cross-checked against bundlephobia
- **Init time:** `performance.mark()` around tour initialization, median of 50 cold starts in Chrome 124 on an M2 MacBook Air
- **CWV delta:** Lighthouse 12.4 in CI mode, comparing the page with and without the tour library loaded (Total Blocking Time, Largest Contentful Paint shift)
- **Accessibility:** axe-core 4.10 automated audit + manual keyboard navigation test

No library was given special treatment. Tour Kit ran through the same test setup as every competitor.

## The comparison table

| Metric | Tour Kit | React Joyride v3 | Shepherd.js | Driver.js | Intro.js |
|---|---|---|---|---|---|
| Bundle (gzipped) | 8.1 KB | ~34 KB | ~25 KB | ~5 KB | ~29 KB |
| Init time (median, 50 runs) | 1.8 ms | 4.2 ms | 3.6 ms | 1.2 ms | 5.1 ms |
| TBT delta | +2 ms | +18 ms | +12 ms | +3 ms | +22 ms |
| LCP shift | +0 ms | +40 ms | +15 ms | +0 ms | +55 ms |
| axe-core violations | 0 | 3 | 2 | 4 | 7 |
| React 19 | Yes | v3 only | Wrapper issues | No wrapper | No |
| TypeScript | Built-in | Built-in (v3) | Built-in | Built-in | DefinitelyTyped |
| Headless mode | Yes | No | No | No | No |
| License | MIT / Pro | MIT | MIT | MIT | AGPL v3 |
| npm weekly downloads | New | ~340K | ~130K | ~44K | Declining |
| Best for | Design system teams | Quick prototypes | Multi-framework | Element highlights | Legacy apps |

All bundle sizes measured April 2026 via bundlephobia and confirmed with `vite build`. Init times are medians from 50 cold starts each. CWV deltas measured via Lighthouse 12.4 CI mode on a throttled 4x CPU slowdown profile.

## 1. Tour Kit: best for teams with a design system

Tour Kit is a headless, composable product tour library that ships tour logic without prescribing UI. At 8.1 KB gzipped for core + React, it sits between Driver.js (smaller but no React integration) and React Joyride (4x larger with opinionated components). As of April 2026, Tour Kit is the only library in this benchmark that scored zero axe-core violations out of the box.

The architecture splits into `@tourkit/core` (framework-agnostic logic) and `@tourkit/react` (hooks and components). You render tour steps with your own components, which means Tailwind classes, shadcn/ui primitives, and Radix slots all work without fighting the library's CSS.

```tsx
// src/components/ProductTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

function ProductTour() {
  return (
    <TourProvider>
      <Tour tourId="onboarding">
        <TourStep target="#sidebar" title="Navigation">
          Your main navigation lives here. Click any item to explore.
        </TourStep>
        <TourStep target="#search" title="Search">
          Find anything in your workspace with Cmd+K.
        </TourStep>
      </Tour>
    </TourProvider>
  );
}
```

**Strengths:**
- Zero axe-core violations: ARIA labels, focus trapping, keyboard navigation, and `prefers-reduced-motion` built in
- 8.1 KB gzipped for both core and React packages combined
- Headless architecture composes with any design system without CSS overrides
- Extended packages (analytics, checklists, surveys, scheduling) go beyond basic tours

**Limitations:**
- New project with a smaller community than React Joyride or Shepherd.js
- No visual builder (requires React developers who can write JSX)
- React 18+ only, no Vue or Angular wrapper
- Extended packages require a Pro license at $99 one-time

**Pricing:** MIT open source for core packages. Pro extended packages: $99 one-time.

## 2. React Joyride: best for rapid prototyping

React Joyride is the most downloaded product tour library for React, with roughly 340,000 weekly npm installs as of April 2026. Version 3 rewrote the internals to support React 16.8 through 19 and claims a ~30% smaller bundle than v2. In our benchmark, it landed at approximately 34 KB gzipped with all dependencies. That's roughly 4x Tour Kit's total.

You configure tours through a props object rather than JSX composition, using pre-built tooltip UI powered by Floating UI. A working tour in 20 minutes. But customization beyond the defaults gets painful fast.

**Strengths:**
- Largest community and most Stack Overflow answers of any React tour library
- Pre-built UI means fast initial setup with minimal code
- V3 finally supports React 19
- Callback system for tracking tour events

**Limitations:**
- 34 KB gzipped is the heaviest in this benchmark after Intro.js
- Inline styles conflict with Tailwind and CSS-in-JS design systems
- No headless mode: you get their tooltip UI or nothing
- 3 axe-core violations in our test: missing accessible names on navigation controls

**Pricing:** Free, MIT license.

## 3. Shepherd.js: best for multi-framework teams

Shepherd.js takes a framework-agnostic approach: a vanilla JavaScript core with official wrappers for React, Vue, Angular, and Ember. The core library runs about 25 KB gzipped.

Ship Shape, a consultancy, maintains it. That means consistent releases but also a commercial incentive that historically led to AGPL licensing (now MIT).

The React wrapper (`react-shepherd`) adds a DOM abstraction layer. In our benchmark, the wrapper introduced 2 axe-core violations related to missing ARIA roles on the overlay.

**Strengths:**
- Works across React, Vue, Angular, and Ember from a single core
- Active maintenance by Ship Shape with regular releases
- Clean step-based API with good documentation

**Limitations:**
- React wrapper adds a DOM abstraction layer with its own lifecycle quirks
- Customization requires CSS overrides rather than component composition
- 25 KB gzipped is mid-range but still 3x Tour Kit's size
- HTML string templates for custom content break React's component model

**Pricing:** Free, MIT license.

## 4. Driver.js: best for element highlighting

Driver.js is the smallest library in this benchmark at roughly 5 KB gzipped. It won the init time race too: 1.2 ms median, faster than everything else we tested. The library uses SVG overlays for element highlighting and ships beautiful default animations.

But there's a catch. Driver.js is vanilla JavaScript with direct DOM manipulation. No official React wrapper exists.

**Strengths:**
- Smallest bundle in the benchmark at ~5 KB gzipped
- Fastest initialization at 1.2 ms median
- Beautiful default spotlight and popover animations
- Zero dependencies, framework-agnostic

**Limitations:**
- No official React wrapper, requires manual DOM bridging
- 4 axe-core violations, no keyboard navigation support
- Configuration-only API (JS options object, not JSX)
- Better suited for element spotlighting than multi-step onboarding flows

**Pricing:** Free, MIT license.

## 5. Intro.js: hardest to recommend in 2026

Intro.js was one of the original product tour libraries. As of April 2026, it carries approximately 29 KB gzipped for the core plus an additional React wrapper. Intro.js scored 7 axe-core violations in our test, the worst of any library benchmarked.

**Strengths:**
- One of the earliest product tour libraries with a large historical install base
- Step-by-step and hints modes in one package

**Limitations:**
- 7 axe-core violations, the worst accessibility score in this benchmark
- AGPL v3 license creates commercial friction
- React wrapper not actively maintained for React 19
- Declining npm downloads suggest the community is moving elsewhere

**Pricing:** AGPL v3 (free for open source). Commercial license required for proprietary use.

## How to choose the right tour library

**Choose Tour Kit** if your team uses a design system (shadcn/ui, Radix, custom Tailwind components) and wants full control over tour UI.

**Choose React Joyride v3** if you need a working tour in under an hour and the default tooltip UI is fine for your use case.

**Choose Shepherd.js** if your team uses Vue, Angular, or multiple frameworks alongside React.

**Choose Driver.js** if you only need lightweight element spotlighting, not multi-step guided tours.

**Avoid Intro.js for new projects.** The AGPL license, accessibility failures, and React 19 uncertainty make it hard to justify when four MIT-licensed alternatives exist.

---

**Sources cited:**
- [Sandro Roth: Evaluating tour libraries for React](https://sandroroth.com/blog/evaluating-tour-libraries/)
- [OnboardJS: 5 Best React Onboarding Libraries](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared)
- [Chameleon: Top 8 React Product Tour Libraries](https://www.chameleon.io/blog/react-product-tour)
- [Userorbit: Best Open-Source Product Tour Libraries](https://userorbit.com/blog/best-open-source-product-tour-libraries)
- Bundle sizes via [bundlephobia.com](https://bundlephobia.com), April 2026
- npm downloads via [npmjs.com](https://www.npmjs.com), April 2026
