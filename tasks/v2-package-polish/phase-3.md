# Phase 3 — Hint Presets

**Duration:** Days 15–19 (~8–12 hours)
**Depends on:** Nothing (parallelizable with Phases 1–2)
**Blocks:** Phase 12 (`<HintGroup>` composes preset hints — the variant prop shape locks here)
**Risk Level:** LOW — pure component additions inside `@tour-kit/hints`; no provider changes, no breaking type widening, no shared-state churn.
**Stack:** react

---

## Objective

Kill the "6px dot is invisible" complaint by shipping three named, opinionated presets on `<HintHotspot>`: `variant="badge"` (count-bearing high-contrast circle), `variant="beacon-with-label"` (beacon plus adjacent label), and `variant="what-s-new-pill"` (pill with sparkle that fades after first interaction). Each preset renders at ≥24×24 px hit-target and passes WCAG 2.1 AA contrast on both light and dark backgrounds. The existing un-prefixed dot (`size: default | sm | lg`) stays as the legacy default so consumers on v1 see zero diff after upgrade. Phase 12 will compose these into `<HintGroup>`, so the variant prop interface defined here is the contract — extra optional props are fine later, but the three string literals must not rename.

## What Success Looks Like

1. `<HintHotspot variant="badge" />` renders with zero other props (the `targetRect` + `position` already required by v1 remain, but no variant-specific prop is mandatory) and produces a circular badge with ≥24×24 px box verified by `element.getBoundingClientRect().width >= 24 && .height >= 24`
2. `<HintHotspot variant="badge" count={3} />` renders the numeric "3" inside the badge with visually-balanced typography (count is the only badge-specific prop)
3. `<HintHotspot variant="beacon-with-label" label="New" side="right" />` renders a pulsing beacon with the label adjacent on the requested side; `side` accepts `"left" | "right"` (default `"right"`); label uses `aria-hidden` because the beacon's existing `aria-label` covers screen readers
4. `<HintHotspot variant="what-s-new-pill" label="What's new" />` renders a pill with a sparkle icon that fades to `opacity: 0` over 200ms after the first `pointerdown` or `focus` on the hotspot; under `prefers-reduced-motion: reduce`, the fade is replaced by an immediate `display: none` swap via the `useReducedMotion()` gate
5. axe-core contrast scan (via `vitest-axe`, already a devDep) reports zero `color-contrast` violations for each variant against a `#ffffff` background and against a `#0a0a0a` background
6. Playwright visual regression snapshots in `packages/playwright/__tests__/hint-variants.spec.ts` pass for all three variants on light + dark backgrounds (six snapshots total — `{badge,beacon-with-label,whats-new-pill}.{light,dark}.png`)
7. `apps/docs/content/docs/hints/variants.mdx` renders a live `<HintHotspot>` example for each of the three variants
8. `pnpm --filter @tour-kit/hints typecheck` exits 0 and `pnpm --filter @tour-kit/hints test` exits 0 with no regressions in the existing `hint-hotspot.test.tsx` suite

---

## Architecture / Key Design Decisions

```
<HintHotspot variant="badge" | "beacon-with-label" | "what-s-new-pill" | undefined />
                │
                ├─► variant === undefined  →  existing dot (cva: size × color × pulse × zIndex)  [v1 path, unchanged]
                │
                ├─► variant === "badge"             →  packages/hints/src/variants/badge.tsx
                │       props: { count?: number }
                │       cva entry adds `variant: { badge: '...' }` to hintHotspotVariants
                │
                ├─► variant === "beacon-with-label" →  packages/hints/src/variants/beacon-with-label.tsx
                │       props: { label: string; side?: 'left' | 'right' }
                │       cva entry adds `variant: { 'beacon-with-label': '...' }`
                │
                └─► variant === "what-s-new-pill"   →  packages/hints/src/variants/whats-new-pill.tsx
                        props: { label: string }
                        internal state: hasInteracted (boolean), gates fade via useReducedMotion()

hint-hotspot.tsx (updated)
  ├─ if variant set → delegate to the matching variant component (which itself returns a styled <button>)
  └─ else            → keep current dot render path (zero diff for existing consumers)
```

### Variant prop interface (the Phase 12 contract — do not rename literals)

```ts
// packages/hints/src/components/hint-hotspot.tsx — added on top of existing HintHotspotProps
type HintHotspotVariantName = 'badge' | 'beacon-with-label' | 'what-s-new-pill'

// Discriminated-union extras keyed by variant; each branch is *optional* on the
// base props so `<HintHotspot variant="badge" />` compiles with no extras.
type HintHotspotVariantExtras =
  | { variant?: undefined }
  | { variant: 'badge'; count?: number }
  | { variant: 'beacon-with-label'; label: string; side?: 'left' | 'right' }
  | { variant: 'what-s-new-pill'; label: string }

// Final prop shape (intersect with existing HintHotspotProps):
export type HintHotspotProps = /* existing base */ & HintHotspotVariantExtras
```

