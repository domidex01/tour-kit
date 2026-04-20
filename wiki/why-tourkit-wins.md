---
title: Why TourKit Wins — The Thesis
type: overview
sources:
  - ../marketing-strategy/positioning.md
  - ../marketing-strategy/market-analysis.md
  - ../marketing-strategy/competitive-landscape.md
  - ../marketing-strategy/go-to-market.md
updated: 2026-04-19
---

*A single-page investment thesis for TourKit. Synthesizes positioning, market, competitors, and timing into one bet.*

> If you read only one page in this wiki, read this one.

## The bet in one sentence

**TourKit becomes the default React onboarding library by owning the "headless onboarding" category in a market where no OSS player has meaningful content presence, while React 19 migration and shadcn/ui convergence create a two-year window of maximum opportunity.**

## The five conditions that must all be true

A thesis is only as strong as its weakest link. Here are the five conditions TourKit needs — each backed by existing wiki evidence.

### 1. A real market exists

- Product tour software market: **$550M (2024) → $1.32B (2033)** at 10% CAGR ([market/analysis.md](market/analysis.md))
- DAP market: $1.2B–$1.9B, 19% CAGR
- PLG adoption drives demand: 64% activation with guided onboarding vs 25% baseline
- Onboarding dropoff is 30–50% for SaaS — the pain is real, not speculative

**Verdict:** ✅ Market size and growth both support it.

### 2. A structural gap competitors can't close

| Axis | Who wins today | TourKit's position |
|---|---|---|
| Headless architecture | Nobody (all OSS and all SaaS render their own DOM) | **Default mode** |
| shadcn/ui native | Nobody | **Native** |
| TypeScript strict | Partial (Joyride, some types for Shepherd) | **Strict across all 10 packages** |
| WCAG 2.1 AA | Minimal (none certified) | **Certified, Lighthouse 100** |
| $99 once vs $300/mo | Intro.js charges $9.99–$299 one-time but is legacy DOM and AGPL | **$99 + MIT free tier** |
| 10-package breadth | No OSS competitor has this; SaaS has it but at $250–$900/mo | **Yes, at $99 once** |

SaaS incumbents (Appcues, UserGuiding, Userpilot, Pendo) **cannot go headless** — it would cannibalize their $300/mo revenue. OSS incumbents (Joyride, Shepherd, Intro.js) **cannot easily add 7 Pro packages** — they're single-maintainer projects. **This gap is structural, not temporary.**

See [competitors/index.md](competitors/index.md), [brand/positioning.md](brand/positioning.md).

### 3. Timing is exceptional

Three forcing functions converge in 2026:

1. **React 19 migration** — React Joyride (680K weekly downloads) is broken. Every upgrade triggers a "what's the alternative?" moment. **This window lasts until Joyride fixes it or dies — ~12–24 months.**
2. **shadcn/ui convergence** — The 2026 indie stack has crystallized (Next.js + TS + Tailwind + shadcn). TourKit is built natively for this *exact* stack. No legacy cruft.
3. **SaaS cost fatigue** — Companies are actively cutting $5K–$50K/year in SaaS spend. One-time OSS pricing is gaining traction (Tailwind UI $299, Laravel Spark $99).

Plus: **zero OSS library has meaningful content presence** for product-tour keywords. SaaS companies dominate SEO because no OSS project has invested in content marketing for the category. This SEO vacuum is a one-time asset — whoever shows up first and invests seriously owns it.

See [market/analysis.md](market/analysis.md) §6, [gtm/seo-content-strategy.md](gtm/seo-content-strategy.md).

### 4. A believable path to capture the market

The plan isn't "build it and they will come." It's a specific, sequenced set of moves:

| Move | Why it works |
|---|---|
| **Supabase-style multi-launch** — each Pro package = new launch moment | 8+ launches vs 1 = 8x the attention surface |
| **Position as "open-source Appcues"** | Cal.com/Calendly and Supabase/Firebase prove this framing works |
| **Comparison-page SEO blitz** — vs Joyride, Appcues, Shepherd, etc. | Every page compounds traffic for years; SaaS incumbents can't write these authentically |
| **Migration guides** — Joyride → TourKit, Appcues → TourKit | Captures high-intent "leaving X" traffic; zero education needed |
| **Newsletter sponsorships** (This Week in React, React Status) | Highest ROI paid channel for dev tools |
| **Documentation-led growth** — docs IS marketing | shadcn, Tailwind, Supabase all grew this way |
| **Shoutouts to dependencies** on launch day (Floating UI, shadcn, Radix, Turborepo) | Dub.co's playbook — each gets retweeted by their audiences |

