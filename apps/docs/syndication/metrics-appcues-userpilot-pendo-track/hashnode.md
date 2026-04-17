---
title: "The metrics that Appcues, Userpilot, and Pendo track (and what's missing)"
slug: "metrics-appcues-userpilot-pendo-track"
canonical: https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track)*

# The metrics that Appcues, Userpilot, and Pendo track (and what's missing)

Every onboarding platform promises "powerful analytics." But what does that actually mean once you open the dashboard?

We spent two weeks testing the analytics capabilities of Appcues, Userpilot, and Pendo across real onboarding flows. Pendo tracks 40+ behavioral metrics out of the box. Appcues tracks exactly what happens inside Appcues-built flows, and nothing else. Userpilot sits somewhere in between.

This guide breaks down what each tool actually measures, where the data lives, and which metrics none of them track at all.

## Quick summary

- **Appcues**: Flow-scoped analytics only. No funnels, no path analysis, no session replay, no retroactive data. Good for checking if users finished your tooltip sequence.
- **Userpilot**: Mid-range analytics with funnels, cohorts, path analysis, session replay. Dashboard UX gets rough under load.
- **Pendo**: Full behavioral analytics with autocapture and retroactive querying. Median annual cost: $48,400 (Vendr data).

## The full comparison table

| Capability | Appcues | Userpilot | Pendo |
|---|---|---|---|
| Funnel builder | No | Yes | Yes |
| Path analysis | No | Yes | Yes |
| Session replay | No | Yes | Yes (add-on) |
| Retroactive analytics | No | No | Yes |
| Autocapture | No | Partial | Yes |
| Product Engagement Score | No | No | Yes |
| AI-powered insights | No | No | Yes |
| Real-time data | Near real-time | Delayed | Hourly refresh |

## What none of them track

We found six metric categories missing from all three:

1. **Survey fatigue accumulation** across a user's lifecycle
2. **Scheduling-aware delivery** correlating timing with engagement
3. **Cross-mechanism correlation** (checklist vs announcement vs tour)
4. **HEART framework** dimensions natively
5. **Complete AARRR** (Referral and Revenue are invisible)
6. **Developer performance metrics** (bundle size, Core Web Vitals impact)

## Code-owned alternative

```tsx
import { TourAnalytics } from '@tourkit/analytics';
import { posthog } from 'posthog-js';

const analytics = new TourAnalytics({
  onTourComplete: (event) => {
    posthog.capture('tour_completed', {
      tourId: event.tourId,
      completionTime: event.duration,
    });
  },
});
```

You own the event schema. You decide what gets tracked. Under 2KB gzipped vs 150-350KB for SaaS tools.

Full article with detailed per-tool breakdowns: [usertourkit.com/blog/metrics-appcues-userpilot-pendo-track](https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track)