### Reduced-motion three-tier defense (per repo-root CLAUDE.md)

| Tier | Mechanism | Where it applies in this phase |
|---|---|---|
| 1 | `motion-safe:` Tailwind prefix on `tailwindcss-animate` utilities (compiles to `@media (prefers-reduced-motion: no-preference)`) | `beacon-with-label` uses `motion-safe:animate-tour-pulse` for the beacon; `what-s-new-pill` uses `motion-safe:transition-opacity motion-safe:duration-200` for the fade |
| 2 | `@media (prefers-reduced-motion: reduce)` wrapper around any custom `@keyframes` we own | No new `@keyframes` this phase — we reuse `animate-tour-pulse` (already tier-2 wrapped in `src/styles/{variables,theme}.css`). If a new keyframe is added (e.g., sparkle shimmer), wrap it the same way |
| 3 | `useReducedMotion()` JS gate from `@tour-kit/core` for render-time class branches | `what-s-new-pill`'s fade-after-interaction logic: under reduce, `hasInteracted && reducedMotion → return null` (or `style={{ display: 'none' }}`) instead of a CSS transition. Mirrors the pattern in `hint-hotspot.tsx` lines 62–67 where `shouldPulse = pulse && !isOpen && !reducedMotion` |

### Data Model Strategy

| Layer | Type | Why |
|---|---|---|
| Variant style table | `cva()` from `class-variance-authority` (already a `dependencies` entry in `packages/hints/package.json`) | Single source of truth for variant → className mapping, mirrors the existing pattern in `packages/surveys/src/components/ui/banner-variants.ts` (canonical example) and the already-present `hintHotspotVariants` in `packages/hints/src/components/ui/hint-variants.ts` |
| Variant prop shapes | discriminated union (`HintHotspotVariantExtras`) on `interface HintHotspotProps` | Lets `<HintHotspot variant="badge">` type-narrow `count?: number` without polluting the other branches; preserves zero-prop default |
| Per-variant internal state (`hasInteracted` for `what-s-new-pill`) | local `React.useState<boolean>` | Single-component, never persisted; no provider plumbing |
| No new context, no new hooks, no new public type exports beyond `HintHotspotVariantName` |

**Other critical rules for this phase:**
- **No breaking changes to the un-variant path.** A consumer who never sets `variant` must see byte-identical rendered output before/after this PR. Snapshot test in `hint-hotspot.test.tsx` covering the default path stays green without snapshot regeneration.
- **`cva` is the only class-mapping tool.** Don't inline class concatenation in the variant tsx files — extend `hintHotspotVariants` with a `variant: { ... }` block so the existing `HintHotspotVariants` type still drives consumers' overrides.
- **Variant components are presentational only.** They accept the same `targetRect` + `position` as the base `<HintHotspot>`, do the positioning with the same `getHotspotPosition` helper, and return a `<button>` (or `<Comp>` via `Slot` when `asChild`). They do NOT introduce new context, refs, or imperative APIs.
- **Hit target ≥24×24 px** is enforced by giving every variant a base utility class chain that includes `min-h-6 min-w-6` (Tailwind `1.5rem = 24px`). Visual element inside can still be smaller (e.g., the 12px beacon dot inside a 24px tappable area).
- **Test rule:** Unit tests use `@testing-library/react` + `vitest-axe`. Playwright visual tests go in `packages/playwright/__tests__/hint-variants.spec.ts` and reuse the existing fixtures-app pattern (a new fixture HTML per variant or one combined fixture with three sections). No new servers, no new Playwright projects.

---

## Tasks

### Task 3.1 — `variant="badge"` preset (2–3h)

Goal: high-contrast circular badge with an optional `count` slot. ≥24×24 px hit target; the visual badge fills the whole target so there's no invisible padding. White text on `bg-primary` (existing token) gives the contrast.

```tsx
// packages/hints/src/variants/badge.tsx
'use client'

import { cn, useUILibrary } from '@tour-kit/core'
import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import { hintHotspotVariants } from '../components/ui/hint-variants'
import type { HotspotPosition } from '../types'

export interface HintBadgeProps {
  targetRect: DOMRect
  position: HotspotPosition
  /** Optional number rendered inside the badge (1–99; clamps to "99+"). */
  count?: number
  isOpen?: boolean
  asChild?: boolean
  className?: string
}

export const HintBadge = React.forwardRef<HTMLButtonElement, HintBadgeProps>(/* ... */)
HintBadge.displayName = 'HintBadge'
```

