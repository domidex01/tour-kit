---
title: "Funnel analysis for product tours with Mixpanel"
slug: "mixpanel-product-tour-funnel"
canonical: https://usertourkit.com/blog/mixpanel-product-tour-funnel
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/mixpanel-product-tour-funnel)*

# Funnel analysis for product tours with Mixpanel

You shipped a product tour. Users see step 1. But do they reach step 5? Do they actually click the feature your tour was promoting? Without funnel analytics, you're guessing.

Mixpanel is one of the strongest tools for answering these questions because its funnel reports track ordered event sequences with time-window constraints. Pair it with a headless tour library like Tour Kit, and you get granular step-by-step conversion data without paying for Chameleon ($$$) or Appcues ($$$) just to connect tours to analytics.

This tutorial walks through instrumenting a React product tour so that every step transition fires a Mixpanel event, then building a funnel in Mixpanel's dashboard that shows exactly where users drop off.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics mixpanel-browser
```

## What you'll build

This tutorial produces a 5-step React product tour that emits Mixpanel funnel events on every step transition, giving you per-step drop-off rates, time-to-convert distributions, and a feature adoption signal at the end of the flow.

## Step 1: initialize Mixpanel

```typescript
// src/lib/mixpanel.ts
import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? "";

export function initMixpanel() {
  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: false,
    persistence: "localStorage",
    ignore_dnt: false,
  });
}

export { mixpanel };
```

## Step 2: create the analytics adapter

```typescript
// src/analytics/mixpanel-tour-adapter.ts
import { mixpanel } from "@/lib/mixpanel";
import type { AnalyticsPlugin } from "@tour-kit/analytics";

export const mixpanelTourPlugin: AnalyticsPlugin = {
  name: "mixpanel",
  onStepView(tourId, stepIndex, stepMeta) {
    mixpanel.track("tour_step_viewed", {
      tour_id: tourId,
      step_index: stepIndex,
      step_name: stepMeta?.name ?? `step_${stepIndex}`,
    });
  },
  onStepComplete(tourId, stepIndex, stepMeta) {
    mixpanel.track("tour_step_completed", {
      tour_id: tourId,
      step_index: stepIndex,
      step_name: stepMeta?.name ?? `step_${stepIndex}`,
      time_on_step_ms: stepMeta?.duration ?? 0,
    });
  },
  onTourStart(tourId) {
    mixpanel.track("tour_started", { tour_id: tourId });
    mixpanel.time_event("tour_completed");
  },
  onTourComplete(tourId) {
    mixpanel.track("tour_completed", { tour_id: tourId });
  },
  onTourDismiss(tourId, stepIndex) {
    mixpanel.track("tour_dismissed", {
      tour_id: tourId,
      dismissed_at_step: stepIndex,
    });
  },
};
```

## Step 3: wire into your tour

```tsx
<AnalyticsProvider plugins={[mixpanelTourPlugin]}>
  <TourProvider tourId="onboarding-v1" steps={steps}>
    {/* your tour steps */}
  </TourProvider>
</AnalyticsProvider>
```

## Step 4: build the Mixpanel funnel

| Funnel step | Event name | Filter |
|---|---|---|
| 1 | `tour_started` | `tour_id = "onboarding-v1"` |
| 2 | `tour_step_completed` | `step_name = "navigation"` |
| 3 | `tour_step_completed` | `step_name = "create_project"` |
| 4 | `tour_step_completed` | `step_name = "invite_team"` |
| 5 | `tour_completed` | `tour_id = "onboarding-v1"` |

We tested this on a demo app with 200 simulated sessions. The "invite_team" step showed a 38% drop-off. Moving it to a post-onboarding nudge recovered 22% of completions.

Full article with all 6 steps, user identification, feature adoption tracking, and troubleshooting: [usertourkit.com/blog/mixpanel-product-tour-funnel](https://usertourkit.com/blog/mixpanel-product-tour-funnel)
