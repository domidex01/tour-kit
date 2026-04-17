---
title: "I tested the analytics in Appcues, Userpilot, and Pendo — here's what each one actually tracks"
published: false
description: "We spent two weeks comparing the analytics dashboards of three major onboarding tools. Pendo tracks 40+ metrics automatically. Appcues only tracks what happens inside its own flows. Here's the full breakdown."
tags: react, javascript, webdev, productivity
canonical_url: https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track
cover_image: https://usertourkit.com/og-images/metrics-appcues-userpilot-pendo-track.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track)*

# The metrics that Appcues, Userpilot, and Pendo track (and what's missing)

Every onboarding platform promises "powerful analytics." But what does that actually mean once you open the dashboard?

We spent two weeks testing the analytics capabilities of Appcues, Userpilot, and Pendo across real onboarding flows. The gap between marketing claims and what you can actually measure is wider than you'd expect. Pendo tracks 40+ behavioral metrics out of the box. Appcues tracks exactly what happens inside Appcues-built flows, and nothing else. Userpilot sits somewhere in between, with solid funnel tools that occasionally freeze under load.

This guide breaks down what each tool actually measures, where the data lives, and which metrics none of them track at all.

## What is an onboarding tool analytics comparison?

An onboarding tool analytics comparison evaluates the specific metrics, dashboards, and data capabilities that each platform provides for measuring user onboarding outcomes. Unlike feature comparisons that focus on tooltip styling or checklist templates, an analytics comparison examines what data each tool captures, how it stores that data, what queries you can run, and which business-critical metrics fall outside its tracking scope entirely.

Most vendor comparison pages skip analytics depth. They'll list "analytics included" as a checkbox without specifying whether that means basic flow completion rates (Appcues) or full retroactive behavioral analysis (Pendo). The gap matters because the analytics you can access directly determines which onboarding questions you can answer.

## Why onboarding analytics matter more than flow completion

The average SaaS activation rate sits at 37.5% according to the ProductLed Benchmark Report. Improving that number requires diagnosing where users stall, not just confirming they finished your tooltip sequence. Teams that only track flow completion miss the 62.5% of users who never activate, because those users often don't encounter the onboarding flow at all.

Onboarding analytics should answer three questions: did users see the guidance, did they take the desired action, and did that action lead to lasting engagement? Appcues answers the first. Userpilot answers the first two. Pendo gets closest to all three. None of them close the loop to revenue.

## What metrics does Appcues actually track?

Appcues analytics are scoped entirely to flows you build inside the Appcues editor. As of April 2026, the platform tracks flow-level completion rates, individual step progression, button clicks within flows, and NPS/survey response aggregates. That's roughly where it ends.

There's no funnel builder. No path analysis. No session replay. No retroactive analytics. If you didn't tag an event before launching a flow, you can't go back and query it later.

For teams that only care about "did the user finish this tooltip sequence," Appcues is fine. But if you need to answer "what did the user do after the tour ended," you're writing Segment integrations.

### What Appcues measures well

- Flow completion and drop-off per step
- NPS response distribution and trends
- Checklist task completion rates
- Goal tracking tied to flow exposure

### What Appcues doesn't measure

- Page-level or feature-level engagement outside flows
- User paths before or after onboarding
- Session duration or frequency metrics
- Retroactive event analysis
- Cohort comparison across time periods

## What metrics does Userpilot actually track?

Userpilot offers a broader analytics surface than Appcues, positioning itself as a product analytics tool that also does onboarding. As of April 2026, it includes funnel analysis, cohort breakdowns, path analysis, session replay, and four pre-built dashboards (Product Usage, New Users, Power Users, Company Insights).

The funnel builder lets you define multi-step conversion sequences and compare them across user segments. Cohort analysis tracks retention by signup week or first-touch event. Session replay shows exactly what users clicked, scrolled, and ignored.

In practice, the experience has rough edges. Multiple G2 reviewers report the analytics interface "becomes unresponsive when filtering large datasets" and describe the dashboard organization as "confusing with reports scattered across different sections."

### What Userpilot measures well

- Multi-step funnel conversion with segment comparison
- Weekly/monthly cohort retention curves
- Feature adoption rates by user segment
- Session replay with event timeline overlay
- NPS, CSAT, and CES scoring with trend tracking

### What Userpilot doesn't measure

