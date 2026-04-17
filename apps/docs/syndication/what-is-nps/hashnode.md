---
title: "What is Net Promoter Score (NPS)? A developer's guide to measuring onboarding satisfaction"
slug: "what-is-nps"
canonical: https://usertourkit.com/blog/what-is-nps
tags: react, javascript, web-development, saas
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

```
NPS = (% Promoters) - (% Detractors)
```

Say 100 users respond: 60 Promoters, 25 Passives, 15 Detractors. Your NPS is 60 - 15 = **+45**.

| Group | Score range | What it means | Action |
|-------|-----------|---------------|--------|
| Promoter | 9-10 | Loyal, will recommend | Ask for referrals, case studies |
| Passive | 7-8 | Satisfied but switchable | Identify what's missing |
| Detractor | 0-6 | Unhappy, may churn | Follow up within 48 hours |

## NPS benchmarks for SaaS

The average SaaS NPS is +36 ([CustomerGauge 2025](https://customergauge.com/benchmarks/blog/nps-saas-net-promoter-score-benchmarks)). B2B SaaS averages +29, B2C software +47. Zoom scores +72, Snowflake +71, Slack +55, Salesforce +20. Only 3% hit +70.

## How to collect NPS after onboarding

In-app NPS surveys get 20-40% response rates versus 5-15% for email ([Refiner.io](https://refiner.io/blog/in-app-nps/)). Trigger after your onboarding tour completes, not during it. Wait 3+ sessions. Never ask more than once every 60 days.

```tsx
import { useSurvey } from '@tourkit/surveys';

export function PostTourNPS() {
  const { show, response } = useSurvey({
    type: 'nps',
    question: 'How likely are you to recommend this product?',
    followUp: 'What could we improve?',
    throttle: { minInterval: '60d' },
  });

  return null;
}
```

## Why NPS matters for product tours

NPS measured right after onboarding tells you whether your tour helped users reach their "aha" moment. But it isn't a silver bullet: cultural norms affect scores by 15-20 points across regions ([Qualtrics](https://www.qualtrics.com/articles/customer-experience/net-promoter-score/)). Use it as a directional signal alongside completion rates and time-to-value.

---

*Sources: [Bain & Company](https://www.netpromotersystem.com/about/measuring-your-net-promoter-score/), [CustomerGauge](https://customergauge.com/benchmarks/blog/nps-saas-net-promoter-score-benchmarks), [Refiner.io](https://refiner.io/blog/in-app-nps/), [Qualtrics](https://www.qualtrics.com/articles/customer-experience/net-promoter-score/), [CMSWire](https://www.cmswire.com/customer-experience/why-nps-became-customer-experiences-favorite-punching-bag/)*
