---
title: "Build an onboarding analytics dashboard with PostHog (5 panels, 45 minutes)"
published: false
description: "Turn raw tour events into a PostHog dashboard with completion funnels, step drop-off charts, and activation correlation. Uses Tour Kit's analytics plugin for zero-config event instrumentation."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog
cover_image: https://usertourkit.com/og-images/onboarding-analytics-dashboard-posthog.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog)*

# Building an onboarding analytics dashboard with PostHog

You're firing tour events into PostHog. That's the easy part. The hard part is turning those events into a dashboard that tells you something useful: which tours convert, where users bail, and whether finishing a tour predicts anything about retention.

Most PostHog tutorials stop at "call `capture()` and check the events tab." That leaves you with raw event logs and no structure. What you actually need is a purpose-built dashboard with funnels, retention curves, and cohort breakdowns that answer the questions your product team keeps asking every sprint.

This tutorial builds that dashboard from scratch. We'll use Tour Kit's `@tour-kit/analytics` package with its PostHog plugin to instrument events, then construct five PostHog dashboard panels covering the onboarding metrics that matter. We tested this setup in a Next.js 15 app tracking three onboarding tours across 30 days of usage data.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics posthog-js
```

## What you'll build

A PostHog dashboard with five panels that cover every onboarding metric your team needs: tour completion funnel, step-level drop-off chart, time-to-complete distribution, completion-to-activation correlation, and a daily active tours trend line. Tour Kit's analytics plugin handles event instrumentation automatically, so you don't need manual `capture()` calls scattered through your components. The dashboard updates in real time as users interact with your tours. The whole setup takes about 45 minutes including PostHog configuration.

If you haven't set up basic PostHog event tracking yet, start with [tracking tour completion with PostHog events](https://usertourkit.com/blog/track-product-tour-completion-posthog-events) first. That article covers the fundamentals. This one builds on top of it.

## Prerequisites

- React 18.2+ or React 19
- A PostHog account with at least 7 days of tour event data
- Tour Kit installed: `@tourkit/core`, `@tourkit/react`, `@tourkit/analytics`
- `posthog-js` v1.130+ installed
- Basic familiarity with PostHog insights and dashboards

## Step 1: Wire up the analytics plugin

Tour Kit's `@tour-kit/analytics` package ships a `posthogPlugin` that maps tour lifecycle events to structured PostHog events automatically, replacing the need to call `capture()` in every tour callback. Every `tour_started`, `step_viewed`, `step_completed`, `tour_completed`, and `tour_skipped` event gets forwarded with consistent properties: tour ID, step index, duration, and session metadata.

This replaces the manual `capture()` approach. Instead of wiring individual callbacks per tour, you configure the plugin once and it handles every tour in your app.

```tsx
// src/providers/analytics-provider.tsx
'use client'

import { AnalyticsProvider, createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics'
import type { ReactNode } from 'react'

const analytics = createAnalytics({
  plugins: [
    posthogPlugin({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      eventPrefix: 'tourkit_',
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
})

export function OnboardingAnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <AnalyticsProvider analytics={analytics}>
      {children}
    </AnalyticsProvider>
  )
}
```

Wrap your layout with this provider above your tour components. The `eventPrefix` ensures all Tour Kit events show up in PostHog prefixed with `tourkit_` so they're easy to filter.

```tsx
// src/app/layout.tsx
import { OnboardingAnalyticsProvider } from '@/providers/analytics-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OnboardingAnalyticsProvider>
          {children}
        </OnboardingAnalyticsProvider>
      </body>
    </html>
  )
}
```

After this step, every tour interaction fires a structured PostHog event. Open your PostHog events tab and you should see `tourkit_tour_started`, `tourkit_step_viewed`, and related events flowing in.

## Step 2: Add custom properties for dashboard segmentation

The default event properties that Tour Kit sends (tour ID, step index, duration) are enough for basic funnels, but a useful onboarding analytics dashboard needs segmentation by user role, signup cohort, or plan tier to surface actionable patterns. Tour Kit's analytics config supports `globalProperties` and `userProperties` that get attached to every event automatically.

```tsx
// src/providers/analytics-provider.tsx
import { useAuth } from '@/hooks/use-auth'