Implementation notes:
- Add a `variant` key to `hintHotspotVariants` (in `components/ui/hint-variants.ts`):
  ```ts
  variant: {
    badge: 'h-6 w-6 min-h-6 min-w-6 flex items-center justify-center text-[11px] font-semibold text-primary-foreground bg-primary',
    'beacon-with-label': 'h-6 w-6 min-h-6 min-w-6 bg-transparent border-transparent',
    'what-s-new-pill': 'h-auto w-auto min-h-6 min-w-6 px-2 py-0.5 rounded-full text-xs font-medium',
  }
  ```
  Note: when `variant` is set, override `h-3 w-3` size defaults — keep this contained inside `compoundVariants` so the un-variant path is byte-identical.
- Clamp `count`: `count == null ? null : count > 99 ? '99+' : String(count)`.
- Keep `aria-label="Show hint"` from the base hotspot; the count is decorative for SR users (the tooltip carries semantic info).

**Sanity check:** `pnpm --filter @tour-kit/hints typecheck` exits 0. In a unit test, `render(<HintHotspot variant="badge" count={3} targetRect={mockRect} position="top-right" />)` and assert `getByRole('button').textContent === '3'` and `getBoundingClientRect().width >= 24`.

---

### Task 3.2 — `variant="beacon-with-label"` preset (3–4h)

**Depends on:** 3.1 (shares the extended `hintHotspotVariants` table)

Goal: pulsing beacon + adjacent label. Label is purely visual; the beacon's existing `aria-label="Show hint"` covers screen readers, so the label gets `aria-hidden="true"`. `side` defaults to `"right"`.

```tsx
// packages/hints/src/variants/beacon-with-label.tsx
'use client'

import { cn, useReducedMotion, useUILibrary } from '@tour-kit/core'
import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import { hintHotspotVariants } from '../components/ui/hint-variants'
import type { HotspotPosition } from '../types'

export interface HintBeaconWithLabelProps {
  targetRect: DOMRect
  position: HotspotPosition
  label: string
  side?: 'left' | 'right'
  isOpen?: boolean
  asChild?: boolean
  className?: string
}

export const HintBeaconWithLabel = React.forwardRef<HTMLButtonElement, HintBeaconWithLabelProps>(
  ({ label, side = 'right', targetRect, position, isOpen = false, asChild, className }, ref) => {
    const reducedMotion = useReducedMotion()
    const shouldPulse = !isOpen && !reducedMotion
    // ... render a wrapper <button> with a beacon dot + a sibling <span aria-hidden="true">
    //     The wrapper itself is the hit target (>=24x24); the visible beacon is 8–10px.
    //     Use `motion-safe:animate-tour-pulse` so reduce mode strips the animation.
    return null // see expected render in implementation
  }
)
HintBeaconWithLabel.displayName = 'HintBeaconWithLabel'
```

Implementation notes:
- Wrapper is `<button>` with `inline-flex items-center gap-1.5 min-h-6 min-w-6` so the whole tappable area is ≥24 px.
- Label `<span>` carries `aria-hidden="true"` and `text-xs font-medium text-foreground`.
- For RTL friendliness, `side="left"` swaps via `flex-row-reverse`.
- Pulse class is `motion-safe:animate-tour-pulse` (tier 1) — no extra JS gate needed beyond the existing `useReducedMotion()` that also strips it from the conditional class chain (tier 3, mirroring `hint-hotspot.tsx`).

**Sanity check:** `render(<HintHotspot variant="beacon-with-label" label="New" side="left" .../>)`; assert that `getByText('New')` exists, is `aria-hidden`, and that the wrapping button's first child (in DOM order) is the label (because of `flex-row-reverse`).

---

### Task 3.3 — `variant="what-s-new-pill"` preset (2–3h)

**Depends on:** 3.1

Goal: pill-shaped hotspot with a sparkle icon + label; fades to `opacity: 0` (200ms) after the first `pointerdown` or `focus`. Under reduce, the fade is replaced by a hard-cut to `display: none` so the element disappears immediately and stays hidden across re-renders. Persists "interacted" only for the lifetime of the component instance — Phase 19 (offscreen autohide) and Phase 1 (force-show) own re-show semantics, not this phase.

