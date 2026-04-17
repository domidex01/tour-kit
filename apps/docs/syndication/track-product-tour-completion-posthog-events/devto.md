---
title: "How to track product tour completion with PostHog custom events in React"
published: false
description: "Wire a headless React product tour to PostHog's capture() API. Get completion funnels, step drop-off analysis, and activation cohorts in about 60 lines of TypeScript."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/track-product-tour-completion-posthog-events
cover_image: https://usertourkit.com/og-images/track-product-tour-completion-posthog-events.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)*

# Track product tour completion with PostHog events

You built a product tour. Users click through it. But how many finish? Does finishing correlate with activation?

PostHog's built-in product tours feature is still in private alpha and only works with their no-code toolbar builder. If you're running a headless tour with Tour Kit or any custom React implementation, you need to wire up your own event tracking. PostHog's `capture()` API makes this straightforward, and the resulting funnels are more flexible than any no-code solution.

This tutorial walks through instrumenting a Tour Kit tour with PostHog events, building a completion funnel, and using cohorts to measure whether tour completers actually activate. We tested this in a Next.js 15 app with Tour Kit and `posthog-js@1.324+`.

```bash
npm install @tourkit/core @tourkit/react posthog-js
```

## What you'll build

By the end of this tutorial you'll have a 5-step onboarding tour that fires structured PostHog events on every interaction: start, step view, step complete, dismiss, and tour finish. Those events feed a PostHog funnel that shows exactly where users drop off, plus cohorts that let you compare activation rates between tour completers and skippers. The whole integration adds about 60 lines of TypeScript.

One limitation worth knowing: Tour Kit doesn't have a built-in analytics adapter for PostHog yet, so you'll wire callbacks manually. The `@tourkit/analytics` package provides a plugin interface if you later need to send events to multiple providers, but for PostHog alone the direct approach shown here is simpler.

## Prerequisites

- React 18.2+ or React 19
- A PostHog account (the free tier covers 1M events/month)
- Tour Kit installed (`@tourkit/core` + `@tourkit/react`)
- A working product tour with at least 3 steps

If you don't have a tour yet, the [Next.js App Router tutorial](https://usertourkit.com/blog/nextjs-app-router-product-tour) covers setup from scratch.

## Step 1: Set up PostHog in your React app

PostHog's React SDK ships two primitives you need: a `PostHogProvider` that initializes the client once at the top of your component tree, and a `usePostHog()` hook that returns the client instance for calling `capture()` from any component. Install `posthog-js` alongside your Tour Kit packages and wrap your layout.

```tsx
// src/providers/posthog-provider.tsx
'use client'

import { PostHogProvider as PHProvider } from 'posthog-js/react'
import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: false, // we handle this manually in App Router
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

Add two environment variables to `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Then wrap your layout:

```tsx
// src/app/layout.tsx
import { PostHogProvider } from '@/providers/posthog-provider'
import { TourKitProvider, TourProvider } from '@tourkit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <TourKitProvider>
            <TourProvider tours={tours}>
              {children}
            </TourProvider>
          </TourKitProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
```

You should see autocaptured pageview and click events in your PostHog dashboard within a few seconds of loading the page.

## Step 2: Design your event schema

PostHog recommends an `[object] [verb]` naming convention for custom events, and for product tours that translates to five event types mapping directly to Tour Kit's callback lifecycle: tour started, tour step viewed, tour step completed, tour dismissed, and tour completed. Defining this schema upfront keeps your funnels clean and your property names consistent across tours.

| Event name | Tour Kit callback | When it fires | Key properties |
|---|---|---|---|
| `tour started` | `onStart` | User begins a tour | tour_id, total_steps, trigger |
| `tour step viewed` | `onStepChange` | User lands on a step | tour_id, step_id, step_index, total_steps |
| `tour completed` | `onComplete` | User reaches the final step | tour_id, total_steps, time_to_complete_ms |
| `tour dismissed` | `onSkip` | User exits early | tour_id, dismissed_at_step, completion_pct |
| `tour step completed` | `onStepChange` (direction: forward) | User advances past a step | tour_id, step_id, step_index, time_on_step_ms |

PostHog puts no limit on the number of properties per event, so include more than you think you need. You can always ignore a property later, but you can't retroactively add one to events that already fired.

## Step 3: Wire Tour Kit callbacks to PostHog

