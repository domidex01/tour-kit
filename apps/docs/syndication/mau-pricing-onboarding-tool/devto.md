---
title: "The math on per-MAU pricing in onboarding tools (it gets ugly at scale)"
published: false
description: "Every major onboarding SaaS bills by monthly active users. I broke down what that actually costs at 2K, 10K, and 50K MAUs — and why the model punishes you for growing."
tags: saas, webdev, opensource, react
canonical_url: https://usertourkit.com/blog/mau-pricing-onboarding-tool
cover_image: https://usertourkit.com/og-images/mau-pricing-onboarding-tool.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/mau-pricing-onboarding-tool)*

# Why onboarding SaaS tools charge per MAU (and why that's a problem)

Every major onboarding SaaS product (Appcues, Pendo, Userpilot, Chameleon, UserGuiding) bills by monthly active users. The model is simple: more people use your product, you pay more for onboarding. On the surface, that sounds fair. But follow the math through two years of growth and you'll find a pricing structure that punishes you for succeeding.

We built [Tour Kit](https://tourkit.dev) as an open-source alternative, so we're obviously biased. Take what follows with appropriate skepticism. Every cost figure below is sourced from vendor pricing pages or Vendr's transaction database, and you can check them yourself.

```bash
npm install @tourkit/core @tourkit/react
```

## The pricing model every onboarding tool shares

Per-MAU pricing in onboarding tools works like this: you pick a plan tier, that tier includes a monthly active user cap, and when your product grows past that cap you either upgrade or negotiate. As of April 2026, here's what that looks like across the market:

| Vendor | 2,000 MAU/mo | 10,000 MAU/mo | 50,000+ MAU/mo |
|--------|-------------|--------------|----------------|
| UserGuiding | $69/mo | $299/mo | $499+/mo (custom) |
| Chameleon | $279/mo | ~$850/mo | Custom |
| Appcues | ~$249/mo | ~$879/mo | Custom |
| Userpilot | $299/mo | $799+/mo | Custom |
| Pendo | ~$600/mo | ~$1,667/mo | $6,250+/mo |

*Sources: vendor pricing pages (April 2026); Pendo estimates from [Vendr marketplace data](https://www.vendr.com/marketplace/pendo) across 530 real purchases.*

UserGuiding at $69/month looks reasonable. But notice: even the cheapest vendor quadruples your bill as you grow from 2K to 10K MAUs. Pendo triples it. And once you cross into "custom" territory, you're negotiating against a vendor who already has your data locked in.

## The structural problem: you pay more when you win

Per-MAU pricing creates a specific misalignment between vendor incentives and customer outcomes. The vendor profits when users log in. Whether those users convert, retain, or generate any revenue for you is irrelevant to the bill.

[Baremetrics](https://baremetrics.com/blog/per-user-pricing) put it bluntly: "Per user pricing kills your growth and sets you up for long term failure, because it's rarely where value is ascribed to your product."

Consider a real scenario documented by [SSOJet](https://ssojet.com/blog/mau-pricing-is-broken-fair-models-for-fast-growing-saas): a company grows from 3,000 to 30,000 MAUs over 18 months. Their onboarding tool bill jumps 10x, from $120/month to $1,200/month. But their revenue only doubled during the same period. The tool vendor captured proportionally more of the new revenue than the customer kept.

This isn't a bug in the model. It's the model working as designed.

Three assumptions baked into per-MAU pricing all fail under scrutiny:

1. **Every user creates equal onboarding value.** They don't. A power user who already knows your product counts the same as a trial signup who bounces after 30 seconds.

2. **Growth always means higher profitability.** It doesn't, especially for freemium products. If half your MAUs are free-tier users, you're paying to onboard people who generate zero revenue.

3. **"Active" means something consistent.** It doesn't. Pendo counts anyone who loads a page with their snippet. Appcues counts unique logins in a rolling 30-day window.

## What this costs at real growth rates

Take a B2B SaaS product growing at 15% month-over-month. Aggressive, but not unusual for a seed-stage company with product-market fit.

Starting at 2,000 MAUs with Userpilot's Starter plan ($299/month):

- **Month 1:** 2,000 MAUs at $299/month ($3,588/year)
- **Month 12:** ~10,000 MAUs at $799+/month ($9,588+/year)
- **Month 18:** ~20,000 MAUs, Growth plan, custom pricing
- **Month 24:** ~40,000 MAUs, enterprise negotiation territory

You started at $3,588/year. Within two years, you're looking at $15,000–$40,000/year for the same product doing the same thing.

Pendo is steeper. Vendr's data from 530 real enterprise purchases shows a median annual contract of $48,500, with deals reaching $147,264/year. One customer reported paying $120,000/year locked into a mandatory three-year commitment.

At those numbers, you're not paying for an onboarding tool anymore. You're paying a growth tax.

## The freemium trap nobody talks about

If you run a freemium product, per-MAU pricing creates a structural contradiction. The entire point of freemium is maximizing monthly active users. More free users = bigger top of funnel = more eventual conversions. But under MAU pricing, more free users = higher onboarding tool bills on users who may never pay you.

Say you have 50,000 MAUs and a 5% paid conversion rate. You're paying to "onboard" 47,500 users who generate zero revenue.

No vendor's pricing page mentions this. The Pendo free tier caps at 500 MAUs, probably the most honest signal in the market about where the math stops working for them.

## The counterargument: why vendors use MAU pricing

To be fair, per-MAU pricing exists for real reasons.

**It aligns cost with infrastructure load.** More users means more events tracked, more analytics processed, more experiences served. The vendor's costs genuinely scale with your MAU count, even if the scaling ratio isn't linear.

**It's simple to understand.** "You pay based on how many people use your product" is easier to budget for than complex usage-based metrics with multiple dimensions.

**It captures value at scale.** If your product has 100,000 MAUs and you're generating $10M ARR, paying $50K/year for an onboarding tool is a 0.5% cost of revenue. That's not unreasonable.

The model breaks specifically for products with non-linear growth, freemium tiers, seasonal spikes, or viral acquisition channels. Which describes most modern SaaS products.

## What we'd do instead

We built Tour Kit as an open-source headless library because we believe onboarding infrastructure should be a fixed cost, not a variable one that scales with your success.

The tradeoff is real: you write more code. Tour Kit gives you hooks, components, and logic, not a no-code visual builder. You need React developers.

But the cost calculus flips at scale. Engineering time to implement a basic product tour with Tour Kit is typically 1–3 days. At $150/hour fully loaded, that's $1,800–$3,600 one-time. Compare that to $48,500/year median for Pendo, and the open-source approach pays for itself in the first month.

```tsx
// src/components/OnboardingTour.tsx
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

The limitation is real, though: Tour Kit has a smaller community than React Joyride (603K weekly npm downloads) or Shepherd.js (200K+). It's React 18+ only. There's no mobile SDK. For some teams, the visual builder and customer success support matter more than cost savings.

## The broader pricing shift

This isn't just an onboarding tools problem. The entire SaaS industry is rethinking per-user pricing. As of Q1 2026, [65% of SaaS vendors](https://editorialge.com/saas-trends-q1/) with AI features are layering usage-based metrics rather than raising per-seat costs.

If you're evaluating onboarding tools today, ask one question: **does the vendor win when I win, or does the vendor win when my users log in?** If the answer is the latter, you're paying a growth tax.

[Try Tour Kit](https://tourkit.dev/docs/getting-started): zero MAU fees, MIT licensed.
