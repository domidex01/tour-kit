---
title: "Migrating from React Joyride to a headless tour library (with API mapping)"
published: false
description: "Step-by-step migration guide from React Joyride to Tour Kit. Includes a full API mapping table, side-by-side code examples, and troubleshooting for common issues."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/migrate-react-joyride-tour-kit
cover_image: https://usertourkit.com/og-images/migrate-react-joyride-tour-kit.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-react-joyride-tour-kit)*

# How to migrate from React Joyride to Tour Kit (step-by-step)

Your React Joyride integration works. Tours fire, users click through. But the cracks are showing.

Maybe your design system overhaul means fighting Joyride's inline styles on every tooltip. Maybe your React 19 upgrade stalled for months because of [GitHub issue #1122](https://github.com/gilbarbara/react-joyride/issues/1122). Or you need analytics and checklists that Joyride simply doesn't offer.

This guide walks you through replacing React Joyride with Tour Kit incrementally, running both libraries side-by-side so nothing breaks in production. Budget 1-2 hours for a typical 5-10 step tour.

**Bias disclosure:** We built Tour Kit. Every claim is verifiable against npm, GitHub, and the source code.

```bash
npm install @tourkit/core @tourkit/react
```

## Why migrate from React Joyride?

React Joyride has 667K weekly npm downloads and 7,690 GitHub stars as of April 2026, making it the most popular open-source React tour library by a wide margin. But popularity doesn't mean it fits every project. Teams migrate away from React Joyride when they hit design system conflicts, delayed framework support, or architectural limits that surface as apps grow.

When we integrated React Joyride into a shadcn/ui project, matching our design tokens required a custom `tooltipComponent`, `floaterProps` overrides, and roughly 80 lines of CSS workarounds. Tour Kit rendered through our existing components with zero overrides.

Here are the specific pain points that push teams toward a migration:

- **Inline style injection** conflicts with Tailwind and design tokens, requiring CSS overrides for every tooltip
- **React 19 support** took six months in v2 while teams waited on issue #1122. One developer wrote: "We are still waiting for this update as it prevents us from upgrading to react 19"
- **Typed callbacks use `any`** on step data, losing compile-time safety on custom payloads
- **Multi-page tours** need `setTimeout()` workarounds since Joyride has no router integration
- **No built-in analytics**, checklists, announcements, surveys, or adoption tracking

To be fair: React Joyride v3 fixed React 19 support and switched to Floating UI with built-in TypeScript. If those fixes address your pain points, staying on Joyride is a valid choice. Migrate when the architectural differences matter to your project.

## API mapping: React Joyride to Tour Kit

| React Joyride | Tour Kit | Notes |
|---|---|---|
| `<Joyride steps={[...]} />` | `<TourProvider>` + `<Tour>` | Provider wraps your app; Tour renders per-tour |
| `steps` array prop | `createTour({ steps: [...] })` | Type-safe tour factory with `createStep()` |
| `target: '.my-element'` | `target: '.my-element'` | Same CSS selector pattern |
| `content: <div>...</div>` | `<TourStep>` children | You control the entire tooltip JSX |
| `callback` prop | `useTour()` hook + event callbacks | Typed `TourCallbackContext` instead of `any` |
| `getHelpers()` (v2) | `useTour()` hook | Returns `next()`, `prev()`, `stop()`, `goTo()` |
| `useJoyride()` (v3) | `useTour()` | Similar hook API, different return shape |
| `tooltipComponent` | Not needed | You write the tooltip directly with `TourCard` |
| `floaterProps` | Placement prop on `<Tour>` | Uses @floating-ui/react under the hood |
| `run` prop | `useTour().start()` / `.stop()` | Imperative control via hook |
| No router support | `useNextAppRouter()` / `useReactRouter()` | Built-in adapters for multi-page tours |
| No analytics | `@tour-kit/analytics` | Plugin-based: PostHog, Mixpanel, GA4, custom |

## Step 1: install Tour Kit alongside React Joyride

Install Tour Kit's two core packages without removing React Joyride. Both libraries use independent React contexts, so they coexist in the same bundle without conflicts.

```bash
npm install @tourkit/core @tourkit/react
```

Then wrap your app with the Tour Kit provider:

