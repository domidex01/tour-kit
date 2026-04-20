---
title: Roadmap
type: overview
sources:
  - ../marketing-strategy/00-roadmap.md
  - ../marketing-strategy/go-to-market.md
  - ../marketing-strategy/tour-kit-shipping-plan.md
updated: 2026-04-19
---

*Combines the marketing execution roadmap (5 phases, 23 docs) with the product launch sequence (Supabase-style multi-launch).*

## Marketing roadmap — 5 phases

### Phase 1: Foundation (Weeks 1–2)

Define who we are, who we're talking to, how we talk. Nothing else can start without them.

| Doc | Wiki page |
|---|---|
| 01 Brand Identity & Guidelines | [brand/identity.md](brand/identity.md) |
| 02 Tone of Voice | [brand/voice.md](brand/voice.md) |
| 03 Ideal Customer Profiles | [audience/icps.md](audience/icps.md) + deep dives |
| 04 Competitor Analysis | [competitors/index.md](competitors/index.md) + per-competitor pages |
| 05 Positioning & Messaging Framework | [brand/positioning.md](brand/positioning.md) |

### Phase 2: Strategy (Weeks 3–4)

Map what we do, where, when.

| Doc | Wiki page |
|---|---|
| 06 SEO & Content Strategy | [gtm/seo-content-strategy.md](gtm/seo-content-strategy.md) |
| 07 Launch Strategy | [gtm/launch-strategy.md](gtm/launch-strategy.md) |
| 08 Community Building Plan | [gtm/community-building.md](gtm/community-building.md) |
| 09 Social Media Strategy | [gtm/social-media.md](gtm/social-media.md) |
| 10 Paid Channels & Sponsorships | [gtm/paid-channels.md](gtm/paid-channels.md) |

### Phase 3: Execution assets (Weeks 5–6)

Tangible assets ready before launch day.

| Doc | Wiki page / status |
|---|---|
| 11 GitHub README Optimization | Tracked in [gtm/launch-checklist.md](gtm/launch-checklist.md) |
| 12 Landing Page & Docs Strategy | [content/landing-pages.md](content/landing-pages.md) + [content/styleguide.md](content/styleguide.md) |
| 13 Email & Waitlist Strategy | *(not yet in wiki — planned)* |
| 14 Launch Day Copy Kit | [gtm/launch-copy-kit.md](gtm/launch-copy-kit.md) |
| 15 Visual & Demo Assets | Tracked in [gtm/launch-checklist.md](gtm/launch-checklist.md) |

### Phase 4: Growth & Retention (Weeks 8–12)

Post-launch is where most dev tools stall.

| Doc | Wiki page / status |
|---|---|
| 16 Developer Relations (DevRel) Plan | *(not yet in wiki — planned)* |
| 17 Partnership & Integration Strategy | Implicit in [gtm/launch-strategy.md](gtm/launch-strategy.md) (shadcn/ui, Vercel, PostHog) |
| 18 Metrics & KPI Dashboard | [gtm/success-metrics.md](gtm/success-metrics.md) |
| 19 Pricing & Monetization Strategy | [product/licensing.md](product/licensing.md) |
| 20 Retention & Expansion Playbook | *(not yet in wiki — planned)* |

### Phase 5: Competitive moats (Ongoing)

Plays that compound and become impossible to replicate.

| Doc | Status |
|---|---|
| 21 Open Source Growth Flywheel | Principles in [gtm/community-building.md](gtm/community-building.md); not yet a full page |
| 22 Thought Leadership & Technical Content | Covered by [content/article-ideas.md](content/article-ideas.md) |
| 23 Ecosystem & Marketplace Vision | *(not yet in wiki — future)* |

## Execution timeline

```
WEEKS 1-2:  Phase 1 — Foundation (brand, voice, ICPs, competitors, positioning)
WEEKS 3-4:  Phase 2 — Strategy (SEO, launch, community, social, paid)
WEEKS 5-6:  Phase 3 — Execution assets (README, landing, emails, copy, visuals)
WEEK 7:     LAUNCH WEEK — Supabase-style multi-launch
WEEKS 8-12: Phase 4 — Growth (DevRel, partnerships, metrics, pricing, retention)
ONGOING:    Phase 5 — Moats (contributor flywheel, thought leadership, ecosystem)
```

## Product roadmap — Supabase-style launches

Each Pro package is a new launch moment, not bundled into one event. From [gtm/launch-strategy.md](gtm/launch-strategy.md):

| # | Package | Story angle |
|---|---|---|
| 1 | Core + React + Hints (main launch) | "Headless product tours for React — the open-source Appcues" |
| 2 | Analytics | "Track tour completion in PostHog, Mixpanel, Amplitude" |
| 3 | Checklists | "Onboarding checklists with task dependencies — $99, not $300/mo" |
| 4 | Announcements | "Product announcements: modals, toasts, banners, slideouts" |
| 5 | Adoption | "Feature adoption tracking and nudge system for React" |
| 6 | Media | "Embed YouTube, Vimeo, Loom, Lottie in your product tours" |
| 7 | Scheduling | "Time-based scheduling with timezone support" |
| 8+ | Future packages | Each = new PH launch, Show HN, Reddit post |

## Shipping cadence (tactical)

The technical ship sequence (4 days to v0.1.0) is in [gtm/shipping-plan.md](gtm/shipping-plan.md).

The launch-day minute-by-minute schedule is in [gtm/launch-checklist.md](gtm/launch-checklist.md).

## Current status vs plan

*(Keep this section updated as the roadmap is executed.)*

| Phase | Status |
|---|---|
| Phase 1 — Foundation | ✅ Done — all 5 documents written and refined |
| Phase 2 — Strategy | ✅ Done |
| Phase 3 — Execution assets | ⚠️ Partial — launch copy kit, content calendar, templates done; waitlist/email strategy not yet authored |
| Launch week | Pending |
| Phase 4 — Growth | Pending |
| Phase 5 — Moats | Pending |

## Gaps to fill later

- `gtm/email-waitlist.md` — waitlist-to-launch sequence, onboarding drip, Pro nurture
- `gtm/devrel.md` — conferences, meetups, podcasts
- `gtm/retention.md` — changelog communication, feature request pipeline, free→Pro triggers, referral program
- `gtm/partnerships.md` — shadcn/ui, Vercel, PostHog, Mixpanel cross-promotion
- `gtm/contributor-flywheel.md` — contributor pipeline, PR review, good-first-issue strategy

## Key strategic principles

1. Developer authenticity over marketing polish
2. Documentation IS marketing
3. Position against known incumbents
4. Launch multiple times
5. Free must be genuinely useful
6. Community before commerce
7. SEO is a compounding asset
8. One-time pricing is the wedge

Detailed in [brand/positioning.md](brand/positioning.md) and [gtm/launch-strategy.md](gtm/launch-strategy.md).

## Related

- [overview.md](overview.md) — Top-level synthesis
- [why-tourkit-wins.md](why-tourkit-wins.md) — Why this roadmap works
- [gtm/launch-strategy.md](gtm/launch-strategy.md)
- [gtm/success-metrics.md](gtm/success-metrics.md)
- [product/packages.md](product/packages.md) — What ships at each launch
