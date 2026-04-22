---
title: "4 ways to calculate feature adoption rate (TypeScript + React examples)"
published: false
description: "The standard formula gives you one number. The eligible-user, depth-adjusted, and velocity variants each tell a different story from the same data. Here's all four with TypeScript code."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/calculate-feature-adoption-rate
cover_image: https://usertourkit.com/og-images/calculate-feature-adoption-rate.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/calculate-feature-adoption-rate)*

# How to calculate feature adoption rate (with code examples)

You shipped a new feature last sprint. Product wants to know if anyone's using it. The PM asks for "the adoption rate." Sounds straightforward until you realize there are at least four different formulas, each producing a different number from the same data.

Feature adoption rate measures what percentage of your users have meaningfully engaged with a specific capability. The keyword is "meaningfully." A user clicking a button once during an accidental hover isn't adoption. Getting this metric right determines whether your team invests more in the feature or kills it.

This tutorial walks through the standard formula, three variants that account for real-world complexity, and working React code you can drop into your codebase today.

```bash
npm install @tour-kit/adoption @tour-kit/react
```

## What is feature adoption rate?

Feature adoption rate is the percentage of users who have meaningfully engaged with a specific product capability, calculated as `(Feature Users / Total Active Users) × 100`. As of April 2026, the median core feature adoption rate across B2B SaaS products is 16.5%, with an average of 24.5% according to Userpilot's Benchmark Report (n=181 companies). Most teams overestimate their rates because they count anyone who saw the feature, not those who actually used it.

## Why feature adoption rate matters for React teams

Product analytics tools hand you page views and click counts, but adoption rate answers the harder question: are users actually getting value from what you built? When we tracked adoption across Tour Kit's own feature set, the gap between "clicked once" and "used three times" cut our numbers by more than half. That distinction drives three concrete decisions.

First, resource allocation. A feature with 6% adoption across 10,000 MAUs means 9,400 people ignore it. Either the feature is poorly discoverable, solves the wrong problem, or targets the wrong audience. Each diagnosis leads to a different fix.

Second, churn prediction. Users who adopt new features are 31% less likely to churn than those who don't ([Chameleon, 2025](https://www.chameleon.io/blog/advanced-feature-adoption)). Identify non-adopters early and you can intervene with targeted onboarding before they leave.

Third, the 30-day cliff. Andrew Chen's research shows 90% of mobile users disappear within 30 days. For web apps the curve is less steep, but the principle holds: feature discovery in the first week matters more than monthly adoption rates.

## How to calculate feature adoption rate

Four distinct formulas exist for calculating feature adoption rate, each producing a different number from identical data.

### The standard formula

```typescript
type AdoptionResult = {
  rate: number
  featureUsers: number
  totalUsers: number
}

function calculateAdoptionRate(
  featureUsers: number,
  totalActiveUsers: number
): AdoptionResult {
  if (totalActiveUsers === 0) return { rate: 0, featureUsers: 0, totalUsers: 0 }

  return {
    rate: (featureUsers / totalActiveUsers) * 100,
    featureUsers,
    totalUsers: totalActiveUsers,
  }
}

// Example: 300 users tried chat / 1,000 total = 30%
const result = calculateAdoptionRate(300, 1000)
// → { rate: 30, featureUsers: 300, totalUsers: 1000 }
```

### The eligible-user variant

When a feature is restricted by plan tier, user role, or permissions, using total active users as the denominator deflates your rate.

```typescript
function calculateEligibleAdoptionRate(
  featureUsers: number,
  eligibleUsers: number
): AdoptionResult {
  if (eligibleUsers === 0) return { rate: 0, featureUsers: 0, totalUsers: 0 }

  return {
    rate: (featureUsers / eligibleUsers) * 100,
    featureUsers,
    totalUsers: eligibleUsers,
  }
}

// 200 paid users tried the feature / 400 paid users total = 50%
// vs 200 / 1,000 all users = 20% — very different signal
```

