---
title: "Google Analytics 4 + Tour Kit: event tracking for onboarding"
slug: "ga4-tour-kit-event-tracking-onboarding"
canonical: https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding
tags: react, javascript, web-development, google-analytics, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding)*

# Google Analytics 4 + Tour Kit: event tracking for onboarding

You shipped a product tour. Users click through it. But do they finish? And does finishing predict whether they stick around?

GA4 doesn't ship a recommended event for product tours. No `tutorial_begin` equivalent covers multi-step onboarding flows with branching logic and skip patterns. You need custom events, and over 60% of GA4 implementations have configuration issues that produce unreliable data ([Tatvic Analytics, 2026](https://www.tatvic.com/blog/everything-you-need-to-know-about-google-analytics-4-ga4-in-2025/)). The usual approach, scattering `window.gtag()` calls through your tour components, gets messy fast and breaks silently when parameters change.

Tour Kit's `@tour-kit/analytics` package takes a different approach: a plugin interface that maps 6 tour lifecycle events to GA4 custom events automatically. Configure it once, and every tour in your app gets instrumented.

GA4 is installed on 37.9 million websites as of 2026 ([SQ Magazine](https://sqmagazine.co.uk/google-analytics-statistics/)), so odds are good your app already has it loaded. This tutorial shows how to wire them together, build a completion funnel in GA4 Explorations, and dodge the gotchas.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

> Full article with all 6 steps, code examples, GA4 limits reference table, and troubleshooting guide at [usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding](https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding)

## What you'll build

By the end of this tutorial you'll have a Tour Kit onboarding flow that sends structured GA4 custom events for every tour interaction: start, step view, step complete, skip, and finish. About 40 lines of TypeScript, 3 files, and zero additional dependencies beyond what GA4 already loads.

## The key setup: 8 lines of TypeScript

```typescript
// src/lib/analytics.ts
import { createAnalytics } from '@tour-kit/analytics'
import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'

export const analytics = createAnalytics({
  plugins: [
    googleAnalyticsPlugin({
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!,
      eventPrefix: 'tourkit_',
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
})
```

This sends 6 GA4 custom events: `tourkit_tour_started`, `tourkit_step_viewed`, `tourkit_step_completed`, `tourkit_tour_completed`, `tourkit_tour_skipped`, and `tourkit_tour_abandoned`. Each includes structured parameters (tour_id, step_index, duration_ms).

Read the full tutorial for provider wiring, DebugView verification, Funnel Exploration setup, custom metadata, and the complete GA4 limits reference table: [usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding](https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding)
