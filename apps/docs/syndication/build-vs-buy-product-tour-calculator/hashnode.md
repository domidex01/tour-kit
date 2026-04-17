---
title: "The developer's calculator: DIY tour vs library vs SaaS"
slug: "build-vs-buy-product-tour-calculator"
canonical: https://usertourkit.com/blog/build-vs-buy-product-tour-calculator
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/build-vs-buy-product-tour-calculator)*

# The developer's calculator: DIY tour vs library vs SaaS

Every product team hits the same crossroads: build onboarding from scratch, install an open-source library, or pay for a SaaS platform. The usual advice is to "just buy" and move on. But that advice comes from the vendors selling you the subscription. We ran the numbers across all three paths and found the answer depends on four variables: your team's hourly rate, your MAU count, how many tours you maintain, and your time horizon.

Disclosure: we built Tour Kit. That makes us biased toward the library path. Every number below is sourced, and you can plug in your own inputs to check our work.

## The problem: build-vs-buy is a false binary

As of April 2026, 35% of enterprises have replaced at least one SaaS tool with a custom build, and 78% plan to build more this year. The binary framing misses a third category: headless libraries that sit between DIY and SaaS.

**Build from scratch:** tooltip positioning, overlay rendering, step sequencing, keyboard nav, scroll handling, focus trapping, analytics. Two to three engineers, two to six months.

**Headless library:** handles logic (positioning, state, accessibility), you render UI with your components. One engineer, two to four weeks.

**SaaS platform:** embed script, visual builder, pay per MAU. Ship a tour in 15 minutes. Give up design control and code ownership.

## Year-one cost comparison

| Cost component | DIY | Library | SaaS |
|---|---|---|---|
| License | $0 | $0 (MIT) or $99 one-time | $3K-$48K/yr |
| Initial engineering | $45K-$60K | $12K-$24K | $3K-$6K |
| Maintenance (year 1) | $25K+ | $6K-$12K | $0 |
| **Year 1 total** | **$70K-$85K** | **$18K-$36K** | **$6K-$54K** |

## Three-year TCO: where the lines cross

| 3-year TCO | DIY | Library | SaaS (10K MAUs) | SaaS (50K MAUs) |
|---|---|---|---|---|
| **Total** | **$142,500** | **$48,000** | **$36,000** | **$99,000+** |

SaaS wins at 10K MAUs. Library wins above 25K. Above 100K MAUs, SaaS exceeds $100K over three years for code you don't own.

## The formulas

**DIY:**
```
initial = engineers * rate * hours/week * weeks
maintenance = initial * 0.20/year
total = initial + (maintenance * 3) + framework_upgrades
```

**Library:**
```
integration = 1 * rate * hours/week * weeks
maintenance = integration * 0.15/year
total = integration + (maintenance * 3) + $99
```

**SaaS:**
```
total = setup + (monthly_price * 12 * 3)
```

## The decision framework

**Choose DIY** for genuinely novel use cases (AR, 3D, non-web).

**Choose a library** if you have React devs, care about design consistency, and plan to scale past 10K MAUs.

**Choose SaaS** if no frontend engineers, need tours this week, under 10K MAUs.

**Choose nothing** if tooltips and empty states handle the job.

Full article with all data sources, code examples, and the Atlassian $3M case study: [usertourkit.com/blog/build-vs-buy-product-tour-calculator](https://usertourkit.com/blog/build-vs-buy-product-tour-calculator)
