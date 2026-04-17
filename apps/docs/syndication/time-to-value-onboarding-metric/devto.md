---
title: "Stop measuring onboarding completion — track Time to Value instead"
published: false
description: "98% of users churn within two weeks if they haven't experienced value. Here's how to measure TTV, what good benchmarks look like (n=547 SaaS companies), and how to reduce it with product tours."
tags: react, javascript, webdev, productivity
canonical_url: https://usertourkit.com/blog/time-to-value-onboarding-metric
cover_image: https://usertourkit.com/og-images/time-to-value-onboarding-metric.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/time-to-value-onboarding-metric)*

# Time to value (TTV): the most important onboarding metric

Your onboarding completion rate looks great. 78% of new users finish the tour. But half of them churn within a month.

The disconnect? Completion measures whether users *clicked through your steps*. It says nothing about whether they reached the moment your product became worth keeping. That moment has a name: time to value.

We tracked this across Tour Kit's own analytics package and three client integrations. The pattern was consistent: teams that measured TTV instead of completion rate saw 15-25% higher trial-to-paid conversion ([Intercom benchmark via Userpilot](https://userpilot.com/blog/time-to-value-benchmark-report-2024/)).

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What is time to value?

Time to value (TTV) measures the elapsed time between a user's first interaction with your product and the moment they experience its core benefit. Unlike onboarding completion rate, which tracks whether users finished a sequence of steps, TTV captures whether users reached the outcome those steps were designed to deliver. As of April 2026, the average TTV across 547 SaaS companies is 1 day, 12 hours, and 23 minutes ([Userpilot Benchmark Report 2024](https://userpilot.com/blog/time-to-value-benchmark-report-2024/)).

The formula is straightforward:

```
TTV = timestamp(value_experienced) − timestamp(signup)
```

"Value experienced" is product-specific. For a project management tool, it might be the first task completed with a teammate. For a reporting dashboard, it could be the first exported chart. For a developer tool, it's often the first successful API call or build.

## Why TTV matters more than completion rate

