---
title: Brand Identity
type: brand
sources:
  - ../../marketing-strategy/tourkit-brand.md
  - ../../marketing-strategy/positioning.md
  - ../../marketing-strategy/01-brand-guidelines.md
updated: 2026-04-19
---

*Mission, values, personality, visual identity.*

## Mission

Give React developers the most accessible, composable, and lightweight way to guide users through their products.

## Values

- **Technical excellence** — Strict TypeScript, tree-shakeable, sub-8KB core, WCAG 2.1 AA default
- **Developer-first** — Headless hooks ship separately from styled components. No forced opinions.
- **Transparency** — MIT open source, public roadmap, no hidden telemetry
- **Accessibility** — Focus management, keyboard nav, ARIA, `prefers-reduced-motion` — built in, not bolted on

## Personality

- **Precise** — say exactly what we mean, no marketing fluff
- **Helpful** — write docs like the reader has 5 minutes to ship
- **Confident, not arrogant** — highlight real metrics, not superlatives
- **Craft-oriented** — care about gzip budget, keyboard traps, contrast ratios

## Visual identity

| Element | Light Mode | Dark Mode |
|---|---|---|
| Primary | Electric Blue `#0056ff` | Soft Blue `#5c9aff` |
| Secondary | Golden Amber `#a1790d` | `#c9a033` (decorative only, never primary actions) |
| Surface | `#fbfcfe` | `#151618` |
| Text | `#000023` | `#edeef2` |

- **Typography:** Geist Sans (body), Geist Mono (code)
- **Icons:** Lucide React, outline only, 2px stroke. Never mix icon libraries.
- **Code blocks:** Dark bg `#1a1b1e`, Geist Mono 13px, custom token colors

## Naming conventions

- **Display name:** TourKit (two words, capital T and K — NOT "Tour Kit", "Tourkit", or "tour-kit" in prose)
- **Code name:** `tour-kit` (npm scope, GitHub slug, filesystem only)
- **Logo:** Needs creation. Current placeholder is Lucide `Sparkles`.

## Related

- [brand/positioning.md](positioning.md) — Positioning statement, taglines, value props
- [brand/voice.md](voice.md) — Tone, banned words, channel rules
- [product/tourkit.md](../product/tourkit.md) — The product these brand values describe