```tsx
// packages/hints/src/variants/whats-new-pill.tsx
'use client'

import { cn, useReducedMotion } from '@tour-kit/core'
import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import { hintHotspotVariants } from '../components/ui/hint-variants'
import type { HotspotPosition } from '../types'

export interface HintWhatsNewPillProps {
  targetRect: DOMRect
  position: HotspotPosition
  label: string
  isOpen?: boolean
  asChild?: boolean
  className?: string
}

export const HintWhatsNewPill = React.forwardRef<HTMLButtonElement, HintWhatsNewPillProps>(
  ({ label, targetRect, position, isOpen = false, asChild, className }, ref) => {
    const reducedMotion = useReducedMotion()
    const [hasInteracted, setHasInteracted] = React.useState(false)

    // Tier 3 gate: in reduce mode, after first interaction, render nothing.
    if (hasInteracted && reducedMotion) return null

    // Tier 1: fade via motion-safe:transition-opacity motion-safe:duration-200
    const fadeClass = hasInteracted ? 'opacity-0' : 'opacity-100'

    return (
      <button
        // ... position via getHotspotPosition(position, targetRect)
        // ... onPointerDown / onFocus → setHasInteracted(true)
        className={cn(
          hintHotspotVariants({ variant: 'what-s-new-pill' }),
          'motion-safe:transition-opacity motion-safe:duration-200',
          fadeClass,
          className
        )}
        aria-label={label}
      >
        <SparkleIcon aria-hidden="true" className="h-3 w-3" />
        <span>{label}</span>
      </button>
    )
  }
)
HintWhatsNewPill.displayName = 'HintWhatsNewPill'
```

Implementation notes:
- Inline a tiny `SparkleIcon` SVG component (no new icon-library dep — `<svg viewBox="0 0 24 24"><path d="..." /></svg>`). Keep it under 200 bytes minified.
- Use the same `aria-label={label}` on the button — `aria-hidden` the icon. The text node is fine to keep visually.
- Reduce-mode JS gate is the key correctness point: under reduce, after interaction, the component returns `null` rather than relying on `opacity-0` (which would still occupy space and remain focusable until removed). Document the reasoning inline.

**Sanity check:** In jsdom (which always reports `prefers-reduced-motion: no-preference` unless mocked) verify the fade-to-opacity-0 path: fire `pointerdown`, assert `getByRole('button').className` contains `opacity-0`. Then mock `useReducedMotion` to `true`, fire `pointerdown`, assert `queryByRole('button')` is `null`.

---

### Task 3.4 — Playwright visual regression + docs page (1–2h)

**Depends on:** 3.1, 3.2, 3.3

Goal: snapshot each variant on light + dark backgrounds; ship the docs page.

Files:
1. `packages/playwright/fixtures-app/hint-variants.html` (NEW) — a single page that mounts all three variants twice (once on a light section, once on a dark section). Mirrors the existing `two-step.html` fixture's React mount pattern.
2. `packages/playwright/__tests__/hint-variants.spec.ts` (NEW) — six `expect(locator).toHaveScreenshot('badge.light.png')` assertions etc. Use `page.emulateMedia({ colorScheme: 'light' | 'dark' })` only if needed; otherwise the fixture's two sections handle it.
3. `apps/docs/content/docs/hints/variants.mdx` (NEW) — three sections, each with a live preview (use the existing Fumadocs preview component pattern from sibling MDX files in `apps/docs/content/docs/hints/`).

Implementation notes:
- The Playwright spec lives in `packages/playwright/__tests__/` (where `smoke.spec.ts` already is) and reuses the existing `playwright.config.ts` `webServer` setup; just add a new entry under `webServer.url` matrix if needed, or rely on the existing dev server which serves all fixtures from `fixtures-app/`. Confirm by checking that `fixtures-app/vite.config.ts` serves all html files in the directory.
- Snapshot tolerance: keep Playwright's default (`maxDiffPixels: 0`, `threshold: 0.2`). If anti-aliasing flakes, raise `maxDiffPixelRatio: 0.01` per snapshot, but try defaults first.
- Each snapshot is taken with the `targetRect` fixed (a hard-coded 100×40 box in the fixture) so positions are deterministic.

**Sanity check:** `cd packages/playwright && pnpm test:e2e hint-variants` runs the six snapshot tests; first run generates baselines (committed); subsequent runs pass. Docs page renders via `cd apps/docs && pnpm dev` with no MDX compile errors.

---

## Deliverables

```
packages/hints/
├── src/
│   ├── variants/
│   │   ├── badge.tsx                          # NEW — HintBadge forwardRef component
│   │   ├── beacon-with-label.tsx              # NEW — HintBeaconWithLabel
│   │   └── whats-new-pill.tsx                 # NEW — HintWhatsNewPill (uses useReducedMotion gate)
│   ├── components/
│   │   ├── hint-hotspot.tsx                   # UPDATED — accept `variant` prop, delegate to variants/
│   │   └── ui/
│   │       └── hint-variants.ts               # UPDATED — extend hintHotspotVariants with `variant: { ... }`
│   └── index.ts                                # UPDATED — re-export the three variant components + types

packages/playwright/
├── fixtures-app/
│   └── hint-variants.html                     # NEW — mounts all three variants on light + dark sections
└── __tests__/
    └── hint-variants.spec.ts                  # NEW — 6 visual-regression snapshots (3 variants × 2 themes)

apps/docs/content/docs/hints/
└── variants.mdx                                # NEW — live preview per variant with copy-pasteable code blocks
```

