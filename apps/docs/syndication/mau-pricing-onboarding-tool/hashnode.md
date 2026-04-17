---
title: "Why onboarding SaaS tools charge per MAU (and why that's a problem)"
slug: "mau-pricing-onboarding-tool"
canonical: https://usertourkit.com/blog/mau-pricing-onboarding-tool
tags: saas, pricing, react, opensource, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/mau-pricing-onboarding-tool)*

# Why onboarding SaaS tools charge per MAU (and why that's a problem)

Every major onboarding SaaS product (Appcues, Pendo, Userpilot, Chameleon, UserGuiding) bills by monthly active users. The model is simple: more people use your product, you pay more for onboarding. On the surface, that sounds fair. But follow the math through two years of growth and you'll find a pricing structure that punishes you for succeeding.

We built [Tour Kit](https://tourkit.dev) as an open-source alternative, so we're obviously biased. Take what follows with appropriate skepticism. Every cost figure below is sourced from vendor pricing pages or Vendr's transaction database, and you can check them yourself.

## The pricing model every onboarding tool shares

Per-MAU pricing in onboarding tools works like this: you pick a plan tier, that tier includes a monthly active user cap, and when your product grows past that cap you either upgrade or negotiate. As of April 2026, here's what that looks like across the market:

| Vendor | 2,000 MAU/mo | 10,000 MAU/mo | 50,000+ MAU/mo |
|--------|-------------|--------------|----------------|
| UserGuiding | $69/mo | $299/mo | $499+/mo (custom) |
| Chameleon | $279/mo | ~$850/mo | Custom |
| Appcues | ~$249/mo | ~$879/mo | Custom |
| Userpilot | $299/mo | $799+/mo | Custom |
| Pendo | ~$600/mo | ~$1,667/mo | $6,250+/mo |

*Sources: vendor pricing pages (April 2026); Pendo estimates from Vendr marketplace data across 530 real purchases.*

UserGuiding at $69/month looks reasonable. But even the cheapest vendor quadruples your bill as you grow from 2K to 10K MAUs.

## The structural problem: you pay more when you win

Per-MAU pricing creates a specific misalignment between vendor incentives and customer outcomes. The vendor profits when users log in. Whether those users convert, retain, or generate any revenue for you is irrelevant to the bill.

Baremetrics put it bluntly: "Per user pricing kills your growth and sets you up for long term failure, because it's rarely where value is ascribed to your product."

A real scenario documented by SSOJet: a company grows from 3,000 to 30,000 MAUs over 18 months. Their onboarding tool bill jumps 10x, from $120/month to $1,200/month. But their revenue only doubled. The tool vendor captured proportionally more of the new revenue than the customer kept.

## What this costs at real growth rates

Take a B2B SaaS product growing at 15% month-over-month. Starting at 2,000 MAUs with Userpilot's Starter plan ($299/month):

- **Month 1:** 2,000 MAUs at $299/month ($3,588/year)
- **Month 12:** ~10,000 MAUs at $799+/month ($9,588+/year)
- **Month 18:** ~20,000 MAUs, Growth plan, custom pricing
- **Month 24:** ~40,000 MAUs, enterprise negotiation territory

You started at $3,588/year. Within two years, you're looking at $15,000–$40,000/year for the same product doing the same thing.

Pendo is steeper. Vendr's data from 530 real enterprise purchases shows a median annual contract of $48,500, with deals reaching $147,264/year.

## The counterargument: why vendors use MAU pricing

To be fair, per-MAU pricing exists for real reasons. Infrastructure costs scale with user count. The model is simple to understand. And at large scale ($10M ARR), a $50K/year onboarding tool is 0.5% of revenue.

The model breaks specifically for products with non-linear growth, freemium tiers, seasonal spikes, or viral acquisition channels. Which describes most modern SaaS products.

## What we'd do instead

We built Tour Kit as an open-source headless library because we believe onboarding infrastructure should be a fixed cost, not a variable one that scales with your success. Engineering time to implement: 1–3 days. Compare that to $48,500/year median for Pendo.

```tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { target: '#welcome', content: 'Welcome to the app' },
  { target: '#dashboard', content: 'Here is your dashboard' },
  { target: '#settings', content: 'Configure your account' },
];

function App() {
  return (
    <TourProvider steps={steps}>
      <YourApp />
    </TourProvider>
  );
}
```

No MAU cap. No overage fees. No three-year commitment.

If you're evaluating onboarding tools today, ask one question: **does the vendor win when I win, or does the vendor win when my users log in?**

[Full article with all pricing data and FAQ](https://usertourkit.com/blog/mau-pricing-onboarding-tool)