```tsx
// src/app/layout.tsx (or your root layout)
import { TourKitProvider } from '@tourkit/react'

export default function RootLayout({ children }) {
  return (
    <TourKitProvider>
      {children}
    </TourKitProvider>
  )
}
```

Tour Kit's provider adds no visible DOM. Your existing Joyride tours continue working exactly as before.

## Step 2: map your Joyride step configuration

**React Joyride (before):**

```tsx
import Joyride from 'react-joyride'

const steps = [
  {
    target: '.dashboard-header',
    content: 'Welcome to your dashboard.',
    disableBeacon: true,
  },
  {
    target: '.create-project-btn',
    content: 'Click here to create your first project.',
    placement: 'bottom',
  },
]

export function OnboardingTour() {
  return <Joyride steps={steps} continuous showProgress showSkipButton />
}
```

**Tour Kit (after):**

```tsx
import {
  Tour, TourStep, TourCard, TourCardHeader, TourCardContent,
  TourCardFooter, TourNavigation, TourProgress, TourOverlay,
  TourClose, createTour, createStep,
} from '@tourkit/react'

const onboardingTour = createTour({
  tourId: 'onboarding',
  steps: [
    createStep({ target: '.dashboard-header', placement: 'bottom' }),
    createStep({ target: '.create-project-btn', placement: 'bottom' }),
  ],
})

export function OnboardingTour() {
  return (
    <Tour {...onboardingTour}>
      <TourOverlay />
      <TourStep>
        <TourCard>
          <TourClose />
          <TourCardHeader />
          <TourCardContent />
          <TourCardFooter>
            <TourNavigation />
            <TourProgress />
          </TourCardFooter>
        </TourCard>
      </TourStep>
    </Tour>
  )
}
```

More lines of JSX, but every piece is a component you control.

## Step 3: migrate tour controls and callbacks

**React Joyride v2 callback:**

```tsx
<Joyride
  callback={(data) => {
    if (data.action === 'close' || data.status === 'finished') {
      setRunTour(false)
    }
  }}
/>
```

**Tour Kit equivalent:**

```tsx
import { useTour } from '@tourkit/react'

export function TourTrigger() {
  const { start, stop, isActive, currentStepIndex } = useTour()

  return (
    <button onClick={() => isActive ? stop() : start()}>
      {isActive ? `Step ${currentStepIndex + 1}` : 'Start tour'}
    </button>
  )
}
```

Every return value from `useTour()` is fully typed. TypeScript catches mistakes at compile time instead of production.

## Step 4: test side-by-side

Use a feature flag to toggle between implementations:

```tsx
const USE_TOUR_KIT = process.env.NEXT_PUBLIC_USE_TOUR_KIT === 'true'

export function OnboardingTour() {
  if (USE_TOUR_KIT) return <TourKitOnboarding />
  return <JoyrideOnboarding />
}
```

Test these behaviors: tour starts correctly, steps highlight the right elements, navigation works, keyboard navigation (Tab, Escape, Enter), and screen reader announcements.

## Step 5: remove React Joyride

After every tour passes testing, uninstall Joyride:

```bash
npm uninstall react-joyride
grep -r "react-joyride" src/  # verify nothing remains
```

## What you'll gain (and what you'll lose)

**You gain:** full design system control, under 8KB gzipped core (vs ~30KB), typed callbacks, built-in router adapters, optional packages for analytics/checklists/announcements, WCAG 2.1 AA accessibility, and React 19 support from day one.

**You lose:** drop-in simplicity (you write tooltip JSX), community size (7,690 stars vs newer project), and pre-built themes.

**Tour Kit limitation:** requires React 18.2+ and doesn't support React Native.

## FAQ

### How long does the migration take?

Budget 1-2 hours for a standard 5-10 step tour. Most time goes to rewriting tooltip JSX.

### Can I run both libraries at the same time?

Yes. Both use independent React contexts. Migrate one tour at a time, then remove Joyride.

### Is Tour Kit free?

Core packages (`@tourkit/core`, `@tourkit/react`, `@tourkit/hints`) are MIT licensed and free. Extended packages require a Pro license at $99 one-time.

---

Full article with all code examples and the complete API mapping table: [usertourkit.com/blog/migrate-react-joyride-tour-kit](https://usertourkit.com/blog/migrate-react-joyride-tour-kit)