Tour Kit's `Tour` interface exposes four lifecycle callbacks (`onStart`, `onComplete`, `onSkip`, `onStepChange`) and each receives a `TourCallbackContext` containing the full tour state: `tourId`, `currentStepIndex`, `totalSteps`, `visitedSteps`, and `previousStepId`. A wrapper function maps these callbacks to PostHog `capture()` calls so you can instrument any tour with a single function call.

Here's the helper:

```tsx
// src/lib/tour-analytics.ts
import posthog from 'posthog-js'
import type { Tour, TourStep, TourCallbackContext } from '@tourkit/core'

let tourStartTime = 0
let stepStartTime = 0

export function withPostHogTracking(tour: Tour): Tour {
  return {
    ...tour,

    onStart: (ctx: TourCallbackContext) => {
      tourStartTime = Date.now()
      stepStartTime = Date.now()

      posthog.capture('tour started', {
        tour_id: ctx.tourId,
        total_steps: ctx.totalSteps,
        trigger: 'manual',
      })

      tour.onStart?.(ctx)
    },

    onStepChange: (step: TourStep, index: number, ctx: TourCallbackContext) => {
      const timeOnPrevStep = Date.now() - stepStartTime
      stepStartTime = Date.now()

      if (ctx.previousStepId) {
        posthog.capture('tour step completed', {
          tour_id: ctx.tourId,
          step_id: ctx.previousStepId,
          step_index: index - 1,
          time_on_step_ms: timeOnPrevStep,
        })
      }

      posthog.capture('tour step viewed', {
        tour_id: ctx.tourId,
        step_id: step.id,
        step_index: index,
        total_steps: ctx.totalSteps,
      })

      tour.onStepChange?.(step, index, ctx)
    },

    onComplete: (ctx: TourCallbackContext) => {
      const totalTime = Date.now() - tourStartTime

      posthog.capture('tour completed', {
        tour_id: ctx.tourId,
        total_steps: ctx.totalSteps,
        time_to_complete_ms: totalTime,
      })

      posthog.people.set({
        [`tour_completed_${ctx.tourId}`]: true,
        [`tour_completed_${ctx.tourId}_at`]: new Date().toISOString(),
      })

      tour.onComplete?.(ctx)
    },

    onSkip: (ctx: TourCallbackContext) => {
      const completionPct = Math.round(
        (ctx.currentStepIndex / ctx.totalSteps) * 100
      )

      posthog.capture('tour dismissed', {
        tour_id: ctx.tourId,
        dismissed_at_step: ctx.currentStepIndex,
        total_steps: ctx.totalSteps,
        completion_pct: completionPct,
      })

      tour.onSkip?.(ctx)
    },
  }
}
```

Then wrap your tour definition:

```tsx
// src/tours/onboarding.ts
import { withPostHogTracking } from '@/lib/tour-analytics'
import type { Tour } from '@tourkit/core'

const onboardingTour: Tour = {
  id: 'onboarding-v2',
  steps: [
    { id: 'welcome', target: '#welcome-header', title: 'Welcome' },
    { id: 'sidebar', target: '#sidebar-nav', title: 'Navigation' },
    { id: 'search', target: '#search-input', title: 'Search' },
    { id: 'settings', target: '#settings-btn', title: 'Settings' },
    { id: 'done', target: '#dashboard', title: 'You are all set' },
  ],
}

export const trackedOnboardingTour = withPostHogTracking(onboardingTour)
```

Pass `trackedOnboardingTour` to your `TourProvider` and every tour interaction flows into PostHog automatically.

## Step 4: Build a completion funnel in PostHog

PostHog's funnel visualization takes tour events and shows exactly where users drop off, step by step, with conversion percentages between each transition.

In your PostHog dashboard:

1. Go to **Product Analytics** > **New Insight** > **Funnel**
2. Add these steps in order:
   - `tour started` (filter: `tour_id = onboarding-v2`)
   - `tour step viewed` (filter: `step_index = 1`)
   - `tour step viewed` (filter: `step_index = 2`)
   - `tour step viewed` (filter: `step_index = 3`)
   - `tour completed` (filter: `tour_id = onboarding-v2`)