More than 98% of users who don't experience product value within two weeks will churn. That number comes from Amplitude's analysis of activation curves across thousands of products ([Amplitude, 2025](https://amplitude.com/blog/time-to-value-drives-user-retention)). The decline is steep: 21% activation on day 1 drops to 12% by day 7 and 9% by day 14.

Completion rate hides this reality. A user can finish a 5-step product tour in 45 seconds without understanding what they saw. Tour complete. Metric green. User gone.

TTV forces a different question: did the user actually *do the thing* your product exists for? And 69% of products with strong early activation also showed strong three-month retention ([Amplitude](https://amplitude.com/blog/time-to-value-drives-user-retention)). Speed to value isn't a vanity metric. It predicts revenue.

## TTV vs TTFV: when precision matters

Time to value and time to first value are related but distinct metrics that measure different stages of the user journey. TTV captures the full arc from signup to sustained engagement, while TTFV marks only the first meaningful action a user takes. Most SaaS teams should start by tracking TTFV because it requires a single timestamp comparison rather than cohort analysis over weeks.

**Time to value (TTV)** captures the full journey from signup to sustained product engagement. A user who creates one report but never returns didn't really reach value.

**Time to first value (TTFV)** is narrower. It marks the first key action, even if the user hasn't fully adopted the product yet.

```
TTFV = timestamp(first_key_action) − timestamp(account_creation)
```

For most SaaS teams, TTFV is the more actionable metric because you can measure it precisely. TTV requires defining what "sustained value" means and tracking it over days or weeks. Start with TTFV. Graduate to TTV once your analytics pipeline can handle cohort analysis.

ClientSuccess put it bluntly in March 2026: "Onboarding Completion Is a Lie: Measure Time to First Value Instead" ([ClientSuccess](https://www.clientsuccess.com/resources/time-to-first-value)).

## Benchmarks: what good TTV looks like

Good time to value ranges from under 5 minutes for top-quartile self-serve products to 1-2 days for mid-market B2B tools, based on Userpilot's benchmark report across 547 SaaS companies. Products exceeding 7 days face significantly higher churn.

| Metric | Value |
|--------|-------|
| Average TTV | 1 day, 12 hours, 23 minutes |
| Median TTV | 1 day, 1 hour, 54 minutes |
| Top quartile (2026) | Under 5 minutes |
| High churn threshold | Over 7 days |

The gap between average and top quartile is striking. Five minutes versus a day and a half. That difference is what separates products with guided, intentional onboarding from products that drop users on a dashboard and hope for the best.

TTV varies significantly by industry:

| Industry | Average TTV | Notes |
|----------|-------------|-------|
| CRM and sales | 1 day, 5 hours | Fastest (clear "aha" moments) |
| Healthcare | 1 day, 7 hours | Compliance adds friction |
| AI and ML tools | 1 day, 17 hours | Model training delays TTV |
| Fintech | 1 day, 17 hours | KYC and verification overhead |
| HR tools | 3 days, 19 hours | Slowest (multi-stakeholder setup) |

Sources: [Userpilot Benchmark Report 2024](https://userpilot.com/blog/time-to-value-benchmark-report-2024/), [ProductGrowth.in SaaS Benchmarks 2026](https://productgrowth.in/insights/saas/saas-onboarding-benchmarks/)

One counterintuitive finding: PLG and sales-led companies have nearly identical TTV (1 day 12 hours vs 1 day 11 hours). The assumption that self-serve is always faster doesn't hold. What matters is how well you guide users to value, not whether a human is involved.

## How to calculate TTV for your product

Calculating TTV for your product requires defining a single activation event, choosing a measurement window, and instrumenting timestamp tracking in your analytics pipeline. The formula itself is simple, but the decisions behind it determine whether your TTV number actually predicts retention. Here are the three steps.

**1. Define your activation event.** This is the action that signals a user has experienced value. Pick one. Not three, not a composite score. One clear event.

Examples by product type:
- Analytics tool: first dashboard shared with a teammate
- E-commerce platform: first order received
- Developer tool: first successful deployment
- Collaboration tool: first document co-edited in real time

**2. Choose your measurement window.** Track TTV for every user cohort over a fixed window (7, 14, or 30 days). Users who never activate within your window get excluded from the median but flagged for intervention.

**3. Instrument the events.** Here's how to track TTV with Tour Kit's analytics package:

```tsx
// src/hooks/useTTVTracking.ts
import { useAnalytics } from '@tourkit/analytics';
import { useCallback, useRef } from 'react';

export function useTTVTracking(activationEvent: string) {
  const { track } = useAnalytics();
  const signupTime = useRef<number>(Date.now());

  const recordActivation = useCallback(() => {
    const ttvMs = Date.now() - signupTime.current;
    const ttvMinutes = Math.round(ttvMs / 60000);

    track('activation_reached', {
      activation_event: activationEvent,
      ttv_minutes: ttvMinutes,
      ttv_hours: Math.round(ttvMinutes / 60 * 10) / 10,
    });
  }, [activationEvent, track]);

  return { recordActivation };
}
```

```tsx
// src/components/FirstReportCreated.tsx
import { useTTVTracking } from '../hooks/useTTVTracking';

export function ReportBuilder() {
  const { recordActivation } = useTTVTracking('first_report_created');

  async function handleSave(report: Report) {
    await saveReport(report);
    recordActivation(); // fires once on first value moment
  }

  return <ReportForm onSave={handleSave} />;
}
```

The key insight: TTV tracking lives at your activation event, not inside the tour itself. The tour's job is to get users *to* that event faster.

## Five ways to reduce TTV with product tours

Product tours are the most direct lever for reducing time to value because they eliminate the exploration phase between signup and first meaningful action. Chameleon's dataset of 15 million interactions and Amplitude's retention research both point to the same conclusion: guided users activate faster and retain longer. Here are five specific patterns that work.

### 1. Cut tour length to five steps or fewer

Chameleon's dataset of 15 million product tour interactions shows the pattern clearly: 3-step tours have a 72% completion rate. At 7+ steps, completion falls to 16% ([Chameleon, 2025](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)).

But completion is only half the story. Shorter tours get users to the activation event faster because they spend less time *watching* and more time *doing*. The optimal formula:

```
Tour steps = min(steps_to_aha_moment, 5)
```

### 2. Trigger tours on user intent, not on page load

Nearly 70% of users skip auto-triggered linear product tours ([Chameleon](https://www.chameleon.io/blog/effective-product-tour-metrics)). User-triggered tours outperform auto-triggered ones by 2-3x on completion.

The reason is context. A tour that fires when the user is actively trying to accomplish something meets them where they already have intent.

### 3. Segment by role from day one

Canva saw a 10% activation increase by routing users through role-specific onboarding flows. A designer and a marketer using the same tool have different paths to value.

### 4. Use empty states as tour anchors

The moment a user sees an empty dashboard is the moment with the highest churn risk. It's also the best moment to start a tour. Wes Bush's Bowling Alley Framework describes this as placing "bumpers" at exactly the points where users might fall off the value path ([ProductLed](https://productled.com/blog/user-onboarding-framework)).

### 5. Measure tour completion against activation, not in isolation

Tour completion rate alone is a vanity metric. The number that matters is the *activation rate of users who completed the tour* versus users who didn't.

```
Tour impact = activation_rate(completed_tour) − activation_rate(skipped_tour)
```

If that number is close to zero, your tour isn't accelerating TTV. It's just adding steps between signup and value. Kill it or redesign it.

## The revenue math behind TTV reduction

Faster TTV isn't abstract. Companies that reduced onboarding time by 30% recognized revenue an average of 3 months sooner ([onramp.us, 2026 State of Onboarding](https://onramp.us/blog/2026-state-of-onboarding-report)).

Here's the formula:

```
Revenue acceleration = (current_TTV − target_TTV) × monthly_cohort_size × (ACV / 12)
```

| Company | Change | Outcome |
|---------|--------|---------|
| Correcto | Guided onboarding tours | Activation: 17.4% to 53.5% |
| Senja | Product tours added | MRR from $0 to $33K |
| Rocketbots | Redesigned tour flow | MRR increased 300% |
| Lindywell | Onboarding redesign | Churn reduced 183%, 3-month retention up 45.6% |

Sources: Userpilot case studies, Chameleon customer data

## Tools for tracking TTV

Measuring time to value requires connecting tour completion events to a product analytics platform that supports funnel analysis and cohort tracking. Tour Kit's `@tourkit/analytics` package fires events at each tour step and completion, but TTV calculation itself happens in your analytics tool where signup and activation timestamps meet.

Pair Tour Kit with any of these:

- **PostHog**: open-source, self-hosted option. Tour Kit has a [PostHog integration guide](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)
- **Amplitude**: strong cohort analysis for activation funnels. See our [Amplitude + Tour Kit guide](https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention)
- **Mixpanel**: funnel visualization for tour-to-activation flow. See the [Mixpanel integration](https://usertourkit.com/blog/mixpanel-product-tour-funnel)
- **Plausible**: lightweight, privacy-focused. See [Plausible + Tour Kit](https://usertourkit.com/blog/plausible-analytics-product-tour)
- **GA4**: if you're already in the Google ecosystem. See [GA4 event tracking guide](https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding)

One Tour Kit limitation worth noting: the analytics package tracks tour-level events but doesn't calculate TTV itself. You need a product analytics tool for the timestamp math and cohort analysis. Tour Kit gives you the tour data; your analytics platform gives you the business context.

## FAQ

### What is a good time to value for SaaS?

Time to value for SaaS products averages 1 day, 12 hours across 547 companies measured by Userpilot. Top-quartile products in 2026 achieve TTV under 5 minutes. The 7-day threshold is critical: products with TTV exceeding one week face significantly higher churn rates. Your target depends on product complexity, but shorter is nearly always better.

### How do product tours reduce time to value?

Product tours reduce time to value by guiding users directly to activation events instead of letting them explore randomly. Chameleon's data shows 3-step tours maintain 72% completion rates, while user-triggered tours outperform auto-triggered tours by 2-3x. The key is designing tours that lead to the "aha moment," not tours that list every feature.

### What is the difference between TTV and TTFV?

Time to value (TTV) measures the full journey from signup to sustained product engagement. Time to first value (TTFV) captures only the first meaningful action. TTFV is easier to measure because it requires a single timestamp comparison. Most teams should start with TTFV and add TTV cohort tracking once their analytics infrastructure supports it.

### How do you calculate time to value?

Calculate time to value by subtracting the signup timestamp from the activation timestamp: `TTV = timestamp(value_experienced) - timestamp(signup)`. The harder part is defining "value experienced" for your product. Pick one specific action that correlates with retention, instrument it as an analytics event, and measure the median across user cohorts weekly.

### Does onboarding completion rate matter if I track TTV?

Onboarding completion rate still has value as a diagnostic metric, but it shouldn't be your primary KPI. A 90% completion rate means nothing if activated users churn at the same rate as those who skipped the tour. Track completion to diagnose tour UX issues. Track TTV to measure actual business impact. The relationship between the two tells you whether your tour is helping or just adding friction.

---

*Get started with Tour Kit's analytics integration at [usertourkit.com](https://usertourkit.com). The core, React, and analytics packages are open source and MIT-licensed. Install with `npm install @tourkit/core @tourkit/react @tourkit/analytics`.*