See [gtm/launch-strategy.md](gtm/launch-strategy.md), [gtm/seo-content-strategy.md](gtm/seo-content-strategy.md), [migration/index.md](migration/index.md).

### 5. The economics work

- **$99 one-time** + zero marginal cost = sustainable at any volume
- **Year 1 SOM: $50K–$200K** (500–2,000 Pro licenses) from a SAM of ~$165M
- **CAC target <$25** = achievable via organic content + newsletter sponsorships
- **Tailwind UI precedent** — $2M+ revenue after millions of free installs proves the free-core + paid-extras model works in this ecosystem
- **No procurement needed** — $99 is impulse corporate-card, no sales cycle

See [market/analysis.md](market/analysis.md) §4–5, [product/licensing.md](product/licensing.md).

## What could kill the bet

| Risk | Severity | Mitigation |
|---|---|---|
| **OnboardJS captures "open-source Appcues" position first** | Medium | Move fast on content/SEO; launch with more packages (8 vs their limited set) |
| **React Joyride v3 stabilizes + regains trust** | Medium | Ship superior DX, headless, extended features they can't replicate |
| **Solo-maintainer burnout** | **High** | Build contributor community early ([gtm/community-building.md](gtm/community-building.md)); keep scope focused |
| **One-time pricing doesn't sustain development** | Medium | Volume play + potential enterprise tier + consulting revenue |
| **SaaS players build headless modes** | Low | They won't cannibalize $300/mo revenue |

See [market/analysis.md](market/analysis.md) §6.

## Who believes what

The thesis lands differently across ICPs:

| ICP | What they believe after reading TourKit's pitch |
|---|---|
| **Frontend Lead** | "This is the React 19–ready headless tour library that doesn't fight my stack." → evaluates on GitHub in <5 min, tries in 15, ships in week 1 |
| **Indie Hacker** | "$99 once instead of $300/mo? Works with shadcn? Ships in an afternoon? Sold." |
| **Product Manager** | "Same features as Appcues, 97–99% cheaper, and my eng team will actually be happy? I'll build the business case." |

See [audience/icps.md](audience/icps.md).

## Why this doesn't work in 2028

- React 19 migration window closes as Joyride either fixes itself or gets replaced by others
- OnboardJS or another entrant may establish the "headless onboarding" category first
- SaaS cost fatigue may cycle back to "trust the platform" sentiment
- shadcn/ui may fragment or lose default-status as React fashion evolves

**Speed matters.** The thesis is strongest now. Every month of delay loses share of the fixed opportunity window.

## The investment test (am I still in?)

Re-read this page every quarter. Ask:

1. Is the market still $550M+ and growing? → check latest [market/analysis.md](market/analysis.md) sources
2. Is the competitive gap still structural? → read [competitors/index.md](competitors/index.md); look for headless moves from SaaS or breadth moves from OSS
3. Are we still first-mover in content? → check SEO rankings for "react joyride alternative", "appcues alternative open source", "headless onboarding"
4. Are we building community velocity? → GitHub stars, issue response time, contributor count ([gtm/success-metrics.md](gtm/success-metrics.md))
5. Is the maintainer burning out? → honest answer. If yes, that's the thesis-killing risk.

If all five are yes → keep going. If two or more are no → revisit the thesis.

## Related

- [overview.md](overview.md) — Shorter product-level summary
- [roadmap.md](roadmap.md) — How the plan is sequenced
- [market/analysis.md](market/analysis.md) — Backing evidence
- [brand/positioning.md](brand/positioning.md) — The positioning that follows from this thesis
- [competitors/index.md](competitors/index.md) — The structural gap visualized
- [gtm/launch-strategy.md](gtm/launch-strategy.md) — How we execute it
- [audience/icps.md](audience/icps.md) — Who we're selling to
