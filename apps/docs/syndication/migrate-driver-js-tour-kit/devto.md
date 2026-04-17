---
title: "Migrating from Driver.js to a Headless Tour Library in React"
published: false
description: "Driver.js is great for simple tours, but what happens when you need custom UI, React state integration, or multi-page support? Here's a step-by-step migration guide to userTourKit."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/migrate-driver-js-tour-kit
cover_image: https://usertourkit.com/og-images/migrate-driver-js-tour-kit.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-driver-js-tour-kit)*

# Migrating from Driver.js to Tour Kit: adding headless power

Driver.js is a lightweight, dependency-free library for creating product tours and element highlights. It ships at roughly 5KB gzipped and works in any JavaScript framework. If your project has outgrown its popover-only UI, imperative API, or lack of React integration, this guide walks you through replacing Driver.js with userTourKit step by step.

```bash
npm install @tourkit/core @tourkit/react
```

## Why migrate?

Driver.js solves the simple case well. You call `driver()`, pass some steps, and call `drive()`. The problems show up when your project needs any of these:

- **Custom UI beyond popovers.** Driver.js renders a single popover template. You cannot swap it for a shadcn/ui card, a Radix dialog, or a custom React component without hacking the DOM after render via `onPopoverRender`.
- **React state integration.** Driver.js operates imperatively outside React's component tree. Updating app state when a user completes a step requires manual bridge code between Driver.js callbacks and your React state.
- **Multi-page tours.** Driver.js has no built-in support for tours that span multiple routes.
- **Accessibility.** Driver.js popovers lack complete ARIA attributes — missing `aria-expanded`, duplicate heading landmarks, and no focus trapping.
- **Analytics.** There is no built-in way to track where users drop off, which steps they skip, or completion rates.

userTourKit addresses all five. It is headless — you provide the UI components, and it handles step sequencing, element positioning, scroll management, keyboard navigation, and persistence. The core package is under 8KB gzipped.

## Step 1: Replace step definitions

### Driver.js (before)

```js
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const driverObj = driver({
  showProgress: true,
  steps: [
    {
      element: '#sidebar',
      popover: {
        title: 'Navigation',
        description: 'Use the sidebar to switch sections.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '#search-input',
      popover: {
        title: 'Search',
        description: 'Find anything in your workspace.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
})

driverObj.drive()
```

### Tour Kit (after)

```tsx
import { TourProvider } from '@tourkit/react'
import type { TourStep } from '@tourkit/core'

const steps: TourStep[] = [
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Use the sidebar to switch sections.',
    placement: 'right-start',
  },
  {
    id: 'search',
    target: '[data-tour="search"]',
    title: 'Search',
    content: 'Find anything in your workspace.',
    placement: 'bottom',
  },
]

function App() {
  return (
    <TourProvider tourId="onboarding" steps={steps}>
      {/* your app */}
    </TourProvider>
  )
}
```

### What changed

| Driver.js | Tour Kit | Notes |
|-----------|----------|-------|
| `element: '#sidebar'` | `target: '[data-tour="sidebar"]'` | Data attributes are more stable than IDs |
| `popover.title` | `title` | Flat property, not nested |
| `popover.description` | `content` | Accepts `React.ReactNode` |
| `side: 'right', align: 'start'` | `placement: 'right-start'` | Combined Floating UI string |
| No `id` field | `id` required | Used for persistence and analytics |
| CSS import required | No CSS import | You control all styling |

## Step 2: Replace tour lifecycle

### Driver.js (before)

```js
driverObj.drive()
driverObj.moveNext()
driverObj.movePrevious()
driverObj.moveTo(2)
driverObj.destroy()
driverObj.isActive()
```

### Tour Kit (after)

```tsx
import { useTour } from '@tourkit/react'

function TourControls() {
  const {
    start, next, prev, goTo, stop, complete,
    isActive, currentStepIndex, isLastStep, totalSteps,
  } = useTour('onboarding')

  return (
    <button onClick={() => (isActive ? stop() : start())}>
      {isActive ? `Step ${currentStepIndex + 1} of ${totalSteps}` : 'Start tour'}
    </button>
  )
}
```

The key difference is reactivity. Driver.js methods return values at call time. Tour Kit properties are reactive state — your component re-renders when they change.

## Step 3: Replace popover rendering

This is the biggest difference. Driver.js renders its own popover. Tour Kit gives you hooks and you render whatever you want.

### Driver.js (before)

