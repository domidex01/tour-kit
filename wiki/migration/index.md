---
title: Migration Guides
type: content
sources:
  - ../../marketing-strategy/competitive-landscape.md
  - ../../marketing-strategy/Articles/competitors/
updated: 2026-04-19
---

*How to move existing onboarding code from each competitor to TourKit. Targets migration-intent keywords ("[competitor] to react", "migrate from [competitor]").*

## Why migration guides matter

- **High intent:** someone searching "migrate from Joyride" has already decided to leave. Zero education needed.
- **SEO compounds:** each guide is a long-tail asset that ranks for years.
- **Social proof:** writing the guide shows we understand the competitor deeply (not just bashing them).

## Guides

| From | Priority | Key angle |
|---|---|---|
| [from-react-joyride.md](from-react-joyride.md) | **P0** | React 19 incompatibility forces migrations now |
| [from-appcues.md](from-appcues.md) | P0 | Cost angle ($3K–$10K/yr → $99 once) + own-the-code |
| [from-shepherd-js.md](from-shepherd-js.md) | P1 | AGPL license dealbreaker; React-native vs wrapper |
| [from-intro-js.md](from-intro-js.md) | P1 | AGPL + dated DOM-based approach; React-native alternative |

## Guides to add later

| From | Reason |
|---|---|
| from-driver-js.md | Vanilla JS → React-native hooks |
| from-userguiding.md | Same pattern as Appcues |
| from-userpilot.md | Same pattern; also hits the "15–25 hrs/mo broken flows" angle |
| from-pendo.md | Enterprise DAP → lightweight library (narrower use case) |
| from-reactour.md | Abandoned library → maintained alternative |
| from-onborda.md | Next.js-only → any-React with more packages |

## Structure (each guide follows this)

1. **Why migrate** — specific pain points from the competitor (pulled from the competitor wiki page)
2. **Feature mapping** — table: "If you use X in [competitor], you'll use Y in TourKit"
3. **Side-by-side API** — code before / code after, same tour
4. **Migration steps** — numbered, minimal, runnable
5. **Common pitfalls** — what typically breaks, how to fix
6. **What TourKit does NOT do** — honest limitations (per [brand/voice.md](../brand/voice.md))
7. **Resources** — docs links, comparison page link, further reading

## Publication workflow

1. Draft in this wiki (`migration/from-*.md`)
2. Refine against the competitor wiki page ([competitors/](../competitors/index.md)) for accuracy
3. Run through [brand/voice.md](../brand/voice.md) checklist
4. Ship to `apps/docs/content/docs/migrate/from-[slug].mdx` (add to docs site)
5. Link from the comparison page (`apps/docs/content/compare/tour-kit-vs-[slug].mdx`)
6. Cross-post to Dev.to, r/reactjs (per [gtm/content-calendar.md](../gtm/content-calendar.md))

## Related

- [competitors/index.md](../competitors/index.md)
- [content/comparison-drafts.md](../content/comparison-drafts.md) — Comparison pages that these migration guides link to
- [gtm/seo-content-strategy.md](../gtm/seo-content-strategy.md) — Migration is Pillar #2
- [brand/voice.md](../brand/voice.md)
