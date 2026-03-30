# Brand Identity & Guidelines

This document defines the visual identity, voice, and usage rules for TourKit. Every color value, font choice, and spacing token referenced here is drawn directly from the existing codebase. Where an asset does not yet exist, it is marked as **Needs to be created** with concrete recommendations.

---

## Brand Essence

### Mission Statement

TourKit exists to give React developers the most accessible, composable, and lightweight way to guide users through their products. We believe onboarding should be a first-class citizen of every application, not an afterthought bolted on with a bloated third-party script.

### Brand Values

| Value | What it means in practice |
|---|---|
| **Technical excellence** | Strict TypeScript, tree-shakeable exports, sub-8 KB core, WCAG 2.1 AA by default. Every API decision is measured against bundle size, type safety, and runtime performance. |
| **Developer-first** | Headless hooks ship separately from styled components. Developers choose their own level of abstraction. The library never forces an opinion on styling or state management. |
| **Transparency** | Open source under MIT. Public roadmap. Changelogs generated from Changesets. No hidden telemetry. |
| **Accessibility** | Focus management, keyboard navigation, ARIA attributes, and `prefers-reduced-motion` support are built into the foundation, not layered on as an optional add-on. |

### Brand Personality Traits

- **Precise** -- We say exactly what we mean. No marketing fluff.
- **Helpful** -- We write documentation as if the reader has five minutes to ship a feature.
- **Confident, not arrogant** -- We highlight real metrics (bundle size, WCAG compliance, TypeScript coverage) instead of superlatives.
- **Craft-oriented** -- We care about the details: the gzip budget, the keyboard trap, the color contrast ratio.

---

## Visual Identity

### Logo

**Status: Needs to be created.**

The documentation site currently uses a Lucide `Sparkles` icon (`<Sparkles className="w-5 h-5 text-[var(--tk-primary)]" />`) beside the wordmark "TourKit" in the navigation bar (see `apps/docs/lib/layout.shared.tsx`).

#### Recommendations for a Proper Logo

- **Concept direction**: A minimal geometric mark that suggests guidance or a path. Potential motifs include a compass needle, a route marker, or a stylized arrow stepping through waypoints.
- **Primary color**: Electric Blue `#0056ff` on light backgrounds; Soft Blue `#5c9aff` on dark backgrounds.
- **Wordmark treatment**: "Tour" in regular weight, "Kit" in bold weight, set in Geist Sans. The two parts should be visually distinct but read as one word.
- **File formats to produce**: SVG (primary), PNG at 1x/2x/4x, ICO (favicon), and an optimized OG image variant (1200x630).

#### Clear Space Requirements

Once a logo is created, maintain a minimum clear space equal to the height of the letter "K" in the wordmark on all four sides.

#### Minimum Sizes

- **Digital**: 24px height minimum for the icon mark; 80px width minimum for the full lockup.
- **Print**: 12mm height minimum for the icon mark.

#### What NOT to Do with the Logo

- Do not rotate, skew, or distort the mark.
- Do not place the logo on a background that fails WCAG AA contrast (4.5:1 for the wordmark text, 3:1 for the icon).
- Do not substitute the icon with a different Lucide icon or emoji.
- Do not add drop shadows, gradients, or outlines that are not part of the official asset.
- Do not use the light-mode color palette on a dark background, or vice versa.

---

### Color Palette

All values below are taken directly from `apps/docs/app/globals.css` and the custom `--tk-*` CSS custom properties.

#### Primary Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--tk-primary` | `#0056ff` (Electric Blue) | `#5c9aff` (Soft Blue) | Buttons, links, focus rings, brand accent |
| `--tk-primary-container` | `#c6dfff` | `#1a3a5c` | Badges, callout backgrounds, subtle highlights |

#### Secondary & Accent Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--tk-secondary` | `#a1790d` (Golden Amber) | `#c9a033` | Secondary buttons, premium/upgrade accents |
| `--tk-tertiary` | `#d5ba8a` (Warm Gold) | `#e8d4b0` | Tertiary actions, decorative accents |
| `--color-fd-accent` | `#f0f6ff` | `#1a3a5c` | Hover states, selected rows, soft fills |
| `--color-fd-secondary` | `#e8f1ff` | `#edeef2` | Secondary surface fills |

