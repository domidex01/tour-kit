---
title: "Build an accessible React onboarding wizard with stepper UI"
published: false
description: "Most React stepper tutorials skip ARIA roles and focus management entirely. Here's how to build a wizard that works for keyboard and screen reader users too."
tags: react, typescript, webdev, a11y
canonical_url: https://usertourkit.com/blog/react-onboarding-wizard
cover_image: https://usertourkit.com/og-images/react-onboarding-wizard.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-onboarding-wizard)*

# How to build an onboarding wizard in React with stepper UI

Most React "onboarding wizard" tutorials hand you a `currentStep` counter and call it done. Focus management when steps change? Missing. ARIA roles on the step indicators? Absent. Tracking where users drop off? Not even considered. You end up with something that looks like a wizard but fails screen readers and frustrates keyboard users.

We tested five popular React stepper tutorials and found zero that implement `aria-current="step"` or manage focus on step transitions. Tour Kit takes a different approach. It gives you headless primitives for step sequencing, element highlighting, and scroll management while you keep full control of the rendering. The core ships at under 8KB gzipped with zero runtime dependencies (verified on [bundlephobia](https://bundlephobia.com/)). By the end of this tutorial, you'll have a working 4-step onboarding wizard with a stepper UI, proper ARIA roles, and optional analytics tracking.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

Tour Kit's onboarding wizard handles the logic layer so you can focus on your UI. The finished wizard includes a horizontal stepper showing progress across four steps (Welcome, Profile, Preferences, Confirmation), animated transitions between steps that respect `prefers-reduced-motion`, keyboard navigation through the entire flow, and screen reader announcements when steps change.

Each step collects user input and validates before advancing. We measured the total JS cost at under 10KB gzipped for the complete wizard, including Tour Kit's core and React bindings.

## Prerequisites

Before starting, make sure your project meets these requirements. Tour Kit works with any React 18.2+ or React 19 project and any bundler, but TypeScript is strongly recommended for type-safe step definitions.

- React 18.2+ or React 19
- TypeScript 5.0+
- A React project with a bundler (Vite, Next.js, or Create React App)
- This tutorial uses Tailwind CSS for styling, but any approach works

## Step 1: install Tour Kit and set up the provider

Tour Kit separates tour logic from UI through a provider/hook pattern, similar to how React Router separates routing logic from route components. The `TourProvider` manages step state, navigation guards, and lifecycle events. You wrap your app (or the wizard's parent) with it, then consume step data through the `useTour()` hook anywhere in the subtree.

```tsx
// src/components/OnboardingWizard.tsx
import { TourProvider, useTour } from '@tourkit/react'

const steps = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'profile', title: 'Profile' },
  { id: 'preferences', title: 'Preferences' },
  { id: 'confirmation', title: 'Confirmation' },
]

export function OnboardingWizard() {
  return (
    <TourProvider steps={steps} initialStep="welcome">
      <WizardShell />
    </TourProvider>
  )
}
```

The `TourProvider` accepts a `steps` array and an optional `initialStep`. Under the hood, it creates a state machine that tracks the current step, manages transitions, and fires lifecycle callbacks.

## Step 2: build the stepper indicator with ARIA roles

A stepper indicator communicates progress both visually and to assistive technology, yet most tutorials only handle the visual side. We checked the top five "React stepper" tutorials on Google as of April 2026 and found zero that include `aria-current="step"` on the active indicator. [Smashing Magazine](https://www.smashingmagazine.com/2024/12/creating-effective-multistep-form-better-user-experience/) covers semantic `<fieldset>` usage but stops short of ARIA step patterns. Here's a stepper that handles both.

```tsx
// src/components/StepperIndicator.tsx
import { useTour } from '@tourkit/react'

export function StepperIndicator() {
  const { steps, currentStep, goToStep } = useTour()

  return (
    <nav aria-label="Onboarding progress">
      <ol className="flex items-center gap-4">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep.id
          const isCompleted = index < steps.indexOf(currentStep)

          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => isCompleted && goToStep(step.id)}
                disabled={!isCompleted}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.title}, step ${index + 1} of ${steps.length}${
                  isCompleted ? ', completed' : ''
                }`}
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full
                  text-sm font-medium transition-colors
                  ${isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

Three things to notice. The `<nav>` gets `aria-label="Onboarding progress"` so screen readers can identify it. Each button uses `aria-current="step"` on the active step, following the [W3C-recommended pattern](https://www.w3.org/WAI/ARIA/apg/) for indicating current position in a sequence. And the connector lines between steps get `aria-hidden="true"` because they're decorative.

## Step 3: create the step content components

Each step in an onboarding wizard should own its own data and validation logic, keeping the parent component thin and making step reordering trivial. As Lee Gillentine puts it on Medium: "It's a good idea to make the steps responsible for their own data, since it keeps things simple. If you don't, you could end up with a very big wizard step wrapper component that handles the sanitizing, validation, and transformation of user input from all the steps in one place." ([source](https://medium.com/@l_e/writing-a-wizard-in-react-8dafbce6db07))

```tsx
// src/components/steps/ProfileStep.tsx
import { useState } from 'react'
import { useTour } from '@tourkit/react'

export function ProfileStep() {
  const { next } = useTour()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  const canAdvance = name.trim().length > 0 && role.trim().length > 0

  return (
    <div role="group" aria-label="Profile information">
      <h2 className="text-xl font-semibold mb-4">Tell us about yourself</h2>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Role</span>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </label>
      </div>
      <button
        onClick={() => next()}
        disabled={!canAdvance}
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-white
                   disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  )
}
```

The `role="group"` with `aria-label` wraps the step content so screen readers treat it as a labeled region. Each step calls `next()` from the `useTour()` hook when the user is ready to advance. Tour Kit handles the transition, including focus management.

## Step 4: wire it all together with focus management

Focus management is the single biggest accessibility gap we found in existing React wizard implementations. When a user clicks "Continue," the browser focus stays on the now-hidden button by default. Screen reader users hear nothing, and keyboard users have no idea where they are in the page. The fix is two attributes and a `useEffect`.

```tsx
// src/components/WizardShell.tsx
import { useRef, useEffect } from 'react'
import { useTour } from '@tourkit/react'
import { StepperIndicator } from './StepperIndicator'
import { WelcomeStep } from './steps/WelcomeStep'
import { ProfileStep } from './steps/ProfileStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { ConfirmationStep } from './steps/ConfirmationStep'

const stepComponents: Record<string, React.ComponentType> = {
  welcome: WelcomeStep,
  profile: ProfileStep,
  preferences: PreferencesStep,
  confirmation: ConfirmationStep,
}

export function WizardShell() {
  const { currentStep } = useTour()
  const contentRef = useRef<HTMLDivElement>(null)

  // Move focus to step content on step change
  useEffect(() => {
    contentRef.current?.focus()
  }, [currentStep.id])

  const StepComponent = stepComponents[currentStep.id]

  return (
    <div className="mx-auto max-w-lg p-6">
      <StepperIndicator />
      <div
        ref={contentRef}
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
        className="mt-8 outline-none"
      >
        <StepComponent />
      </div>
    </div>
  )
}
```

Two critical accessibility details here. The content container has `tabIndex={-1}` so it can receive programmatic focus without appearing in the tab order. And `aria-live="polite"` announces the new step content to screen readers when it changes.

Without these two attributes, step transitions are invisible to assistive technology.

## Adding analytics to track drop-off

Once your onboarding wizard works, the product team will ask where users abandon it. Step 2? Step 3? Tour Kit's `onStepChange` callback gives you this data without extra dependencies.

```tsx
// src/components/OnboardingWizard.tsx
import { TourProvider } from '@tourkit/react'

export function OnboardingWizard() {
  return (
    <TourProvider
      steps={steps}
      initialStep="welcome"
      onStepChange={(from, to) => {
        // Track in your analytics provider
        analytics.track('onboarding_step', {
          from: from.id,
          to: to.id,
          timestamp: Date.now(),
        })
      }}
      onComplete={() => {
        analytics.track('onboarding_complete')
      }}
    >
      <WizardShell />
    </TourProvider>
  )
}
```

The `onStepChange` callback fires on every transition, giving you the `from` and `to` step objects. Feed this into Mixpanel, Amplitude, PostHog, or any provider you already use. The `onComplete` callback fires when the user reaches the final step. For structured funnel analysis, `@tour-kit/analytics` adds plugin-based integrations on top of these primitives.

## How this compares to other approaches

The right stepper library depends on your bundle budget, accessibility requirements, and whether you need analytics hooks. Here's how the main options compare as of April 2026, based on our testing in a Vite 6 + React 19 + TypeScript 5.7 project:

| Criteria | Tour Kit | Stepperize | MUI Stepper | Custom DIY |
|---|---|---|---|---|
| Bundle size (gzipped) | <8KB core | <1KB | ~80KB+ (MUI dep) | ~0.5-2KB |
| TypeScript | Yes, strict mode | Yes | Yes | Your choice |
| Headless | Yes | Yes | No (opinionated UI) | Yes |
| ARIA support built-in | Yes | Minimal | Partial | Manual |
| Analytics hooks | Yes (onStepChange, onComplete) | No | No | Manual |
| Works with shadcn/ui | Yes | Yes | Conflicts | Yes |
| Best for | Accessible onboarding with analytics | Minimal stepper, tiny budget | Material Design projects | Learning, simple 2-3 step flows |

Stepperize is genuinely impressive at under 1KB. If your wizard is purely visual with no accessibility requirements or analytics needs, it's a solid choice. But "under the hood, a wizard is nothing more than a state machine" as Lee Gillentine points out, and state machines need lifecycle hooks for anything production-grade. Tour Kit won't be the smallest option. It will be the one that handles focus, ARIA, and tracking without you writing that infrastructure yourself.

Fair warning: Tour Kit has no visual builder, so you'll need React developers on your team. The community is also smaller than Joyride's or MUI's. For teams already deep in the Material ecosystem, MUI Stepper may be the pragmatic call.

## Common issues and troubleshooting

We hit these three gotchas while building the wizard for this tutorial. Each has a one-line fix, but the symptoms can be confusing if you haven't seen them before.

### "Step content doesn't update when clicking stepper indicators"

Check that your step components are keyed by `currentStep.id`. Without a key, React may reuse the component instance and skip the re-render:

```tsx
<StepComponent key={currentStep.id} />
```

### "Focus moves to the top of the page on step change"

This happens when `contentRef.current?.focus()` targets a container that's been removed from the DOM before the new step mounts. Make sure the container `<div>` persists across steps. Only the child `<StepComponent />` should swap.

### "Screen readers don't announce the new step"

Verify that `aria-live="polite"` is on the persistent container, not on the step component itself. When the step component unmounts, the live region disappears and the announcement never fires.

## Next steps

You now have a working onboarding wizard with proper ARIA roles, focus management on step transitions, and analytics hooks for tracking completion rates. Here are four enhancements to consider for a production deployment:

- **Conditional steps:** skip the "Preferences" step for returning users by filtering the `steps` array based on user state
- **Persist progress:** use `localStorage` to save wizard state so users don't lose data on accidental refresh (Smashing Magazine's "[Creating an Effective Multistep Form](https://www.smashingmagazine.com/2024/12/creating-effective-multistep-form-better-user-experience/)" covers this pattern well)
- **Step animations:** add CSS transitions between steps, using `prefers-reduced-motion` to disable animation for users who request it
- **Connect `@tour-kit/analytics`:** get structured funnel analysis instead of raw events

Check the [Tour Kit documentation](https://usertourkit.com/docs) for the full API reference and more examples. The source code for this tutorial is on [GitHub](https://github.com/domidex01/tour-kit).

## FAQ

### What is a React onboarding wizard?

A React onboarding wizard is a multi-step UI component that guides new users through an initial setup flow. Tour Kit implements this as a state machine with typed steps, lifecycle callbacks, and built-in focus management. Most use a horizontal stepper indicator showing progress across 3-7 steps.

### Does Tour Kit support React 19?

Tour Kit works with both React 18.2+ and React 19. The library uses hooks (`useTour`, `useStep`) that are compatible with React's concurrent features. The core package ships at under 8KB gzipped with zero peer dependencies beyond React itself.

### How is Tour Kit different from React Joyride for wizards?

React Joyride is designed for tooltip-based product tours that highlight existing UI elements. Tour Kit handles both product tours and multi-step wizard flows, providing step sequencing, validation hooks, and analytics callbacks. Joyride has 603K weekly npm downloads and more community resources if tooltip tours are all you need.

### Does adding a stepper wizard affect performance?

Tour Kit's core adds under 8KB gzipped to your bundle, compared to MUI Stepper at roughly 80KB+. As the LogRocket blog notes, "adding a third-party package for every development requirement isn't always a good choice" ([source](https://blog.logrocket.com/add-stepper-components-react-app/)). Under 8KB for step management, focus handling, and ARIA support is a reasonable trade-off.

### Can I use Tour Kit's wizard with shadcn/ui?

Yes. Tour Kit is headless, managing step logic through hooks without rendering any UI. You bring your own components. The `asChild` pattern through Tour Kit's UnifiedSlot lets you compose primitives directly with shadcn/ui's `Button`, `Card`, and `Input` without wrapper divs.
