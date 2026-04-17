---
title: "Push product tour events into Google Tag Manager with 28 lines of TypeScript"
published: false
description: "Build a custom GTM analytics plugin for Tour Kit that routes tour_started, step_viewed, and tour_completed into GTM's dataLayer. Includes trigger setup, GA4 tags, and Preview Mode debugging."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager
cover_image: https://usertourkit.com/og-images/track-tour-kit-events-google-tag-manager.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager)*

# How to track Tour Kit events in Google Tag Manager

Your product tour runs. Users click through steps, skip some, finish others. But none of that data reaches your marketing tags, your ad conversion pixels, or your CRM enrichment scripts. GTM doesn't know about any of it.

Google Tag Manager processes events through a single pipe: `window.dataLayer`. If your tour library doesn't push structured events there, GTM can't fire tags. Over 60% of GA4 implementations have configuration issues producing unreliable data ([Tatvic Analytics, 2026](https://www.tatvic.com/blog/everything-you-need-to-know-about-google-analytics-4-ga4-in-2025/)).

Tour Kit's `@tour-kit/analytics` package (3.1KB gzipped, 0 runtime dependencies) tracks 6 lifecycle events. This tutorial builds a custom GTM plugin in 28 lines of TypeScript.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## Step 1: build the GTM analytics plugin

Tour Kit's `AnalyticsPlugin` interface requires 2 fields (`name` and `track`) and supports 4 optional methods. The plugin receives `TourEvent` objects with 10 typed fields and pushes them to GTM's dataLayer using snake_case event names.

```typescript
// src/analytics/gtm-plugin.ts
import type { AnalyticsPlugin, TourEvent } from '@tour-kit/analytics'

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function gtmPlugin(): AnalyticsPlugin {
  return {
    name: 'google-tag-manager',

    init() {
      window.dataLayer = window.dataLayer || []
    },

    track(event: TourEvent) {
      window.dataLayer.push({
        event: event.eventName,
        tour_id: event.tourId,
        step_id: event.stepId ?? null,
        step_index: event.stepIndex ?? null,
        total_steps: event.totalSteps ?? null,
        duration_ms: event.duration ?? null,
        session_id: event.sessionId,
        ...event.metadata,
      })
    },
  }
}
```

Every push includes the `event` key. Without it, GTM stores the data but no trigger fires. That's the single most common GTM debugging headache ([Google Tag Platform docs](https://developers.google.com/tag-platform/tag-manager/datalayer)).

## Step 2: register the plugin with Tour Kit

```typescript
// src/analytics/index.ts
import { createAnalytics } from '@tour-kit/analytics'
import { gtmPlugin } from './gtm-plugin'

export const analytics = createAnalytics({
  plugins: [gtmPlugin()],
  debug: process.env.NODE_ENV === 'development',
})
```

Then wire it into your tour:

```tsx
// src/components/OnboardingTour.tsx
'use client'

import { TourProvider } from '@tour-kit/react'
import { analytics } from '../analytics'

const steps = [
  { id: 'welcome', target: '#welcome-banner', title: 'Welcome' },
  { id: 'sidebar', target: '#sidebar-nav', title: 'Navigation' },
  { id: 'settings', target: '#settings-btn', title: 'Settings' },
]

export function OnboardingTour() {
  return (
    <TourProvider
      tourId="onboarding-v2"
      steps={steps}
      onTourStart={() =>
        analytics.tourStarted('onboarding-v2', steps.length)
      }
      onStepChange={(step, index) =>
        analytics.stepViewed('onboarding-v2', step.id, index, steps.length)
      }
      onTourComplete={() =>
        analytics.tourCompleted('onboarding-v2')
      }
      onTourSkip={(stepIndex) =>
        analytics.tourSkipped('onboarding-v2', stepIndex)
      }
    />
  )
}
```

## Step 3: create GTM triggers and variables

In GTM, create **Data Layer Variables** for each parameter (`tour_id`, `step_id`, `step_index`, `total_steps`, `duration_ms`, `session_id`), then **Custom Event Triggers** matching each event name (`tour_started`, `step_viewed`, `tour_completed`, `tour_skipped`, `step_skipped`), and finally **GA4 Event Tags** forwarding the parameters.

Event names are case-sensitive. `tour_started` won't match `Tour_Started`. GA4 enforces a 40-character limit on event names and a 500-event-per-instance cap.

You can also combine all 5 events into a single tag using a RegEx trigger matching `tour_started|step_viewed|tour_completed|tour_skipped|step_skipped`.

## Step 4: debug with GTM Preview Mode

1. Click **Preview** in GTM workspace
2. Enter your app URL (`http://localhost:3000`)
3. Start a tour
4. In Tag Assistant, click the event name, open **Variables** tab to verify values
5. Check **Tags** tab to confirm "Fired"
6. Cross-check in GA4 **DebugView**

We tested this with Tour Kit's `consolePlugin` running alongside GTM. Double-confirmation catches 90% of issues before production.

## Troubleshooting

**"window is not defined" in Next.js** — Guard the analytics init:

```typescript
export const analytics =
  typeof window !== 'undefined'
    ? createAnalytics({ plugins: [gtmPlugin()] })
    : null
```

**"Tour events fire twice"** — You're probably running both `googleAnalyticsPlugin` (direct to GA4) and the GTM plugin (which also fires a GA4 tag). Pick one.

**History Change trigger fires on every route** — React Router dispatches 2-3 history events per navigation. Use Custom Event triggers exclusively.

## Event schema reference

| Tour Kit event | GTM event name | Key parameters |
|---|---|---|
| `tour_started` | `tour_started` | tour_id, total_steps |
| `step_viewed` | `step_viewed` | tour_id, step_id, step_index |
| `tour_completed` | `tour_completed` | tour_id, duration_ms |
| `tour_skipped` | `tour_skipped` | tour_id, step_index |
| `step_skipped` | `step_skipped` | tour_id, step_id |

Full article with consent mode setup, complete GTM variable/trigger/tag tables, and FAQ: [usertourkit.com/blog/track-tour-kit-events-google-tag-manager](https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager)