#### Surface & Background Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--tk-surface` | `#fbfcfe` | `#151618` | Page background |
| `--tk-surface-variant` | `#f8f9fb` | `#1e2023` | Cards, popovers |
| `--tk-container` | `#f8f9fb` | `#1e2023` | Elevated containers |
| `--tk-container-dim` | `#f3f4f6` | `#292c30` | Muted container backgrounds |

#### Text Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--tk-on-surface` | `#000023` | `#edeef2` | Primary body text, headings |
| `--tk-on-surface-variant` | `#2b2e33` | `#9b9ea5` | Secondary/muted text |

#### Border & Outline Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--tk-outline` | `#45484d` | `#9b9ea5` | Strong borders |
| `--tk-outline-variant` | `#9b9ea5` | `#45484d` | Subtle borders, dividers |
| `--color-fd-border` | `#d0d3d8` | `#d3d3d5` | Default component borders |
| `--color-fd-ring` | `#0056ff` | `#5c9aff` | Focus rings |

#### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--tk-error` | `#861309` | `#ff6b6b` | Destructive actions, error states |
| `--tk-success` | `#005900` | `#4caf50` | Success confirmations, positive states |
| `--tk-warning` | `#835c00` | `#f5b800` | Caution callouts, deprecation notices |

#### Feature Highlight Colors (Landing Page)

These Tailwind utility colors are used on the landing page to distinguish feature cards. They are not part of the design token system but are part of the brand palette:

| Feature | Color | Tailwind Class |
|---|---|---|
| Headless first | Amber | `text-amber-500` / `bg-amber-500/10` |
| Accessible by default | Emerald | `text-emerald-500` / `bg-emerald-500/10` |
| Tree-shakeable & tiny | Violet | `text-violet-500` / `bg-violet-500/10` |
| Keyboard navigation | Sky | `text-sky-500` / `bg-sky-500/10` |
| Spotlight & overlays | Rose | `text-rose-500` / `bg-rose-500/10` |
| TypeScript native | Electric Blue | `text-[var(--tk-primary)]` / `bg-[var(--tk-primary)]/10` |

#### Color Accessibility

All text-on-background pairings must meet WCAG 2.1 AA minimum contrast ratios:

- **Normal text** (< 18px or < 14px bold): 4.5:1 contrast ratio minimum.
- **Large text** (>= 18px or >= 14px bold): 3:1 contrast ratio minimum.
- **UI components and graphical objects**: 3:1 contrast ratio minimum.

Key pairings to verify:

| Foreground | Background | Mode | Minimum Ratio |
|---|---|---|---|
| `#0056ff` on `#fbfcfe` | Primary on surface | Light | 4.5:1 |
| `#5c9aff` on `#151618` | Primary on surface | Dark | 4.5:1 |
| `#000023` on `#fbfcfe` | Text on surface | Light | 4.5:1 |
| `#edeef2` on `#151618` | Text on surface | Dark | 4.5:1 |
| `#fff` on `#0056ff` | White on primary button | Light | 4.5:1 |

---

### Typography

#### Primary Typeface: Geist Sans

The documentation site loads **Geist Sans** via `geist/font/sans` (see `apps/docs/app/layout.tsx`). It is applied as the default body font.

```css
font-family: var(--font-geist-sans), system-ui, sans-serif;
```

**Geist Sans characteristics**: A modern, clean sans-serif optimized for UI. Designed by Vercel. Excellent legibility at small sizes. Supports a wide range of weights.

#### Code Font: Geist Mono

All code blocks, inline code, `<pre>`, `<kbd>`, and `<samp>` elements use **Geist Mono**.

```css
font-family: var(--font-geist-mono), monospace;
```

#### Heading Hierarchy

Derived from the landing page components and Fumadocs defaults:

