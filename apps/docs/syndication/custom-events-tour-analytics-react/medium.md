# How to Track What Users Actually Do During Product Tours

*Type-safe custom analytics events for React product tours, without another SDK*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/custom-events-tour-analytics-react)*

---

Product tour libraries tell you who finished step 5. They don't tell you who clicked the upgrade button, watched the demo video, or filled out the feedback form along the way.

That's the gap between lifecycle events (tour started, step viewed, tour completed) and the business questions you actually need answered. According to Pendo's 2025 Product Benchmarks report, only 28% of product tours result in the target feature being used within 7 days. If you can't track what happened *inside* each step, you can't diagnose why.

Tour Kit's `@tourkit/analytics` package (2 KB gzipped) solves this with a `metadata` field on every event and a plugin architecture that routes to any backend. This tutorial shows how to layer typed custom events on top of that foundation.

## The approach

Every `TourEvent` in Tour Kit carries an optional `metadata: Record<string, unknown>` field. The `step_interaction` event type exists specifically for in-step user actions. The pattern is:

1. Define TypeScript interfaces for each interaction type (CTA click, video play, form submit)
2. Create thin helper functions that enforce those types at the call site
3. Build a plugin that transforms and batches events for your backend
4. Call the helpers from inside tour step components

Zero bundle cost. The types compile away and the helpers are 4-8 line wrappers.

## Type safety matters here

Expedia Group's engineering team identified the core problem: "Common components know when an event occurs, but they do not know all the details necessary to satisfy required and optional fields." For product tours, step components know a user interacted, but need tour-level context injected automatically.

A discriminated union catches mismatched metadata at compile time:

```
interface CtaClickMeta {
  interactionType: 'cta_click'
  ctaId: string
  ctaLabel: string
  destination?: string
}
```

Pass `{ interactionType: 'cta_click' }` without `ctaId` and TypeScript stops you before the event ever fires.

## The plugin interface

Tour Kit's `AnalyticsPlugin` has 5 methods (only `track` required). A custom plugin that batches events and uses `navigator.sendBeacon` on page close takes about 40 lines. Every plugin receives every event, so you can run PostHog and GA4 simultaneously without duplication logic.

## Key data point

Each `step_interaction` event payload is roughly 200 bytes. A 5-step tour with 2 custom interactions per step generates about 15 events in under 60 seconds. Batching in groups of 10 means 1-2 network requests per tour completion.

---

Full tutorial with complete code examples, comparison table, and troubleshooting: [usertourkit.com/blog/custom-events-tour-analytics-react](https://usertourkit.com/blog/custom-events-tour-analytics-react)