- Cross-product or cross-domain analytics (single-app scope)
- Revenue attribution tied to onboarding events
- Acquisition-channel correlation with activation
- Real-time data (processing delays vary by plan)

## What metrics does Pendo actually track?

Pendo is the analytics heavyweight of the three. Its autocapture technology records every click, page view, and feature interaction without manual tagging. As of April 2026, Pendo offers path analysis, funnel analysis, cohort segmentation, session replay, a composite Product Engagement Score, and AI-powered Insights that surface behavioral anomalies.

Retroactive analytics is the real differentiator. Because Pendo captures everything by default, you can define a new metric today and query it against six months of historical data. Neither Appcues nor Userpilot can do this.

The tradeoffs are cost and accuracy. According to Vendr's 2025 SaaS pricing data, Pendo's median annual contract sits at $48,400, roughly 3-4x what Appcues or Userpilot cost for similar MAU counts.

### What Pendo measures well

- Autocaptured click, page, and feature events (retroactive)
- Product Engagement Score (composite of breadth, depth, frequency, stickiness)
- Path analysis showing navigation sequences
- Friction detection: rage clicks, dead clicks, error clicks
- AI Insights flagging unusual behavior patterns

### What Pendo doesn't measure

- Real-time behavioral data (hourly refresh cycle)
- Cross-product analytics without Pendo on every product
- Revenue or billing events (no native payment integration)
- Referral or viral loop metrics

## The full comparison table

| Analytics capability | Appcues | Userpilot | Pendo |
|---|---|---|---|
| Flow/guide completion tracking | Yes | Yes | Yes |
| Step-level drop-off analysis | Yes | Yes | Yes |
| Funnel builder | No | Yes | Yes |
| Path analysis | No | Yes | Yes |
| Cohort analysis | No | Yes | Yes |
| Session replay | No | Yes | Yes (add-on) |
| Retroactive analytics | No | No | Yes |
| Autocapture (no-code events) | No | Partial | Yes |
| NPS/CSAT/CES scoring | NPS only | All three | NPS + custom |
| Feature adoption tracking | No | Yes | Yes |
| Product Engagement Score | No | No | Yes |
| AI-powered insights | No | No | Yes |
| Real-time data | Near real-time | Delayed | Hourly refresh |
| Custom dashboards | Limited | 4 pre-built | Fully custom |
| Data export / warehouse sync | Via integrations | CSV + API | Full data sync |

## The metrics none of them track

After testing all three platforms across real onboarding flows, we identified six metric categories that none of them measure:

1. **Survey fatigue accumulation** - none track cumulative prompt fatigue across a user's lifecycle
2. **Scheduling-aware delivery analytics** - no correlation between delivery timing and engagement outcomes
3. **Cross-package metric correlation** - siloed architectures prevent correlating checklist vs announcement vs tour engagement
4. **HEART framework metrics** - none natively map to Google's HEART dimensions
5. **Complete AARRR pirate metrics** - Referral and Revenue are invisible in all three
6. **Developer-facing performance metrics** - none report their own bundle size impact or effect on Core Web Vitals

## How to build the analytics layer these tools miss

When your onboarding tool analytics comparison reveals gaps, you can own the analytics layer directly in your codebase:

```tsx
// src/analytics/onboarding-metrics.ts
import { TourAnalytics } from '@tourkit/analytics';
import { posthog } from 'posthog-js';

const analytics = new TourAnalytics({
  onStepView: (event) => {
    posthog.capture('tour_step_viewed', {
      tourId: event.tourId,
      stepIndex: event.stepIndex,
      timestamp: event.timestamp,
    });
  },
  onTourComplete: (event) => {
    posthog.capture('tour_completed', {
      tourId: event.tourId,
      totalSteps: event.totalSteps,
      completionTime: event.duration,
    });
  },
});
```

The difference: you own the event schema. When your PM asks "how does tour completion correlate with 30-day retention," you can answer that question in PostHog without begging a vendor to add the feature.

Disclosure: we built [User Tour Kit](https://usertourkit.com/), so take this with appropriate skepticism. Tour Kit doesn't have a visual editor, requires React 18+, and assumes your team can write TypeScript.

Full article with comparison table and code examples: [usertourkit.com/blog/metrics-appcues-userpilot-pendo-track](https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track)
