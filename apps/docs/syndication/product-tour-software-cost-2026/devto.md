---
title: "Product tour software pricing in 2026: $0 to $142K/yr (full breakdown)"
published: false
description: "I pulled pricing from 10 vendor websites and calculated what product tour tools actually cost for a 5,000 MAU SaaS product. The gap between sticker price and real cost is wild."
tags: react, webdev, javascript, opensource
canonical_url: https://usertourkit.com/blog/product-tour-software-cost-2026
cover_image: https://usertourkit.com/og-images/product-tour-software-cost-2026.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-software-cost-2026)*

# How much does product tour software cost in 2026?

You're evaluating product tour tools and every vendor pricing page gives you the same thing: a grid of features, a monthly number with an asterisk, and a "Talk to Sales" button for the plan you actually need. None of them show you what the bill looks like after your MAU count doubles.

We pulled pricing data from 10 vendor websites, cross-referenced with published G2 and Capterra reviews, and calculated what each option actually costs over 12 months for a 5,000 MAU SaaS product. Disclosure: we built Tour Kit, so we're biased toward the open-source path. Every number below is sourced and verifiable.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

Product tour software costs between $0 and $142,000 per year in 2026. SaaS platforms like Appcues and Userpilot charge $249-$300 per month for entry plans with 1,000-2,000 monthly active users, scaling to $750+ as you grow. Enterprise digital adoption platforms (Pendo, WalkMe) run $9,000 to $142,000 annually. Open-source libraries like Tour Kit, React Joyride, and Shepherd.js cost $0 in licensing, with the real expense being developer time for integration and customization, typically 8-40 hours depending on complexity.

## What does each product tour tool cost?

The pricing gap between the cheapest and most expensive product tour software spans three orders of magnitude. As of April 2026, here's what each vendor charges based on their public pricing pages and published customer reports.

| Tool | Type | Starting price | 5,000 MAU estimate | 10,000 MAU estimate |
|------|------|---------------|-------------------|-------------------|
| UserGuiding | SaaS | $69/mo | ~$200/mo | Custom |
| Userflow | SaaS | $240/mo (3K MAU) | ~$350/mo | Custom |
| Userpilot | SaaS | $249/mo (2K MAU) | ~$400/mo | Custom |
| Chameleon | SaaS | $279/mo | ~$450/mo | Custom |
| Appcues | SaaS | $300/mo (1K MAU) | ~$600/mo | ~$1,500/mo |
| Intercom Tours | Add-on | $99/mo + seat fees | ~$200-400/mo total | ~$400-800/mo total |
| Pendo | DAP | Free (limited) | $15,000-$50,000/yr | $50,000+/yr |
| WalkMe | DAP | $9,000/yr | $15,000-$25,000/yr | $25,000-$50,000/yr |
| React Joyride | Open source | $0 (MIT) | $0 | $0 |
| Shepherd.js | Open source | $0 (AGPL) | $0 | $0 |
| Tour Kit | Open source | $0 (MIT) / $99 Pro | $0-$99 one-time | $0-$99 one-time |