No new dependencies. No `package.json` changes. No provider changes.

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/hints typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/hints test` exits 0 with all existing tests green plus new unit coverage for each of the three variants (≥1 render assertion + ≥1 a11y/contrast assertion per variant)
- [ ] `<HintHotspot variant="badge" targetRect={r} position="top-right" />` (no other props) renders a button whose `getBoundingClientRect()` reports `width >= 24 && height >= 24`
- [ ] `<HintHotspot variant="beacon-with-label" label="New" targetRect={r} position="top-right" />` renders the label with `aria-hidden="true"`; `<HintHotspot variant="what-s-new-pill" label="What's new" .../>` renders with the sparkle icon `aria-hidden="true"` and `aria-label="What's new"` on the button
- [ ] vitest-axe scan reports `0` `color-contrast` violations for each of the three variants on `#ffffff` and on `#0a0a0a` backgrounds
- [ ] Six Playwright snapshots in `packages/playwright/__tests__/hint-variants.spec.ts` pass: `{badge,beacon-with-label,whats-new-pill}.{light,dark}.png` — baseline images committed
- [ ] Under `prefers-reduced-motion: reduce` (mocked via `useReducedMotion → true`), `variant="what-s-new-pill"` returns `null` after first `pointerdown`; `variant="beacon-with-label"` renders without `animate-tour-pulse` in the className chain
- [ ] `apps/docs/content/docs/hints/variants.mdx` renders in `pnpm --filter docs dev` with three working live previews; the existing hints sidebar shows the "Variants" entry
- [ ] The un-variant path (`<HintHotspot />` with no `variant` prop) produces byte-identical DOM versus `main` (verified by the existing `hint-hotspot.test.tsx` snapshot — no snapshot regeneration)

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 3 of Tour Kit v2 Package Polish — **Hint Presets**. You are adding three named, opinionated variants to `<HintHotspot>` in `@tour-kit/hints`. All work is additive and backwards-compatible.

### What This Project Is
Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless product-tour primitives (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) plus pro packages. Strict TypeScript, ES2020 target, tsup for bundling, vitest for unit tests, Playwright for E2E + visual regression. The `@tour-kit/hints` package ships persistent hints/hotspots that exist outside the tour flow.

### Established in Prior Phases
- Phase 0 (validation gate, complete) locked the cross-cutting API contracts in `tasks/v2-package-polish/phase-0-validation.md`. **This phase does not consume any Phase 0 contract** — it only touches `@tour-kit/hints` internals. The variant prop interface defined here will, however, be consumed by Phase 12 (`<HintGroup>`).
- `@tour-kit/hints` v0.12.0 ships a working `<HintHotspot>` at `packages/hints/src/components/hint-hotspot.tsx`. Its existing `cva` style table lives at `packages/hints/src/components/ui/hint-variants.ts`. The existing hotspot supports `size: default|sm|lg`, `color: default|secondary|destructive|success|warning`, `pulse: boolean`, `zIndex: default|high`. Under the hood it positions via `getHotspotPosition(position, rect)`, uses `useReducedMotion()` from `@tour-kit/core` to gate the `animate-tour-pulse` class, and switches between `<button>` / `Slot` / `UnifiedSlot` via `useUILibrary()`.
- `class-variance-authority` (`cva`) is already a `dependencies` entry in `packages/hints/package.json`. **Canonical example to mirror:** `packages/surveys/src/components/ui/banner-variants.ts` (5-line cva with variants + compoundVariants + defaultVariants).
- Playwright visual regression infra exists at `packages/playwright/`. Existing fixtures live in `packages/playwright/fixtures-app/*.html` (`two-step.html`, `no-bridge.html`, `two-step-with-diagnose.html`). The dev server runs via `pnpm fixtures:serve` on `http://localhost:5180`. Existing E2E spec is `packages/playwright/__tests__/smoke.spec.ts`.
- Reduced-motion three-tier defense is the load-bearing cross-package contract — see below.

### Your Goal for This Phase
Ship three named presets — `variant="badge"`, `variant="beacon-with-label"`, `variant="what-s-new-pill"` — on `<HintHotspot>`. Each ≥24×24 px hit-target, each passes WCAG 2.1 AA contrast on light and dark backgrounds, each has a Playwright visual-regression snapshot on both themes, each has a live example in the docs.

