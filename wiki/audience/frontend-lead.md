---
title: Frontend Lead — Primary ICP
type: audience
sources:
  - ../../marketing-strategy/icps-and-buyers.md
  - ../../marketing-strategy/tourkit-icps.md
updated: 2026-04-19
---

*Senior React Developer / Frontend Lead. 50% of marketing effort.*

## Who

Senior FE Engineer, Frontend Lead, or Staff Engineer. Age 27–38, 5–12 years experience. Owns library selection for a 3–15 person eng team at a Series A–C SaaS (20–200 employees, $1M–$30M ARR).

## Stack

React 18/19 · Next.js 14/15 App Router · TypeScript strict · Tailwind + shadcn/ui · Zustand/Jotai · pnpm/bun · Vercel/AWS.

## Top pain points

1. React Joyride showing age — React 19 incompatibility (deprecated APIs), inline styles clash with Tailwind, broken spotlight in dark mode.
2. Vanilla JS libraries (Shepherd, Driver.js) feel wrong in React — wrapper layers, DOM conflicts with React's virtual DOM.
3. SaaS tools absurdly expensive ($249–$879/mo) with no developer control.
4. Accessibility is an afterthought in all existing options.
5. No headless option exists that lets them own the UI completely.

## Buying triggers

1. New product launch needing guided onboarding
2. Onboarding metrics tanking (activation rate, time-to-value)
3. React 19 migration breaks existing tour library
4. Cost-cutting kills SaaS subscriptions
5. Switching to shadcn/ui-based design system
6. Accessibility audit fails

## Decision process

- Evaluates in **<5 minutes on GitHub**: README, stars, last commit, TypeScript quality
- Tries in **15 minutes** in a local project
- Ships basic tour **week 1**
- Realizes need for Pro features **week 2–8**
- **$99 = impulse corporate-card buy.** No procurement process.

## Key message

> "Headless product tours for React — hooks-based, accessible, and built for the shadcn/ui era."

## Channels

Twitter/X · r/reactjs · Hacker News · This Week in React newsletter · GitHub Trending · Reactiflux Discord · shadcn Discord.

## What they care about (by the time they buy)

- TypeScript strict compliance (no `any`)
- Bundle size with a number
- Last commit date + issue response time (is this maintained?)
- Works with their router (Next App Router, React Router, TanStack Router)
- Doesn't fight Tailwind
- Accessible by default
- Can I use this without a Provider wrapping everything? (headless)

## Sales objections relevant to this ICP

See [audience/objections.md](objections.md). Most relevant:

- "Not enough GitHub stars"
- "What if maintainer abandons it?"
- "React Joyride works for us"
- "We should build our own"

## Related

- [audience/icps.md](icps.md)
- [audience/indie-hacker.md](indie-hacker.md) — Often overlaps on the small end
- [competitors/oss/react-joyride.md](../competitors/oss/react-joyride.md) — The incumbent this ICP is leaving
- [brand/positioning.md](../brand/positioning.md)
- [gtm/seo-content-strategy.md](../gtm/seo-content-strategy.md) — Comparison pages are built for this ICP