*Pricing data as of April 2026 from vendor pricing pages and [Apty's DAP pricing guide](https://apty.ai/blog/digital-adoption-platform-pricing/). MAU estimates are approximate based on published tier structures. "Custom" means the vendor requires a sales call.*

Something worth flagging: seven out of eight SaaS tools on that list hide their real pricing behind "Contact Sales" once you cross a MAU threshold. The sticker price is for the smallest plan.

## What are the hidden costs of product tour software?

The subscription fee is the beginning of the real cost, not the total. Product tour software carries four categories of hidden costs that don't appear on any pricing page: implementation time, MAU overages, compliance add-ons, and switching costs. A [CompareTiers analysis](https://comparetiers.com/blog/hidden-costs-saas-pricing) found SaaS hidden costs push the actual spend 2-5x beyond published prices.

**MAU overages** are the biggest surprise. Every SaaS product tour tool prices by monthly active users, and your product is supposed to grow. When it does, your tour software bill grows faster than your revenue.

Appcues at 1,000 MAUs costs $300/month. At 20,000 MAUs, published quotes from G2 reviewers put it north of $2,000/month. That's $24,000/year for tooltip rendering.

**Implementation and training** add $2,000 to $50,000 depending on complexity. Staff training averages 20-30 hours per admin. Enterprise tools like WalkMe and Pendo require dedicated implementation engineers.

**Compliance gates** hit at the worst time. SSO, audit logs, data residency, and SOC 2 compliance are almost always locked behind the enterprise tier. A startup that needs HIPAA compliance for healthcare onboarding can't get it on the $300/month plan.

**Switching costs** are the trap door. No SaaS onboarding tool offers clean data export. Tour definitions, user progress, analytics history: all stored in proprietary formats. When you switch, you rebuild from zero.

## How do open-source product tour libraries compare on cost?

Open-source product tour libraries cost $0 in licensing fees, but the real expense is developer time for integration, customization, and ongoing maintenance. For a React team with an existing design system, the integration cost ranges from 8 hours (basic 5-step tour) to 40 hours (complex multi-page onboarding with analytics). At $150/hour for a US-based senior React developer, that's $1,200 to $6,000 in one-time setup cost with near-zero recurring fees.

Here's how the three main open-source options break down:

**React Joyride** has 603K weekly npm downloads and 6.9K GitHub stars as of April 2026. It's free (MIT license), but ships at 37KB gzipped with an opinionated UI. Customizing it to match your design system means overriding CSS or replacing components entirely.

**Shepherd.js** has 13K GitHub stars but uses the AGPL license, which requires you to open-source your entire application if you distribute it. Buying a commercial license removes that restriction but adds cost.

**Tour Kit** is MIT licensed with a <8KB gzipped core and a headless architecture: you render your own components, so there's nothing to override. The free tier covers tours, hints, and analytics. Pro features (scheduling, adoption tracking, surveys) cost $99 one-time. No MAU fees, no recurring charges.

Tour Kit doesn't have a visual builder, which means product managers can't create tours without developer help. React 18+ only. Smaller community than React Joyride. Those are real trade-offs.

```tsx
// src/components/ProductTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { target: '#dashboard-nav', content: 'Start here to see your metrics' },
  { target: '#create-button', content: 'Create your first project' },
  { target: '#help-menu', content: 'Find docs and support here' },
];

export function ProductTour() {
  return (
    <TourProvider tourId="onboarding" steps={steps}>
      <TourContent />
    </TourProvider>
  );
}
```

## Decision framework: which pricing model fits your team?

Choosing the right product tour pricing model depends on four variables: your team's technical capability, your MAU growth rate, your design system maturity, and your compliance requirements.

**If you have React developers and an existing design system:** Use an open-source library. Integration runs 8-40 hours with no recurring fees and full design control. Tour Kit or React Joyride are the strongest options for React teams.

**If you're a product-led team without frontend engineers:** SaaS tools like Userpilot or Chameleon make sense. You're paying for the visual builder and the PM-facing workflow. Budget $300-$600/month and expect that number to double as you grow past 5,000 MAUs.

**If you're an enterprise with 50,000+ users and compliance needs:** Pendo or WalkMe are the standard choices. Budget $25,000-$100,000/year. You're buying the analytics suite and the support contract as much as the tour functionality.

**If you're a startup watching cash:** UserGuiding ($69/month) is the cheapest SaaS entry. But if you have even one React developer, the open-source path pays for itself within 2-3 months compared to any SaaS subscription.

The product tour software market was valued at $478 million in 2025 and is projected to reach $781 million by 2031 at a 7.3% CAGR ([Valuates Reports](https://reports.valuates.com/market-reports/QYRE-Auto-0U19691/global-product-tour-software-for-saas)). Prices are going up, not down.

## What we recommend (and why)

We built Tour Kit, so take this recommendation with appropriate skepticism. But the math is straightforward.

For a 5,000 MAU SaaS product over three years, Appcues costs roughly $21,600-$54,000 (assuming MAU-driven price increases). Userpilot runs $14,400-$36,000. A headless library like Tour Kit costs $0-$99 plus 16-40 hours of developer time for initial setup.

The three-year difference is $14,000 to $53,000. For most engineering teams that already use React, the library path isn't just cheaper: it gives you code ownership, design control, and zero vendor lock-in.

That said, if your team doesn't write React and your PM needs to ship tours without engineering, SaaS tools exist for a reason. The right choice depends on your team, not the price tag.

Check out the full [docs and getting started guide](https://usertourkit.com/) to see if Tour Kit fits your stack.

## Frequently asked questions

### How much does Appcues cost per month?

Appcues costs $300 per month for the Essentials plan with 1,000 monthly active users as of April 2026. The Growth plan starts at $750 per month. Enterprise pricing requires a sales call. The product tour software cost scales with MAU count, so a 10,000 MAU product typically pays $1,000-$2,000 per month based on published G2 reviewer reports.

### Is there free product tour software?

Yes. React Joyride (MIT license), Driver.js (MIT), and Tour Kit's free tier all provide product tour functionality at no licensing cost. Pendo also offers a limited free plan. The trade-off with open-source libraries is developer integration time (8-40 hours) instead of monthly SaaS fees. Tour Kit's free tier includes tours, hints, and analytics with no MAU limits.

### What is the cheapest product tour tool for startups?

UserGuiding is the cheapest SaaS product tour tool at $69 per month as of April 2026. For React-based startups, open-source libraries like Tour Kit ($0 MIT, $99 one-time for Pro) are the most cost-effective option with a one-time integration cost of $1,200-$6,000 in developer time versus $828-$3,600 per year in SaaS fees that increase with growth.

### How much does enterprise product tour software cost?

Enterprise product tour software (digital adoption platforms) costs $9,000 to $142,000 per year in 2026. Pendo's enterprise tier ranges from $50,000 to $142,000 annually. WalkMe runs $25,000 to $50,000 per year. These prices include analytics suites, compliance features, and professional services that mid-market SaaS tools don't offer.

### Should I build product tours in-house or buy software?

Building product tours from scratch costs $45,000-$70,000 in year one for a startup team, with $25,000+ annual maintenance ([Appcues build vs buy analysis](https://www.appcues.com/blog/build-vs-buy-saas)). Buying SaaS costs $3,600-$9,000 per year at entry scale. The third option, using an open-source headless library, costs $1,200-$6,000 in one-time setup with near-zero recurring cost. For React teams, this third path typically delivers the best three-year total cost of ownership.
