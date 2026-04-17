---
title: "Track tour metrics with Plausible Analytics (privacy-first)"
slug: "plausible-analytics-product-tour"
canonical: https://usertourkit.com/blog/plausible-analytics-product-tour
tags: react, javascript, web-development, analytics, privacy
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/plausible-analytics-product-tour)*

# Track tour metrics with Plausible Analytics (privacy-first)

Your onboarding flow starts with a cookie consent banner. The user hasn't even seen your product yet and they're already making a trust decision. Roughly 55.6% of visitors reject or ignore consent prompts entirely ([Plausible, 2025](https://plausible.io/vs-google-analytics)), which means more than half your tour completion data never reaches Google Analytics.

Plausible is a privacy-first analytics tool that ships at ~1 KB, needs no cookies, and requires no consent banner under GDPR. That makes it a natural fit for product tour tracking where accuracy matters and first impressions shouldn't start with legal text.

This tutorial wires Tour Kit's lifecycle callbacks to Plausible custom events, builds a step-level event schema, and shows how to reconstruct tour funnels from the resulting data.

```bash
npm install @tourkit/core @tourkit/react plausible-tracker
```

## What you'll build

By the end you'll have a product tour that fires Plausible custom events on every interaction: start, step view, dismiss, and finish. Those events carry structured properties that let you reconstruct a completion funnel. About 50 lines of TypeScript total.

## Step 1: Add Plausible to your React app

```tsx
// src/lib/plausible.ts
import Plausible from 'plausible-tracker'

export const plausible = Plausible({
  domain: 'yourapp.com',
  trackLocalhost: true,
})

plausible.enableAutoPageviews()
```

```tsx
// src/app/layout.tsx
import '@/lib/plausible'
import { TourKitProvider, TourProvider } from '@tourkit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TourKitProvider>
          <TourProvider tours={tours}>
            {children}
          </TourProvider>
        </TourKitProvider>
      </body>
    </html>
  )
}
```

No cookie banner, no consent gate. That's the entire setup.

## Step 2: Design your event schema

| Event name | Tour Kit callback | When it fires | Custom properties |
|---|---|---|---|
| `Tour Started` | `onStart` | User begins a tour | tour_id, total_steps |
| `Tour Step Viewed` | `onStepChange` | User lands on a step | tour_id, step_id, step_index |
| `Tour Completed` | `onComplete` | User reaches the final step | tour_id, total_steps, duration_sec |
| `Tour Dismissed` | `onSkip` | User exits early | tour_id, dismissed_at_step, completion_pct |

Custom events count toward your Plausible pageview quota. A 5-step tour generates 7-8 events per user.

## Step 3: Wire Tour Kit callbacks to Plausible

```tsx
// src/lib/tour-plausible.ts
import { plausible } from './plausible'
import type { Tour, TourStep, TourCallbackContext } from '@tourkit/core'

let tourStartTime = 0

export function withPlausibleTracking(tour: Tour): Tour {
  return {
    ...tour,
    onStart: (ctx: TourCallbackContext) => {
      tourStartTime = Date.now()
      plausible.trackEvent('Tour Started', {
        props: { tour_id: ctx.tourId, total_steps: String(ctx.totalSteps) },
      })
      tour.onStart?.(ctx)
    },
    onStepChange: (step: TourStep, index: number, ctx: TourCallbackContext) => {
      plausible.trackEvent('Tour Step Viewed', {
        props: { tour_id: ctx.tourId, step_id: step.id, step_index: String(index) },
      })
      tour.onStepChange?.(step, index, ctx)
    },
    onComplete: (ctx: TourCallbackContext) => {
      const durationSec = Math.round((Date.now() - tourStartTime) / 1000)
      plausible.trackEvent('Tour Completed', {
        props: { tour_id: ctx.tourId, total_steps: String(ctx.totalSteps), duration_sec: String(durationSec) },
      })
      tour.onComplete?.(ctx)
    },
    onSkip: (ctx: TourCallbackContext) => {
      const completionPct = Math.round((ctx.currentStepIndex / ctx.totalSteps) * 100)
      plausible.trackEvent('Tour Dismissed', {
        props: { tour_id: ctx.tourId, dismissed_at_step: String(ctx.currentStepIndex), completion_pct: String(completionPct) },
      })
      tour.onSkip?.(ctx)
    },
  }
}
```

Wrap your tour: `export const trackedTour = withPlausibleTracking(onboardingTour)` and pass it to your `TourProvider`.

## Step 4: Reconstruct funnels

Plausible doesn't have built-in funnel visualization. Filter `Tour Step Viewed` by `step_index` property and compare visitor counts across steps. Use the Stats API to automate:

```bash
curl "https://plausible.io/api/v1/stats/breakdown?site_id=yourapp.com&period=30d&property=event:props:step_index&filters=event:name==Tour%20Step%20Viewed" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Step 5: Budget your events

| Scenario | Events/user | 10K monthly users | Plan needed |
|---|---|---|---|
| All events | 7 | 70,000 | 100K ($19/mo) |
| Start + complete only | 2-3 | 20-30K | 50K ($9/mo) |
| Complete + dismiss only | 1-2 | 10-20K | 10K ($9/mo) |

Self-hosting under AGPL eliminates the billing constraint entirely.

Full article with troubleshooting, ad blocker proxy setup, and FAQ: [usertourkit.com/blog/plausible-analytics-product-tour](https://usertourkit.com/blog/plausible-analytics-product-tour)
