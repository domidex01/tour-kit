# Homepage Styleguide

Design reference for the userTourKit landing page (`apps/docs/app/page.tsx`).

---

## Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **Brand Primary** | `#0056ff` | `#5c9aff` | `--tk-primary`, `--color-fd-primary` — links, active states, badges |
| **Hero Accent** | `#0197f6` | `#0197f6` | Hardcoded — CTAs, highlights in hero/CTA footer, step indicators |
| **Landing Accent** | `var(--landing-accent)` | `var(--landing-accent)` | **Missing definition** — used in features, packages, comparison table |
| **Background** | `#fbfcfe` | `#151618` | `--color-fd-background` |
| **Foreground** | `#000023` | `#edeef2` | `--color-fd-foreground` |
| **Muted** | `#f3f4f6` | `#292c30` | `--color-fd-muted` — section backgrounds |
| **Muted Foreground** | `#2b2e33` | `#9b9ea5` | `--color-fd-muted-foreground` — body text, labels |
| **Card** | `#f8f9fb` | `#1e2023` | `--color-fd-card` |
| **Border** | `#d0d3d8` | `#d3d3d5` | `--color-fd-border` |
| **Dark Text (hero)** | `#02182b` | `white` | Hardcoded in hero headings |
| **Success** | emerald-600 | emerald-400 | Comparison table checkmarks |
| **Partial** | amber-600/70 | amber-400/70 | Comparison table "partial" cells |

### Known Issues

1. **`--landing-accent` is never defined** — Used in 9 places across features, packages, comparison-table, and social-proof but has no CSS declaration. These elements render with no color.
2. **`animate-fade-in-up` / `animate-fade-in-up-delay-2` are never defined** — Used in hero and packages but no corresponding `@keyframes` or Tailwind animation config exists.
3. **Two competing blue values** — Hero uses hardcoded `#0197f6` while the design system uses `#0056ff` (`--tk-primary`). These are visually different blues.

---

## Typography

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| **H1 (hero)** | Geist Sans | `clamp(2rem, 4vw, 3rem)` | 800 (extrabold) | `-0.03em` |
| **H2 (sections)** | Geist Sans | `text-3xl` / `sm:text-4xl` | 700 (bold) | `-0.02em` |
| **H3 (cards)** | Geist Mono | `text-[14px]` | 700 (bold) | — |
| **Body** | Geist Sans | `text-[16px]`–`text-[17px]` | 400 | — |
| **Body (hero)** | Geist Sans | `text-[17px]` | 400 | `leading-[1.7]` |
| **Labels / Tags** | Geist Mono | `text-[11px]`–`text-[13px]` | 600 (semibold) | `tracking-[0.06em]`–`tracking-[0.08em]` |
| **Code blocks** | Geist Mono | `text-[13px]` | 400 | `leading-[1.8]` |
| **Install command** | Geist Mono | `text-[12px]`–`text-[14px]` | 400 | — |

### Fonts

- **Sans:** Geist Sans (`--font-geist-sans`)
- **Mono:** Geist Mono (`--font-geist-mono`)

---

## Spacing & Layout

| Property | Value |
|----------|-------|
| **Max content width** | `max-w-[1120px]` (1120px) |
| **Section padding (x)** | `px-6 sm:px-8 lg:px-12` |
| **Section padding (y)** | `py-20 md:py-28` to `py-28 md:py-36` |
| **Hero top padding** | `pt-20 md:pt-28` |
| **Grid gap** | `gap-12 lg:gap-20` (hero), `gap-8 lg:gap-12` (quick-start) |
| **Section gap between items** | `space-y-24 md:space-y-32` (features) |

---

## Component Patterns

### Buttons

| Variant | Classes |
|---------|---------|
| **Primary CTA** | `bg-[#0197f6] px-6 py-3 text-[14px] font-semibold text-white rounded-lg shadow-lg shadow-[#0197f6]/20` + hover: `-translate-y-0.5 brightness-110` |
| **Secondary (ghost)** | `border border-fd-border bg-fd-background/60 px-5 py-3 text-[14px] font-semibold backdrop-blur-sm rounded-lg` + hover: `-translate-y-0.5 shadow-md` |
| **Step number (active)** | `bg-[#0197f6] text-white h-8 w-8 rounded-lg font-mono text-[13px]` |
| **Step number (inactive)** | `bg-fd-muted text-fd-muted-foreground` |

### Cards

| Variant | Style |
|---------|-------|
| **Core package card** | `rounded-lg border border-fd-border bg-fd-card p-6` + hover: `-translate-y-0.5 shadow-md` |
| **Extension card** | `rounded-lg border border-dashed border-fd-border bg-fd-card px-5 py-4` + hover: `border-solid shadow-sm` |
| **Hero mockup** | `rounded-xl border border-white/20 bg-fd-card/80 shadow-2xl backdrop-blur-xl` |
| **CTA card** | `rounded-2xl border border-fd-border/50 bg-fd-background/60 p-10 shadow-2xl backdrop-blur-xl` |

### Code Blocks (custom syntax highlighting)

| Token | Color |
|-------|-------|
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

Code block chrome: `bg-[#16171a]` header, `bg-[#0d0e11]` body, traffic light dots (`#ff5f57`, `#febc2e`, `#28c840`).

### Badges/Tags (hero)

```
rounded-md border border-fd-border bg-fd-card/80 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm
```

---

## Backgrounds

| Location | Treatment |
|----------|-----------|
| **Hero & CTA footer** | `hero-light.avif` / `hero-dark.avif` at 50% opacity + dot grid overlay (`radial-gradient`, 24px spacing, 35% opacity) |
| **Packages section** | `bg-fd-muted/30` |
| **Social proof strip** | `border-y border-fd-border bg-fd-muted/20` |
| **Other sections** | Transparent (inherits page background) |

---

## Interactions & Animations

| Element | Effect |
|---------|--------|
| **CTA buttons** | `hover:-translate-y-0.5` lift + shadow increase |
| **Cards** | `hover:-translate-y-0.5` lift + shadow |
| **Extension cards** | Dashed border becomes solid on hover; arrow link fades in (`opacity-0 → group-hover:opacity-100`) |
| **Hero demo** | Auto-cycling steps every 3s with tooltip position transition (`duration-500 ease-in-out`) |
| **Step indicators** | Active dot stretches: `h-1.5 w-1.5` → `h-1.5 w-4` with `transition-all duration-300` |
| **Packages reveal** | IntersectionObserver triggers `animate-fade-in-up` (staggered delays: 100ms core, 80ms extensions) |
| **Quick-start tabs** | Active tab gets left blue bar + card background |
| **Features alternating** | Even rows normal, odd rows use `md:[direction:rtl]` to flip layout |

---

## Section Order

1. **Hero** — headline + animated demo mockup
2. **DemoTour** — interactive tour demonstration
3. **QuickStart** — 4-step vertical tabs + code panel
4. **Features** — alternating text/code blocks (4 features)
5. **Packages** — core cards + extension grid
6. **ComparisonTable** — vs Appcues, Userflow, Intro.js
7. **SocialProof** — single-line strip with links
8. **CTA Footer** — closing card with install command

---

## Action Items

1. **Define `--landing-accent`** — Add to `:root` and `.dark` in `globals.css` (likely should be `#0197f6` or `var(--tk-primary)`)
2. **Define `animate-fade-in-up` keyframes** — Add to tailwind config or `globals.css`
3. **Reconcile blues** — Decide between `#0197f6` (hero) and `#0056ff` (design system) as the single brand blue
