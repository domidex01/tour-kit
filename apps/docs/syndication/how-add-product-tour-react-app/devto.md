---
title: "How to add a product tour to any React app (5 approaches compared)"
published: false
description: "Most React tour libraries are stuck on React 16. Here are the five ways to add a product tour in 2026, with real data on bundle size, accessibility, and React 19 support."
tags: react, javascript, typescript, webdev
canonical_url: https://usertourkit.com/blog/how-add-product-tour-react-app
cover_image: https://usertourkit.com/og-images/how-add-product-tour-react-app.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/how-add-product-tour-react-app)*

# How do I add a product tour to my React app?

Your users sign up, land on a blank dashboard, and leave. A product tour fixes that gap by walking them through key features the first time they visit. But the library you pick determines whether you spend thirty minutes wiring it up or thirty hours fighting it. As of April 2026, the React tour ecosystem has a compatibility problem: most popular libraries were built for React 16 and haven't caught up with React 19's ref changes, Server Components, and strict mode double-rendering.

```bash
npm install @tourkit/core @tourkit/react
```

This article answers the question directly, compares the five most-used libraries with real data, and gives you a working code example you can drop into any React project.

## Short answer

To add a product tour to a React app, install a tour library, define your steps as an array of objects (each targeting a DOM element by CSS selector or ref), wrap your app in the library's provider component, and trigger the tour on first visit. Tour Kit does this in under 8KB gzipped with full TypeScript types, WCAG 2.1 AA accessibility, and native React 19 support. The whole setup takes about ten minutes.

## The five main approaches

There are five ways to add a product tour to a React app in 2026. Each involves a different tradeoff between control, bundle cost, and maintenance burden.

### 1. Use a dedicated React tour library

