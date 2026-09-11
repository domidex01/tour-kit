# Homepage Styleguide

Design reference for the userTourKit landing page (`apps/docs/app/page.tsx`).

**Design source:** Figma *TailwindCSS v4 Design System (Community)*, file
`6VwCdAiNHSTOHaOWOB0Zmo` — frames `3945:1460` (Home · Dark, canonical),
`3792:1460` (Home · Light), `3830:1460` (Pricing · Light),
`3830:1461` (Blog · Light), `3830:1462` (Product Tours · Light), plus dark
twins. The palette is Tailwind v4's stock `slate` + `indigo`, so there is no
bespoke colour ramp to maintain.

> **Redesign in progress.** Phase 1 (tokens, type, theme default) has landed and
> is what this document describes. Section-by-section anatomy below still
> describes the *previous* layout and is rewritten per phase as each section is
> rebuilt.

---

## Color Palette

Dark is the default the site boots in; light is the toggle.
`app/__tests__/design-tokens.test.ts` holds every pair below to WCAG AA and
fails if one drifts.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **Brand ink** | `#4f39f6` indigo-600 | `#7c86ff` indigo-400 | `--color-fd-primary` — links, accents, eyebrows, the second line of a two-tone headline, focus ring |
| **CTA fill** | `#4f39f6` indigo-600 | `#615fff` indigo-500 | `--tk-cta` + `--tk-cta-ink` (white). Split from brand ink on purpose — see note below |
| **Background** | `#ffffff` | `#020618` slate-950 | `--color-fd-background` |
| **Foreground** | `#020618` slate-950 | `#ebebeb` | `--color-fd-foreground` |
| **Muted** | `#f8fafc` slate-50 | `#0f172b` slate-900 | `--color-fd-muted` — section bands |
| **Muted foreground** | `#62748e` slate-500 | `#b3b3b3` | `--color-fd-muted-foreground` — body copy, labels |
| **Card / popover** | `#ffffff` | `#0f172b` slate-900 | `--color-fd-card`, `--color-fd-popover` |
| **Border** | `#e2e8f0` slate-200 | `#314158` slate-700 | `--color-fd-border` — quiet dividers, card edges |
| **Hairline** | `#62748e` slate-500 | `#62748e` slate-500 | `--tk-hairline` — the visible edge on a *control* (button, input, badge, kbd), where WCAG 1.4.11 wants 3:1 |
| **Secondary** | `#c6d2ff` indigo-200 | `#1d293d` slate-800 | `--color-fd-secondary` |
| **Accent** | `#f1f5f9` slate-100 | `#312c85` indigo-900 | `--color-fd-accent` |
| **Destructive** | `#9f0712` red-800 | `#ff6467` red-400 | `--color-fd-destructive` |
| **Success** | `#007a55` emerald-700 | `#5ee9b5` emerald-300 | `--tk-success` — comparison-table checks |
| **Logo lamp** | `#FFE20A` | `#FFE20A` | Hardcoded in `TourKitLogo`; the 8 body paths are `currentColor` and follow the brand token |

### Why brand ink and CTA fill are two tokens

They cannot be one colour and still clear AA in both themes. On the slate-950
ground, indigo-400 reads at 6.5:1 as a link — but white on indigo-400 is only
3.1:1, which fails for a 14px button label. (The Figma mockup does exactly this.)
So the fill steps down to indigo-500, where white reaches 4.6:1, and the ink
stays indigo-400. In light mode both roles collapse onto indigo-600.

### Hardcoded hex that stays hardcoded

| Hex | Where | Why |
|---|---|---|
| `#16171a` / `#0d0e11` | Code-window header / body | Dark chrome, independent of theme |
| `#ff5f57` `#febc2e` `#28c840` | macOS traffic lights | Standard window controls |
| `#FFE20A` | Logo lamp glass | Brand secondary |
| `#7c86ff` in `lib/og-image.ts` | OG image SVG | Satori renders outside the DOM, where a CSS variable never resolves |
| `#0197f6` in `[data-tk-theme="ocean"]` | Tour-card theme preset | Demo content showing what a consumer can theme *their* tour to — not site chrome |

### Known Issues

All three issues this document previously tracked were closed by the Phase 1
token work: `--landing-accent` is now declared in both themes,
`animate-fade-in-up` / `-delay-2` have keyframes (and a reduced-motion
opt-out), and the two competing blues have collapsed into one indigo.

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

- **Sans / display:** Host Grotesk (`--font-host-grotesk`), loaded via
  `next/font/google` in `app/layout.tsx`. Variable over 300-800, so the
  400 / 600 / 800 the design uses come from one file.
- **Mono:** Geist Mono (`--font-geist-mono`) — code, eyebrows, kbd.

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
| **Primary CTA** | `bg-[var(--tk-cta)] text-[var(--tk-cta-ink)] px-6 py-3 text-[14px] font-semibold rounded-lg shadow-lg shadow-[var(--color-fd-primary)]/20` + hover: `-translate-y-0.5 brightness-110` |
| **Secondary (ghost)** | `border border-fd-border bg-fd-background/60 px-5 py-3 text-[14px] font-semibold backdrop-blur-sm rounded-lg` + hover: `-translate-y-0.5 shadow-md` |
| **Step number (active)** | `bg-[var(--tk-cta)] text-[var(--tk-cta-ink)] h-8 w-8 rounded-lg font-mono text-[13px]` |
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

Phase 1 closed the three that stood here (undeclared `--landing-accent`,
undeclared `animate-fade-in-up`, two competing blues). Remaining, by phase:

2. **Chrome** — navbar (search pill + Ctrl K, theme toggle, socials) and footer.
3. **Templates** — Home (14 sections), Pricing, Blog, and the capability
   template that serves all five `/product-tours`-style pages.
4. **Sweep** — compare, alternatives, about, legal and the docs routes against
   the new foundation.

Open question for phase 3: the Figma *Pricing* page shows Free + Pro $99 (what
the site sells today), while the Home page's pricing band shows Core $39 / Pro
$99 / Team $299. The two designs disagree; the tiers need settling before that
section is built.
