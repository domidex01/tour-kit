---
title: "I modeled 3 years of Appcues costs vs an open-source alternative — here's the math"
published: false
description: "We built a TCO model comparing Appcues and Tour Kit at 5K, 25K, and 100K MAU. The gap ranges from $28K to $228K over 36 months. Every number is sourced."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/tco-comparison-appcues-tour-kit
cover_image: https://usertourkit.com/og-images/tco-comparison-appcues-tour-kit.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tco-comparison-appcues-tour-kit)*

# TCO comparison: 3 years of Appcues vs 3 years of Tour Kit

Appcues charges per user per month. Tour Kit charges nothing per user, ever. Over three years that difference compounds into a gap that ranges from $30,000 to over $120,000, depending on your MAU tier. We modeled both paths at 5K, 25K, and 100K monthly active users, including every cost we could identify: licenses, engineering time, maintenance, price increases, and switching costs.

We built Tour Kit, so our bias is obvious. Every number in this article is sourced from public pricing pages, Vendr contract intelligence, and published engineering rate data. You can reconstruct the entire model yourself.

```bash
npm install @tourkit/core @tourkit/react
```

## The problem: annual pricing hides 3-year compounding

Most teams evaluate onboarding tools on year-one cost. That's a mistake. SaaS contracts compound in ways that don't show up until renewal: MAU-based pricing scales non-linearly, annual increases of 5-15% are standard, and the switching cost of rebuilding proprietary flows keeps you locked in even when the math stops working. Vendr's 2025 SaaS Trends Report found that the average SaaS contract increases 8% at renewal, with onboarding tools trending higher due to MAU growth tracking user growth.

A 3-year model captures what a 1-year evaluation misses: the compounding effect of price increases on top of MAU growth, the maintenance tail of both approaches, and the point where one path becomes permanently cheaper than the other.

## The model: assumptions and methodology

We built this model with the following assumptions. Where we had to estimate, we picked the number less favorable to Tour Kit.

**Shared assumptions:**
- US-based senior React developer at $150/hour
- Team of 3 people authoring onboarding flows
- 10 onboarding flows maintained across the product
- MAU grows 20% year-over-year

**Appcues assumptions:**
- Growth plan pricing from Appcues pricing page and Userorbit pricing guide as of April 2026
- 10% annual price increase at renewal (mid-range of the 5-15% Vendr reports)
- 3 seats included in Growth; additional seats at $50/month each
- No professional services

**Tour Kit assumptions:**
- 80 hours initial implementation (2 weeks for a senior developer)
- 30 hours/year ongoing maintenance
- Tour Kit Pro license at $99 one-time
- Zero per-MAU cost (client-side library)

## 3-year TCO at 5,000 MAU

| Cost component | Appcues (3-year total) | Tour Kit (3-year total) |
|---|---|---|
| License / subscription | $45,540 | $99 (one-time) |
| Initial implementation | $3,000 | $12,000 |
| Additional seats (3 extra) | $5,400 | $0 |
| Annual maintenance | $0 | $13,500 |
| **3-year total** | **$53,940** | **$25,599** |
| **Savings with Tour Kit** | **$28,341 (53%)** | |

## 3-year TCO at 25,000 MAU

| Cost component | Appcues (3-year total) | Tour Kit (3-year total) |
|---|---|---|
| License / subscription | $105,600 | $99 |
| Initial implementation | $3,000 | $12,000 |
| Additional seats | $5,400 | $0 |
| Annual maintenance | $0 | $13,500 |
| **3-year total** | **$114,000** | **$25,599** |
| **Savings with Tour Kit** | **$88,401 (78%)** | |

Notice that Tour Kit's cost stays flat. Client-side libraries don't care how many users load the page.

## 3-year TCO at 100,000 MAU

| Cost component | Appcues (3-year total) | Tour Kit (3-year total) |
|---|---|---|
| License / subscription | $216,000+ | $99 |
| Initial implementation | $15,000 | $18,000 |
| Additional seats (10 extra) | $18,000 | $0 |
| Annual maintenance | $0 | $18,000 |
| Premium support | $15,000+ | $0 |
| **3-year total** | **$264,000+** | **$36,099** |
| **Savings with Tour Kit** | **$227,901+ (86%)** | |

## Where Appcues wins (honestly)

**No frontend engineers available.** If your team has zero React developers, a visual builder is your only option.

**Ship in hours, not weeks.** A PM can build an Appcues flow in 15 minutes. Tour Kit's initial setup takes 2-4 weeks.

**Non-technical flow authoring.** If PMs need to create flows without developer involvement, Appcues is purpose-built for that.

**Under 2,500 MAU and staying there.** At the Essentials tier ($249/month), Appcues costs $8,964 over three years — competitive with Tour Kit's implementation cost.

## Where Tour Kit wins

**Cost scales with complexity, not users.** Tour Kit's 3-year cost is the same whether you have 1,000 or 1,000,000 MAU.

**Code ownership.** Flows live in your repository, go through code review, ship with your deploys.

**No vendor lock-in.** MIT-licensed core. If you stop using it, your flows are still React components.

**Performance.** Under 8KB gzipped vs Appcues' 80-120KB SDK.

## The break-even calculation

If you have a senior React developer, break-even occurs at approximately month 4 for a 10K MAU SaaS. After that, Tour Kit is permanently cheaper.

**Break-even month = Tour Kit implementation cost / (monthly Appcues cost - monthly Tour Kit maintenance cost)**

## Our recommendation

If your Appcues contract is under $10,000/year and you have no frontend engineers, stay with Appcues. If your contract is above $15,000/year and you have React developers on the team, the 3-year savings will likely fund 2-3 months of engineering time with money left over.

The math isn't close at scale. At 25K+ MAU, Appcues costs 4-7x more than Tour Kit over three years. That's not a rounding error. That's a headcount.

```bash
npm install @tourkit/core @tourkit/react
```
