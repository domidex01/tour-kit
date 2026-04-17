---
title: "Building an onboarding analytics dashboard with PostHog"
slug: "onboarding-analytics-dashboard-posthog"
canonical: https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog)*

# Building an onboarding analytics dashboard with PostHog

You're firing tour events into PostHog. That's the easy part. The hard part is turning those events into a dashboard that tells you something useful: which tours convert, where users bail, and whether finishing a tour predicts anything about retention.

Most PostHog tutorials stop at "call `capture()` and check the events tab." That leaves you with raw event logs and no structure. What you actually need is a purpose-built dashboard with funnels, retention curves, and cohort breakdowns that answer the questions your product team keeps asking every sprint.

This tutorial builds that dashboard from scratch using Tour Kit's `@tour-kit/analytics` package with its PostHog plugin, constructing five dashboard panels covering the onboarding metrics that matter. We tested this setup in a Next.js 15 app tracking three onboarding tours across 30 days of usage data.

**Read the full tutorial with all code examples at [usertourkit.com/blog/onboarding-analytics-dashboard-posthog](https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog)**

## What you'll build

A PostHog dashboard with five panels: tour completion funnel, step-level drop-off chart, time-to-complete distribution, completion-to-activation correlation, and a daily active tours trend line. The whole setup takes about 45 minutes including PostHog configuration.

## Key metrics and benchmarks

| Metric | Good | Needs work |
|---|---|---|
| Tour completion rate | 55-75% | < 40% |
| Worst step drop-off | < 15% | > 25% |
| Median time to complete | 45-90s (5 steps) | < 30s or > 120s |
| Activation lift | > 10% delta | < 5% delta |
| Tour coverage | > 85% | < 60% |

Benchmarks sourced from [Appcues' 2025 product adoption report](https://www.appcues.com/blog/product-adoption-benchmarks) and [Pendo's State of Product-Led Growth data](https://www.pendo.io/resources/the-state-of-product-led-growth/).

## The quick setup

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics posthog-js
```

Tour Kit's `posthogPlugin` maps tour lifecycle events to structured PostHog events automatically. Configure it once and it handles every tour in your app:

```tsx
import { createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics'

const analytics = createAnalytics({
  plugins: [
    posthogPlugin({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      eventPrefix: 'tourkit_',
    }),
  ],
})
```

The full tutorial covers all six steps: plugin setup, custom properties for segmentation, completion funnel, drop-off chart, retention correlation, and automated alerts.

**Full article: [usertourkit.com/blog/onboarding-analytics-dashboard-posthog](https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog)**
