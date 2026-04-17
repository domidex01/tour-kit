---
title: "5 alternatives to building onboarding from scratch (with real cost data)"
published: false
description: "Building onboarding in-house costs ~$70K in year one. We tested 5 libraries in a React 19 + Vite 6 project and compared bundle size, accessibility, and total cost of ownership."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house
cover_image: https://usertourkit.com/og-images/best-alternatives-building-onboarding-in-house.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house)*

# 5 best alternatives to building onboarding in-house

Building onboarding in-house sounds reasonable until you do the math. A conservative estimate puts year-one cost at $70,784, split between $45,018 in upfront development and $25,766 in annual maintenance ([Appcues, 2026](https://www.appcues.com/blog/build-vs-buy-saas)). That's before you tackle WCAG compliance, analytics, or the iteration tax of every copy change requiring an engineer. We tested five alternatives that get you further for less.

Disclosure: we built Tour Kit, so take our #1 ranking with appropriate skepticism. Every claim below is verifiable against npm, GitHub, and bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## How we evaluated these tools

We installed each library in a Vite 6 + React 19 + TypeScript 5.7 project and built the same 5-step onboarding tour. Then we measured what matters: bundle size impact (gzipped, via bundlephobia), TypeScript support, accessibility compliance, maintenance activity, and iteration speed.

Criteria that weighted heaviest:

- Bundle size: every kilobyte costs mobile users real seconds
- Accessibility: WCAG 2.1 AA isn't optional, it's a legal requirement in the EU, UK, and increasingly the US
- Iteration speed: how fast can a non-engineer change tour copy or reorder steps?
- Maintenance health: last npm publish date, open issue count, React 19 compatibility
- Total cost of ownership: license fees, vendor lock-in risk, engineering hours over 12 months

We didn't test SaaS platforms that require vendor contracts and per-MAU pricing. If you want that comparison, see our [in-app guidance tools roundup](https://usertourkit.com/blog/best-in-app-guidance-tools-saas).

## Quick comparison

| Library | Type | Bundle size (gzip) | React 19 | TypeScript | License | WCAG 2.1 AA | Best for |
|---|---|---|---|---|---|---|---|
| Tour Kit | Headless | <8KB core | ✅ | ✅ strict | MIT | ✅ | Design system teams |
| React Joyride | Opinionated | ~37KB | ✅ | ✅ | MIT | ⚠️ partial | Rapid prototyping |
| Shepherd.js | Framework-agnostic | ~25KB | ✅ (wrapper) | ✅ | MIT | ⚠️ partial | Multi-framework teams |
| Driver.js | Lightweight | ~5KB | ✅ | ✅ | MIT | ❌ | Simple highlights |
| Onborda | Next.js-native | ~12KB | ✅ | ✅ | MIT | ⚠️ partial | Next.js App Router |

## 1. Tour Kit: best for teams with a design system

Tour Kit is a headless onboarding library for React that ships logic without prescribing UI. The core package weighs under 8KB gzipped with zero runtime dependencies. You render steps with your own components (Radix primitives, shadcn/ui, Tailwind classes, whatever your team already uses). WCAG 2.1 AA compliance is built in: focus trapping, ARIA roles, keyboard navigation, and `prefers-reduced-motion` support all ship by default.

**Strengths:**
- Headless architecture means your tours match your design system exactly, with no CSS overrides and no `!important` hacks
- 10 composable packages: install `@tourkit/core` and `@tourkit/react` for tours, then add `@tourkit/analytics` or `@tourkit/surveys` only when you need them
- TypeScript strict mode with full type exports, so your IDE catches tour configuration errors at build time
- MIT license, $99 one-time for Pro features (no per-seat, no MAU pricing)

**Limitations:**
- No visual builder. Your product team can't edit tours without a developer writing JSX
- Smaller community than React Joyride or Shepherd.js (younger project)
- React 18+ only, with no support for older React versions or non-React frameworks

**Pricing:** Free (MIT) for core packages. Pro features cost $99 one-time per project.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { id: 'welcome', target: '#dashboard', content: 'Welcome to your dashboard' },
  { id: 'sidebar', target: '#nav-menu', content: 'Navigate between sections here' },
  { id: 'create', target: '#new-project', content: 'Create your first project' },
];

function TourContent() {
  const { currentStep, next, prev, isActive } = useTour();
  if (!isActive) return null;

  return (
    <div role="dialog" aria-label="Onboarding tour">
      <p>{currentStep?.content}</p>
      <button onClick={prev}>Back</button>
      <button onClick={next}>Next</button>
    </div>
  );
}

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider steps={steps}>
      {children}
      <TourContent />
    </TourProvider>
  );
}
```

## 2. React Joyride: best for getting a tour running fast

React Joyride is the most downloaded product tour library in the React ecosystem, with 340,000+ weekly npm downloads and 5,100+ GitHub stars as of April 2026. It ships a complete UI out of the box (tooltips, overlays, beacons, progress indicators) so you can have a working tour in under 30 minutes. The tradeoff: that pre-built UI ships at ~37KB gzipped, and customizing it to match your design system means fighting CSS specificity.

**Strengths:**
- Massive adoption: 340K+ weekly downloads means edge cases are well-documented
- Declarative API with callback system for tracking step completion
- Active maintenance with regular releases, React 19 compatible

**Limitations:**
- 37KB gzipped is 4.6x larger than Tour Kit's core
- Customizing the tooltip UI requires overriding internal component styles
- Accessibility coverage is partial: focus management and keyboard navigation need manual work

**Pricing:** Free. MIT license.

## 3. Shepherd.js: best for multi-framework teams

Shepherd.js takes a framework-agnostic approach. The core is vanilla JavaScript with official wrappers for React, Vue, Angular, and Ember. At ~25KB gzipped and 12,000+ GitHub stars, it's the most popular option for teams that don't want to lock their onboarding to a single framework. Keyboard navigation support exists out of the box.

**Strengths:**
- Framework-agnostic core means one library works across your entire stack
- Built-in keyboard navigation for step traversal
- Tether-based positioning handles scroll and resize edge cases well

**Limitations:**
- The React wrapper adds an abstraction layer
- Default UI requires CSS customization to match modern design systems
- No built-in analytics or event tracking

**Pricing:** Free. MIT license.

## 4. Driver.js: best for simple element highlighting

Driver.js is the lightweight option at ~5KB gzipped. No framework dependency, no build step required. Add a script tag and go. It does one thing well: highlighting elements on a page and walking users through them in sequence.

**Strengths:**
- 5KB gzipped, the smallest option on this list by a wide margin
- Zero framework dependency. Works with any JavaScript project
- Clean, minimal API that's hard to misuse

**Limitations:**
- No React integration, so you manage lifecycle and state yourself
- No accessibility support: missing ARIA roles, focus management, and keyboard navigation
- No built-in persistence. Refreshing the page loses tour progress

**Pricing:** Free. MIT license.

## 5. Onborda: best for Next.js App Router projects

Onborda is purpose-built for Next.js App Router. It understands route transitions, handles server component boundaries, and supports Framer Motion animations natively. For teams already on Next.js 14+, the integration feels natural because Onborda follows App Router conventions rather than fighting them.

**Strengths:**
- Route-aware onboarding: tours survive page transitions without manual state management
- First-class TypeScript support with step type definitions
- Framer Motion integration for polished step transitions

**Limitations:**
- Next.js only. If you're on Vite, Remix, or vanilla React, it won't work
- Smaller community means fewer Stack Overflow answers
- Accessibility implementation is partial

**Pricing:** Free. MIT license.

## Why we skipped Intro.js

Intro.js is popular in search results but uses an AGPL v3 license. If you're building proprietary SaaS, AGPL requires you to release your source code or buy a commercial license. Many legal teams reject AGPL outright. We only listed MIT-licensed alternatives to avoid that landmine.

## The real cost of building in-house

Before you dismiss these libraries and reach for `useState` and `createPortal`, here's what the "I'll just build it myself" path actually looks like:

**Month 1-2: Initial build (~$45K)**
Tooltip positioning that handles scroll, resize, and dynamic content. Overlay with cutout highlighting. Step sequencing with forward/back/skip logic.

Then the hard parts: focus trapping, keyboard navigation, screen reader announcements, persistence across sessions, mobile responsiveness.

**Month 3-12: The iteration tax (~$26K/year)**
Every copy change needs an engineer. Every step reorder needs an engineer. Product wants analytics, so you bolt on event tracking. Legal wants WCAG compliance, which means auditing every component.

Then QA finds a z-index conflict with your modal library. Chrome 130 changes scroll behavior and breaks your positioning.

AdRoll's growth team put it bluntly: "Creating modals take, like, 15 minutes rather than a few days" after switching from in-house to a dedicated tool ([Appcues](https://www.appcues.com/blog/build-vs-buy-saas)).

The iteration tax is what kills in-house solutions. Building v1 is fun. But maintaining versions 2 through 20 while your product evolves underneath? That's where the real cost lives.

## How to choose the right alternative

**Tour Kit** fits React teams with a design system (shadcn/ui, Radix, or custom) who want full code ownership without building positioning and accessibility from scratch.

**React Joyride** is the right pick when you need a working tour this week and don't mind the default tooltip UI. Battle-tested, largest community.

**Shepherd.js** makes sense if your stack spans multiple frameworks and you want one onboarding library that works everywhere.

For simple element highlighting on a static page, **Driver.js** gives you the smallest possible bundle at 5KB.

**Onborda** is the answer for Next.js App Router projects that need tours surviving route transitions natively.

And if onboarding is your core product differentiator (you're building an onboarding *platform*, not adding onboarding *to* your platform), building in-house with dedicated engineering bandwidth is still a valid path.
