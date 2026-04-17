---
title: "How do I add a product tour to my React app?"
slug: "how-add-product-tour-react-app"
canonical: https://usertourkit.com/blog/how-add-product-tour-react-app
tags: react, javascript, web-development, typescript
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

The problem is React 19 compatibility. React Joyride hasn't been updated in over nine months and breaks on React 19.

### 2. Use a vanilla JS library with a React wrapper

Shepherd.js (130K weekly downloads) and Driver.js (~5KB gzipped) work outside React. Wrap them in a `useEffect` and you're running. The tradeoff: you lose React's component model entirely. Shepherd.js has an official React wrapper (`react-shepherd`), but it's also not React 19 compatible.

### 3. Use a headless tour library

A headless library gives you tour logic without any UI. You render your own tooltip components. This is what Tour Kit does, and it's the approach Sentry's engineering team chose when they built their own tour system ([Sentry Engineering](https://sentry.engineering/blog/building-a-product-tour-in-react/)).

### 4. Build it yourself

Budget 40-80 hours for a production-quality implementation with accessibility. Sentry did this with React Context + useReducer + CSS floating.

### 5. Use CSS anchor positioning (experimental)

Ryan Trimble demonstrated on [CSS-Tricks](https://css-tricks.com/one-of-those-onboarding-uis-with-anchor-positioning/) that native CSS positioning can replace JavaScript positioning. Browser support is Chrome 125+ only as of April 2026.

## Library comparison

| Library | Bundle size | React 19 | Accessibility | Headless | License |
|---|---|---|---|---|---|
| React Joyride | 498KB unpacked | No (unstable next) | Undocumented | No | MIT |
| Shepherd.js | Not published | Wrapper broken | Keyboard nav only | No | MIT |
| Driver.js | ~5KB gzipped | N/A (vanilla JS) | Not documented | No | MIT |
| Intro.js | Not published | Not tested | No focus trap, bad ARIA | No | AGPL v3 |
| Reactour | Smaller | Not tested | Vague claims | No | MIT |
| Tour Kit | core <8KB gzip | Yes (native) | WCAG 2.1 AA | Yes | MIT |

## Working code example

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

Full article with decision framework, FAQ, and more code examples: [usertourkit.com/blog/how-add-product-tour-react-app](https://usertourkit.com/blog/how-add-product-tour-react-app)