### Data Model Rules (follow exactly)
- **`cva` is the only class-mapping mechanism.** Add `variant: { badge: '...', 'beacon-with-label': '...', 'what-s-new-pill': '...' }` to the existing `hintHotspotVariants` in `components/ui/hint-variants.ts`. Do not inline `cn(...)` chains for variant style sets in the new variant components — pull from the extended `cva` table.
- **Discriminated union on `HintHotspotProps`** for variant-specific extras. The base props stay required (`targetRect`, `position`); the union narrows extras by `variant` literal:
  ```ts
  type HintHotspotVariantExtras =
    | { variant?: undefined }
    | { variant: 'badge'; count?: number }
    | { variant: 'beacon-with-label'; label: string; side?: 'left' | 'right' }
    | { variant: 'what-s-new-pill'; label: string }
  ```
- **No new public types beyond `HintHotspotVariantName`** (the literal union). Export the three variant components (`HintBadge`, `HintBeaconWithLabel`, `HintWhatsNewPill`) for advanced composition but document the recommended path as `<HintHotspot variant="...">`.
- **Internal state stays local.** `what-s-new-pill` uses `React.useState<boolean>` for `hasInteracted`. No new context, no new hooks, no provider plumbing.
- **No new dependencies.** Do not add `lucide-react`, `@radix-ui/react-icons`, or any icon library — inline the sparkle SVG.

### Reduced-Motion Three-Tier Defense (cross-package contract, copied from repo-root CLAUDE.md)
1. **`motion-safe:` Tailwind prefix** on every `tailwindcss-animate` utility (`animate-in`, `fade-*`, `slide-*`, `zoom-*`) and on `transition-*` chains. Compiles to `@media (prefers-reduced-motion: no-preference)` — under reduce, the utility never applies. Required because `tailwindcss-animate` does not auto-respect the OS pref.
2. **`@media (prefers-reduced-motion: reduce)` keyframe wrappers** for custom `@keyframes` we own (`tour-pulse` in `hints` is already wrapped at `packages/hints/src/styles/{variables,theme}.css`).
3. **JS gate via `useReducedMotion()`** from `@tour-kit/core` for render-time class branches or conditional renders. Re-exported from `@tour-kit/hints` already.

Per-variant tier mapping for this phase:
- `badge`: no animation → no tiers needed beyond inheriting the base hotspot's existing pulse gate.
- `beacon-with-label`: tier 1 (`motion-safe:animate-tour-pulse`) + tier 3 (`shouldPulse = !isOpen && !reducedMotion` in the className chain). Tier 2 is already in place for `tour-pulse`.
- `what-s-new-pill`: tier 1 (`motion-safe:transition-opacity motion-safe:duration-200`) + tier 3 (`if (hasInteracted && reducedMotion) return null`).

### Architecture
```
<HintHotspot variant?="badge" | "beacon-with-label" | "what-s-new-pill" />
                │
                ├─► no variant prop → existing dot path (unchanged)
                │
                └─► variant set     → delegate to variants/<name>.tsx
                                       which composes hintHotspotVariants({ variant: '...' })
                                       and reuses getHotspotPosition() for placement.
```

### Confirmed Library APIs

**`cva` — canonical pattern from this repo (mirror exactly):**
```ts
// packages/surveys/src/components/ui/banner-variants.ts — DO THIS
import { cva } from 'class-variance-authority'

export const bannerVariants = cva(
  'relative flex items-center justify-between gap-4 px-4 py-3 text-sm',
  {
    variants: {
      position: { top: 'border-b', bottom: 'border-t' },
      intent: { info: '...', feedback: 'bg-background text-foreground border-border' },
      sticky: { true: 'fixed left-0 right-0 z-40', false: 'relative' },
    },
    compoundVariants: [
      { position: 'top', sticky: true, className: 'top-0' },
      { position: 'bottom', sticky: true, className: 'bottom-0' },
    ],
    defaultVariants: { position: 'top', intent: 'info', sticky: false },
  }
)
```

