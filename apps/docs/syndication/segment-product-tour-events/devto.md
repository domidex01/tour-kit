---
title: "Send product tour events to 400+ tools with one Segment plugin"
published: false
description: "Build a custom Segment plugin for Tour Kit that pipes tour lifecycle events to every analytics destination. ~50 lines of TypeScript, zero per-tool config."
tags: react, javascript, typescript, tutorial
canonical_url: https://usertourkit.com/blog/segment-product-tour-events
cover_image: https://usertourkit.com/og-images/segment-product-tour-events.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/segment-product-tour-events)*

# Tour Kit + Segment: piping tour events to every analytics tool

Most product tour libraries send events to one analytics tool. You wire up GA4 or Mixpanel, declare victory, and move on. Six months later, the data team asks for the same events in BigQuery. Then marketing wants them in HubSpot. Then someone adds Amplitude. You're writing glue code for each destination, and the tour config file you swore was clean now has four analytics callbacks.

Segment solves this by sitting between your app and every downstream tool. One `analytics.track()` call fans out to 400+ destinations without extra code. As of April 2026, `@segment/analytics-node` pulls roughly 539K weekly downloads on npm, and Segment's Analytics.js 2.0 ships at about 16KB gzipped after a 70% reduction from the v1 bundle ([Segment Engineering Blog](https://segment.com/blog/analytics-js-2/)).

Tour Kit's plugin-based analytics architecture maps cleanly to Segment's `track` and `identify` methods. You write one plugin, and every tour event in your app flows to Amplitude, Mixpanel, BigQuery, HubSpot, and wherever else your Segment workspace is configured to send data.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What you'll build

You'll create a custom Tour Kit analytics plugin that sends structured tour lifecycle events through Segment to every connected destination, mapping 6 core event types to Segment's `track` API with typed properties and user identification support. The plugin works with both Analytics.js 2.0 in the browser and `@segment/analytics-node` on the server. About 50 lines of TypeScript across 2 files.

Tour Kit requires React 18.2+ and has no visual tour builder. You write steps in code. If your team needs drag-and-drop, Chameleon or Appcues are better fits for that workflow.

## Why Segment + Tour Kit?

Segment is a customer data platform (CDP) that acts as a single collection point for all your event data and routes it to downstream tools without per-destination integration code. Tour Kit's `@tour-kit/analytics` package already ships plugins for GA4, PostHog, Mixpanel, and Amplitude. But each of those is a point-to-point connection. Segment replaces all four with one pipe.

The practical benefit: when you add a new analytics tool next quarter, you configure it in the Segment dashboard. Zero code changes in your React app.

| Approach | Tools supported | Code changes per new tool | Tour Kit setup |
|---|---|---|---|
| Direct plugins (GA4, Mixpanel, etc.) | 1 per plugin | New plugin + provider config | ~8 lines per tool |
| Segment plugin | 400+ via Segment dashboard | Zero (dashboard toggle) | ~12 lines, once |

The tradeoff is cost. Segment's free tier caps at 1,000 monthly tracked users (MTUs) with 2 sources ([Segment Pricing](https://segment.com/pricing/connections/)). That covers early-stage apps, but Segment's pricing jumped roughly 40% in 2025, so growing teams hit a wall fast. Tour Kit's plugin architecture hedges this: if you outgrow Segment, swap the plugin for RudderStack or a direct integration without touching your tour code.

## Prerequisites

