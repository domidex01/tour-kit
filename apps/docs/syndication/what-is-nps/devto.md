---
title: "NPS for developers: what it is, how to calculate it, and when to trigger it in-app"
published: false
description: "Net Promoter Score explained from a developer's perspective. Includes the scoring formula, SaaS benchmarks (+36 average), and a React code example for collecting NPS after onboarding tours."
tags: react, webdev, tutorial, beginners
canonical_url: https://usertourkit.com/blog/what-is-nps
cover_image: https://usertourkit.com/og-images/what-is-nps.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-nps)*

# What is Net Promoter Score (NPS)? Measuring onboarding satisfaction

Net Promoter Score is a single-question survey metric that measures how likely someone is to recommend your product. Ask users to rate from 0 to 10, group them into three buckets, subtract the unhappy percentage from the happy one. You get a number between -100 and +100.

Fred Reichheld introduced NPS in a 2003 Harvard Business Review article titled "The One Number You Need to Grow." It remains the most recognized loyalty metric in SaaS, though its dominance is fading. As of 2025, only 23% of enterprise CX leaders still treat NPS as their primary metric ([CMSWire](https://www.cmswire.com/customer-experience/why-nps-became-customer-experiences-favorite-punching-bag/)).

For developers building onboarding flows, NPS is the quickest signal that your tour actually helped.

```bash
npm install @tourkit/core @tourkit/react @tourkit/surveys
```

## How NPS scoring works

NPS divides respondents into three groups based on their 0-10 rating. Promoters score 9 or 10 and actively recommend your product. Passives land on 7 or 8, satisfied but unenthusiastic. Detractors score 0 through 6.

The formula:

```
NPS = (% Promoters) - (% Detractors)
```

Say 100 users respond: 60 Promoters, 25 Passives, 15 Detractors. Your NPS is 60 - 15 = **+45**. Passives count toward the total but don't affect the calculation directly. That's a quirk worth noting: the largest segment often gets ignored.

| Group | Score range | What it means | Action |
|-------|-----------|---------------|--------|
| Promoter | 9-10 | Loyal, will recommend | Ask for referrals, case studies |
| Passive | 7-8 | Satisfied but switchable | Identify what's missing from their experience |
| Detractor | 0-6 | Unhappy, may churn | Follow up within 48 hours, fix blockers |

## NPS benchmarks for SaaS

Knowing your score means nothing without context. The average SaaS NPS is +36, according to [CustomerGauge's 2025 benchmark report](https://customergauge.com/benchmarks/blog/nps-saas-net-promoter-score-benchmarks). B2B SaaS specifically averages +29, while B2C software sits higher at +47.

A few reference points: Zoom scores +72, Snowflake +71, Slack +55, Salesforce +20. Only about 3% of SaaS companies hit +70 or above.

What counts as "good" depends on your segment:
- **Below 0:** Something is broken. Investigate immediately.
- **0 to 30:** Not unusual for early-stage products. Room to grow.
- **30 to 50:** At or above the SaaS average.
- **50+:** Strong loyalty. Your onboarding is working.

## NPS examples in practice

A B2B dashboard tool runs a 5-step onboarding tour, then triggers an NPS survey 3 sessions later. Promoters (9-10) get invited to a case study. Detractors (0-6) receive a follow-up asking what went wrong. The team discovers that users who skip step 3 score 20 points lower on average, so they redesign that step.

An e-commerce SaaS compares two tour variants over 4 weeks. Version A (linear walkthrough) averages +38. Version B (contextual tooltips) averages +54. The 16-point gap is a concrete signal, not a gut feeling.

## How to collect NPS after onboarding

The biggest mistake with NPS is bad timing. Asking during a product tour interrupts the flow. Asking three months later measures something other than onboarding quality.

In-app NPS surveys get 20-40% response rates versus 5-15% for email ([Refiner.io](https://refiner.io/blog/in-app-nps/)). The difference is context: users responding inside your app have a fresh opinion.

Trigger the survey after your onboarding tour completes, not during it. Wait for at least 3 sessions. And never ask more than once every 60 days.

```tsx
// src/components/PostTourNPS.tsx
import { useSurvey } from '@tourkit/surveys';

export function PostTourNPS() {
  const { show, response } = useSurvey({
    type: 'nps',
    question: 'How likely are you to recommend this product?',
    followUp: 'What could we improve?',
    throttle: { minInterval: '60d' },
  });

  // Trigger after onboarding tour completes
  // show() is called from your tour's onComplete callback

  return null; // Renders via portal when show() is called
}
```

One question plus one optional follow-up. That's enough signal without annoying anyone.

## Why NPS matters for product tours

NPS measured right after onboarding tells you whether your tour helped users reach their first "aha" moment. A confusing tour shows up as a low score within days, not months.

But NPS isn't a silver bullet. The 0-6 detractor range groups someone mildly disappointed (a 6) with someone who hates the product (a 0). Cultural norms affect scores by 15-20 points across regions ([Qualtrics XM Institute](https://www.qualtrics.com/articles/customer-experience/net-promoter-score/)). And Passives, often your biggest segment, vanish from the math entirely.

Use NPS as a directional signal alongside completion rates and time-to-value, not the single source of truth.

---

*Sources: [Bain & Company NPS methodology](https://www.netpromotersystem.com/about/measuring-your-net-promoter-score/), [CustomerGauge SaaS benchmarks 2025](https://customergauge.com/benchmarks/blog/nps-saas-net-promoter-score-benchmarks), [Refiner.io in-app NPS guide](https://refiner.io/blog/in-app-nps/), [Qualtrics NPS methodology](https://www.qualtrics.com/articles/customer-experience/net-promoter-score/), [CMSWire NPS adoption data](https://www.cmswire.com/customer-experience/why-nps-became-customer-experiences-favorite-punching-bag/)*
