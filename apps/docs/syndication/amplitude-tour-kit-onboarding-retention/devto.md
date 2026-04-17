---
title: "Wire Amplitude to your React product tour: funnels, cohorts, and retention curves"
published: false
description: "How to instrument a headless React product tour with Amplitude's track() API, build step-level funnels, create behavioral cohorts, and measure actual retention impact. 70 lines of TypeScript."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention
cover_image: https://usertourkit.com/og-images/amplitude-tour-kit-onboarding-retention.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention)*

# Amplitude + Tour Kit: measuring onboarding impact on retention

Most teams track whether users finish their onboarding tour. Fewer teams ask the harder question: does finishing the tour actually change retention?

Amplitude's behavioral cohort model answers this directly. You split users into two groups (those who completed the tour within 24 hours of signup, and those who didn't) then compare their Day-7, Day-14, and Day-30 retention curves. The gap between those curves is the tour's real ROI.

Calm ran this exact analysis and found retention was [3x higher among users who completed a single onboarding step](https://amplitude.com/blog/user-onboarding-stack-retention) compared to those who skipped it.

But Amplitude doesn't ship a product tour component. And most tour libraries don't ship typed analytics callbacks. Tour Kit bridges this: its `onTourStart`, `onStepView`, `onTourComplete`, and `onTourSkip` callbacks map directly to Amplitude events, which feed funnels and cohorts without manual instrumentation glue.

This tutorial covers the full loop: install, instrument, funnel, cohort, retention analysis.

```bash
npm install @tourkit/core @tourkit/react @amplitude/analytics-browser
```

## What you'll build

Tour Kit's `TourKitProvider` accepts four analytics callbacks that fire on every tour lifecycle event: start, step view, complete, and skip. By the end of this tutorial, those callbacks will send structured events to Amplitude with typed properties, giving you a step-level funnel, behavioral cohorts for completers vs. skippers, and a retention analysis chart that shows whether your onboarding tour actually moves the needle on Day-7 and Day-30 retention. The whole integration is about 70 lines of TypeScript.

One limitation to know upfront: Tour Kit doesn't have a built-in Amplitude adapter, and it requires React 18+ (no older React or React Native support). You'll wire the callbacks manually using `@amplitude/analytics-browser`.

The `@tourkit/analytics` package provides a plugin interface if you later need multi-provider support, but for Amplitude alone the direct approach is cleaner.

## Prerequisites

- React 18.2+ or React 19
- An Amplitude account (the free tier covers 50,000 MTUs/month, as of April 2026)
- Tour Kit installed (`@tourkit/core` + `@tourkit/react`)
- A working product tour with at least 3 steps

No tour yet? The [Next.js App Router tutorial](https://usertourkit.com/blog/nextjs-app-router-product-tour) gets you there from scratch.

## Step 1: Initialize Amplitude in your React app

Amplitude's browser SDK (`@amplitude/analytics-browser`) doesn't ship a React-specific package. The deprecated `react-amplitude` library was never replaced with an official hooks-based successor. You initialize the SDK once at the top of your component tree and call `track()` from anywhere. No provider wrapper needed.

```tsx
// src/lib/amplitude.ts
import * as amplitude from '@amplitude/analytics-browser'

let initialized = false

export function initAmplitude() {
  if (initialized) return

  amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!, {
    autocapture: { elementInteractions: false },
  })

  initialized = true
}

export { amplitude }
```

Call `initAmplitude()` from your root layout:

```tsx
// src/app/layout.tsx
'use client'

import { useEffect } from 'react'
import { initAmplitude } from '@/lib/amplitude'
import { TourKitProvider } from '@tourkit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <TourKitProvider>
      {children}
    </TourKitProvider>
  )
}
```

The `autocapture: { elementInteractions: false }` flag disables Amplitude's automatic click tracking. You want explicit events only, which gives you cleaner data and a smaller network footprint.

## Step 2: Define a typed event schema

Inconsistent event names are the number one pain point developers report with Amplitude. A typed schema prevents this at compile time.

```tsx
// src/lib/tour-events.ts
type TourEventMap = {
  'tour_started': {
    tour_id: string
    total_steps: number
  }
  'tour_step_viewed': {
    tour_id: string
    step_id: string
    step_index: number
    total_steps: number
  }
  'tour_completed': {
    tour_id: string
    total_steps: number
    time_to_complete_ms: number
  }
  'tour_dismissed': {
    tour_id: string
    dismissed_at_step: number
    total_steps: number
    completion_pct: number
  }
}

export type TourEventName = keyof TourEventMap
export type TourEventProperties<T extends TourEventName> = TourEventMap[T]
```

This gives you autocomplete and type checking on every `track()` call. If someone misspells `tour_started` or passes a `string` where a `number` belongs, TypeScript catches it before the event ever reaches Amplitude.

## Step 3: Wire Tour Kit callbacks to Amplitude

Tour Kit's `TourKitProvider` accepts `onTourStart`, `onStepView`, `onTourComplete`, and `onTourSkip` as props. Each callback receives the tour ID, step ID, and step index, which covers everything Amplitude needs as event properties.

```tsx
// src/providers/tracked-tour-provider.tsx
'use client'

import { TourKitProvider } from '@tourkit/react'
import { amplitude } from '@/lib/amplitude'
import { useRef } from 'react'

export function TrackedTourProvider({ children }: { children: React.ReactNode }) {
  const tourStartTimes = useRef<Map<string, number>>(new Map())

  return (
    <TourKitProvider
      onTourStart={(tourId) => {
        tourStartTimes.current.set(tourId, Date.now())

        amplitude.track('tour_started', {
          tour_id: tourId,
          total_steps: 0,
        })
      }}
      onStepView={(tourId, stepId, stepIndex) => {
        amplitude.track('tour_step_viewed', {
          tour_id: tourId,
          step_id: stepId,
          step_index: stepIndex,
          total_steps: 0,
        })
      }}
      onTourComplete={(tourId) => {
        const startTime = tourStartTimes.current.get(tourId) ?? Date.now()
        const elapsed = Date.now() - startTime

        amplitude.track('tour_completed', {
          tour_id: tourId,
          total_steps: 0,
          time_to_complete_ms: elapsed,
        })

        // Set a user property for cohort building
        const identify = new amplitude.Identify()
        identify.set(`tour_completed_${tourId}`, true)
        identify.set(`tour_completed_${tourId}_at`, new Date().toISOString())
        amplitude.identify(identify)

        tourStartTimes.current.delete(tourId)
      }}
      onTourSkip={(tourId, stepIndex) => {
        amplitude.track('tour_dismissed', {
          tour_id: tourId,
          dismissed_at_step: stepIndex,
          total_steps: 0,
          completion_pct: 0,
        })

        tourStartTimes.current.delete(tourId)
      }}
    >
      {children}
    </TourKitProvider>
  )
}
```

Replace `TourKitProvider` in your layout with `TrackedTourProvider` and every tour in your app sends events to Amplitude automatically. No per-tour wiring.

## Step 4: Build a step-level funnel in Amplitude

Amplitude's funnel analysis takes those four events and shows exactly where users drop off during your tour. According to [Amplitude's onboarding measurement guide](https://amplitude.com/blog/4-steps-to-measure-user-onboarding), identifying the largest drop-off and fixing it first is the single most impactful thing you can do. Teams that redesign flows based on drop-off data see trial-to-paid conversion improvements of 20-25%.

In your Amplitude dashboard:

1. Go to **Analytics** > **Create** > **Funnel Analysis**
2. Add these events in order:
   - `tour_started` (filter: `tour_id = onboarding-v2`)
   - `tour_step_viewed` (filter: `step_index = 0`)
   - `tour_step_viewed` (filter: `step_index = 1`)
   - `tour_step_viewed` (filter: `step_index = 2`)
   - `tour_completed` (filter: `tour_id = onboarding-v2`)
3. Set the conversion window to **1 hour**

| Funnel step | Typical conversion | Red flag threshold |
|---|---|---|
| Start to Step 1 | 85-95% | Below 75% |
| Step N to Step N+1 | 70-85% | Below 60% |
| Last step to Complete | 60-80% | Below 45% |
| Overall (5-step tour) | 30-40% | Below 20% |

## Step 5: Create behavioral cohorts

The funnel tells you where users drop off. Cohorts tell you whether dropping off matters. This is the part most analytics tutorials skip, and it's the part that actually justifies the instrumentation work.

Amplitude's behavioral cohort model lets you define groups by actions taken (or not taken), then compare their downstream behavior.

In Amplitude:

1. Go to **Cohorts** > **Create Cohort**
2. Define **"Tour completers"**: users who have user property `tour_completed_onboarding-v2` equals `true`
3. Add **"Tour skippers"**: users who performed `tour_dismissed` where `tour_id = onboarding-v2`
4. Add **"Tour unseen"**: users who signed up but never triggered `tour_started` with `tour_id = onboarding-v2`

Three cohorts, not two. The "unseen" group is your control: users who never encountered the tour.

## Step 6: Run a retention analysis

Amplitude's Retention Analysis chart compares how each cohort retains over time. If tour completers retain at 2x the rate of the unseen group, the tour is driving real value. If there's no gap, the tour might be teaching the wrong things.

In Amplitude:

1. Go to **Analytics** > **Create** > **Retention Analysis**
2. Set the **start event** to `Signup`
3. Set the **return event** to any meaningful engagement action
4. Under **Performed by**, select each of your three cohorts

Calm's team discovered through exactly this analysis that users who set a daily reminder during onboarding retained at [3x the rate of those who didn't](https://amplitude.com/blog/user-onboarding-stack-retention). They made the reminder step mandatory. Retention went up across the entire user base.

## Common issues and troubleshooting

We tested this integration in a Next.js 15 app with a 5-step onboarding tour and measured three problems that come up regularly.

### "Events appear in Amplitude but user properties are missing"

The `Identify` call needs to happen after `amplitude.init()` resolves. If your tour auto-starts before init completes, the identify gets dropped silently:

```tsx
onTourComplete={(tourId) => {
  if (!amplitude.getSessionId()) {
    console.warn('Amplitude not initialized, skipping identify')
    return
  }

  const identify = new amplitude.Identify()
  identify.set(`tour_completed_${tourId}`, true)
  amplitude.identify(identify)
}}
```

### "Amplitude adds too much to my bundle"

As of April 2026, `@amplitude/analytics-browser` ships at roughly 36KB gzipped. Dynamic import keeps it out of your critical path:

```tsx
let amplitudeInstance: typeof import('@amplitude/analytics-browser') | null = null

export async function getAmplitude() {
  if (!amplitudeInstance) {
    amplitudeInstance = await import('@amplitude/analytics-browser')
    amplitudeInstance.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!)
  }
  return amplitudeInstance
}
```

### "Tour events fire twice in development"

React 18+ StrictMode double-invokes effects. Doesn't happen in production. Deduplicate with a ref if it creates noisy dev data.

## Next steps

- Use Amplitude's Experiment feature to A/B test different tour step content
- Wire `@tourkit/hints` callbacks to track hotspot engagement
- Build a [custom Amplitude dashboard](https://amplitude.com/guides/measure-user-onboarding) combining tour metrics with your activation funnel

The [Tour Kit docs](https://usertourkit.com/docs) cover the full callback API. Amplitude's [onboarding measurement guide](https://amplitude.com/blog/4-steps-to-measure-user-onboarding) goes deeper on the four-step framework referenced throughout this tutorial.
