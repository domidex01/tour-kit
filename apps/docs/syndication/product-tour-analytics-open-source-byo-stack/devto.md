---
title: "Stop paying $249/mo for tour analytics — build your own with open-source tools"
published: false
description: "Four open-source analytics stacks that replace SaaS tour analytics. PostHog, Plausible, Umami, or roll your own — with TypeScript plugin examples."
tags: react, opensource, webdev, tutorial
canonical_url: https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack
cover_image: https://usertourkit.com/og-images/product-tour-analytics-open-source-byo-stack.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack)*

# Product tour analytics without SaaS: the BYO stack

Appcues charges $249/month to show tooltips and tell you how many people clicked "Next." Pendo's analytics tier starts even higher. And the data those platforms collect about your users sits on their servers, governed by their retention policies, accessible only through their dashboards.

There's another way. You wire your product tour library to open-source analytics tools you already control, and the resulting pipeline costs nothing beyond the infrastructure you're running anyway. We built Tour Kit's analytics plugin system specifically for this approach: a 2 KB adapter layer that routes tour events to any backend you choose.

This guide walks through four open-source analytics stacks that replace SaaS tour analytics entirely. Each one captures the same metrics (tour completion rate, step drop-off, time-to-complete) without vendor lock-in, per-seat pricing, or third-party data processing agreements.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What is BYO analytics for product tours?

BYO (build your own) analytics for product tours means routing onboarding event data to analytics infrastructure you own and operate, rather than relying on a SaaS vendor's embedded dashboard. The tour library emits structured events (tour started, step viewed, tour completed) and a thin plugin translates those events into the format your analytics backend expects. Unlike SaaS platforms like Appcues or Userpilot that bundle analytics into their proprietary UI, a BYO stack gives you full query access to raw event data, no per-seat costs, and complete data residency control.

## Why SaaS analytics creates problems you shouldn't have

Three issues come up repeatedly when teams rely on SaaS onboarding platforms for analytics.

**Data portability.** When you cancel Appcues, your historical tour analytics go with it. You can export CSVs, sometimes, if your plan includes that feature. But the funnel definitions, cohort filters, and dashboard configurations? Gone.

**Cost scaling.** SaaS analytics pricing scales with monthly tracked users (MTUs) or monthly active users (MAUs). Appcues jumps from $249 to custom enterprise pricing above 2,500 MTUs. Your analytics costs grow linearly with your user base.

**Query limitations.** SaaS dashboards show you the aggregations they decided to build. Want to correlate tour completion with 30-day retention by acquisition channel? That requires exporting data to your own warehouse.

## The four open-source stacks

### Stack 1: PostHog (the full replacement)

PostHog ships funnels, retention tables, session replay, and feature flags in a single self-hosted deployment, covering everything Amplitude and Mixpanel charge for under an MIT license. The free cloud tier covers 1 million events per month.

Tour Kit ships a first-party PostHog plugin:

```typescript
import { createAnalytics } from '@tourkit/analytics'
import { posthogPlugin } from '@tourkit/analytics'

export const tourAnalytics = createAnalytics({
  plugins: [
    posthogPlugin({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      apiHost: 'https://your-posthog.example.com',
      eventPrefix: 'tourkit_',
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
})
```

### Stack 2: Plausible (privacy-first, minimal)

Plausible is the right choice when your analytics requirements are "did users complete the tour?" and your compliance requirements are "no cookies, no consent banners." Writing a Tour Kit plugin takes 20 lines.

### Stack 3: Umami (deploy to Vercel, query with SQL)

Umami is MIT-licensed, supports custom events since v2, and deploys to Vercel with Postgres. Its advantage is direct database access — tour analytics becomes SQL queries against raw event data.

### Stack 4: Roll your own (API route + database)

A POST endpoint, `navigator.sendBeacon` for reliable delivery, and a database table. No third-party scripts at all.

## Cost comparison

| Stack | Monthly (10K MAU) | Annual |
|---|---|---|
| Appcues | $249 | $2,988 |
| Chameleon | $279 | $3,348 |
| Tour Kit + PostHog cloud | $0 | $0 |
| Tour Kit + PostHog self-hosted | ~$40-80 | $480-960 |
| Tour Kit + custom API | $0 | $0 |

## The metrics that matter

- **Tour completion rate** — median 68% for tours under 5 steps, drops to 42% above 7 steps
- **Step drop-off index** — which step loses the most users
- **Median time-on-step** — above 15 seconds often indicates confusion
- **Tour-to-activation correlation** — requires joining tour events with product events
- **Skip rate** — early vs late skips tell different stories

Full article with all code examples, comparison tables, and FAQ: [usertourkit.com/blog/product-tour-analytics-open-source-byo-stack](https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack)
