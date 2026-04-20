---
title: Landing/Docs Styleguide
type: content
sources:
  - ../../apps/docs/STYLEGUIDE.md
  - ../../marketing-strategy/tourkit-brand.md
updated: 2026-04-19
---

*Design reference for the TourKit landing page (`apps/docs/app/page.tsx`). Source of truth for copy implementations.*

## Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| Brand Primary | `#0056ff` | `#5c9aff` | `--tk-primary` / `--color-fd-primary` — links, active, badges |
| Hero Accent | `#0197f6` | `#0197f6` | **Hardcoded** — CTAs, hero highlights, step indicators |
| Landing Accent | `var(--landing-accent)` | — | ⚠️ **Missing definition** (used 9 places, renders with no color) |
| Background | `#fbfcfe` | `#151618` | `--color-fd-background` |
| Foreground | `#000023` | `#edeef2` | `--color-fd-foreground` |
| Muted | `#f3f4f6` | `#292c30` | Section backgrounds |
| Muted Foreground | `#2b2e33` | `#9b9ea5` | Body text, labels |
| Card | `#f8f9fb` | `#1e2023` | — |
| Border | `#d0d3d8` | `#d3d3d5` | — |
| Dark Text (hero) | `#02182b` | white | Hardcoded in hero |
| Success | emerald-600 | emerald-400 | Comparison table checks |
| Partial | amber-600/70 | amber-400/70 | Comparison table "partial" |

## Known issues

1. **`--landing-accent` never defined** — Used in 9 places across features, packages, comparison-table, social-proof. No CSS declaration exists. **Action:** add to `:root` and `.dark` in `globals.css` (likely `#0197f6` or `var(--tk-primary)`).
2. **`animate-fade-in-up` / `animate-fade-in-up-delay-2` never defined** — Used in hero and packages. **Action:** add keyframes to Tailwind config or `globals.css`.
3. **Two competing blues** — Hero hardcodes `#0197f6`, design system uses `#0056ff` (`--tk-primary`). Visually different. **Action:** pick one.

## Typography

| Element | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| H1 (hero) | Geist Sans | `clamp(2rem, 4vw, 3rem)` | 800 | `-0.03em` |
| H2 (sections) | Geist Sans | `text-3xl` / `sm:text-4xl` | 700 | `-0.02em` |
| H3 (cards) | Geist Mono | `text-[14px]` | 700 | — |
| Body | Geist Sans | `text-[16px]`–`text-[17px]` | 400 | — |
| Body (hero) | Geist Sans | `text-[17px]` | 400 | `leading-[1.7]` |
| Labels / Tags | Geist Mono | `text-[11px]`–`text-[13px]` | 600 | `tracking-[0.06em]`–`[0.08em]` |
| Code blocks | Geist Mono | `text-[13px]` | 400 | `leading-[1.8]` |
| Install command | Geist Mono | `text-[12px]`–`text-[14px]` | 400 | — |

Fonts: `--font-geist-sans`, `--font-geist-mono`.

## Spacing & layout

| | |
|---|---|
| Max content width | `max-w-[1120px]` |
| Section padding x | `px-6 sm:px-8 lg:px-12` |
| Section padding y | `py-20 md:py-28` to `py-28 md:py-36` |
| Hero top | `pt-20 md:pt-28` |
| Grid gap | `gap-12 lg:gap-20` (hero), `gap-8 lg:gap-12` (quick-start) |
| Section gap | `space-y-24 md:space-y-32` (features) |

## Components

### Buttons
| Variant | Classes |
|---|---|
| Primary CTA | `bg-[#0197f6] px-6 py-3 text-[14px] font-semibold text-white rounded-lg shadow-lg shadow-[#0197f6]/20` + hover `-translate-y-0.5 brightness-110` |
| Secondary (ghost) | `border border-fd-border bg-fd-background/60 px-5 py-3 text-[14px] font-semibold backdrop-blur-sm rounded-lg` + hover `-translate-y-0.5 shadow-md` |
| Step number (active) | `bg-[#0197f6] text-white h-8 w-8 rounded-lg font-mono text-[13px]` |
| Step number (inactive) | `bg-fd-muted text-fd-muted-foreground` |

### Cards
| Variant | Style |
|---|---|
| Core package | `rounded-lg border border-fd-border bg-fd-card p-6` + hover lift + shadow |
| Extension | `rounded-lg border border-dashed border-fd-border bg-fd-card px-5 py-4` + hover border solid + shadow |
| Hero mockup | `rounded-xl border border-white/20 bg-fd-card/80 shadow-2xl backdrop-blur-xl` |
| CTA card | `rounded-2xl border border-fd-border/50 bg-fd-background/60 p-10 shadow-2xl backdrop-blur-xl` |

### Code blocks (custom syntax highlighting)

| Token | Color |
|---|---|
| Keyword | `#c4a7e7` |
| String | `#a8cc8c` |
| Comment | `#5c6370` |
| Component | `#89b4fa` |
| Tag | `#7fb4ca` |
| Attribute | `#cba6f7` |
| Function | `#e2cca9` |
| Number | `#f5a97f` |
| Bracket | `#5a5a6e` |
| Plain | `#abb2bf` |

Chrome: `bg-[#16171a]` header, `bg-[#0d0e11]` body, traffic lights `#ff5f57 / #febc2e / #28c840`.

### Hero badges

`rounded-md border border-fd-border bg-fd-card/80 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm`

## Backgrounds

| Location | Treatment |
|---|---|
| Hero & CTA footer | `hero-light.avif` / `hero-dark.avif` @ 50% opacity + dot grid overlay (radial-gradient, 24px, 35% opacity) |
| Packages section | `bg-fd-muted/30` |
| Social proof strip | `border-y border-fd-border bg-fd-muted/20` |
| Other | Transparent (inherits page) |

## Interactions

| Element | Effect |
|---|---|
| CTAs | `hover:-translate-y-0.5` lift + shadow |
| Cards | Same as CTAs |
| Extension cards | Dashed → solid border on hover; arrow fades in |
| Hero demo | Auto-cycling steps every 3s with tooltip transition `duration-500 ease-in-out` |
| Step indicators | Active dot stretches `h-1.5 w-1.5` → `h-1.5 w-4` via `transition-all duration-300` |
| Packages reveal | IntersectionObserver → `animate-fade-in-up` (staggered 100ms core / 80ms extensions) |
| Quick-start tabs | Active tab has left blue bar + card background |
| Features | Even rows normal; odd rows `md:[direction:rtl]` to flip layout |

## Section order (homepage)

1. Hero — headline + animated demo mockup
2. DemoTour — interactive tour demo
3. QuickStart — 4-step vertical tabs + code panel
4. Features — alternating text/code blocks (4 features)
5. Packages — core cards + extension grid
6. ComparisonTable — vs Appcues, Userflow, Intro.js
7. SocialProof — single-line strip with links
8. CTA Footer — closing card with install command

## Related

- [brand/identity.md](../brand/identity.md) — Brand colors and typography at the source
- [content/landing-pages.md](landing-pages.md) — The pages this styleguide applies to
- [brand/voice.md](../brand/voice.md) — Copy voice
