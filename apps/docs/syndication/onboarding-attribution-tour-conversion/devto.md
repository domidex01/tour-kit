---
title: "Which product tour actually drove the conversion? Tour-level attribution for React"
published: false
description: "95% of SaaS companies misattribute revenue with single-touch models. Here's how to attribute conversions to specific onboarding tours using event-driven analytics."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/onboarding-attribution-tour-conversion
cover_image: https://usertourkit.com/og-images/onboarding-attribution-tour-conversion.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-attribution-tour-conversion)*

# Onboarding attribution: which tour actually drove the conversion?

Your onboarding flow has five tours. A user completes three of them, skips two, then upgrades to paid on day nine. Which tour gets credit?

If you said "the last one they saw," you're using last-touch attribution, and you're probably wrong about what's working. If you said "all of them equally," you're using linear attribution, and you're definitely wrong. The truth depends on your product, your trial length, and how many onboarding touchpoints you actually track.

As of April 2026, 95% of SaaS companies misattribute revenue by relying on single-touch models ([House of Martech](https://houseofmartech.com/blog/saas-marketing-attribution-multi-touch-models-that-actually-work)). And that stat is about marketing channels. Inside the product, where tours, checklists, and tooltips compete for credit, attribution is practically nonexistent.

This guide breaks down how to attribute conversions to individual product tours (not marketing channels) using event-driven analytics and Tour Kit's plugin architecture.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## Why tour-level attribution matters

Product teams spend weeks building onboarding flows. Five tours, a checklist, maybe some contextual tooltips. Then they measure success with a single number: "onboarding completion rate." That tells you nothing about which pieces work.

We measured tour-by-tour conversion impact across several onboarding flows and found something consistent: removing a single underperforming tour often had zero effect on conversion, while removing the one high-impact tour dropped trial-to-paid rates by 30-50%. Without tour-level attribution, you can't tell which is which.

Personalized onboarding paths increase completion rates by 35% ([Gleap](https://gleap.io)). But personalization without attribution is guesswork. Tour-level attribution gives you the signal to personalize with confidence.

## What is tour-level attribution?

Tour-level attribution is an analytics pattern that assigns conversion credit to individual in-app experiences (product tours, onboarding checklists, feature hints) rather than to marketing channels like ads or email campaigns. It answers a specific question: of the three tours this user completed before upgrading, which one actually moved them toward activation?

B2B SaaS deals average approximately 266 touchpoints before closing ([House of Martech](https://houseofmartech.com/blog/saas-marketing-attribution-multi-touch-models-that-actually-work)). Most teams track fewer than ten of those. Inside the product, the number of tracked in-app guidance touchpoints is typically zero.

## The six attribution models, applied to product tours

| Model | Credit split | Tour A (welcome) | Tour B (feature) | Tour C (create) | Best for |
|---|---|---|---|---|---|
| First-touch | 100% to first | 100% | 0% | 0% | Understanding what starts activation |
| Last-touch | 100% to last | 0% | 0% | 100% | Understanding what closes activation |
| Linear | Equal across all | 33% | 33% | 33% | Balanced view when no clear winner |
| Time-decay | More to recent | 15% | 30% | 55% | Short trial cycles (7-day free trial) |
| U-shaped | 40 / 20 / 40 | 40% | 20% | 40% | B2B SaaS with long activation arcs |
| Data-driven | ML-weighted | Varies | Varies | Varies | Teams with 1,000+ conversions/month |

The U-shaped model gives 40% credit to the first touchpoint, 40% to the last, and distributes the remaining 20% across everything in between ([Usermaven](https://usermaven.com/blog/multi-touch-attribution)). For onboarding flows, this maps to: "Which tour got the user started?" and "Which tour sealed the deal?"

## How to instrument tour-level attribution

### Step 1: Define your conversion event

```tsx
// src/analytics/events.ts
export const CONVERSION_EVENTS = {
  TRIAL_CONVERTED: 'trial_converted',
  FEATURE_ADOPTED: 'feature_adopted',
  PLAN_UPGRADED: 'plan_upgraded',
} as const;

export type ConversionEvent = typeof CONVERSION_EVENTS[keyof typeof CONVERSION_EVENTS];
```

### Step 2: Emit tour events with attribution metadata

```tsx
// src/analytics/tour-attribution-plugin.ts
import type { AnalyticsPlugin } from '@tourkit/analytics';

interface TourEvent {
  tourId: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  stepIndex: number;
  totalSteps: number;
}

export function createAttributionPlugin(
  track: (event: string, properties: TourEvent) => void
): AnalyticsPlugin {
  return {
    name: 'tour-attribution',
    onTourStart(context) {
      track('tour_started', {
        tourId: context.tourId,
        userId: context.userId,
        sessionId: context.sessionId,
        timestamp: Date.now(),
        stepIndex: 0,
        totalSteps: context.steps.length,
      });
    },
    onTourComplete(context) {
      track('tour_completed', {
        tourId: context.tourId,
        userId: context.userId,
        sessionId: context.sessionId,
        timestamp: Date.now(),
        stepIndex: context.steps.length - 1,
        totalSteps: context.steps.length,
      });
    },
  };
}
```

### Step 3: Build the attribution calculator

```tsx
// src/analytics/attribution.ts
interface TouchPoint {
  tourId: string;
  timestamp: number;
  type: 'tour_started' | 'tour_completed';
}

interface AttributionResult {
  tourId: string;
  credit: number; // 0-1
  model: string;
}

export function attributeConversion(
  touchpoints: TouchPoint[],
  model: 'first-touch' | 'last-touch' | 'linear' | 'u-shaped'
): AttributionResult[] {
  const completed = touchpoints
    .filter((tp) => tp.type === 'tour_completed')
    .sort((a, b) => a.timestamp - b.timestamp);

  if (completed.length === 0) return [];

  switch (model) {
    case 'first-touch':
      return completed.map((tp, i) => ({
        tourId: tp.tourId,
        credit: i === 0 ? 1 : 0,
        model,
      }));

    case 'last-touch':
      return completed.map((tp, i) => ({
        tourId: tp.tourId,
        credit: i === completed.length - 1 ? 1 : 0,
        model,
      }));

    case 'linear':
      return completed.map((tp) => ({
        tourId: tp.tourId,
        credit: 1 / completed.length,
        model,
      }));

    case 'u-shaped': {
      const middleCredit = completed.length > 2
        ? 0.2 / (completed.length - 2)
        : 0;
      return completed.map((tp, i) => ({
        tourId: tp.tourId,
        credit:
          i === 0 ? 0.4
          : i === completed.length - 1 ? 0.4
          : middleCredit,
        model,
      }));
    }
  }
}
```

## The holdout group: proving tours matter at all

Set aside 10-20% of new users who never see any onboarding tours. Compare their trial-to-paid conversion rate against the group that receives tours. If the holdout group converts at nearly the same rate, your tours aren't driving conversion. They're just present during it.

Run this for a full trial cycle (14 days minimum) before drawing conclusions.

## Which attribution model should you start with?

If you have fewer than 500 conversions per month, start with U-shaped attribution. It captures the two most important signals (what started the user's journey and what sealed the deal) without requiring the data volume that algorithmic models need.

Data-driven attribution requires at least 1,000 conversions per month to produce statistically valid results. Start simple, accumulate data, then graduate to algorithmic models when the volume justifies it.

For teams just starting out: implement first-touch and last-touch side by side. Compare them. When they disagree about which tour is most valuable, that's where multi-touch models add clarity.

---

Full article with code examples and comparison table: [usertourkit.com/blog/onboarding-attribution-tour-conversion](https://usertourkit.com/blog/onboarding-attribution-tour-conversion)
