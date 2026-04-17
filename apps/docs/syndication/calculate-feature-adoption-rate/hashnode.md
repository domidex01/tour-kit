---
title: "How to calculate feature adoption rate (with code examples)"
slug: "calculate-feature-adoption-rate"
canonical: https://usertourkit.com/blog/calculate-feature-adoption-rate
tags: react, javascript, web-development, typescript
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

Feature adoption rate is the percentage of users who have meaningfully engaged with a specific product capability, calculated as `(Feature Users / Total Active Users) × 100`. As of April 2026, the median core feature adoption rate across B2B SaaS products is 16.5%, with an average of 24.5% according to Userpilot's Benchmark Report (n=181 companies).

## The standard formula

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
```

## The eligible-user variant

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

// 200 paid users / 400 paid total = 50%
// vs 200 / 1,000 all users = 20%
```

## The depth-adjusted formula

```typescript
function calculateDepthAdjustedRate(
  users: Array<{ userId: string; useCount: number; lastUsed: Date }>,
  totalActiveUsers: number,
  config = { minUses: 3, windowDays: 30 }
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

## Benchmarks

| Feature tier | Target | Median reality | Source |
|---|---|---|---|
| Core features | 60-80% | 24.5% | Userpilot 2024 |
| Secondary features | 30-50% | ~16% | Pendo |
| Niche features | 5-30% | 6.4% | Pendo |

Users don't reject features. They never find them.

## Tracking adoption in React with Tour Kit

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
]

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AdoptionProvider features={features}>{children}</AdoptionProvider>
}
```

```tsx
import { useFeature, IfNotAdopted, NewFeatureBadge } from '@tour-kit/adoption'

function ExportButton() {
  const { useCount, trackUsage, status } = useFeature('export-csv')

  return (
    <button onClick={trackUsage}>
      Export CSV
      <IfNotAdopted featureId="export-csv">
        <NewFeatureBadge>New</NewFeatureBadge>
      </IfNotAdopted>
    </button>
  )
}
```

---

Full article with all four formulas, velocity tracking, and improvement strategies: [usertourkit.com/blog/calculate-feature-adoption-rate](https://usertourkit.com/blog/calculate-feature-adoption-rate)
