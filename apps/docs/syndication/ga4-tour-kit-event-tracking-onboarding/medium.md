# Google Analytics 4 + Tour Kit: Event Tracking for Onboarding

## How to wire typed GA4 custom events to your React product tour in 40 lines of TypeScript

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding)*

You shipped a product tour. Users click through it. But do they finish? And does finishing predict whether they stick around?

GA4 doesn't ship a recommended event for product tours. No `tutorial_begin` equivalent covers multi-step onboarding flows with branching logic and skip patterns. You need custom events, and over 60% of GA4 implementations have configuration issues that produce unreliable data (Tatvic Analytics, 2026). The usual approach, scattering `window.gtag()` calls through your tour components, gets messy fast and breaks silently when parameters change.

Tour Kit's analytics package takes a different approach: a plugin interface that maps 6 tour lifecycle events to GA4 custom events automatically. Configure it once, and every tour in your app gets instrumented.

GA4 is installed on 37.9 million websites as of 2026 (SQ Magazine), so odds are good your app already has it loaded.

## What you'll build

A Tour Kit onboarding flow that sends structured GA4 custom events for every tour interaction. Those events feed a GA4 Funnel Exploration showing exactly where users drop off. About 40 lines of TypeScript, 3 files, and zero additional dependencies.

One thing to know upfront: Tour Kit requires React 18.2+ and doesn't have a visual builder. You write tour steps in code.

## The core setup

The plugin wraps `window.gtag()` with typed tour events and prefixes every event name with `tourkit_` by default:

```
import { createAnalytics } from '@tour-kit/analytics'
import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'

export const analytics = createAnalytics({
  plugins: [
    googleAnalyticsPlugin({
      measurementId: 'G-XXXXXXXXXX',
      eventPrefix: 'tourkit_',
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
})
```

This sends 6 GA4 custom events covering the full tour lifecycle: start, step view, step complete, tour complete, skip, and abandon. Each includes structured parameters like tour_id, step_index, and duration_ms.

## GA4 limits worth knowing

GA4 allows 500 unique event names per property. Tour Kit's 6 event names consume about 1% of that budget. But parameter values get silently truncated at 100 characters, and high-cardinality parameters (500+ unique values) degrade report performance.

Best practice: focus on 15-25 meaningful events aligned to business goals.

## The underrated feature: open funnels

GA4's open funnel feature is perfect for product tours. Closed funnels require users to hit step 1 first. Open funnels count users from wherever they join, which matters when 20-30% of users re-enter onboarding mid-flow.

---

*Full tutorial with all 6 steps, provider wiring, DebugView verification, custom metadata, troubleshooting guide, and complete GA4 limits reference table: [usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding](https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding)*

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
