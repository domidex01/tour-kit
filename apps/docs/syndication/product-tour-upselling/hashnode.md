---
title: "How to use product tours for upselling and expansion revenue"
slug: "product-tour-upselling"
canonical: https://usertourkit.com/blog/product-tour-upselling
tags: react, javascript, web-development, saas, onboarding
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-upselling)*

# How to use product tours for upselling and expansion revenue

Most product teams treat onboarding tours and upselling as separate disciplines. Onboarding gets the guided walkthroughs and contextual tooltips. Upselling gets a modal with a pricing table and a "please upgrade" button. The result: onboarding works, and upgrade prompts get dismissed.

There's a better approach. The same guided tour patterns that teach new users can introduce existing users to premium features they haven't discovered yet. As of April 2026, expansion revenue accounts for 40-50% of new ARR at the median SaaS company, up from roughly 30% in 2021. Acquiring a new customer costs 5x more than expanding an existing one. The math is clear: getting more value from current users is the most efficient growth motion available.

## What is product tour upselling?

Product tour upselling is the practice of using guided, multi-step in-app experiences to introduce existing users to higher-tier features, plan upgrades, or add-on products at the moment they're most likely to see the value. Unlike one-off upgrade modals that interrupt the user with a pricing page, upsell tours walk users through the premium feature in context, showing what it does and why it matters to their specific workflow.

The distinction matters. A modal says "upgrade to get Feature X." An upsell tour says "you just completed 50 reports this month; here's how the premium analytics dashboard breaks those numbers down by region, and here's how to set it up." One is a billboard. The other is a guided experience that demonstrates value before asking for money.

## Why NRR is the metric that matters now

Net revenue retention (NRR) has become the single most important SaaS metric in 2026. Companies with 120%+ NRR command 30-50% higher valuation multiples than peers at 100% NRR, even with identical ARR and growth rates. A 10-point NRR increase boosts company valuation by 20-30%.

| NRR range | Valuation multiple | What it means |
|---|---|---|
| 120%+ | 10-12x ARR | Customers grow faster than they churn |
| 100-120% | 6-10x ARR | Expansion roughly offsets churn |
| Below 100% | 4-6x ARR | Revenue is shrinking per cohort |

Usage-based or hybrid pricing achieves 115-130%+ NRR, while flat subscription models only hit 95-105%. Product tours don't change your pricing model, but they do change how many users discover and use premium features, which directly feeds expansion revenue regardless of how you price.

The recommended product investment split for 2026 is 40% expansion features, 30% retention, 30% acquisition. If your product team is spending all its tour-building energy on first-day onboarding, you're under-investing in the 40% that drives the most efficient growth.

## The upsell tour framework

Traditional upselling relies on static prompts — a badge on the nav item, a banner at the top, or a modal when someone clicks a locked feature. These convert at roughly 20-25% on average for growth-stage SaaS.

An upsell tour improves on this by adding context, progression, and timing:

**1. Trigger on behavior, not a timer.** The best upsell moments happen when a user hits a natural boundary: they've reached their plan's usage limit, they've used a feature 10 times and would benefit from the premium version, or they've just completed a workflow that connects to a higher-tier capability.

**2. Show, don't sell.** The tour's job is to demonstrate the premium feature in the user's own context, not to display pricing. Walk them through what the feature does, show sample output using their data, and let them see the value before any upgrade CTA appears.

**3. End with a soft ask.** The final step offers the upgrade, a trial of the premium feature, or a "remind me later" option. No hard gates, no forced decisions.

## Building upsell-aware tours in React

Here's a usage-triggered upsell tour that fires when a user reaches 80% of their plan's report limit:

```tsx
// src/components/UpsellTour.tsx
import { TourProvider } from '@tourkit/react';

const upsellSteps = [
  {
    target: '[data-tour="reports-counter"]',
    title: 'You've created 40 of 50 reports this month',
    content: 'Your team is getting real value from reporting. Here's what Pro reporting adds.',
  },
  {
    target: '[data-tour="analytics-preview"]',
    title: 'Regional breakdowns',
    content: 'Pro analytics splits your report data by region, team, and time period.',
  },
  {
    target: '[data-tour="export-button"]',
    title: 'Scheduled exports',
    content: 'Set reports to auto-export as CSV or PDF every Monday. No manual work.',
  },
  {
    target: '[data-tour="upgrade-cta"]',
    title: 'Try Pro reporting free for 14 days',
    content: 'No credit card required. If it's not useful, you're back on your current plan.',
  },
];

function UsageUpsellTour({ usagePercent }: { usagePercent: number }) {
  if (usagePercent < 0.8) return null;

  return (
    <TourProvider steps={upsellSteps}>
      <ReportsDashboard />
    </TourProvider>
  );
}
```

The tour only renders when the user has hit 80% of their limit. It's a response to the user's own behavior, which means it feels helpful rather than pushy.

## Wiring adoption tracking to upsell triggers

Tour Kit's `@tour-kit/adoption` package tracks which features each user has engaged with. Adoption scores become automated upsell triggers:

```tsx
// src/hooks/useUpsellTrigger.ts
import { useAdoptionScore } from '@tourkit/adoption';
import { useTour } from '@tourkit/react';

function useUpsellTrigger(featureGroup: string, threshold: number) {
  const { score, features } = useAdoptionScore(featureGroup);
  const { startTour } = useTour();

  if (score >= threshold && !features.includes('premium-explored')) {
    startTour('premium-feature-tour');
  }
}
```

This pattern connects the pipeline: feature adoption scoring feeds into upsell tour triggers, which feed into expansion revenue, which feeds into NRR. Each piece is measurable. You can attribute specific tours to specific upgrades.

## Five upsell patterns that work

After studying 15 SaaS products, five patterns consistently outperform static modals:

**1. Feature gating with guided preview** — Show a 2-3 step tour that previews the premium feature before revealing the gate. Grammarly gives 3 free daily uses, then shows an inline upgrade prompt.

**2. Usage threshold triggers** — Trigger at 80-90% of plan limits, not at the hard wall. By 100% users are frustrated. By 80% they're receptive.

**3. Milestone celebrations with upsell** — When a user crosses a usage milestone (100 tasks, 50 reports), trigger a congratulatory tour that naturally leads to premium features. Asana does this well.

**4. Contextual discovery during workflow** — Surface premium feature tooltips between commonly-used free features. The upsell feels like a natural extension of the current task.

**5. Downgrade prevention with usage data** — Canva shows users "You used background removal 47 times this month" when they consider downgrading. Personalized usage stats are far more persuasive than generic benefit lists.

## Avoiding upsell fatigue

- **Frequency caps.** Show an upsell tour at most once every 14 days per feature.
- **Cooldown after dismissal.** If a user dismisses an upsell tour, don't show any upsell tour for 30 days.
- **Respect "not interested."** Offer a permanent dismiss option.
- **Limit concurrent campaigns.** Run one upsell tour at a time.

## Common mistakes

**Showing pricing before value.** The upgrade CTA belongs at the end of the tour, not the beginning.

**Using the same tour for every plan tier.** A Starter plan user needs a different upsell tour than someone on Business. Build plan-aware tour content.

**Not measuring attribution.** Wire tour completion events to your revenue analytics. Tour Kit's analytics package supports event callbacks into Mixpanel, PostHog, or Amplitude.

Full docs and code examples at [usertourkit.com](https://usertourkit.com/)