**Existing `hintHotspotVariants` (extend, don't replace):**
```ts
// packages/hints/src/components/ui/hint-variants.ts — CURRENT SHAPE
export const hintHotspotVariants = cva(
  'fixed rounded-full border-2 border-background shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      size: { default: 'h-3 w-3', sm: 'h-2.5 w-2.5', lg: 'h-4 w-4' },
      color: { default: 'bg-primary', secondary: 'bg-secondary-foreground', destructive: 'bg-destructive', success: 'bg-emerald-500', warning: 'bg-amber-500' },
      pulse: { true: 'animate-tour-pulse', false: '' },
      zIndex: { default: 'z-50', high: 'z-[9999]' },
    },
    compoundVariants: [{ pulse: true, className: 'animate-tour-pulse' }],
    defaultVariants: { size: 'default', color: 'default', pulse: true, zIndex: 'default' },
  }
)
```
ADD a new `variant: { badge, 'beacon-with-label', 'what-s-new-pill' }` key. Use `compoundVariants` to neutralize the `h-3 w-3` size default when a `variant` is set (so badge gets 24×24, not 12×12). Keep `defaultVariants.variant` undefined so the un-variant path stays byte-identical.

**`useReducedMotion()` (already exists, already re-exported from `@tour-kit/hints`):**
```ts
import { useReducedMotion } from '@tour-kit/core'
// returns boolean — true when `prefers-reduced-motion: reduce` matches
const reducedMotion = useReducedMotion()
```

**Existing `getHotspotPosition` helper in `hint-hotspot.tsx`:** reuse it directly — do NOT reimplement positioning inside variant components. Either inline the call in each variant, or factor it into a shared helper at `packages/hints/src/variants/_position.ts` if you find yourself duplicating it three times.

**Playwright visual regression — existing pattern from `smoke.spec.ts`:**
```ts
import { expect, test } from '../src'
test.describe('hint variants', () => {
  test('badge — light', async ({ page }) => {
    await page.goto('/hint-variants.html#badge-light')
    await expect(page.locator('[data-testid="badge-light"]')).toHaveScreenshot('badge.light.png')
  })
  // ... five more
})
```

### Files to Create

#### `packages/hints/src/variants/badge.tsx`
Export `HintBadge` (forwardRef`<HTMLButtonElement, HintBadgeProps>`). Props: `targetRect`, `position`, `count?: number`, `isOpen?`, `asChild?`, `className?`. Inside: call `getHotspotPosition(position, targetRect)`, render a `<button>` (or `Slot`/`UnifiedSlot` when `asChild`) with `cn(hintHotspotVariants({ variant: 'badge' }), className)`. Render `count` (clamped to "99+" if >99) as text content. `aria-label="Show hint"`. No animation; no reduced-motion gate needed beyond inheriting `pulse: false` for badges (the badge itself doesn't pulse).

#### `packages/hints/src/variants/beacon-with-label.tsx`
Export `HintBeaconWithLabel`. Props: `targetRect`, `position`, `label: string`, `side?: 'left' | 'right'` (default `'right'`), `isOpen?`, `asChild?`, `className?`. Wrapper is an `inline-flex items-center gap-1.5 min-h-6 min-w-6` button. Inside: a `<span aria-hidden>` with `text-xs font-medium`. Use `motion-safe:animate-tour-pulse` on the inner beacon dot. Compute `const shouldPulse = !isOpen && !reducedMotion` via `useReducedMotion()`. `aria-label` on the button is `"Show hint"`; the visible label is `aria-hidden="true"` (avoids SR double-read).

#### `packages/hints/src/variants/whats-new-pill.tsx`
Export `HintWhatsNewPill`. Props: `targetRect`, `position`, `label: string`, `isOpen?`, `asChild?`, `className?`. Uses `React.useState<boolean>(false)` for `hasInteracted`. On the first `onPointerDown` or `onFocus`, set true. Render `<SparkleIcon aria-hidden />` + `<span>{label}</span>` inside the button. ClassName uses `motion-safe:transition-opacity motion-safe:duration-200` plus `hasInteracted ? 'opacity-0' : 'opacity-100'`. **Critical reduced-motion logic:** `if (hasInteracted && reducedMotion) return null` so the element is removed (not just transparent) under reduce. `aria-label={label}` on the button. Inline `SparkleIcon` as a 4-pointed star SVG, ~150 bytes minified.

#### `packages/hints/src/components/hint-hotspot.tsx` (update)
Add the discriminated-union `HintHotspotVariantExtras` to `HintHotspotProps`. Inside the component body: if `props.variant` is set, delegate to the matching variant component (pass through `targetRect`, `position`, `isOpen`, `asChild`, `className`, plus the variant-specific extras). Otherwise, run the existing v1 render path **unchanged**. Type-narrow with a `switch (props.variant)` so the variant-specific props are typesafe at the call site.

#### `packages/hints/src/components/ui/hint-variants.ts` (update)
Add the `variant: { badge, 'beacon-with-label', 'what-s-new-pill' }` key as described. Use `compoundVariants` to override the `h-3 w-3` size when a `variant` is set (e.g., `{ variant: 'badge', className: 'h-6 w-6 min-h-6 min-w-6 ...' }`). Keep `defaultVariants` untouched (no `variant` default → un-variant path is byte-identical).

#### `packages/hints/src/index.ts` (update)
Re-export `HintBadge`, `HintBeaconWithLabel`, `HintWhatsNewPill` and their prop interfaces. Re-export the `HintHotspotVariantName` type literal alias.

#### `packages/hints/__tests__/variants/badge.test.tsx`, `beacon-with-label.test.tsx`, `whats-new-pill.test.tsx`
One vitest file per variant. Each tests: (a) renders without throwing on minimal props, (b) `getBoundingClientRect().width >= 24 && height >= 24`, (c) `vitest-axe` contrast scan on `#ffffff` and `#0a0a0a` background wrappers reports zero color-contrast violations. For `whats-new-pill`, an extra test mocks `useReducedMotion → true`, fires `pointerdown`, asserts `queryByRole('button')` is `null`.

#### `packages/playwright/fixtures-app/hint-variants.html`
A single page that mounts a React tree with six anchored sections — each variant in a light section + a dark section. Each section has a stable `data-testid` (`badge-light`, `badge-dark`, etc.) and contains a fixed-size 100×40 anchor div so positions are deterministic.

#### `packages/playwright/__tests__/hint-variants.spec.ts`
Six tests, one per `{variant, theme}` pair, each running `await expect(page.locator('[data-testid="..."]')).toHaveScreenshot('...png')`. Reuse the existing `expect, test` import from `../src`.

#### `apps/docs/content/docs/hints/variants.mdx`
A new Fumadocs MDX page with three sections — one per variant — each containing a live `<HintHotspot variant="..." />` preview plus a copy-pasteable code block. Mirror the structure of sibling MDX pages in `apps/docs/content/docs/hints/` (check one and replicate the frontmatter + component imports). Add the page to the hints sidebar config if Fumadocs requires explicit registration (check `apps/docs/content/docs/hints/meta.json` or equivalent).

### Success Criteria
- `pnpm --filter @tour-kit/hints typecheck` exits 0
- `pnpm --filter @tour-kit/hints test` exits 0 with new variant tests green and existing tests untouched
- Each variant renders at ≥24×24 px (verified by `getBoundingClientRect()` in a unit test)
- `vitest-axe` reports zero `color-contrast` violations per variant on light + dark backgrounds
- `pnpm --filter @tour-kit/playwright test:e2e` exits 0 with six new hint-variant snapshots green (baselines committed)
- Under mocked `useReducedMotion → true`: `variant="what-s-new-pill"` returns `null` after first `pointerdown`; `variant="beacon-with-label"` className chain does NOT contain `animate-tour-pulse`
- `apps/docs` builds without MDX errors and the new `/docs/hints/variants` page renders three live previews
- The existing `<HintHotspot />` un-variant render path is byte-identical (existing `hint-hotspot.test.tsx` snapshot unchanged)

### Expected File Structure at End
```
packages/hints/
├── src/
│   ├── variants/                                   [NEW dir]
│   │   ├── badge.tsx                                NEW
│   │   ├── beacon-with-label.tsx                    NEW
│   │   └── whats-new-pill.tsx                       NEW
│   ├── components/
│   │   ├── hint-hotspot.tsx                         UPDATED
│   │   └── ui/hint-variants.ts                      UPDATED
│   └── index.ts                                     UPDATED
├── __tests__/                                       [NEW dir]
│   └── variants/
│       ├── badge.test.tsx                           NEW
│       ├── beacon-with-label.test.tsx               NEW
│       └── whats-new-pill.test.tsx                  NEW

packages/playwright/
├── fixtures-app/hint-variants.html                  NEW
└── __tests__/hint-variants.spec.ts                  NEW

apps/docs/content/docs/hints/
└── variants.mdx                                     NEW
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 3 has no upstream phase dependencies (`Depends on: Nothing` per big-plan.md). The references it consumes (the existing `hintHotspotVariants` cva, `useReducedMotion()` hook, `getHotspotPosition` helper, Playwright fixtures-app pattern, surveys `banner-variants.ts` canonical cva example) are all verified to exist in-repo at the cited paths.
- [PASS] Every sub-task has a clear, testable completion condition — each of 3.1–3.4 ends with a one-paragraph "Sanity check" specifying the assertion or shell command that proves it.
- [PASS] Execution prompt is self-contained — prior facts copied inline (existing cva shape pasted verbatim, surveys cva pasted verbatim, three-tier reduced-motion contract pasted verbatim from CLAUDE.md); data model rules explicit (cva-only, discriminated union, no new deps, internal state only); per-file guidance specifies exact exports, props, and gotchas; no "see Phase X" references.
- [PASS] Exit criteria map 1:1 to deliverables — eight exit checkboxes covering typecheck, unit tests (variants × axe), variant hit-target, accessibility roles, Playwright snapshots (6), reduced-motion behaviour (both gated variants), docs page render, and a byte-identity check for the un-variant path. Each deliverable file is covered by at least one exit check.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in this phase (`cva` is already a dep; `@playwright/test` already a peer; no model loads, no network). Reduced-motion is mocked via direct `useReducedMotion` mock in the whats-new-pill test.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. The canonical `cva` snippet is pasted verbatim from `packages/surveys/src/components/ui/banner-variants.ts` (in-repo source-of-truth, per phase instructions). Playwright snapshot pattern is pasted from the existing `smoke.spec.ts`.