| Level | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| H1 | `clamp(2.5rem, 5.5vw, 4.5rem)` | `font-extrabold` (800) | `tracking-tight` | Landing page hero only |
| H2 | `text-3xl` / `sm:text-4xl` (1.875rem / 2.25rem) | `font-extrabold` (800) | `tracking-tight` | Section headings |
| H3 | `text-[16px]` | `font-bold` (700) | default | Feature card titles, subsection headings |
| Body | `text-lg` (1.125rem) or `text-[15px]` | `font-normal` (400) | default | Paragraph text |
| Small / Label | `text-xs` (0.75rem) or `text-sm` (0.875rem) | `font-medium` (500) | default | Badges, metadata, labels |
| Inline code | `text-[13px]` | `font-semibold` (600) | default | Code references within prose |

#### Font Weights in Use

- **800 (extrabold)** -- Hero and section headings.
- **700 (bold)** -- Card titles, stat values, package names.
- **600 (semibold)** -- Navigation wordmark, inline code, CTA text, link labels.
- **500 (medium)** -- Buttons, badges, labels, tab bar items.
- **400 (normal)** -- Body copy, descriptions.

---

### Iconography

#### Icon Library: Lucide React

TourKit uses **Lucide React** (`lucide-react`) exclusively. Lucide icons are used throughout the landing page, navigation, and feature cards.

#### Icons Currently in Use

| Icon | Context |
|---|---|
| `Sparkles` | Navigation brand icon |
| `ArrowRight` | CTA buttons, documentation links |
| `Terminal` | Install command block |
| `Zap` | Headless first feature |
| `Shield` | Accessibility feature |
| `Package` | Tree-shakeability feature |
| `Keyboard` | Keyboard navigation feature |
| `Eye` | Spotlight feature |
| `Code2` | TypeScript feature, API nav link |
| `Cpu` | Core package |
| `Component` | React package |
| `Lightbulb` | Hints package |
| `BookOpen` | Docs nav link |
| `Layers` | Examples nav link |
| `CreditCard` | Pricing nav link |

#### Icon Style Rules

- **Style**: Outline (Lucide default). Never use filled variants.
- **Standard size**: `h-5 w-5` (20px) for feature icons and navigation; `h-4 w-4` (16px) for inline/button icons; `h-3.5 w-3.5` (14px) for small trailing arrows.
- **Stroke width**: Lucide default (2px).
- **Color**: Icons inherit their parent's text color or use a specific brand/feature color class.
- **Icon containers**: Feature icons sit inside an 11x11 (44px) rounded-lg container with a 10% opacity background tint of the icon's color (`bg-{color}/10`).

---

### Spacing & Layout

#### Layout Width

The documentation site uses a custom max layout width:

```css
--fd-layout-width: 1400px;
```

Landing page sections use `max-w-6xl` (1152px) centered within the viewport.

#### Grid System

- **Landing page feature grid**: 3-column on large screens (`lg:grid-cols-3`), 2-column on small (`sm:grid-cols-2`), single column on mobile.
- **Hero section**: Asymmetric 2-column grid (`lg:grid-cols-[1.1fr_0.9fr]`).
- **Code preview**: Asymmetric 2-column grid (`lg:grid-cols-[1fr_1.2fr]`).
- **Package cards**: Equal 3-column grid (`md:grid-cols-3`).
- **Stats row**: Equal 3-column grid (`grid-cols-3`).

#### Spacing Scale

The project uses Tailwind's default spacing scale. Common values appearing in the landing page:

| Token | Value | Common usage |
|---|---|---|
| `gap-2` | 8px | Icon + label inline pairs |
| `gap-2.5` | 10px | List item spacing |
| `gap-3` | 12px | Stats grid gap |
| `gap-4` | 16px | Button group gap |
| `gap-6` | 24px | Card grid gap, section element spacing |
| `gap-12` | 48px | Major content section gap |
| `gap-16` | 64px | Hero/code-preview column gap on large screens |
| `py-20` | 80px | Section vertical padding (mobile) |
| `md:py-28` | 112px | Section vertical padding (desktop) |
| `px-6` | 24px | Section horizontal padding (mobile) |
| `sm:px-8` | 32px | Section horizontal padding (tablet) |
| `lg:px-12` | 48px | Section horizontal padding (desktop) |

#### Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-full` | 9999px | Badges, status dots, decorative blobs |
| `rounded-xl` | 12px | Cards, code blocks, feature containers |
| `rounded-lg` | 8px | Buttons, icon containers, CTA links |
| `rounded-md` | 6px | Inline code, button components (`.btn-primary` at `0.375rem`) |

