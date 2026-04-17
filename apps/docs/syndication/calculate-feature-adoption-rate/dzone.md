---
title: "How to Calculate Feature Adoption Rate: 4 Formulas With TypeScript"
canonical_url: https://usertourkit.com/blog/calculate-feature-adoption-rate
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/calculate-feature-adoption-rate)*

# How to Calculate Feature Adoption Rate: 4 Formulas With TypeScript

Feature adoption rate measures what percentage of your users have meaningfully engaged with a specific capability. The keyword is "meaningfully." A user clicking a button once during an accidental hover isn't adoption.

This tutorial walks through the standard formula, three variants that account for real-world complexity, and working code you can drop into your codebase today.

## The Four Formulas

### Standard

```
(Feature Users / Total Active Users) × 100
```

Works for universally available features. 300 users tried chat out of 1,000 total = 30%.

### Eligible-User Variant

```
(Feature Users / Eligible Users) × 100
```

For gated features (plan tier, role, permissions). 200 paid users out of 400 paid total = 50% vs 20% against all 1,000 users.

### Depth-Adjusted

Filter by minimum engagement threshold before counting a user as "adopted." The industry convention is 3 uses within 30 days, but the right threshold depends on the feature.

### Velocity

```
(Rate at T2 - Rate at T1) / Days Between
```

Top-quartile enterprise SaaS products hit 7-10% daily velocity during core feature launches.

## Benchmarks

The median core feature adoption rate across B2B SaaS is 16.5%, with an average of 24.5% (Userpilot Benchmark Report 2024, n=181 companies).

| Feature Tier | Target | Median Reality |
|---|---|---|
| Core features | 60-80% | 24.5% |
| Secondary features | 30-50% | ~16% |
| Niche features | 5-30% | 6.4% |

The gap between target and reality for core features represents a discoverability problem, not a feature quality problem.

## Five Ways to Improve

1. Fix discoverability first — verify users can find the feature before assuming they don't want it
2. Segment your denominator — use eligible users, not total users
3. Set different thresholds per feature type
4. Measure time-to-adopt, not just adoption rate
5. Check accessibility — inaccessible features have artificially low adoption rates

---

Full article with TypeScript implementations, React hooks, and tool comparison: [usertourkit.com/blog/calculate-feature-adoption-rate](https://usertourkit.com/blog/calculate-feature-adoption-rate)