export function OnboardingAnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const analytics = createAnalytics({
    plugins: [
      posthogPlugin({
        apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
        eventPrefix: 'tourkit_',
      }),
    ],
    userId: user?.id,
    userProperties: {
      plan: user?.plan ?? 'free',
      role: user?.role ?? 'member',
      signup_date: user?.createdAt,
    },
    globalProperties: {
      app_version: process.env.NEXT_PUBLIC_APP_VERSION,
    },
  })

  return (
    <AnalyticsProvider analytics={analytics}>
      {children}
    </AnalyticsProvider>
  )
}
```

Now every PostHog event carries `plan`, `role`, and `signup_date` as person properties. You can break down any dashboard panel by these dimensions later.

One gotcha we hit: if you're using PostHog's `identify()` elsewhere in your app, make sure the `userId` you pass to Tour Kit's analytics matches the distinct ID PostHog already knows. Mismatched IDs create duplicate person profiles.

## Step 3: Build the completion funnel panel

The completion funnel is the most important panel in any onboarding analytics dashboard because it shows you the exact percentage of users who progress through each stage of your tour, from first impression to final step. Open PostHog and create a new dashboard named "Onboarding Analytics." You'll add five panels to it over the next three steps.

The first panel is a funnel. Click "New insight," select "Funnels," and configure these steps:

| Funnel step | Event name | Filter |
|---|---|---|
| 1. Tour started | `tourkit_tour_started` | tour_id = "onboarding-main" |
| 2. Reached midpoint | `tourkit_step_viewed` | step_index = 2 (of 5) |
| 3. Reached final step | `tourkit_step_viewed` | step_index = 4 |
| 4. Tour completed | `tourkit_tour_completed` | tour_id = "onboarding-main" |

Set the funnel window to 30 minutes and the conversion mode to "ordered." This matters because users sometimes revisit steps; without the ordered constraint, PostHog counts any occurrence regardless of sequence.

A healthy onboarding funnel converts between 55% and 75% from start to completion ([Appcues 2025 Product Adoption Benchmarks](https://www.appcues.com/blog/product-adoption-benchmarks)). If you're below 40%, the problem is usually step 2 or 3, the middle of the tour where engagement drops. If you're above 80%, your tour might be too short to teach anything useful.

## Step 4: Create the step-level drop-off chart

While the funnel shows overall conversion shape, the step-level drop-off chart pinpoints exactly which step in your onboarding tour loses the most users. Create a new insight, select "Trends," and add `tourkit_step_viewed` as the event with a breakdown by `step_index`.

Configure it as a bar chart with "Total count" as the aggregation. Each bar represents how many times a specific step was viewed. The drop between consecutive bars is your per-step attrition rate.

```
Step 0: 1,240 views   (100%)
Step 1: 1,105 views   (89.1%)
Step 2:   842 views   (67.9%)  ← biggest drop
Step 3:   798 views   (64.4%)
Step 4:   756 views   (61.0%)
```

If one step shows a disproportionate drop (more than 15% between adjacent steps), something about that step is off. We've found three common causes. The tooltip covers the element the user needs to interact with. The step text is too long. Or the highlighted element hasn't loaded yet because of a lazy-loaded component.

## Step 5: Add time-to-complete distribution and retention

**Time-to-complete distribution.** Create a Trends insight for `tourkit_tour_completed` and set the Y-axis to "Property value, Average" on the `duration_ms` property. Break down by `tour_id` to compare tours.

A well-designed 5-step tour completes in 45 to 90 seconds. Under 30 seconds means users are clicking through without reading. Over 120 seconds means steps are too complex or the tour is too long. We measured this across three onboarding tours in our test app, and the tour with the highest completion rate averaged 62 seconds.

**Completion-to-activation correlation.** This is the panel that answers whether your tours actually work. Create a new insight, select "Retention," and configure:
- Target event: `tourkit_tour_completed` (tour_id = "onboarding-main")
- Return event: your activation event (e.g., `feature_first_used` or `subscription_started`)
- Period: Week
- Timeframe: Last 12 weeks

Compare this retention curve against users who triggered `tourkit_tour_skipped` or `tourkit_tour_abandoned`. If tour completers don't activate at a meaningfully higher rate (we'd call 10%+ delta meaningful), the tour content itself needs rethinking, not just the UX.

## Step 6: Set up alerts for metric drops

PostHog supports alerts on any saved insight. Configure these two:

1. **Completion rate alert:** On your funnel insight, set an alert when the overall conversion rate drops below 50% on a rolling 7-day basis.
2. **Volume alert:** On the `tourkit_tour_started` trend, alert when daily volume drops below 50% of the 30-day average. This catches cases where tour targeting breaks silently after a deploy.

Both alerts fire to Slack or email. The volume alert is the more useful one. We've seen deploys accidentally remove tour mounting points without anyone noticing for days.

## The five metrics that matter

After running this dashboard for a month, we narrowed down to five numbers worth tracking weekly:

| Metric | Formula | Good | Needs work |
|---|---|---|---|
| Tour completion rate | completed / started | 55-75% | < 40% |
| Worst step drop-off | max single-step attrition | < 15% | > 25% |
| Median time to complete | P50 of duration_ms | 45-90s (5 steps) | < 30s or > 120s |
| Activation lift | completers activation% - skippers activation% | > 10% delta | < 5% delta |
| Tour coverage | users who saw tour / new signups | > 85% | < 60% |

These benchmarks come from a combination of [Appcues' 2025 product adoption report](https://www.appcues.com/blog/product-adoption-benchmarks), [Pendo's State of Product-Led Growth data](https://www.pendo.io/resources/the-state-of-product-led-growth/), and our own measurements across Tour Kit test apps.

## Common issues and troubleshooting

### "Events appear in PostHog but properties are missing"

This happens when the analytics provider renders before the PostHog plugin finishes initializing. The `posthogPlugin` loads `posthog-js` dynamically via `import()`, which is async. If a tour starts during that initialization window, events queue but some properties may not attach.

Fix: ensure your tour doesn't auto-start on mount. Gate it behind a user action:

```tsx
// src/components/onboarding-tour.tsx
import { useTour } from '@tour-kit/react'

