---
title: "TCO comparison: 3 years of Appcues vs 3 years of Tour Kit"
slug: "tco-comparison-appcues-tour-kit"
canonical: https://usertourkit.com/blog/tco-comparison-appcues-tour-kit
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tco-comparison-appcues-tour-kit)*

# TCO comparison: 3 years of Appcues vs 3 years of Tour Kit

Appcues charges per user per month. Tour Kit charges nothing per user, ever. Over three years that difference compounds into a gap that ranges from $30,000 to over $120,000, depending on your MAU tier. We modeled both paths at 5K, 25K, and 100K monthly active users, including every cost we could identify: licenses, engineering time, maintenance, price increases, and switching costs.

We built Tour Kit, so our bias is obvious. Every number in this article is sourced from public pricing pages, Vendr contract intelligence, and published engineering rate data.

```bash
npm install @tourkit/core @tourkit/react
```

## The problem: annual pricing hides 3-year compounding

Most teams evaluate onboarding tools on year-one cost. That's a mistake. SaaS contracts compound: MAU-based pricing scales non-linearly, annual increases of 5-15% are standard, and switching costs lock you in.

## The results at a glance

| MAU Tier | Appcues 3-Year | Tour Kit 3-Year | Savings |
|---|---|---|---|
| 5,000 | $53,940 | $25,599 | $28,341 (53%) |
| 25,000 | $114,000 | $25,599 | $88,401 (78%) |
| 100,000 | $264,000+ | $36,099 | $227,901+ (86%) |

Tour Kit's cost stays flat because client-side libraries don't charge per user.

## Where Appcues wins

- No frontend engineers available — visual builder is your only option
- Ship in hours, not weeks — PM can build a flow in 15 minutes
- Under 2,500 MAU and staying there — $8,964 over three years is competitive

## Where Tour Kit wins

- Cost scales with complexity, not users
- Code ownership — flows ship with your deploys
- No vendor lock-in — MIT-licensed core
- Performance — under 8KB gzipped vs 80-120KB

## Break-even

At 10K MAU with a senior React developer, break-even occurs around month 4. After that, Tour Kit is permanently cheaper.

## Recommendation

Under $10K/year Appcues contract + no frontend engineers = stay with Appcues. Above $15K/year + React developers on team = 3-year savings fund 2-3 months of engineering time.

At 25K+ MAU, Appcues costs 4-7x more over three years. That's a headcount, not a rounding error.

Full breakdown with detailed tables and methodology: [usertourkit.com/blog/tco-comparison-appcues-tour-kit](https://usertourkit.com/blog/tco-comparison-appcues-tour-kit)
