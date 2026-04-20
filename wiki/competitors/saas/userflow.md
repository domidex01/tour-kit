---
title: Userflow
type: competitor
sources:
  - ../../../marketing-strategy/Articles/competitors/14-userflow.md
updated: 2026-04-19
---

*Best-in-class visual onboarding builder. 4.9/5 G2. Acquired by Beamer Feb 2024 (~$60M).*

## Stats

| | |
|---|---|
| Startup tier | $240/mo |
| Pro tier | $680/mo (183% jump from Startup) |
| MAU overage | $80/mo per additional 5,000 MAUs (50% discount above 100K) |
| G2 | 4.9/5 |
| Ease of use (G2) | 9.3/10 (vs Appcues 8.7) |
| Customer support (G2) | 9.8/10 |

## Annual cost at scale

| MAU | Userflow Startup | Userflow Pro | TourKit |
|---|---|---|---|
| 5,000 | $3,840/yr | $8,160/yr | $0–99 once |
| 10,000 | $4,800/yr | $8,160/yr | $0–99 once |
| 50,000 | $12,480/yr | $15,840/yr | $0–99 once |

3-year TCO at 10K MAUs on Userflow Pro: **$24,480** + external analytics (Mixpanel/Amplitude).

## Strengths

- **Best-in-class visual builder** — Kanban-style drag-and-drop canvas. Reviewers: "feels like a game."
- **AI Smartflows** — auto-generate 30-step tours from recorded clicks
- **One-click AI localization** (Pro)
- **Resource center** (built-in)
- **Comprehensive integrations** — HubSpot, Salesforce, Amplitude, Mixpanel, Segment
- **Strong segmentation** — attributes, events, cohorts
- **Customer support quality** — 9.8/10 on G2

## Weaknesses

- **Pricing cliff** — Startup → Pro is $240 → $680 (183% increase). Custom CSS, event tracking, unlimited surveys, localization all gated to Pro.
- **Shallow analytics** — tracks completion only, no funnels / behavior / session replay. Must bolt on Mixpanel or Amplitude.
- **Design customization ceiling** — renders own DOM overlay. Even with Pro Custom CSS, cannot pixel-match shadcn/Tailwind.
- **CDN runtime dependency** — ~15KB stub + full SDK from CDN at runtime. Hard dependency on Userflow servers for core UX.
- **No mobile SDK** — web only. iOS/Android teams need separate vendor.
- **Canvas builder, not in-app editor** — unlike Chrome-extension tools; learning curve, feels disconnected.
- **Brand-name SEO collision** — "user flow" is a ubiquitous UX design term. Zero organic Reddit discussions about Userflow the product.

## Feature matrix (key)

| | Userflow | TourKit |
|---|---|---|
| Product tours | Visual builder | Type-safe code |
| Checklists | Built-in | Pro |
| NPS surveys | All plans (2 Q on Startup, unlimited Pro) | — |
| Analytics | Basic (no funnels) | Pro |
| AI flow generation | Smartflows | — |
| Localization | Pro only (AI) | Manual i18n |
| A/B testing | Attribute-based | — |
| Custom design system | Overlay DOM + CSS on Pro | Native shadcn, Radix, Base UI |
| TypeScript | SDK types only | Full inference |
| Bundle | ~15KB stub + async CDN | <8KB core, <12KB react |
| WCAG | Not documented | WCAG 2.1 AA, Lighthouse 100 |
| Self-hosted | No — CDN dependent | Yes (default) |
| Open source | No | MIT (core + react + hints) |
| Integrations | Segment, HubSpot, Amplitude, Mixpanel, Salesforce | Bring your own |

## Usertour.io (different company)

**Usertour.io ≠ Userflow.** Separate company, Singapore-based. Positions as "open-source alternative to Userflow and Appcues." Built on React + TS + Tailwind + shadcn + Prisma + Postgres. ~1,900 GitHub stars. AGPL-3.0, Docker self-host, cloud free–$249/mo.

**Threat to TourKit:** Low — Usertour is a self-hostable visual-builder platform, not a code-first library. Renders own overlay widgets, not headless. Doesn't integrate with design systems. Real risk: category confusion in "open source onboarding" search results — **TourKit must clearly own "headless onboarding" as a category term.**

## When Userflow genuinely wins

- Product-manager-led (not engineering-led) teams — visual builder is transformative
- Speed of iteration outweighs design fidelity — AI Smartflows generate 30-step tours from clicks in minutes
- Complex multi-step onboarding with branching, segmentation, conditional targeting
- Integrations matter more than customization (HubSpot / Salesforce / Amplitude out of the box)
- Budget exists and team values time over money — at $240–$680/mo, less than a day of senior eng time/month

## Where TourKit wins

- Developer-led React teams wanting onboarding architecturally part of the app
- Pixel-perfect shadcn/Tailwind/Radix fidelity
- Strict performance budgets (<8KB vs 15KB + CDN)
- Content must not depend on third-party CDN
- TypeScript type safety across entire onboarding config
- Zero vendor lock-in, self-hosted by default

## Content opportunities (specific to Userflow)

1. **Developer's guide to headless onboarding** — target "headless onboarding library" / "headless product tour" (near-zero competition)
2. **Userflow vs open-source: cost + control for engineering teams** — transparent 3-year TCO at 5K/10K/50K MAUs
3. **Best React product tour libraries in 2026 — honest** — all existing listicles are vendor-biased (Chameleon, UserGuiding, Whatfix)
4. **Build vs buy onboarding: real math for SaaS teams** — ROI calculator; flip the "just buy SaaS" narrative
5. **Open-source alternatives to Userflow, Appcues, Pendo** — categorize libraries (TourKit, Joyride, Driver.js) vs platforms (Usertour.io)

## Keywords

- "userflow alternative" (low–med competition, high intent)
- "userflow alternative open source" (10–50/mo, very low competition)
- "userflow pricing" (med competition)
- "react product tour library" (200–500/mo, med)
- "headless onboarding library" (10–50/mo, near-zero competition — **own this category**)

## Related

- [competitors/index.md](../index.md)
- [competitors/saas/userpilot.md](userpilot.md) — Similar segment
- [competitors/saas/appcues.md](appcues.md)
- [competitors/oss/new-entrants.md](../oss/new-entrants.md) — OnboardJS positioning + Usertour.io category confusion risk
- [gtm/seo-content-strategy.md](../../gtm/seo-content-strategy.md)
