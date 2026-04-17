# The Real Cost of Product Tour Onboarding: DIY vs Library vs SaaS

## A three-year TCO analysis with actual numbers

*Originally published at [usertourkit.com](https://usertourkit.com/blog/build-vs-buy-product-tour-calculator)*

Every product team hits the same crossroads: build onboarding from scratch, install an open-source library, or pay for a SaaS platform. The usual advice is to "just buy" and move on. But that advice comes from the vendors selling you the subscription.

We ran the numbers across all three paths and found the answer depends on four variables: your team's hourly rate, your MAU count, how many tours you maintain, and your time horizon.

Disclosure: we built Tour Kit, an open-source headless tour library. That makes us biased toward the library path. Every number below is sourced.

## The problem: build-vs-buy is a false binary

Most articles frame this as two options. But product tour implementation has three distinct paths with very different cost curves.

As of April 2026, 35% of enterprises have replaced at least one SaaS tool with a custom build, and 78% plan to build more this year (Retool 2026 Report). The framing misses a third category: headless libraries.

Building from scratch means writing tooltip positioning, overlay rendering, step sequencing, keyboard navigation, scroll handling, and focus trapping yourself. That's two to three engineers and two to six months.

A headless library handles the logic while you render UI with your own components. One engineer, two to four weeks.

SaaS means embedding a third-party script and paying per monthly active user. Fast to deploy, but you give up design control and code ownership.

## Year-one numbers

Using a US-based senior React developer at $150/hour:

- DIY: $70,000-$85,000 (including $25K maintenance)
- Headless library: $18,000-$36,000
- SaaS: $6,000-$54,000 (Appcues $249-$879/mo; Pendo $15K-$48K/yr)

Year one favors SaaS for small teams.

## The three-year plot twist

But costs diverge sharply over 36 months. Maintenance compounds on DIY builds. Per-MAU pricing scales against you on SaaS.

Three-year totals:
- DIY: $142,500
- Library: $48,000
- SaaS at 10K MAUs: $36,000
- SaaS at 50K MAUs: $99,000+

The crossover between SaaS and library falls between 10K and 25K MAUs. IBM research shows maintenance consumes 50-75% of total software costs over a product's lifetime.

## The Atlassian case study

Atlassian's internal onboarding build cost $3 million over three years. Staffing grew from 3 to 7 people. Infrastructure hit $200K-$500K annually. And the team still couldn't iterate fast enough.

Their scale is unusual, but the pattern is common: the build starts small, scope creeps, and the team meant to build features ends up maintaining onboarding infrastructure.

## When each path wins

SaaS wins for teams without frontend engineers, under 5K MAUs, and when a PM needs to ship tours without code changes.

A headless library wins for React teams that care about design consistency and plan to scale past 10K MAUs.

DIY wins only for genuinely novel use cases where no library or SaaS exists.

## The AI factor

AI coding tools have reduced build timelines by 30-50%. But they don't eliminate the maintenance multiplier. AI makes the initial build cheaper. It doesn't make ongoing maintenance disappear.

The interesting twist: AI also makes library-based approaches stronger. You can use AI to generate tour configurations while the library handles positioning, scroll handling, and focus trapping.

Full article with comparison tables, TCO formulas, code examples, and decision framework: [usertourkit.com/blog/build-vs-buy-product-tour-calculator](https://usertourkit.com/blog/build-vs-buy-product-tour-calculator)

**Suggested publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
