---
title: "The real cost of Userpilot for growing SaaS teams"
slug: "real-cost-userpilot-growing-saas"
canonical: https://usertourkit.com/blog/real-cost-userpilot-growing-saas
tags: react, javascript, web-development, saas, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/real-cost-userpilot-growing-saas)*

# The real cost of Userpilot for growing SaaS teams

Userpilot's pricing page shows $299/month for the Starter plan. That number is accurate for about five minutes. Specifically, the five minutes before your SaaS crosses 2,000 monthly active users and you discover what "Growth" pricing actually means.

We built Tour Kit, an open-source onboarding library, so we're biased. Every number below comes from Userpilot's own pricing page, Vendr's transaction database, G2 reviews, or Capterra listings. Check them yourself.

```bash
npm install @tourkit/core @tourkit/react
```

## The problem: a pricing cliff at 2,001 MAU

Userpilot's pricing has a hard step function at 2,000 monthly active users. Below that threshold, you're on the Starter plan at $299/month ($3,588/year billed annually). The moment you hit 2,001 MAU, you jump to the Growth plan at $799/month ($9,588/year). That's a $6,000 annual increase triggered by a single user.

For context, most B2B SaaS products cross 2,000 MAU within 6-12 months of reaching product-market fit. If you're evaluating Userpilot because your user base is growing, you're evaluating the wrong plan.

| MAU tier | Plan required | Monthly cost | Annual cost | Cost per MAU/month |
|---|---|---|---|---|
| Up to 2,000 | Starter | $299 | $3,588 | $0.15 |
| 2,001-5,000 | Growth | $799+ | $9,588+ | ~$0.16 |
| 5,001-10,000 | Growth (custom) | Contact sales | $18,000+ (Vendr median) | Unknown |
| 10,001+ | Enterprise | Contact sales | $30,000-$60,680 (Vendr range) | Unknown |

According to Vendr's data, actual Userpilot spend ranges from $7,638 to $60,680 annually. That's an 8x spread.

## The argument: advertised price hides the real bill

Several features that growing teams need are either plan-gated or sold as add-ons:

- A/B testing for flows: requires Growth ($799/month minimum)
- Custom analytics and event-based reporting: requires Growth
- Session replays: add-on pricing not published
- Salesforce/HubSpot CRM sync: add-on or Enterprise only
- Data retention: 1 year on Starter, 3 years on Growth
- Mobile support: web-only as of April 2026

A G2 reviewer: "The pricing model becomes prohibitive as you scale. We started at $299 and within a year were looking at quotes above $15K."

## The real 3-year cost at 5,000 MAU

| Cost category | Year 1 | Year 2 | Year 3 | 3-year total |
|---|---|---|---|---|
| Userpilot subscription | $3,588 | $9,588+ | $12,000+ | $25,176+ |
| Implementation | $3,000 | $1,500 | $1,500 | $6,000 |
| Mobile tooling gap | $0 | $2,400 | $2,400 | $4,800 |
| Session replay add-on | $0 | $1,200 | $1,200 | $2,400 |
| **Total** | **$6,588** | **$14,688+** | **$17,100+** | **$38,376+** |

That $299/month turned into $38,000+ over three years.

## What the alternatives cost

| Approach | Year 1 cost | 3-year cost | MAU scaling |
|---|---|---|---|
| Userpilot (2K-5K MAU) | $9,588+ | $38,000+ | Increases with MAU |
| Tour Kit (open source + Pro) | $99 one-time | $99 total | No MAU fees |
| PostHog + Tour Kit | $99 + PostHog free tier | $99 + usage-based | Analytics scales, tours don't |
| Build from scratch | $15,000-$30,000 | $25,000-$45,000 | No MAU fees |

```tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

function OnboardingTour() {
  return (
    <TourProvider>
      <Tour tourId="welcome-flow">
        <TourStep
          target="#dashboard-nav"
          title="Your dashboard"
          content="This is where you'll track key metrics."
        />
        <TourStep
          target="#create-project"
          title="Create your first project"
          content="Click here to get started."
        />
      </Tour>
    </TourProvider>
  );
}
```

The deeper question isn't "how much does Userpilot cost?" It's "do you want your onboarding cost to scale with your success?"

Full breakdown: [usertourkit.com/blog/real-cost-userpilot-growing-saas](https://usertourkit.com/blog/real-cost-userpilot-growing-saas)