```js
const driverObj = driver({
  popoverClass: 'my-custom-popover',
  nextBtnText: 'Continue',
  prevBtnText: 'Back',
  onPopoverRender: (popover, { config, state }) => {
    // Hack: inject custom HTML after render
    const customEl = document.createElement('div')
    customEl.textContent = `Step ${state.activeIndex + 1} of ${config.steps.length}`
    popover.description.appendChild(customEl)
  },
  steps: [/* ... */],
})
```

### Tour Kit (after) — using shadcn/ui

```tsx
import { useTour } from '@tourkit/react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ShadcnTourTooltip() {
  const { currentStep, next, prev, stop, isFirstStep, isLastStep } = useTour('onboarding')
  if (!currentStep) return null

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-sm font-semibold">{currentStep.title}</h3>
        <Button variant="ghost" size="icon" onClick={stop} aria-label="Close tour">
          ×
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{currentStep.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isFirstStep && (
          <Button variant="outline" size="sm" onClick={prev}>Back</Button>
        )}
        <Button size="sm" onClick={isLastStep ? stop : next}>
          {isLastStep ? 'Done' : 'Next'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

No `popoverClass`, no `onPopoverRender` hacks, no DOM manipulation. Your tooltip is a React component with full access to your design tokens.

## Step 4: Replace highlighting and overlay

| Driver.js | Tour Kit | Notes |
|-----------|----------|-------|
| `overlayOpacity: 0.7` | `spotlight.color: 'rgba(0,0,0,0.7)'` | Full color control |
| `stagePadding: 10` | `spotlight.padding: 10` | Same concept |
| `stageRadius: 8` | `spotlight.borderRadius: 8` | Same concept |
| `animate: true` | `spotlight.animate: true` | Respects `prefers-reduced-motion` |

```tsx
<TourProvider
  tourId="onboarding"
  steps={steps}
  spotlight={{
    enabled: true,
    color: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    animate: true,
  }}
>
  {/* your app */}
</TourProvider>
```

## Step 5: Replace callbacks

| Driver.js | Tour Kit |
|-----------|----------|
| `onNextClick` | Your button's `onClick` handler |
| `onPrevClick` | Your button's `onClick` handler |
| `onCloseClick` | Your button's `onClick` handler |
| `onPopoverRender` | Not needed |
| `onDestroyStarted` | Step `onBeforeHide` (return `false` to block) |
| `onDestroyed` | `onComplete` or `onSkip` on provider |
| Step `onDeselected` | Step `onHide` |

The pattern shift: Driver.js gives you callbacks because it owns the UI. Tour Kit gives you hooks and state because **you** own the UI.

## Step 6: Add multi-page support

Driver.js has no built-in multi-page support. Tour Kit handles this natively:

```tsx
const steps: TourStep[] = [
  {
    id: 'dashboard-welcome',
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    content: 'This is your main dashboard.',
    route: '/dashboard',
    routeMatch: 'exact',
  },
  {
    id: 'settings-intro',
    target: '[data-tour="settings"]',
    title: 'Settings',
    content: 'Configure your preferences here.',
    route: '/settings',
    routeMatch: 'exact',
  },
]
```

The `route` property tells Tour Kit which page the step belongs to. The `persist` option saves progress across page reloads.

## Step 7: Features Driver.js doesn't have

### Conditional steps

```tsx
{
  id: 'admin-panel',
  target: '[data-tour="admin"]',
  title: 'Admin panel',
  content: 'Manage your team from here.',
  when: (context) => currentUser.role === 'admin',
}
```

### Branching tours

```tsx
{
  id: 'choose-path',
  target: '[data-tour="role-select"]',
  title: 'What describes you best?',
  content: 'Pick your role to customize the tour.',
  onAction: {
    developer: 'dev-step-1',
    designer: 'design-step-1',
    manager: 'manager-step-1',
  },
}
```

### Built-in persistence

```tsx
<TourProvider tourId="onboarding" steps={steps} persist="localStorage" />
```

## Migration checklist

- [ ] Install `@tourkit/core` and `@tourkit/react`
- [ ] Remove `driver.js` and its CSS import
- [ ] Convert step definitions to `TourStep[]` format
- [ ] Add `data-tour` attributes to target elements
- [ ] Wrap your app in `<TourProvider>`
- [ ] Build your tooltip component using `useTour()` hook
- [ ] Migrate callbacks to step-level hooks
- [ ] Configure spotlight/overlay settings
- [ ] Add persistence if needed
- [ ] Add route properties for multi-page tours
- [ ] Test keyboard navigation and screen reader
- [ ] Remove `driver.js` from `package.json`

---

The full article with the complete API mapping reference table is at [usertourkit.com/blog/migrate-driver-js-tour-kit](https://usertourkit.com/blog/migrate-driver-js-tour-kit).