[Smashing Magazine's TARS framework](https://www.smashingmagazine.com/2025/12/how-measure-impact-features-tars/) goes further, defining "target users" as those who actually have the problem the feature solves (a subset of even eligible users).

### The depth-adjusted formula

```typescript
type DepthConfig = {
  minUses: number
  windowDays: number
}

function calculateDepthAdjustedRate(
  users: Array<{ userId: string; useCount: number; lastUsed: Date }>,
  totalActiveUsers: number,
  config: DepthConfig = { minUses: 3, windowDays: 30 }
): AdoptionResult {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - config.windowDays)

  const adopters = users.filter(
    (u) => u.useCount >= config.minUses && u.lastUsed >= cutoff
  )

  return {
    rate: totalActiveUsers === 0 ? 0 : (adopters.length / totalActiveUsers) * 100,
    featureUsers: adopters.length,
    totalUsers: totalActiveUsers,
  }
}
```

### Adoption velocity

```typescript
function calculateAdoptionVelocity(
  rateAtT1: number,
  rateAtT2: number,
  daysBetween: number
): number {
  return (rateAtT2 - rateAtT1) / daysBetween
}

// Week 1: 5% adoption. Week 2: 12% adoption.
const velocity = calculateAdoptionVelocity(5, 12, 7)
// → 1.0 percentage points/day — healthy launch curve
```

## Benchmarks: what good looks like

| Feature tier | Target adoption | Median reality | Source |
|---|---|---|---|
| Core / defining features | 60-80% | 24.5% | Userpilot 2024 |
| Secondary features | 30-50% | ~16% | Pendo benchmark |
| Niche / advanced features | 5-30% | 6.4% | Pendo all-feature median |

Pendo considers 28% a "good" adoption rate for core features. The top 10% of products hit 15.6% across all features — 2.5x the industry average of 6.4%.

One data point that should bother you: the gap between target (60-80%) and reality (24.5%) for core features. Users don't reject features. They never find them.

## How to track feature adoption rate in React

### Using @tour-kit/adoption

```tsx
import { AdoptionProvider } from '@tour-kit/adoption'
import type { Feature } from '@tour-kit/adoption'

const features: Feature[] = [
  {
    id: 'dark-mode',
    name: 'Dark mode',
    trigger: '[data-feature="dark-mode"]',
    adoptionCriteria: { minUses: 3, recencyDays: 30 },
    category: 'settings',
  },
  {
    id: 'export-csv',
    name: 'CSV export',
    trigger: { event: 'export:csv' },
    adoptionCriteria: { minUses: 1, recencyDays: 60 },
    category: 'data',
    priority: 2,
  },
]

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdoptionProvider features={features}>
      {children}
    </AdoptionProvider>
  )
}
```

Then query adoption state from any component:

```tsx
import { useFeature, IfNotAdopted, NewFeatureBadge } from '@tour-kit/adoption'

function ExportButton() {
  const { isAdopted, useCount, trackUsage, status } = useFeature('export-csv')

  return (
    <div>
      <button onClick={trackUsage}>
        Export CSV
        <IfNotAdopted featureId="export-csv">
          <NewFeatureBadge featureId="export-csv" text="New" />
        </IfNotAdopted>
      </button>
      {status === 'exploring' && <span>Used {useCount} times</span>}
    </div>
  )
}
```

## Five ways to improve feature adoption rate

1. **Fix discoverability first.** "Sometimes low feature adoption has nothing to do with the feature itself, but rather where it sits in the UI." (Smashing Magazine TARS)
2. **Segment your denominator.** Use eligible-user or target-user formula instead of total users.
3. **Set different thresholds per feature type.** A search bar vs a quarterly report need different adoption criteria.
4. **Measure time-to-adopt, not just adoption rate.** Litmus saw a 22x increase by targeting users within their first 72 hours.
5. **Check accessibility.** Features with accessibility gaps have artificially low adoption rates.

---

Full article with all code examples and comparison tables: [usertourkit.com/blog/calculate-feature-adoption-rate](https://usertourkit.com/blog/calculate-feature-adoption-rate)
