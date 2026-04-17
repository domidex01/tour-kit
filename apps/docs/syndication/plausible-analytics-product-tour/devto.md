---
title: "Privacy-first product tour analytics with Plausible (no cookies, 1KB script)"
published: false
description: "Wire React product tour events to Plausible Analytics — zero cookies, no consent banner, and more accurate completion data than GA4. TypeScript walkthrough included."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/plausible-analytics-product-tour
cover_image: https://usertourkit.com/og-images/plausible-analytics-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/plausible-analytics-product-tour)*

# Track tour metrics with Plausible Analytics (privacy-first)

Your onboarding flow starts with a cookie consent banner. The user hasn't even seen your product yet and they're already making a trust decision. Roughly 55.6% of visitors reject or ignore consent prompts entirely ([Plausible, 2025](https://plausible.io/vs-google-analytics)), which means more than half your tour completion data never reaches Google Analytics.

Plausible is a privacy-first analytics tool that ships at ~1 KB, needs no cookies, and requires no consent banner under GDPR. That makes it a natural fit for product tour tracking where accuracy matters and first impressions shouldn't start with legal text. We tested this integration in a Next.js 15 app with Tour Kit and `plausible-tracker@0.3.9`, and the entire setup took under 20 minutes.

This tutorial wires Tour Kit's lifecycle callbacks to Plausible custom events, builds a step-level event schema, and shows how to reconstruct tour funnels from the resulting data.

```bash
npm install @tourkit/core @tourkit/react plausible-tracker
```

## What you'll build

By the end of this tutorial you'll have a Tour Kit product tour that fires Plausible custom events on every interaction: tour start, step view, step complete, dismiss, and finish. Those events carry structured properties (tour ID, step index, time-on-step) that let you reconstruct a completion funnel in Plausible's dashboard. The whole integration adds about 50 lines of TypeScript and zero kilobytes to your consent burden.

One limitation to know upfront: Plausible doesn't have built-in funnel visualization like PostHog or Mixpanel. You get event counts and property breakdowns, but reconstructing step-by-step drop-off requires filtering by custom properties. We'll cover that workaround in step 4.

## Prerequisites

- React 18.2+ or React 19
- A Plausible account (cloud starts at $9/month for 10K pageviews, or [self-host for free](https://plausible.io/self-hosted-web-analytics))
- Tour Kit installed (`@tourkit/core` + `@tourkit/react`)
- A working product tour with at least 3 steps

No tour yet? The [Next.js App Router tutorial](https://usertourkit.com/blog/nextjs-app-router-product-tour) covers setup from scratch.

## Step 1: Add Plausible to your React app

Plausible offers two integration paths for React: a `<script>` tag or the `plausible-tracker` npm package. The npm package is better for SPAs because it gives you a programmatic `trackEvent()` function instead of relying on the global `window.plausible`. It ships at under 1 KB (for comparison, the Google Analytics tag is 45.7 KB) ([Plausible, 2025](https://plausible.io/lightweight-web-analytics)).

```tsx
// src/lib/plausible.ts
import Plausible from 'plausible-tracker'

export const plausible = Plausible({
  domain: 'yourapp.com',
  trackLocalhost: true, // useful during development
})

// Start automatic pageview tracking for SPAs
plausible.enableAutoPageviews()
```

Initialize once at the module level. The `plausible-tracker` package handles SPA route changes via `pushState` interception, so pageviews track automatically in React Router and Next.js App Router projects.

Then call the init in your layout:

```tsx
// src/app/layout.tsx
import '@/lib/plausible' // side-effect import — initializes tracking
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

No cookie banner, no consent gate, no provider wrapper. That's the entire setup.

Plausible processes data exclusively on EU-based servers and collects no personal data. As of April 2026, seven EU data protection authorities (Austria, France, Italy, Denmark, Finland, Norway, Sweden) have ruled that Google Analytics violates GDPR due to US data transfers ([Plausible, 2025](https://plausible.io/vs-google-analytics)). Plausible sidesteps this entirely.

## Step 2: Design your event schema

Plausible custom events follow a simple model: an event name string plus an optional `props` object with string values. Each custom event counts toward your monthly pageview quota, so the schema design matters for both analytics clarity and billing. A 5-step tour firing events on every interaction generates 7-8 events per user per run.

| Event name | Tour Kit callback | When it fires | Custom properties |
|---|---|---|---|
| `Tour Started` | `onStart` | User begins a tour | tour_id, total_steps |
| `Tour Step Viewed` | `onStepChange` | User lands on a step | tour_id, step_id, step_index |
| `Tour Completed` | `onComplete` | User reaches the final step | tour_id, total_steps, duration_sec |
| `Tour Dismissed` | `onSkip` | User exits early | tour_id, dismissed_at_step, completion_pct |

We deliberately skip a `Tour Step Completed` event to keep the event budget tighter. The `Tour Step Viewed` event already tells you which steps users reach — if step 3 has 400 views and step 4 has 280, you know 30% dropped between them. Four event types instead of five saves one event per step transition, which adds up fast. For a 5-step tour with 10,000 monthly users, that's 50,000 fewer billable events per month.

All property values must be strings in Plausible's model. Numbers get stringified: `step_index: String(index)`.

## Step 3: Wire Tour Kit callbacks to Plausible

Tour Kit's `Tour` interface exposes four lifecycle callbacks (`onStart`, `onComplete`, `onSkip`, `onStepChange`) and each receives a `TourCallbackContext` with the current tour state. A wrapper function maps these to Plausible `trackEvent()` calls.

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
        props: {
          tour_id: ctx.tourId,
          total_steps: String(ctx.totalSteps),
        },
      })

      tour.onStart?.(ctx)
    },

    onStepChange: (step: TourStep, index: number, ctx: TourCallbackContext) => {
      plausible.trackEvent('Tour Step Viewed', {
        props: {
          tour_id: ctx.tourId,
          step_id: step.id,
          step_index: String(index),
        },
      })

      tour.onStepChange?.(step, index, ctx)
    },

    onComplete: (ctx: TourCallbackContext) => {
      const durationSec = Math.round((Date.now() - tourStartTime) / 1000)

      plausible.trackEvent('Tour Completed', {
        props: {
          tour_id: ctx.tourId,
          total_steps: String(ctx.totalSteps),
          duration_sec: String(durationSec),
        },
      })

      tour.onComplete?.(ctx)
    },

    onSkip: (ctx: TourCallbackContext) => {
      const completionPct = Math.round(
        (ctx.currentStepIndex / ctx.totalSteps) * 100
      )

      plausible.trackEvent('Tour Dismissed', {
        props: {
          tour_id: ctx.tourId,
          dismissed_at_step: String(ctx.currentStepIndex),
          completion_pct: String(completionPct),
        },
      })

      tour.onSkip?.(ctx)
    },
  }
}
```

Then wrap your tour definition:

```tsx
// src/tours/onboarding.ts
import { withPlausibleTracking } from '@/lib/tour-plausible'
import type { Tour } from '@tourkit/core'

const onboardingTour: Tour = {
  id: 'onboarding-v1',
  steps: [
    { id: 'welcome', target: '#welcome-header', title: 'Welcome' },
    { id: 'sidebar', target: '#sidebar-nav', title: 'Navigation' },
    { id: 'search', target: '#search-input', title: 'Search' },
    { id: 'settings', target: '#settings-btn', title: 'Settings' },
    { id: 'done', target: '#dashboard', title: 'All set' },
  ],
}

export const trackedTour = withPlausibleTracking(onboardingTour)
```

Pass `trackedTour` to your `TourProvider`. Every tour interaction now flows into Plausible without touching a cookie or collecting a single piece of personal data.

## Step 4: Reconstruct funnels from custom properties

Plausible doesn't have a dedicated funnel visualization. But you can reconstruct step-by-step drop-off using the `Tour Step Viewed` event filtered by `step_index` property. This takes more manual work than PostHog's drag-and-drop funnel builder, and it's the main tradeoff of going privacy-first. The data is all there; the visualization is just less automated.

In your Plausible dashboard:

1. Navigate to your site's dashboard
2. Click **Goal Conversions** in the bottom section
3. For each step, filter `Tour Step Viewed` by `step_index` property (0, 1, 2, 3, 4)
4. Record the unique visitor count for each step index

| Step | Event | Filter | Visitors (example) | Drop-off |
|---|---|---|---|---|
| Welcome | Tour Step Viewed | step_index = 0 | 1,000 | — |
| Navigation | Tour Step Viewed | step_index = 1 | 820 | 18% |
| Search | Tour Step Viewed | step_index = 2 | 690 | 16% |
| Settings | Tour Step Viewed | step_index = 3 | 540 | 22% |
| Completed | Tour Completed | tour_id = onboarding-v1 | 480 | 11% |

You can also use Plausible's Stats API to automate this. Pull event counts programmatically and build a funnel chart in your admin dashboard:

```bash
curl "https://plausible.io/api/v1/stats/breakdown?site_id=yourapp.com&period=30d&property=event:props:step_index&filters=event:name==Tour%20Step%20Viewed" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

The API returns visitor counts per property value, which maps directly to funnel steps.

## Step 5: Budget your events

Plausible bills by monthly pageview count, and custom events count toward that quota. This is the gotcha most tutorials skip. A high-traffic app running multiple tours can burn through its allocation fast if you're not intentional about what you track.

| Scenario | Events per user | 10K monthly users | Plausible plan needed |
|---|---|---|---|
| All events (start + 5 steps + complete) | 7 | 70,000 | 100K ($19/mo) |
| Start + complete + dismiss only | 2-3 | 20-30,000 | 50K ($9/mo) |
| Complete + dismiss only | 1-2 | 10-20,000 | 10K ($9/mo) |

Start with the full event set during beta testing to identify drop-off patterns. Once you've iterated on your tour steps, consider trimming to `Tour Completed` and `Tour Dismissed` only to keep costs down. The `step_index` on dismiss events still tells you where users bail.

For context, Plausible's pricing as of April 2026 starts at $9/month for 10K monthly pageviews, scaling to $19/month at 100K. Self-hosting eliminates the billing constraint entirely. Plausible is open source under AGPL ([GitHub](https://github.com/plausible/analytics)).

## Common issues and troubleshooting

Wiring tour events to Plausible is straightforward, but four issues come up regularly. We hit each of these while testing the integration in a Next.js 15 app with Tour Kit and `plausible-tracker`, and the fixes are quick once you know the root cause.

### "Events don't appear in Plausible dashboard"

Custom events require goal setup in Plausible before they show in the dashboard. Go to your site **Settings** > **Goals** > **Add Goal** and create a custom event goal for each event name (`Tour Started`, `Tour Step Viewed`, `Tour Completed`, `Tour Dismissed`). Without goals, events are received but not displayed.

### "Ad blockers prevent tour tracking"

Plausible avoids most ad blockers because it doesn't use third-party cookies or match known tracking patterns. But some aggressive blocklists (like uBlock Origin's strict mode) block the Plausible domain itself. The fix is proxying Plausible through your own domain. For Next.js:

```ts
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/js/script.js',
        destination: 'https://plausible.io/js/script.js',
      },
      {
        source: '/api/event',
        destination: 'https://plausible.io/api/event',
      },
    ]
  },
}
```

Then update your Plausible init to use the proxied endpoint:

```tsx
const plausible = Plausible({
  domain: 'yourapp.com',
  apiHost: '', // empty string = same origin
})
```

This routes all analytics traffic through your domain, making it invisible to ad blockers.

### "Property values show as undefined"

Plausible requires all custom property values to be strings. If you pass a number directly, it silently drops the property. Always stringify:

```tsx
// Wrong: number value
props: { step_index: index }

// Right: string value
props: { step_index: String(index) }
```

### "Tour events fire twice in development"

React 18+ StrictMode double-invokes effects, which can cause duplicate callback execution. This doesn't happen in production builds. If you need clean dev data, deduplicate with a timestamp check:

```tsx
let lastEventTime = 0

onStepChange: (step, index, ctx) => {
  const now = Date.now()
  if (now - lastEventTime < 50) return // debounce
  lastEventTime = now
  plausible.trackEvent('Tour Step Viewed', { /* ... */ })
}
```

## Next steps

You now have privacy-first tour tracking that collects zero cookies, adds under 1 KB to your bundle, and captures more accurate completion data than GA4 can deliver behind a consent banner. Here are four ways to build on this foundation:

- Use Plausible's Stats API to build an internal dashboard that shows tour completion trends over time
- Wire up `@tourkit/analytics` if you later add a second provider (Plausible for privacy, PostHog for session replay). The plugin interface wraps the same callbacks shown here
- Apply the same `trackEvent()` pattern to `@tourkit/hints` callbacks for contextual hotspot tracking
- If you run multiple tours, add a `tour_id` filter to all your Plausible goals so you can compare completion rates across tours

As one developer put it when describing the shift to privacy-first tools: "The ecosystem of privacy-focused analytics tools has gotten genuinely strong. Not just 'good enough,' but legitimately better for most use cases" ([DEV.to, 2026](https://dev.to/alanwest/migrating-from-google-analytics-to-privacy-first-alternatives-in-2026-1m5b)).

The [Tour Kit docs](https://usertourkit.com/docs) cover the full callback API, and [Plausible's custom event documentation](https://plausible.io/docs/custom-event-goals) goes deeper on goal setup and property configuration.

## FAQ

### Can Plausible track product tour events without cookies?

Plausible Analytics tracks custom events including product tour interactions without cookies or personal data collection. Tour Kit's lifecycle callbacks map directly to Plausible's `trackEvent()` API. No consent banner is required under GDPR, removing friction from onboarding flows.

### How does Plausible compare to Google Analytics for tour tracking?

Plausible's script is ~1 KB versus Google Analytics' 45.7 KB. More importantly, GA4 loses roughly 55.6% of visitor data when consent banners are displayed because most users decline tracking. Plausible captures closer to 100% of tour events since no consent is needed, giving you more accurate completion and drop-off metrics.

### Does Plausible support funnel analysis for multi-step tours?

Plausible doesn't have a built-in funnel visualization like PostHog or Mixpanel. You reconstruct funnels by filtering the `Tour Step Viewed` event by the `step_index` custom property and comparing visitor counts across steps. Plausible's Stats API can automate this if you need programmatic access to the data.

### How much does Plausible cost for tour event tracking?

Plausible starts at $9/month for 10,000 monthly pageviews, and custom events count toward that quota. A 5-step tour generates roughly 7 events per user. At 10,000 monthly users you'd need the 100K tier at $19/month. Self-hosting under AGPL is free.

### Does adding Plausible tracking affect Tour Kit's accessibility?

Plausible's `trackEvent()` calls are fire-and-forget JavaScript that don't modify the DOM or interfere with focus management. Tour Kit maintains WCAG 2.1 AA compliance regardless of analytics callbacks. The tracking layer is invisible to screen readers and keyboard navigation.
