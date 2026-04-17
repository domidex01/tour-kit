---
title: "How to track Tour Kit events in Google Tag Manager"
slug: "track-tour-kit-events-google-tag-manager"
canonical: https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager
tags: react, javascript, web-development, google-tag-manager, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager)*

# How to track Tour Kit events in Google Tag Manager

Your product tour runs. Users click through steps, skip some, finish others. But none of that data reaches your marketing tags, your ad conversion pixels, or your CRM enrichment scripts. GTM doesn't know about any of it.

Google Tag Manager processes events through a single pipe: `window.dataLayer`. If your tour library doesn't push structured events there, GTM can't fire tags. Over 60% of GA4 implementations have configuration issues producing unreliable data ([Tatvic Analytics, 2026](https://www.tatvic.com/blog/everything-you-need-to-know-about-google-analytics-4-ga4-in-2025/)).

Tour Kit's `@tour-kit/analytics` package (3.1KB gzipped, 0 runtime dependencies) tracks 6 lifecycle events. This tutorial builds a custom GTM plugin in 28 lines of TypeScript. You'll configure Custom Event triggers, wire up GA4 tags, and verify the pipeline through GTM's Preview Mode.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## Step 1: build the GTM analytics plugin

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

Every push includes the `event` key. Without it, GTM stores the data but no trigger fires ([Google Tag Platform docs](https://developers.google.com/tag-platform/tag-manager/datalayer)).

## Step 2: register the plugin

```typescript
import { createAnalytics } from '@tour-kit/analytics'
import { gtmPlugin } from './gtm-plugin'

export const analytics = createAnalytics({
  plugins: [gtmPlugin()],
  debug: process.env.NODE_ENV === 'development',
})
```

Then pass the tracker to your tour via `onTourStart`, `onStepChange`, `onTourComplete`, and `onTourSkip` callbacks on `TourProvider`.

## Step 3: GTM configuration

Create Data Layer Variables (`tour_id`, `step_id`, `step_index`, `total_steps`, `duration_ms`, `session_id`), Custom Event Triggers for each event name, and GA4 Event Tags forwarding the parameters.

Event names are case-sensitive. GA4 enforces a 40-character limit and a 500-event cap per property. Tour Kit's 6 events fit well within both.

## Step 4: debug with Preview Mode

Use GTM's Preview Mode (Tag Assistant) to inspect every `dataLayer.push` call in real time. Enter `http://localhost:3000` as your URL. Each tour event appears in the left panel with full variable inspection.

## Common gotchas

- **Missing `event` key**: GTM stores data but no trigger fires
- **`window is not defined`**: Guard `createAnalytics` with `typeof window !== 'undefined'` for Next.js SSR
- **Double events**: Don't run both `googleAnalyticsPlugin` and GTM plugin simultaneously
- **History Change trigger**: Fires 2-3x per React Router navigation. Use Custom Event triggers only.

Full article with detailed GTM variable/trigger/tag tables, consent mode setup, and event schema reference: [usertourkit.com/blog/track-tour-kit-events-google-tag-manager](https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager)