3. Set the funnel window to **1 hour** (tours shouldn't take longer)

The funnel shows your conversion rate between each step. Industry benchmarks from Product Fruits put median 5-step tour completion at roughly 34%. If you're above that, your tour content is working. Below it, look at where the biggest drop happens and rework that step.

Compare funnel performance across time periods to see whether tour iterations improve completion. PostHog's breakdown feature lets you segment by user properties: plan type, signup source, device type.

## Step 5: Create activation cohorts

Tour completion rate alone is a vanity metric because it doesn't tell you whether finishing the tour actually changes user behavior. PostHog cohorts let you split users into "completed the tour" and "skipped the tour" groups, then compare their activation rates side by side.

1. Go to **People** > **Cohorts** > **New Cohort**
2. Create "Tour completers": users where person property `tour_completed_onboarding-v2` equals `true`
3. Create "Tour skippers": users who performed event `tour dismissed` with `tour_id = onboarding-v2`

Now compare these cohorts against your activation metric. In a new Trends insight, plot your activation event (first project created, first API call, whatever defines "activated" in your product) and break it down by cohort.

If tour completers activate at, say, 3x the rate of skippers, the tour is pulling its weight. If there's no difference, the tour might be teaching the wrong things or targeting users who would have activated anyway.

## Common issues and troubleshooting

### "Events show up in PostHog but with missing properties"

This happens when `capture()` fires before Tour Kit's state has fully resolved. Use the `TourCallbackContext` values directly:

```tsx
// Wrong: stale closure over external state
onComplete: () => {
  posthog.capture('tour completed', { tour_id: tourId })
}

// Right: use the callback context
onComplete: (ctx: TourCallbackContext) => {
  posthog.capture('tour completed', { tour_id: ctx.tourId })
}
```

### "PostHog adds 50KB+ to my bundle"

As of April 2026, `posthog-js` core ships at roughly 52KB gzipped. Session replay, surveys, and other extensions lazy-load separately. Not in the initial payload.

If that's still too heavy, PostHog offers an experimental slim bundle:

```tsx
import posthog from 'posthog-js/dist/module.no-external'
```

Tour Kit's core is under 8KB gzipped. The PostHog SDK is the heavier dependency, but it replaces your entire analytics stack, not just tour tracking.

### "Tour events fire twice on step changes"

React 18+ StrictMode double-invokes effects in development, which can cause duplicate `onStepChange` calls. Doesn't happen in production builds. If it bothers you during development, deduplicate with a ref:

```tsx
const lastEventRef = useRef<string>('')

onStepChange: (step, index, ctx) => {
  const eventKey = `${ctx.tourId}-${step.id}-${index}`
  if (eventKey === lastEventRef.current) return
  lastEventRef.current = eventKey
  posthog.capture('tour step viewed', { /* ... */ })
}
```

## Next steps

- Use PostHog's feature flags to A/B test different tour step content and track which variant has higher completion using these same events
- Wire up `@tourkit/analytics` if you need to send events to multiple providers
- Apply the same `capture()` pattern to `@tourkit/hints` callbacks if you use contextual hotspots
- Use PostHog person properties to only show tours to users who haven't completed them yet

The [Tour Kit docs](https://usertourkit.com/docs) cover the full callback API, and PostHog's [event tracking guide](https://posthog.com/tutorials/event-tracking-guide) goes deeper on naming conventions and property design.

## FAQ

### Does PostHog's built-in product tour feature work with Tour Kit?

No. PostHog's product tours are in private alpha and only work with their no-code toolbar builder, not custom React components. To get PostHog analytics with Tour Kit, wire the `capture()` API to Tour Kit's callbacks as shown in this tutorial.

### What tour completion rate should I aim for?

Product Fruits research puts median completion at roughly 34% for 5-step tours, though launcher-driven tours (where users opt in) hit around 67%. Completion alone is less important than the correlation between completion and your activation metric.

### How much does PostHog cost for tour analytics?

PostHog's free tier includes 1 million events per month. A 5-step tour fires roughly 7 events per session, so you can track about 142,000 tour sessions monthly for free. PostHog charges per event after the free allocation.

### Does adding PostHog tracking affect tour accessibility?

PostHog's `capture()` calls are fire-and-forget JavaScript that don't touch the DOM or interfere with focus management. Tour Kit maintains WCAG 2.1 AA compliance regardless of what you do in callbacks. The analytics layer is invisible to assistive technology.

### Can I track tours across multiple pages?

Tour Kit supports multi-page tours with its persistence system. PostHog identifies users across pages automatically via its first-party cookie. Events from a multi-page tour are attributed to the same user session and show up correctly in funnels.