This is what most teams reach for first. You install a package, define steps, and render a provider. React Joyride has 400K+ weekly npm downloads and 5.1K GitHub stars, making it the most popular option by volume. But Sandro Roth, who evaluated every major option for a production app, found that "unless your needs are very simple, there still aren't many solid options" ([sandroroth.com](https://sandroroth.com/blog/evaluating-tour-libraries/)).

The problem is React 19 compatibility. React Joyride hasn't been updated in over nine months and breaks on React 19. An unstable `next` version exists but "doesn't work reliably" according to Roth's testing.

### 2. Use a vanilla JS library with a React wrapper

Shepherd.js (130K weekly downloads) and Driver.js (~5KB gzipped) work outside React. Wrap them in a `useEffect` and you're running. The tradeoff: you lose React's component model entirely. Tour steps live outside your JSX, state management gets awkward, and cleanup on unmount requires manual teardown.

Shepherd.js has an official React wrapper (`react-shepherd`), but it's also not React 19 compatible.

### 3. Use a headless tour library

A headless library gives you tour logic (step sequencing, scroll handling, element targeting) without any UI. You render your own tooltip components. This is what Tour Kit does, and it's the approach Sentry's engineering team chose when they built their own tour system using React Context and `useReducer` rather than adopting an existing library ([Sentry Engineering](https://sentry.engineering/blog/building-a-product-tour-in-react/)).

Martin Fowler's team documented this as the ["headless component" pattern](https://martinfowler.com/articles/headless-component.html), where logic and rendering are separated. It works well when your app already has a design system.

### 4. Build it yourself

You can build a tour with `useState`, a step array, and some absolute positioning. Sentry did exactly this. The hidden cost is maintenance: scroll handling, resize observers, keyboard navigation, focus trapping, and edge cases like elements that aren't in the viewport.

Sentry's implementation specifically had to solve for steps that "don't cause re-renders of one another as they update the registry." Budget 40-80 hours for a production-quality implementation with accessibility.

### 5. Use CSS anchor positioning (experimental)

Ryan Trimble demonstrated on [CSS-Tricks](https://css-tricks.com/one-of-those-onboarding-uis-with-anchor-positioning/) that native CSS `anchor-name` and `position-anchor` properties can replace JavaScript positioning entirely. He noted that "anchor positioning may change a lot of the ways we write CSS, similar to the introduction of flexbox or grid." Browser support is Chrome 125+ only as of April 2026. Not production-ready for most teams.

## Library comparison

| Library | Bundle size | React 19 | Accessibility | Headless | License |
|---|---|---|---|---|---|
| React Joyride | 498KB unpacked | No (unstable next) | Undocumented | No | MIT |
| Shepherd.js | Not published | Wrapper broken | Keyboard nav only | No | MIT |
| Driver.js | ~5KB gzipped | N/A (vanilla JS) | Not documented | No | MIT |
| Intro.js | Not published | Not tested | No focus trap, bad ARIA | No | AGPL v3 |
| Reactour | Smaller | Not tested | Vague claims | No | MIT |
| Tour Kit | core <8KB gzip | Yes (native) | WCAG 2.1 AA | Yes | MIT |

Intro.js deserves a special mention on accessibility. Roth found that its "popovers lack proper `aria-labelledby` or `aria-describedby` attributes, buttons are implemented as links with `role='button'` instead of actual button elements," and "there's also no focus trap, so keyboard users can tab through the entire app" ([sandroroth.com](https://sandroroth.com/blog/evaluating-tour-libraries/)). If your app needs to pass an accessibility audit, eliminate Intro.js immediately.

One more thing: Intro.js uses AGPL v3 licensing, which requires a commercial license for business use. Every other library listed here is MIT.

## Working code example

Here's a minimal product tour using Tour Kit. This targets three elements on a dashboard and works with React 18 or 19.

```tsx
// src/components/DashboardTour.tsx
import { TourProvider, useTour } from '@tourkit/react'

const steps = [
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Use the sidebar to switch between sections.',
  },
  {
    id: 'search',
    target: '[data-tour="search"]',
    title: 'Search',
    content: 'Find anything in your workspace.',
  },
  {
    id: 'settings',
    target: '[data-tour="settings"]',
    title: 'Settings',
    content: 'Configure your account preferences here.',
  },
]

function TourTooltip() {
  const { currentStep, next, prev, end, isFirst, isLast } = useTour()
  if (!currentStep) return null

  return (
    <div role="dialog" aria-label={currentStep.title}>
      <h3>{currentStep.title}</h3>
      <p>{currentStep.content}</p>
      <div>
        {!isFirst && <button onClick={prev}>Back</button>}
        {isLast
          ? <button onClick={end}>Done</button>
          : <button onClick={next}>Next</button>
        }
      </div>
    </div>
  )
}

export function DashboardTour({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider tourId="dashboard-intro" steps={steps}>
      {children}
      <TourTooltip />
    </TourProvider>
  )
}
```

Then add `data-tour` attributes to your target elements:

```tsx
// src/components/Dashboard.tsx
export function Dashboard() {
  return (
    <div>
      <nav data-tour="sidebar">Sidebar content</nav>
      <input data-tour="search" placeholder="Search..." />
      <button data-tour="settings">Settings</button>
    </div>
  )
}
```

Tour Kit handles element highlighting, scroll-into-view, keyboard navigation (arrow keys and Escape), and focus trapping automatically. You control what the tooltip looks like. Swap in shadcn/ui components, Radix primitives, or plain Tailwind. The library doesn't care.

## Decision framework

Pick your approach based on what you actually need.

**Need something in under an hour?** React Joyride on React 18 still works if you don't need React 19 or accessibility audits. Pin to React 18 and accept the risk.

**Bundle size is everything?** Driver.js at ~5KB gzipped is the smallest option. It's vanilla JavaScript though, so you'll manage the React lifecycle yourself with no built-in accessibility.

**On React 19 already?** Your options narrow fast. As of April 2026, Tour Kit is the only maintained library with native React 19 support, headless rendering, and documented WCAG 2.1 AA compliance.

**Have 40+ hours and want full control?** Build it yourself. Read Sentry's [architecture writeup](https://sentry.engineering/blog/building-a-product-tour-in-react/) first. Their approach (React Context + useReducer + CSS floating) works well if you have the bandwidth.

**Already running a design system?** A headless library saves you from fighting opinionated CSS. Tour Kit's headless architecture means your tour matches your app automatically.

## What we recommend (and why)

We built Tour Kit, so take this recommendation with appropriate skepticism. Every claim above is verifiable against npm, GitHub, and bundlephobia.

That said: for most React apps shipping in 2026, a headless tour library with React 19 support is the pragmatic choice. The React 19 compatibility gap alone eliminates React Joyride and react-shepherd. Driver.js works but requires manual React integration. Building from scratch costs 40-80 hours of engineering time.

Tour Kit's core ships at under 8KB gzipped with zero runtime dependencies. It has real limitations: no visual builder (you need a developer), no mobile SDK, React 18+ only, and a smaller community than React Joyride.

If you need a drag-and-drop tour editor for non-technical product managers, Tour Kit is the wrong choice. Look at Appcues or Userpilot instead.

For teams that write React and want code-level control over their onboarding, start here:

```bash
npm install @tourkit/core @tourkit/react
```

Read the full docs at [usertourkit.com](https://usertourkit.com/) or browse the [source on GitHub](https://github.com/DomiDex/tour-kit).

## FAQ

### What is the easiest way to add a product tour to React?

Tour Kit is the fastest path for React 18 and 19 apps. Install `@tourkit/core` and `@tourkit/react`, define steps as an array, wrap your app in `TourProvider`, and add `data-tour` attributes to target elements. Setup takes under ten minutes with full TypeScript autocompletion.

### Does React Joyride work with React 19?

As of April 2026, React Joyride does not have stable React 19 support. The main package hasn't been updated in over nine months. An unstable `next` version exists but has been reported as unreliable. If you're on React 19, consider Tour Kit or Driver.js (vanilla JS) as alternatives.

### Which React tour library is the most accessible?

Tour Kit is the only React tour library documenting WCAG 2.1 AA compliance with focus trapping, keyboard navigation, proper ARIA attributes, and screen reader support. Intro.js has documented gaps including missing `aria-labelledby` and no focus trap. Most other libraries don't document accessibility at all.

### How much does a product tour library add to bundle size?

Bundle impact varies widely. Driver.js adds approximately 5KB gzipped, the smallest option. Tour Kit's core is under 8KB gzipped. React Joyride ships 498KB unpacked. According to [web.dev](https://web.dev/vitals/), every additional 10KB of JavaScript adds measurable First Input Delay impact on mobile.

### Can I style product tour tooltips with Tailwind or shadcn/ui?

Yes, if you use a headless tour library. Tour Kit provides step logic, element highlighting, and scroll management without rendering any UI. You write the tooltip components yourself using Tailwind, shadcn/ui, Radix, CSS Modules, or plain CSS. Opinionated libraries like React Joyride ship their own styles that you have to override.
