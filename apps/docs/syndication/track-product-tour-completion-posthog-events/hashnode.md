---
title: "Track product tour completion with PostHog events"
slug: "track-product-tour-completion-posthog-events"
canonical: https://usertourkit.com/blog/track-product-tour-completion-posthog-events
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)*

# Track product tour completion with PostHog events

You built a product tour. Users click through it. But how many finish? Does finishing correlate with activation?

PostHog's built-in product tours feature is still in private alpha and only works with their no-code toolbar builder. If you're running a headless tour with Tour Kit or any custom React implementation, you need to wire up your own event tracking. PostHog's `capture()` API makes this straightforward, and the resulting funnels are more flexible than any no-code solution.

This tutorial walks through instrumenting a Tour Kit tour with PostHog events, building a completion funnel, and using cohorts to measure whether tour completers actually activate.

```bash
npm install @tourkit/core @tourkit/react posthog-js
```

> Full article with all code examples, troubleshooting guide, and FAQ: [usertourkit.com/blog/track-product-tour-completion-posthog-events](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)

The key integration point is a `withPostHogTracking()` wrapper that maps Tour Kit's four lifecycle callbacks (`onStart`, `onComplete`, `onSkip`, `onStepChange`) to PostHog `capture()` calls. About 60 lines of TypeScript gives you:

- **5 structured events**: tour started, tour step viewed, tour step completed, tour dismissed, tour completed
- **Step-level funnels**: see exactly where users drop off
- **Activation cohorts**: compare tour completers vs skippers against your activation metric
- **Person properties**: flag users who completed specific tours for targeting

Industry benchmarks put median 5-step tour completion at roughly 34% (Product Fruits research). Launcher-driven tours where users opt in hit around 67%.

The full tutorial covers PostHog provider setup, event schema design, the `withPostHogTracking()` wrapper code, funnel building, cohort creation, and three common troubleshooting issues.

[Read the full tutorial with code examples](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)
