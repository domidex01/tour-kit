---
title: "What is churn rate? How onboarding reduces it (with formulas)"
published: false
description: "70% of SaaS churn happens in the first 90 days. Here's how to calculate churn rate, what the 2026 benchmarks look like, and why onboarding is the most effective fix."
tags: saas, webdev, react, beginners
canonical_url: https://usertourkit.com/blog/what-is-churn-rate
cover_image: https://usertourkit.com/og-images/what-is-churn-rate.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-churn-rate)*

# What is churn rate? How onboarding reduces it

Seventy percent of SaaS churn happens in the first 90 days. Not month six. Not after a competitor steals the deal. The first three months. That makes churn rate less of a retention metric and more of an onboarding diagnostic.

```bash
npm install @tourkit/core @tourkit/react
```

## Churn rate definition

Churn rate is the percentage of customers who cancel, downgrade, or stop using a product during a given period. It's typically measured monthly for SaaS businesses. As of April 2026, median B2B SaaS monthly churn sits at 3.5%, with SMBs running 3-7% and enterprise accounts at 0.5-1% ([MRRSaver, 2026 benchmark of 500+ companies](https://www.mrrsaver.com/blog/saas-churn-rate-benchmarks)).

Two flavors matter:

**Customer churn** counts heads. Ten customers left out of 500? That's 2% customer churn. Simple, but it treats a $50/month account the same as a $50,000/month one.

**Revenue churn** (MRR churn) counts dollars. Losing one enterprise account can outweigh 20 small cancellations. Revenue churn gives you the financial picture that customer churn hides.

## How churn rate works

Churn rate captures how quickly your customer base erodes over time, and the math reveals why small monthly numbers translate into existential annual losses for SaaS businesses. Two formulas cover the vast majority of use cases: customer churn for headcount and revenue churn for financial impact.

```
Churn Rate = (Customers Lost in Period / Customers at Start of Period) × 100
```

Say you start April with 900 customers and lose 30 by month's end. That's 30 / 900 = 3.33% monthly churn.

For revenue churn:

```
Revenue Churn Rate = (MRR Lost from Cancellations + Downgrades) / Starting MRR × 100
```

One thing trips people up: monthly-to-annual conversion isn't multiplication. 5% monthly churn doesn't equal 60% annual. It compounds:

```
Annual Churn = 1 − (1 − Monthly Churn Rate)^12
```

At 5% monthly, you're looking at roughly 46% annual churn. At 2% monthly, that drops to about 21%. Small monthly improvements compound into large annual gains.

## Churn rate examples

Real-world benchmarks show how dramatically churn rate varies by company size, industry vertical, and contract value. These numbers come from a 2026 study of 500+ SaaS companies ([Artisan Growth Strategies](https://www.artisangrowthstrategies.com/blog/saas-churn-rate-benchmarks-2026-500-companies)):

| Segment | Monthly churn | Annual churn |
|---|---|---|
| Enterprise (>$100K ACV) | 0.5-1% | 6-10% |
| Mid-market ($15K-$100K ACV) | 1-3% | 11-22% |
| SMB (<$15K ACV) | 3-7% | 31-58% |
| Early-stage (<$1M ARR) | 5-7% | 46-58% |

Industry matters too. Infrastructure SaaS churns at 1.8% monthly because switching costs are high. EdTech runs at 9.6% monthly, the highest of any vertical ([MRRSaver](https://www.mrrsaver.com/blog/saas-churn-rate-benchmarks)).

Annual churn below 5% is gold standard for established B2B SaaS. If you're early-stage and above 7% monthly, onboarding is the first place to look.

## Why onboarding is the most effective churn fix

Most churn isn't a retention problem. It's an activation problem wearing a retention mask. 75% of users abandon a product within the first week when onboarding fails to show clear value, and 70% of all churn clusters in the first 90 days ([Userlens](https://userlens.io/blog/impact-of-onboarding-on-saas-retention)). Fixing onboarding fixes churn at the source.

Users who complete full onboarding retain at 82%. Partial onboarding? Just 19%. A 4x gap driven by whether someone understood the product before quitting.

Personalized onboarding lifts 90-day retention by 41%, and companies where time-to-first-value sits under seven days see 50% lower churn rates than those with longer ramps. Google's developer blog documented this concretely: the Fabulous app ran A/B tests on their onboarding using Firebase Remote Config, lifting completion from 42% to 64% and boosting day-one retention by 27% ([Google Developers Blog](https://developers.googleblog.com/2016/06/introducing-firebase-remote-config.html)).

There's a cognitive load ceiling too. Suzanne Scacca at [Smashing Magazine](https://www.smashingmagazine.com/2023/04/design-effective-user-onboarding-flow/) points out that people hold 5-7 items in working memory at once. Cap onboarding steps at five. Go beyond that, completion rates crater.

## Reducing churn with product tours

Product tours address churn at the exact moment it's decided: the first session. Guide users to one high-value action rather than narrating the entire UI. Product Fruits found that directing users to a single "aha moment" cut Day 1 churn by 20%, and each day shaved off time-to-value increased activation rate by 3-5% ([Product Fruits](https://productfruits.com/blog/how-we-reduced-day-1-churn-by-20-percent/)).

With Tour Kit, a minimal activation tour looks like this:

```tsx
// src/components/ActivationTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

const steps = [
  {
    target: '#create-project-btn',
    title: 'Start here',
    content: 'Create your first project to see results in under 2 minutes.',
  },
  {
    target: '#template-picker',
    title: 'Pick a template',
    content: 'Templates get you to your first win faster than starting blank.',
  },
];

export function ActivationTour() {
  return (
    <TourProvider>
      <Tour tourId="activation" steps={steps} />
    </TourProvider>
  );
}
```

Two steps. One goal: get the user to their first project. No 12-step walkthrough that tours the settings page nobody asked about.

Tour Kit is a headless library, so you control every pixel of the tooltip UI. Ships at under 8KB gzipped for the core package. Requires React 18+.

The tradeoff: there's no visual builder. You write the tour in code, which means a developer needs to be involved. For teams that want design-system-consistent tours owned by engineering, that's the point. For teams that need marketing to edit tours without deploys, it's a limitation worth knowing about.

## FAQ

### What is a good churn rate for SaaS?

Below 3% monthly for established B2B SaaS. Annual churn below 5% puts you in the top tier. Early-stage companies run higher at 5-7% monthly, which isn't cause for alarm if you're actively improving onboarding.

### How do you calculate monthly churn rate?

Divide customers lost during the month by customers at the start, then multiply by 100. Started with 900 and lost 30? That's 3.33%. For revenue churn, swap customer counts for MRR values.

### Does onboarding actually reduce churn?

Yes. Full onboarding completers retain at 82% vs. 19% for partial onboarding. Personalized onboarding lifts 90-day retention by 41%. Since 70% of all churn happens in the first 90 days, onboarding is where to focus.

### What is the difference between customer churn and revenue churn?

Customer churn counts the percentage of accounts lost, treating every customer equally. Revenue churn (MRR churn) measures the percentage of recurring revenue lost from cancellations and downgrades. Revenue churn matters more because losing one $50K account hits harder than losing ten $500 accounts.