- React 18.2+ or React 19
- A Segment workspace with a JavaScript source (grab the write key from Sources > JavaScript > Settings)
- Analytics.js 2.0 loaded on your page (via Segment's snippet or `@segment/analytics-next`)
- Tour Kit installed: `@tourkit/core`, `@tourkit/react`, `@tourkit/analytics`
- At least one Segment destination enabled (GA4, Amplitude, a warehouse, anything)

If you don't have a tour yet, the [React 19 quickstart](https://usertourkit.com/blog/add-product-tour-react-19) gets you running in 5 minutes.

## Step 1: Load Segment's Analytics.js

Analytics.js 2.0 is Segment's browser-side SDK that collects events and routes them to downstream destinations. Segment recommends loading it via their snippet in your HTML `<head>`. The initial bundle is about 16KB gzipped, with destination-specific code loaded on demand ([Segment Docs](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/)). If you're using a bundler and prefer npm, `@segment/analytics-next` works too, but the snippet approach keeps Segment out of your JS bundle entirely.

For Next.js, add the snippet to your root layout:

```tsx
// src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="segment-snippet"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(){var i="analytics",...}()` // Paste your Segment snippet here
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Replace the snippet placeholder with the actual code from your Segment workspace under Sources > JavaScript > Quickstart.

## Step 2: Build the Segment plugin

Tour Kit's `AnalyticsPlugin` interface has 5 methods (`init`, `track`, `identify`, `flush`, and `destroy`) that map directly to Segment's `analytics.track()` and `analytics.identify()` calls, making a custom plugin about 40 lines of TypeScript.

```tsx
// src/lib/segment-plugin.ts
import type { AnalyticsPlugin, TourEvent } from '@tour-kit/analytics'

declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, unknown>) => void
      identify: (userId: string, traits?: Record<string, unknown>) => void
      flush?: () => void
    }
  }
}

interface SegmentPluginOptions {
  eventPrefix?: string
  eventNameMap?: Partial<Record<string, string>>
}

export function segmentPlugin(options: SegmentPluginOptions = {}): AnalyticsPlugin {
  const prefix = options.eventPrefix ?? 'tourkit_'

  const getAnalytics = () => {
    if (typeof window !== 'undefined' && window.analytics) {
      return window.analytics
    }
    return null
  }

  const resolveEventName = (eventName: string): string => {
    if (options.eventNameMap?.[eventName]) {
      return options.eventNameMap[eventName]
    }
    return `${prefix}${eventName}`
  }

  return {
    name: 'segment',

    init() {
      if (!getAnalytics()) {
        console.warn(
          'Tour Kit Segment plugin: window.analytics not found. ' +
          'Make sure the Segment snippet is loaded before Tour Kit initializes.'
        )
      }
    },

    track(event: TourEvent) {
      const seg = getAnalytics()
      if (!seg) return

      seg.track(resolveEventName(event.eventName), {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        ...event.metadata,
      })
    },

    identify(userId: string, properties?: Record<string, unknown>) {
      const seg = getAnalytics()
      if (!seg) return
      seg.identify(userId, properties)
    },

    flush() {
      const seg = getAnalytics()
      seg?.flush?.()
    },

    destroy() {
      // Segment manages its own lifecycle
    },
  }
}
```

## Step 3: Wire the plugin into your app

Connecting the Segment plugin to your React app follows the same provider pattern as Tour Kit's other analytics integrations.

```tsx
// src/lib/analytics.ts
import { createAnalytics } from '@tour-kit/analytics'
import { segmentPlugin } from './segment-plugin'

export const analytics = createAnalytics({
  plugins: [
    segmentPlugin({
      eventPrefix: 'tourkit_',
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
})
```

Then wrap your layout:

```tsx
// src/app/providers.tsx
'use client'

import { TourKitProvider } from '@tourkit/react'
import { AnalyticsProvider } from '@tourkit/analytics'
import { analytics } from '@/lib/analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider analytics={analytics}>
      <TourKitProvider>
        {children}
      </TourKitProvider>
    </AnalyticsProvider>
  )
}
```

Every tour in your app now sends events to Segment. No per-tour configuration needed.

## Step 4: Verify events in Segment Debugger

Segment's Debugger (Sources > your source > Debugger) shows events in real time. Trigger a tour in your dev environment and watch for `tourkit_tour_started` with the expected properties.

| Tour Kit event | Segment event name | Properties sent |
|---|---|---|
| `tour_started` | `tourkit_tour_started` | tour_id, total_steps |
| `step_viewed` | `tourkit_step_viewed` | tour_id, step_id, step_index, total_steps |
| `step_completed` | `tourkit_step_completed` | tour_id, step_id, step_index, duration_ms |
| `tour_completed` | `tourkit_tour_completed` | tour_id, total_steps, duration_ms |
| `tour_skipped` | `tourkit_tour_skipped` | tour_id, step_index, total_steps |
| `tour_abandoned` | `tourkit_tour_abandoned` | tour_id, step_index, duration_ms |

## Going further

Once events flow through Segment, you can build on the pipeline without touching tour code:

- **Segment Protocols** validates your event schema before data reaches destinations.
- **Segment Journeys** lets you define multi-step user paths for targeted campaigns.
- **Warehouse sync** dumps raw events to BigQuery, Snowflake, or Redshift on a schedule.
- **Swap CDPs later** if Segment's pricing doesn't scale. Tour Kit's plugin interface works identically with RudderStack or Hightouch.

## FAQ

### Does Segment have built-in product tour event tracking?

Segment does not define a standard event schema for product tours. Tour Kit's Segment plugin fills this gap with 6 typed lifecycle events that map to Segment's `track` API.

### How much does Segment cost for tour event tracking?

Segment's free tier includes 1,000 monthly tracked users (MTUs), 2 sources, and unlimited destinations. Tour events don't increase your MTU count. Segment pricing increased roughly 40% in 2025.

### Does adding Segment increase my page load time?

Analytics.js 2.0 loads about 16KB gzipped initially. Combined with Tour Kit's core at under 8KB gzipped, total overhead is roughly 24KB. Events fire asynchronously.

### Can I use Tour Kit's Segment plugin with server-side rendering?

The plugin checks for `window.analytics` before calling any method, so it's SSR-safe. For server-side tracking, use `@segment/analytics-node` directly.

### What if I outgrow Segment's free tier?

Tour Kit's analytics plugin interface is CDP-agnostic. Swap in a RudderStack plugin with the same `track` and `identify` methods, and your tour code stays identical.
