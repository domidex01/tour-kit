---
title: "Product tour analytics without SaaS: the BYO stack"
slug: "product-tour-analytics-open-source-byo-stack"
canonical: https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack
tags: react, javascript, web-development, analytics, open-source
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

BYO (build your own) analytics for product tours means routing onboarding event data to analytics infrastructure you own and operate. The tour library emits structured events (tour started, step viewed, tour completed) and a thin plugin translates those events into the format your analytics backend expects. Unlike SaaS platforms that bundle analytics into their proprietary UI, a BYO stack gives you full query access to raw event data, no per-seat costs, and complete data residency control.

## The four open-source stacks

### PostHog — the full replacement

PostHog ships funnels, retention tables, session replay, and feature flags in a single self-hosted deployment. MIT licensed. Free cloud tier: 1 million events/month.

```typescript
import { createAnalytics, posthogPlugin } from '@tourkit/analytics'

export const tourAnalytics = createAnalytics({
  plugins: [
    posthogPlugin({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      apiHost: 'https://your-posthog.example.com',
      eventPrefix: 'tourkit_',
    }),
  ],
})
```

### Plausible — privacy-first, minimal

No cookies, ~1 KB script, GDPR compliance without consent banners. Custom goal events only — no funnels or retention charts.

### Umami — deploy to Vercel, query with SQL

MIT-licensed, custom events since v2, deploys to Vercel with Postgres. Direct database access means tour analytics is just SQL.

### Roll your own — API route + database

A POST endpoint with `navigator.sendBeacon` and a database table. Total control, no dependencies.

## Cost comparison at 10K MAU

| Stack | Monthly | Annual |
|---|---|---|
| Appcues | $249 | $2,988 |
| Chameleon | $279 | $3,348 |
| Pendo | ~$833 | $10,000+ |
| Tour Kit + PostHog cloud | $0 | $0 |
| Tour Kit + self-hosted | ~$40-80 | $480-960 |
| Tour Kit + custom API | $0 | $0 |

## The metrics that matter

- **Tour completion rate** — median 68% under 5 steps, 42% above 7
- **Step drop-off index** — which step loses the most users
- **Median time-on-step** — above 15s often means confusion
- **Tour-to-activation correlation** — the number that actually predicts retention
- **Skip rate** — early vs late skips tell different stories

Full article with all code examples and plugin implementations: [usertourkit.com/blog/product-tour-analytics-open-source-byo-stack](https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack)
