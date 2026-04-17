---
title: "Every onboarding KPI explained with formulas and benchmarks"
published: false
description: "The average SaaS activation rate is 36%. Two-thirds of signups leave without experiencing core value. Here's every onboarding metric worth tracking, with the formula and benchmark data for each."
tags: react, saas, webdev, productivity
canonical_url: https://usertourkit.com/blog/onboarding-metrics-explained
cover_image: https://usertourkit.com/og-images/onboarding-metrics-explained.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-metrics-explained)*

# Onboarding metrics explained: every KPI with formulas

Most SaaS teams measure signups and churn. Everything between those two numbers is onboarding, and most teams fly blind through it.

As of April 2026, 59% of SaaS buyers regret at least one software purchase made in the past 18 months ([Gartner](https://www.gartner.com/en/digital-markets/insights/software-buying-trends)). That regret almost always crystallizes during onboarding, the first 7 to 30 days where users decide if your product is worth keeping or not.

This guide covers every onboarding metric worth tracking. Each section includes the formula, real benchmark data, and how to instrument it.

## The four categories of onboarding metrics

**Activation metrics** measure whether users reached your product's core value. User activation rate, time to value, and feature adoption rate belong here.

**Engagement metrics** measure whether users come back after the initial onboarding window. Tour completion rate, DAU/MAU ratio, and retention curves track habit formation.

**Satisfaction metrics** capture qualitative user sentiment. NPS, CSAT, and CES tell you how users feel about the experience.

**Business impact metrics** connect onboarding to revenue. ROI calculations, trial-to-paid conversion, and support ticket reduction.

---

## Activation metrics

### User activation rate

The single most important onboarding metric. As of April 2026, the average SaaS activation rate sits at 36% ([Userpilot](https://userpilot.com/blog/user-activation-for-saas/)).

**Formula:**

```
Activation Rate = (Users who completed activation event / Total new signups) x 100
```

| Rating | Activation rate | What it means |
|--------|----------------|---------------|
| Poor | <20% | Onboarding is broken |
| Average | 20-40% | Industry norm |
| Good | 40-60% | Effective onboarding |
| Excellent | 60%+ | Top-tier |

### Time to value (TTV)

Measures the elapsed time between first login and the moment users experience core value. Teams that measure TTV instead of completion rate see 15-25% higher trial-to-paid conversion.

**Formula:**

```
TTV = Timestamp of activation event - Timestamp of first login
```

Cross-industry average across 547 SaaS companies: 1 day, 12 hours, 23 minutes ([Userpilot](https://userpilot.com/blog/time-to-value-benchmark-report-2024/)).

### Feature adoption rate

```
Feature Adoption Rate = (Users who used feature / Total active users) x 100
```

Core features should hit 80%+ adoption. Below 40% means your onboarding isn't surfacing it.

---

## Engagement metrics

### Tour completion rate

The average sits at 61% across 15 million interactions ([Chameleon, 2025](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)).

```
Tour Completion Rate = (Users who finished all steps / Users who started) x 100
```

What matters more: *where* users drop off, not the topline number.

### DAU/MAU ratio (stickiness)

```
DAU/MAU Ratio = (Daily Active Users / Monthly Active Users) x 100
```

| Product category | Median DAU/MAU | Top quartile |
|-----------------|---------------|-------------|
| Social / messaging | 30-50% | 60%+ |
| SaaS / productivity | 10-20% | 25%+ |
| E-commerce | 5-10% | 15%+ |

### Retention curves

```
Week N Retention = (Users active in week N / Users in original cohort) x 100
```

Products with structured onboarding retain 2.6x more users at week 4 ([Appcues 2024](https://www.appcues.com/blog/onboarding-benchmarks)).

---

## Satisfaction metrics

### NPS

```
NPS = % Promoters - % Detractors
```

Asking NPS during onboarding (day 3-7) captures onboarding quality. Asking after (day 30+) captures product quality. Different measurements.

### CSAT

```
CSAT = (Satisfied responses / Total responses) x 100
```

Best triggered after specific milestones.

### CES (customer effort score)

The strongest predictor of customer loyalty, stronger than CSAT or NPS ([Gartner](https://www.gartner.com/en/customer-service-support/insights/customer-effort-score)).

```
CES = Sum of all scores / Number of responses
```

Above 5.0 = low friction. Below 4.0 = problem.

---

## Business impact metrics

### Onboarding ROI

```
ROI = ((Revenue impact - Total cost) / Total cost) x 100
```

Revenue impact decomposes into: activation lift revenue, churn prevention savings, support ticket reduction, and expansion revenue acceleration.

### Trial-to-paid conversion

| Trial model | Median conversion | With guided onboarding |
|------------|------------------|----------------------|
| Free trial (no card) | 8-12% | 15-20% |
| Free trial (card required) | 45-55% | 55-65% |
| Freemium | 3-5% | 5-8% |

---

## Best practices (quick version)

1. Define activation before instrumentation
2. Measure at step level, not just tour level
3. Pair quantitative metrics with qualitative surveys
4. Segment by user cohort, not just time period
5. Set benchmark targets by product complexity
6. Review metrics weekly, not monthly
7. Test one variable at a time
8. Track leading and lagging indicators together

---

Full article with all formulas, benchmark tables, code examples, and links to 23 deep-dive guides: [usertourkit.com/blog/onboarding-metrics-explained](https://usertourkit.com/blog/onboarding-metrics-explained)