#### Shadows

- **Cards at rest**: `shadow-sm`
- **Cards on hover**: `shadow-md`
- **Primary CTA at rest**: `shadow-lg shadow-[var(--tk-primary)]/20`
- **Primary CTA on hover**: `shadow-xl shadow-[var(--tk-primary)]/30`

---

## Voice & Tone

### Writing Principles

1. **Lead with the benefit, not the feature.** Instead of "We support keyboard navigation", write "No mouse required -- full keyboard support with customizable bindings."
2. **Use concrete numbers.** "Core under 8 KB gzipped" is stronger than "Lightweight."
3. **Address the developer directly.** Use "you" and "your", not "users" or "one".
4. **Keep sentences short.** Landing page copy tops out at roughly 20 words per sentence.
5. **Avoid jargon laddering.** Do not stack buzzwords. One technical claim per sentence.

### Taglines Currently in Use

| Context | Copy |
|---|---|
| **Site title** | "TourKit - Product Tours for React" |
| **Meta description** | "The most developer-friendly, accessible product tour library for React. Headless hooks and pre-styled components." |
| **Hero headline** | "Guide users through your app" |
| **Hero subhead** | "Headless hooks and composable components for product tours, onboarding flows, and contextual hints. Built for React. Works with shadcn/ui." |
| **Features heading** | "Everything you need, nothing you don't" |
| **Packages heading** | "Pick what you need" |
| **Code preview heading** | "A few lines of code, a complete tour" |
| **CTA heading** | "Ready to build?" |
| **CTA subhead** | "Get your first product tour running in under five minutes." |

---

## Brand Applications

### GitHub Repository

- **Repository name**: `tour-kit` (lowercase, hyphenated).
- **Description**: Use the meta description from the docs site: "The most developer-friendly, accessible product tour library for React."
- **Topics**: `react`, `product-tour`, `onboarding`, `typescript`, `headless`, `shadcn`, `tailwind`, `accessibility`.
- **Social preview image**: **Needs to be created.** Should be 1280x640, feature the brand name in Geist Sans, Electric Blue `#0056ff` accent, and a minimal code snippet or abstract path graphic on a light surface (`#fbfcfe`).

### npm Package Pages

- **Package names**: `@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`, plus extended packages under the `@tour-kit` scope.
- **README badges**: Use shields.io badges with consistent styling. Recommended badges: npm version, bundle size (bundlephobia), TypeScript, license (MIT), WCAG AA.
- **README opening line**: Mirror the site meta description for consistency across all packages.

### Documentation Site

- **URL structure**: `/docs/` prefix for all documentation pages.
- **Navigation**: Wordmark with Sparkles icon on the left; Docs, API, Examples, Pricing links on the right; GitHub link at far right.
- **Page template**: `%s | TourKit` title format.
- **Code blocks**: Dark background (`#1a1b1e`), syntax-highlighted with a muted token palette. Always include a copy button.

### Social Media Profiles

- **Handle**: `@tourkit` or `@tour_kit` (to be established).
- **Avatar**: The logo mark (once created) on a white or `#fbfcfe` background for light platforms, on `#151618` for dark platforms.
- **Bio**: "Headless product tours for React. Open source. WCAG AA accessible. < 8 KB gzipped."
- **Link**: Documentation site URL.

### Conference Slides Template Guidelines

- **Background**: Light slides use `#fbfcfe`; dark slides use `#151618`.
- **Accent bar**: A thin (4px) horizontal rule in Electric Blue `#0056ff` at the top of each slide.
- **Headings**: Geist Sans Extrabold, `#000023` (light) or `#edeef2` (dark).
- **Body text**: Geist Sans Regular, `#2b2e33` (light) or `#9b9ea5` (dark).
- **Code samples**: Geist Mono on a `#1a1b1e` background with the same token colors used on the docs site.
- **Logo placement**: Bottom-right corner, minimum 24px height.

### Code Example Styling