export function OnboardingTour() {
  const { start } = useTour({ tourId: 'onboarding-main' })

  return (
    <button onClick={() => start()}>
      Start tour
    </button>
  )
}
```

### "Funnel conversion shows 0% between steps"

Check that your funnel events use exact string matching on `tour_id`. PostHog is case-sensitive, so `"onboarding-main"` and `"Onboarding-Main"` are treated as different events. Also verify the funnel window is wide enough. A 5-minute window works for a 5-step tour, but if users navigate between pages mid-tour, you need 30 minutes minimum.

## Limitations and honest assessment

Tour Kit doesn't have a pre-built analytics dashboard component. You're building the PostHog dashboard manually, which gives you full flexibility but requires PostHog familiarity. If your team isn't already using PostHog, the setup has two learning curves.

PostHog's free tier covers 1 million events per month ([PostHog pricing, April 2026](https://posthog.com/pricing)). A moderately active app sending 6 events per tour session across 10,000 monthly active users generates about 60,000 events, well within the free tier.

SaaS alternatives like Appcues and Userpilot include built-in analytics dashboards with zero configuration. If you need a dashboard today and don't want to build one, those are legitimate options. The tradeoff: their dashboards only show data from tours built in their platform, you pay per monthly active user ($249+/month at scale), and you don't own the raw event data. With PostHog + Tour Kit, you own everything, but you build everything too.

## FAQ

### Does PostHog charge extra for dashboard panels?

PostHog dashboards and insights are free on all plans, including the free tier. You only pay based on event volume. As of April 2026, the first 1 million events per month are free, then $0.00031 per event after that. Five dashboard panels with the same underlying events don't multiply your event count.

### Can I use this dashboard setup with Mixpanel or Amplitude instead?

Tour Kit's analytics package ships plugins for both Mixpanel and Amplitude alongside PostHog. The event structure is identical across all three: `tour_started`, `step_viewed`, `tour_completed` with the same properties. The dashboard configuration is tool-specific, but the instrumentation code works unchanged. Swap `posthogPlugin` for `mixpanelPlugin` or `amplitudePlugin`.

### How many events does a typical onboarding tour generate per user?

A 5-step tour generates 7 events minimum: 1 `tour_started`, 5 `step_viewed`, and 1 `tour_completed` (or `tour_skipped`/`tour_abandoned`). If you also track `step_completed` for each step, that doubles to 12 events per tour per user. For 10,000 monthly active users running one tour each, that's 70,000 to 120,000 events per month.

### What's a good sample size before trusting the dashboard numbers?

Wait for at least 100 completed funnel passes before drawing conclusions from your onboarding analytics dashboard. Below that threshold, a single power user or bot can skew your completion rate by several percentage points.

### Does Tour Kit support server-side analytics for SSR apps?

Tour Kit's analytics runs client-side because tour interactions happen in the browser. For SSR frameworks like Next.js, the `posthogPlugin` guards against server execution with a `typeof window` check. Server-side tour state (for example, "user has completed tour X") should be tracked separately through your backend, not through the client analytics pipeline.