- **Background**: `#1a1b1e` (dark, regardless of site theme).
- **Font**: Geist Mono at `13px`, line-height `1.7`.
- **Token colors** (from `apps/docs/components/landing/code-preview.tsx`):
  - Keywords (`import`, `from`, `const`, `return`, `function`): `#c4a7e7` (muted purple)
  - Function names / identifiers: `#e2cca9` (warm gold)
  - Strings: `#a8cc8c` (soft green)
  - JSX component tags: `#89b4fa` (blue)
  - JSX HTML tags: `#7fb4ca` (teal)
  - JSX attributes: `#cba6f7` (light purple)
  - JSX punctuation: `#5a5a6e` (dim gray)
  - Default text: `#d4d4d8` (light gray)

---

## Do's and Don'ts

### Do

- **Do** use Electric Blue `#0056ff` as the single dominant brand color in light mode.
- **Do** switch to Soft Blue `#5c9aff` for the primary color in dark mode.
- **Do** pair the primary color with white (`#fff`) text on buttons. This pairing meets WCAG AA.
- **Do** use Geist Sans for all UI and marketing text. Fall back to `system-ui, sans-serif`.
- **Do** use Geist Mono for all code-related content. Fall back to `monospace`.
- **Do** use Lucide outline icons at their default 2px stroke width.
- **Do** wrap icons in a rounded-lg container with a 10% tinted background when displaying feature highlights.
- **Do** reference real, verifiable metrics: "< 8 KB gzipped", "WCAG 2.1 AA", "100% TypeScript".
- **Do** maintain the `@tour-kit/` npm scope for all packages.
- **Do** keep landing page section padding consistent: `py-20 md:py-28` vertical, `px-6 sm:px-8 lg:px-12` horizontal.
- **Do** test every color pairing against WCAG AA contrast requirements before shipping.

### Don't

- **Don't** use the Golden Amber secondary color (`#a1790d` / `#c9a033`) as a primary action color. It is reserved for secondary and decorative uses.
- **Don't** mix icon libraries. Do not introduce Font Awesome, Heroicons, or other icon sets alongside Lucide.
- **Don't** use filled icon variants. TourKit uses outline-only icons.
- **Don't** set body text in a serif or display typeface.
- **Don't** use `font-black` (900) weight anywhere. The heaviest weight in the system is `font-extrabold` (800).
- **Don't** place colored text on colored backgrounds without verifying contrast (e.g., amber text on a yellow surface).
- **Don't** refer to the project as "Tour Kit" (two words), "Tourkit" (lowercase k), or "tour-kit" in user-facing prose. The canonical display name is **TourKit**. The hyphenated form `tour-kit` is reserved for the npm scope, GitHub repository slug, and filesystem paths.
- **Don't** use background blur effects heavier than `blur-[80px]` for decorative gradients. The current accents use 80px blur at 5-7% opacity, which is intentionally subtle.
- **Don't** add animated effects that cannot be disabled when `prefers-reduced-motion: reduce` is active.
- **Don't** use border-radius values outside the established set (`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`). Avoid `rounded`, `rounded-sm`, `rounded-2xl`, or `rounded-3xl` unless introducing a new documented pattern.

---

## Assets Inventory

A summary of what exists and what needs to be produced.

| Asset | Status | Location / Notes |
|---|---|---|
| Logo (icon mark) | Needs to be created | Currently using Lucide `Sparkles` as placeholder |
| Logo (full lockup) | Needs to be created | Wordmark "TourKit" in Geist Sans Semibold + icon mark |
| Favicon | Needs to be created | Derive from the icon mark; produce as SVG and ICO |
| OG / social preview image | Needs to be created | 1200x630 for docs site; 1280x640 for GitHub |
| Color tokens | Exists | `apps/docs/app/globals.css` (`:root` and `.dark` blocks) |
| Tailwind theme extension | Exists | `apps/docs/tailwind.config.ts` (`colors.tk.*`) |
| Typography (Geist Sans + Mono) | Exists | Loaded in `apps/docs/app/layout.tsx` via `geist/font/*` |
| Icon set (Lucide) | Exists | Used across all landing page components |
| Code syntax theme | Exists | Hardcoded token colors in `apps/docs/components/landing/code-preview.tsx` |
| Brand guidelines doc | This file | `marketing-strategy/01-brand-guidelines.md` |
