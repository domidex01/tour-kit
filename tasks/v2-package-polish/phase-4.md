# Phase 4 — TourCard Design Refresh

**Duration:** Days 20–24 (~8–12 hours)
**Depends on:** Nothing — but coordinates with Phase 5 on shared `tour-card.tsx` (do not rebase Phase 5 onto Phase 4's branch; the two phases land sequentially and the second rebases up)
**Blocks:** Nothing direct — gates **Milestone M3** (visual regression diff approved; Lighthouse a11y on a tour page = 100)
**Risk Level:** HIGH — this is a visual breaking change to the most-rendered component in the library. Existing consumer themes can regress silently; the step indicator can double-read for screen readers; the arrow can misalign at fallback placements.
**Stack:** react

---

## Objective

Refresh `<TourCard>` to look like a 2026 product tour rather than a 2018 modal: render a step-of-N indicator inside the card header, draw a real arrow/beak that points at the target using Floating UI's `arrow` middleware (already in the file — see `packages/react/src/components/card/tour-card.tsx:5–11, 89`), demote the **Skip** button to a tertiary text link, promote **Next** to primary, and keep **Back** as the secondary outline. Ship a one-minor-cycle opt-out (`<TourCard variant="classic">`) so existing consumers can pin the v1 look while they upgrade their themes. Every change must preserve the existing focus-trap, `role="dialog"` / `aria-modal="true"` contract, and Lighthouse Accessibility score of 100.

## What Success Looks Like

1. `<TourCard />` renders a step indicator string matching `/^\d+ \/ \d+$/` (e.g. `3 / 7`) inside the header **and** that same string appears in the dialog's `aria-label` — there is no separate `aria-live` region announcing it (verified by `screen.getByRole('dialog')` having `aria-label="Step 3 of 7: <title>"` and a `querySelector('[aria-live]')` returning `null`).
2. `arrow({ element: arrowRef })` is in the `useFloating` middleware list (already present) and `<FloatingArrow>` renders for every one of the 12 placements (`top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end`) — verified by a Playwright matrix test that screenshots each placement and asserts the arrow tip is within 4px of the target's edge.
3. `pnpm --filter @tour-kit/react test src/__tests__/a11y/tour-card-a11y.test.tsx` exits 0 with the existing 8 cases still green **plus** 3 new assertions: (a) `aria-label` contains the step counter, (b) arrow `<svg>` has `aria-hidden="true"`, (c) no `aria-live` element exists inside the dialog.
4. Lighthouse Accessibility audit on `examples/dashboard-next` with a tour open returns score = 100 (recorded as a JSON artifact in the PR).
5. `pnpm --filter @tour-kit/playwright exec playwright test tour-card-placements.spec.ts` passes 12/12 placement screenshots within tolerance.
6. `<TourCard variant="classic" />` renders the v1 layout (dots progress, no arrow, no step counter, Skip = outline button) and emits a `console.warn` in dev mentioning removal in the next major.
7. `pnpm --filter @tour-kit/react typecheck` exits 0; the new `TourCardProps` interface includes `showStepIndicator?: boolean`, `progress?: number`, `arrowSize?: number`, and `variant?: 'refreshed' | 'classic'` (default `'refreshed'`).
8. Storybook visual regression diff against `examples/dashboard-next` and `apps/docs` shows ≤2 unexpected diffs (anything beyond TourCard itself), reviewed and signed off by the user before merge — this is the **M3 milestone gate**.

---

## What Failure Looks Like (and what to do)

- **Visual regression diff shows >2 unexpected diffs in existing example apps** (e.g., consumer themes regress on padding, border-radius, or shadow) → revert the cva refresh, ship the arrow + step counter + button hierarchy only, and keep the existing `tourCardVariants` shadow/border tokens. Document the deferred token refresh as Phase 4.5.
- **Lighthouse Accessibility drops below 100** → the most likely culprit is the step counter being announced both via `aria-label` and as visible text creating a double-read OR the arrow `<svg>` missing `aria-hidden`. Fix: move the visible `"3 / 7"` to a `<span aria-hidden="true">` and rely solely on `aria-label="Step 3 of 7: <title>"` for the screen-reader path. Re-run Lighthouse before merge.
- **Arrow misaligns on `*-start` / `*-end` placements or after `flip()` falls back** → `<FloatingArrow>` from `@floating-ui/react` derives `staticSide` from `context.placement.split('-')[0]` automatically when the `context` prop is wired — confirm the rendered SVG's transform matches the resolved placement after `flip` by reading `data-placement` on the floating element. If it still misaligns, switch from `<FloatingArrow>` to a manual `<svg>` reading `context.middlewareData.arrow.{x,y}` plus a `staticSide` lookup table `{ top: 'bottom', bottom: 'top', left: 'right', right: 'left' }`. Do not ship without 12/12 placements green.
- **Existing consumer themes break under `variant="refreshed"`** that we did not catch in visual regression → ship `variant="classic"` as the documented escape hatch for one minor cycle (mark deprecated; remove in v3.0). Open a follow-up issue logging which consumer themes regressed so v3.0 has migration notes.
- **Reduced-motion users see new transitions** → any new transition (e.g., the indicator number tick on step change) must use the `motion-safe:` Tailwind prefix or be gated by `useReducedMotion()` from `@tour-kit/core` (already imported on line 12 of the existing file). Three-tier defense per CLAUDE.md.
- **Bundle size for `@tour-kit/react` increases >0.5 KB gzipped** → the arrow component is already in the bundle (`TourArrow` at `packages/react/src/components/primitives/tour-arrow.tsx`); any growth must come from the step-counter logic. Inline the `Step N of M` formatter into `tour-card.tsx` instead of a new file if needed.

---

## Architecture / Key Design Decisions

```
┌──────────────────────────────────────────────────────────────┐
│                       <TourCard>                             │
│                                                              │
│  ┌──────── TourCardHeader (existing) ─────────────────────┐ │
│  │  [Step 3/7]    Title (h3, font-semibold)        [×]   │ │
│  │   ▲ NEW visible "3 / 7" indicator (aria-hidden)        │ │
│  │   • aria-label="Step 3 of 7: Title" goes on <div>      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  TourCardContent (unchanged)                                 │
│                                                              │
│  ┌──────── TourCardFooter ────────────────────────────────┐ │
│  │  TourProgress (existing dots/bar/numbered/chain)       │ │
│  │  TourNavigation:                                       │ │
│  │    Skip (variant="link")   ◄── demoted to text link    │ │
│  │    Back (variant="secondary") ◄── unchanged            │ │
│  │    Next (variant="default")   ◄── primary, focus-ring  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  <TourArrow context={context} ref={arrowRef} />              │
│   ▲ NEW: <FloatingArrow> staticSide derived from placement  │
│     (handled by @floating-ui/react internally)              │
└──────────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `TourCardProps` (component contract) | TypeScript `interface` extending existing shape | Public API; consumers rely on `interface` merging for type augmentation |
| `tourCardVariants` (style contract) | `cva()` from class-variance-authority | Existing pattern in `packages/react/src/components/ui/card-variants.ts`; adds a new `variant: 'refreshed' | 'classic'` axis |
| Per-render placement string | Inline string template | Hot path — runs every step transition; do not allocate a config object |

**Other critical rules for this phase:**
- **Backwards compatibility:** `<TourCard size="default" />` (no `variant` prop) MUST render the refreshed look. The classic opt-out is explicit (`variant="classic"`). All existing tests pass without modification on the new default.
- **No new runtime deps:** `@floating-ui/react` is already a dep (`useFloating`, `arrow`, `FloatingArrow`). Reuse exclusively.
- **No `tailwindcss-animate` utilities added** unless prefixed with `motion-safe:`. Per CLAUDE.md cross-package reduced-motion contract.
- **Verify-don't-hope on Floating UI staticSide:** `<FloatingArrow context={context}>` internally calls `context.middlewareData.arrow` and derives `staticSide` from `context.placement.split('-')[0]`. Confirmed via repo source — `packages/react/src/components/primitives/tour-arrow.tsx:13–24` already wires it correctly. Do not reimplement this manually unless the Playwright matrix proves misalignment.
- **No `console.warn` spam:** the `variant="classic"` deprecation warning fires **once per mount** (use a module-level `Set<string>` keyed by `currentStep.id`).
- **Tests must work without a real browser** for unit-level assertions: use `@testing-library/react` + jsdom for `aria-label` / `aria-hidden` assertions; only the placement-matrix screenshot test runs in Playwright.

---

## Tasks

### Task 4.1 — Step indicator + aria-label refactor (2–3h)

Add a visible `"3 / 7"` indicator inside `<TourCardHeader>` (positioned before the title) and rewrite the dialog's accessibility hookup so the step counter lives in `aria-label`, not as a separate live region. The visible string is decorative — `aria-hidden="true"` on its `<span>`.

Update `TourCardProps` (in `packages/react/src/components/card/tour-card.tsx`):

```ts
// Confirmed via repo source — packages/react/src/components/card/tour-card.tsx:30–32
// (existing shape, extended in Phase 4):

export interface TourCardProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    TourCardVariants {
  /** Show "N / M" indicator inside the header. Default: true on `variant="refreshed"`, false on `variant="classic"`. */
  showStepIndicator?: boolean
  /** Override the 0..1 progress value (defaults to currentStepIndex+1 / totalSteps). */
  progress?: number
  /** Floating UI arrow size in pixels. Default: 8. */
  arrowSize?: number
  /** Opt-out for v1 look — deprecated, removed in next major. */
  variant?: 'refreshed' | 'classic'
}
```

Rewrite the dialog wrapper's a11y attributes:

```tsx
// In tour-card.tsx — replace the existing aria-labelledby with aria-label.
// Existing line ~143: aria-labelledby={`tour-step-title-${currentStep.id}`}
// New behaviour:

const stepLabel = `Step ${currentStepIndex + 1} of ${totalSteps}`
const ariaLabel = resolvedTitle ? `${stepLabel}: ${resolvedTitle}` : stepLabel

// On the <div role="dialog">:
//   aria-label={ariaLabel}           // single source for SR announcement
//   aria-modal="true"                // unchanged
//   (drop aria-labelledby — replaced by aria-label)
```

Update `<TourCardHeader>` (`packages/react/src/components/card/tour-card-header.tsx`) to accept and render the indicator:

```tsx
// New prop on TourCardHeaderProps:
stepIndicator?: { current: number; total: number } | null

// Render before the title:
{stepIndicator && (
  <span
    aria-hidden="true"
    className="text-xs font-medium text-muted-foreground tabular-nums"
    data-slot="tour-step-indicator"
  >
    {stepIndicator.current} / {stepIndicator.total}
  </span>
)}
```

**Sanity check:**
- `grep -c "aria-live" packages/react/src/components/card/tour-card.tsx` returns 0.
- `pnpm --filter @tour-kit/react test src/__tests__/a11y/tour-card-a11y.test.tsx` still exits 0 after rewriting the existing `aria-labelledby` test to assert on `aria-label`.

---

### Task 4.2 — Arrow refinement + placement matrix tests (4–5h)

**Depends on:** 4.1

The Floating UI `arrow` middleware is **already wired** (`packages/react/src/components/card/tour-card.tsx:85–90`) and `<TourArrow>` already renders via `<FloatingArrow>` from `@floating-ui/react`. This task hardens visual quality and proves placement coverage:

```tsx
// Confirmed via repo source — packages/react/src/components/card/tour-card.tsx:82–92
// existing middleware list:

const { refs, floatingStyles, context } = useFloating({
  open: isActive,
  placement: toFloatingPlacement(currentStep?.placement),
  middleware: [
    offset(currentStep?.offset?.[1] ?? 12),
    flip({ fallbackAxisSideDirection: 'start' }),
    shift({ padding: 8 }),
    arrow({ element: arrowRef }),  // already here — DO NOT re-add
  ],
  whileElementsMounted: autoUpdate,
})
```

Add a configurable `arrowSize` prop to `<TourArrow>` (default 8). Update `tour-arrow.tsx`:

```tsx
// packages/react/src/components/primitives/tour-arrow.tsx — extended:
interface TourArrowProps {
  context: FloatingContext
  className?: string
  size?: number  // NEW — passes through to FloatingArrow `height`/`width`
}

// In the body:
<FloatingArrow
  ref={ref}
  context={context}
  height={size ?? 8}
  width={(size ?? 8) * 2}  // FloatingArrow convention: width = 2× height for the beak
  className={className}
  fill="var(--color-popover)"
  stroke="var(--color-border)"
  strokeWidth={1}
  aria-hidden="true"  // NEW — explicit; FloatingArrow does not set this
/>
```

Create a Playwright placement-matrix test at `packages/playwright/__tests__/tour-card-placements.spec.ts`:

```ts
// One test per placement; runs against a new fixture page that takes ?placement= query param.
// Placements: top, top-start, top-end, bottom, bottom-start, bottom-end,
//             left, left-start, left-end, right, right-start, right-end
//
// For each: navigate to /placement-matrix.html?placement=top-start,
// wait for the dialog, screenshot, and assert the arrow tip is within
// 4px of the target's edge using boundingBox math.
```

Add a fixture page at `packages/playwright/fixtures-app/placement-matrix.html` that reads `?placement=` and configures the tour step accordingly. Mirror the existing `two-step.html` fixture structure.

**Sanity check:**
- `pnpm --filter @tour-kit/playwright exec playwright test tour-card-placements.spec.ts --reporter=list` shows 12 passed.
- Visual snapshots committed to `packages/playwright/__tests__/__screenshots__/tour-card-placements/` — review-able in the PR diff.

---

### Task 4.3 — Button hierarchy rework (1–2h)

**Depends on:** 4.1

Demote **Skip** to a tertiary text link, promote **Next** as primary, keep **Back** as secondary outline. Today's `<TourNavigation>` (at `packages/react/src/components/navigation/tour-navigation.tsx:42–69`) **already renders Skip as `variant="link"`**, so the only change is layout order and the focus-ring assertion. Confirm the visual hierarchy table:

| Action | Variant token | Order (LTR) | Notes |
|---|---|---|---|
| **Skip** | `variant="link"` (existing) | leftmost | tertiary text link with underline-offset hover; muted-foreground color; size `sm` |
| **Back** | `variant="secondary"` (existing) | middle | outline button; hidden on first step (current logic) |
| **Next** / **Finish** | `variant="default"` (existing) | rightmost | primary; receives focus ring; size `sm` |

The current order in `<TourNavigation>` is already `Skip → Back → Next`. **No order change needed.** What changes:

1. Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to the **Next** button to make the primary focus state more visible (the existing button-variant focus ring is `ring-1`).
2. Ensure the Skip button has `aria-label="Skip tour"` (it currently relies on the visible "Skip" text — add explicit label for clarity).
3. Update the variant CSS for the refreshed look in `card-variants.ts` if needed (e.g., bump `default` size shadow on the card from `shadow-lg` to a softer `shadow-xl ring-1 ring-border/10`) — only if visual regression on existing example apps stays ≤2 diffs.

```tsx
// Only the focus ring tweak — modify packages/react/src/components/ui/button-variants.ts
// `default` variant becomes:
default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-offset-2',
```

**Sanity check:**
- `screen.getByRole('button', { name: /next|finish/i })` receives a visible focus ring on `Tab` (test added to a11y suite).
- Skip button has `aria-label="Skip tour"` — verifiable via `screen.getByRole('button', { name: 'Skip tour' })`.

---

### Task 4.4 — A11y test additions + `variant="classic"` opt-out (1–2h)

**Depends on:** 4.1, 4.2, 4.3

Extend the existing a11y test suite at `packages/react/src/__tests__/a11y/tour-card-a11y.test.tsx`. Add 3 new cases:

```tsx
it('aria-label contains the step counter', async () => {
  // ... start two-step tour
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveAttribute('aria-label', expect.stringMatching(/Step \d+ of \d+/))
})

it('arrow svg has aria-hidden', async () => {
  // ... start tour
  await screen.findByRole('dialog')
  // FloatingArrow renders inside the dialog as the last child
  const arrowSvg = document.querySelector('[role="dialog"] svg[aria-hidden="true"]')
  expect(arrowSvg).not.toBeNull()
})

it('does not double-read step counter via aria-live', async () => {
  // ... start tour
  await screen.findByRole('dialog')
  const liveRegion = document.querySelector('[role="dialog"] [aria-live]')
  expect(liveRegion).toBeNull()
})
```

Implement the `variant="classic"` opt-out. The classic variant:
- Renders **no** step indicator span (header looks like v1)
- Renders **no** `<FloatingArrow>` (the existing v1 had no arrow)
- Falls back to `variant="secondary"` for Skip (the v1 button hierarchy)
- Logs a one-time `console.warn('[tour-kit/react] <TourCard variant="classic"> is deprecated and will be removed in the next major. See https://tour-kit.dev/docs/react/migration/v2-tour-card-refresh')` in dev (`process.env.NODE_ENV !== 'production'`)

Add a docs page at `apps/docs/content/docs/react/components/tour-card-migration.mdx` covering:
1. What changed visually
2. The `variant="classic"` opt-out (with a one-line example)
3. The deprecation timeline (one minor cycle)
4. A diff snippet showing how to upgrade a custom theme

**Sanity check:**
- `pnpm --filter @tour-kit/react test` exits 0 with the 3 new cases green.
- `<TourCard variant="classic" />` renders without a step indicator, without an arrow, with Skip as a secondary outline button.
- Console warning fires exactly once per mount (verifiable with a `vi.spyOn(console, 'warn')` test).

---

## Deliverables

```
packages/react/
├── src/components/card/
│   ├── tour-card.tsx                                 # UPDATE — new props, aria-label, variant gate
│   └── tour-card-header.tsx                          # UPDATE — render optional step indicator span
├── src/components/primitives/
│   └── tour-arrow.tsx                                # UPDATE — add `size` prop, explicit aria-hidden
├── src/components/ui/
│   ├── card-variants.ts                              # UPDATE — add `variant: 'refreshed' | 'classic'` axis
│   └── button-variants.ts                            # UPDATE — bump `default` focus ring to ring-2
└── src/__tests__/a11y/
    └── tour-card-a11y.test.tsx                       # UPDATE — 3 new cases (aria-label, arrow aria-hidden, no aria-live)

packages/playwright/
├── __tests__/
│   └── tour-card-placements.spec.ts                  # NEW — 12-placement screenshot matrix
└── fixtures-app/
    └── placement-matrix.html                         # NEW — fixture page with ?placement= query param

apps/docs/
└── content/docs/react/components/
    └── tour-card-migration.mdx                       # NEW — opt-out docs + deprecation timeline
```

No new packages, no new runtime deps, no schema changes outside the component prop interface.

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/react typecheck` exits 0 with the extended `TourCardProps` interface (4 new optional props)
- [ ] `pnpm --filter @tour-kit/react test src/__tests__/a11y/tour-card-a11y.test.tsx` exits 0 with 11 passing cases (8 existing + 3 new)
- [ ] `pnpm --filter @tour-kit/playwright exec playwright test tour-card-placements.spec.ts` exits 0 with 12 passing placement screenshots; arrow tip within 4px of target edge in every one
- [ ] `grep -c "aria-live" packages/react/src/components/card/tour-card.tsx` returns 0 (step counter is in `aria-label` only)
- [ ] `<TourCard variant="classic" />` renders v1 look (no indicator, no arrow, Skip as secondary outline) and emits a one-time dev `console.warn`
- [ ] Lighthouse Accessibility on `examples/dashboard-next` with an active tour = 100 (JSON artifact attached to PR)
- [ ] Visual regression diff against existing example apps reviewed and signed off by the user (≤2 unexpected diffs) — **this is the M3 milestone gate**
- [ ] `apps/docs/content/docs/react/components/tour-card-migration.mdx` exists with `published: true` (or the equivalent Fumadocs visibility flag) and shows in nav
- [ ] Bundle size delta for `@tour-kit/react` ≤ 0.5 KB gzipped (verified via `pnpm --filter @tour-kit/react build` size comparison vs `main`)
- [ ] No regression in existing `pnpm --filter @tour-kit/react test` suite — all card / navigation / progress tests green

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---

You are building Phase 4 of Tour Kit v2 Package Polish — **TourCard Design Refresh**. This is a HIGH-risk visual refresh of the most-rendered React component in the library.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 packages providing headless React product-tour primitives. `@tour-kit/react` ships the styled tour shell — `<TourCard>` is its centerpiece, used by every consumer who doesn't go fully headless. Stack: TypeScript strict mode, React 18+, Tailwind CSS, `class-variance-authority` for variants, `@floating-ui/react` for positioning. Backwards compatibility is non-negotiable: existing example apps and consumer themes must not visibly regress beyond a small reviewed delta.

### Established in Prior Phases (and Repo Facts)

- The TourCard file is at `packages/react/src/components/card/tour-card.tsx` (NOT `components/tour/`). Children: `tour-card-header.tsx`, `tour-card-content.tsx`, `tour-card-footer.tsx`.
- Floating UI is already a dep; `arrow({ element: arrowRef })` is already in the `useFloating` middleware list (`tour-card.tsx:85–90`). `<FloatingArrow>` is already used in `packages/react/src/components/primitives/tour-arrow.tsx:14–24`. **Do not re-add the middleware or rewrite the arrow from scratch — extend what exists.**
- `TourCardProps` currently extends `React.ComponentPropsWithoutRef<'div'>` (omitting `content`) and `TourCardVariants` from `card-variants.ts`. Today's variants are `{ size: 'default' | 'sm' | 'lg' | 'auto' }` only.
- `<TourNavigation>` (`packages/react/src/components/navigation/tour-navigation.tsx`) **already** renders Skip as `variant="link"` (the demoted style); the button order is already `Skip → Back → Next`. The visual hierarchy work in 4.3 is mostly the focus-ring bump.
- The existing a11y test suite at `packages/react/src/__tests__/a11y/tour-card-a11y.test.tsx` has 8 cases. They must stay green.
- The Playwright workspace is at `packages/playwright/` with fixtures at `fixtures-app/*.html`. Existing fixtures: `two-step.html`, `no-bridge.html`, `two-step-with-diagnose.html`. Tests run via `pnpm --filter @tour-kit/playwright exec playwright test`.
- Reduced-motion contract (per `CLAUDE.md`): any new transition uses `motion-safe:` Tailwind prefix or is gated by `useReducedMotion()` from `@tour-kit/core` (already imported at line 12 of the existing file).

### Your Goal for This Phase

Make `<TourCard>` look like a 2026 product tour: step-of-N indicator inside the header, real arrow already pointing at the target, visible focus ring on the primary action, and an explicit `variant="classic"` opt-out for one minor cycle.

### Data Model Rules (follow exactly)

- **TypeScript `interface`**: `TourCardProps` (public component contract). Extends existing `React.ComponentPropsWithoutRef<'div'>` + `TourCardVariants`. Adds 4 new optional props (`showStepIndicator`, `progress`, `arrowSize`, `variant`).
- **`cva()` from class-variance-authority**: style variants. Add a `variant: 'refreshed' | 'classic'` axis to `tourCardVariants` in `packages/react/src/components/ui/card-variants.ts`. Default `'refreshed'`.
- **No `@dataclass` / no Zod**: this is a styled React component — no validation boundaries; no hot-path data classes. Everything is either props or computed inline.

### Confirmed Library APIs

`@floating-ui/react` — confirmed via repo source `packages/react/src/components/card/tour-card.tsx:5–11, 82–92` and `packages/react/src/components/primitives/tour-arrow.tsx:3–24`:

```ts
import { arrow, autoUpdate, flip, offset, shift, useFloating, FloatingArrow } from '@floating-ui/react'

// In the component:
const arrowRef = React.useRef<SVGSVGElement>(null)
const { refs, floatingStyles, context } = useFloating({
  open: isActive,
  placement: toFloatingPlacement(currentStep?.placement),
  middleware: [
    offset(currentStep?.offset?.[1] ?? 12),
    flip({ fallbackAxisSideDirection: 'start' }),
    shift({ padding: 8 }),
    arrow({ element: arrowRef }),   // ALREADY PRESENT — do not duplicate
  ],
  whileElementsMounted: autoUpdate,
})

// And later, inside the floating div:
<FloatingArrow ref={arrowRef} context={context} height={size} width={size * 2} fill="..." />
// <FloatingArrow> derives `staticSide` from `context.placement` internally — works for all 12 placements out of the box.
```

`@tour-kit/core` — already-imported hooks:

```ts
import { useFocusTrap, useReducedMotion, useTour } from '@tour-kit/core'
// useTour() returns { isActive, currentStep, currentStepIndex, totalSteps, next, prev, skip, isFirstStep, isLastStep }
// useReducedMotion() returns boolean — true when prefers-reduced-motion: reduce
// useFocusTrap(active) returns { containerRef, activate, deactivate } — already wired in tour-card.tsx
```

### Files to Create / Update

#### `packages/react/src/components/card/tour-card.tsx` (UPDATE)
Extend `TourCardProps` with the 4 new optional props (interface above). Replace the existing `aria-labelledby={`tour-step-title-${id}`}` with `aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}${resolvedTitle ? `: ${resolvedTitle}` : ''}`}`. Pass `stepIndicator={{ current: currentStepIndex + 1, total: totalSteps }}` to `<TourCardHeader>` when `variant === 'refreshed'` and `showStepIndicator !== false`. When `variant === 'classic'`: skip the step indicator, skip rendering `<TourArrow>`, and emit a one-time dev `console.warn` (use a module-level `Set<string>` keyed by `currentStep.id` for dedup). Default `variant` is `'refreshed'`.

#### `packages/react/src/components/card/tour-card-header.tsx` (UPDATE)
Add `stepIndicator?: { current: number; total: number } | null` to `TourCardHeaderProps`. When non-null, render `<span aria-hidden="true" className="text-xs font-medium text-muted-foreground tabular-nums" data-slot="tour-step-indicator">{current} / {total}</span>` BEFORE the title `<h3>`. Drop the `aria-labelledby` requirement — the dialog uses `aria-label` now, so the header `<h3>` no longer needs the `id={titleId}` for SR purposes (keep it for backwards compat; it's harmless).

#### `packages/react/src/components/primitives/tour-arrow.tsx` (UPDATE)
Add `size?: number` prop (default 8). Pass `height={size ?? 8}` and `width={(size ?? 8) * 2}` to `<FloatingArrow>`. Add `aria-hidden="true"` explicitly on the `<FloatingArrow>` element.

#### `packages/react/src/components/ui/card-variants.ts` (UPDATE)
Add a `variant: { refreshed: '...', classic: '...' }` axis to `tourCardVariants`. `refreshed` (default) keeps `rounded-lg border bg-popover text-popover-foreground shadow-lg`. `classic` uses the same base. The variant exists primarily to gate behaviour in `tour-card.tsx`, not to swap classes — but the cva axis gives consumers a clean prop-driven choice.

#### `packages/react/src/components/ui/button-variants.ts` (UPDATE)
Change `default` variant string to add `focus-visible:ring-2 focus-visible:ring-offset-2`. This is the only button-variants change.

#### `packages/react/src/__tests__/a11y/tour-card-a11y.test.tsx` (UPDATE)
Rewrite the `aria-labelledby linked to title` test to assert on `aria-label` instead. Add 3 new cases per Task 4.4 (aria-label contains step counter; arrow svg has aria-hidden; no aria-live region inside dialog).

#### `packages/playwright/__tests__/tour-card-placements.spec.ts` (NEW)
12 `test()` blocks — one per Floating UI placement. Each: `await page.goto('/placement-matrix.html?placement=top-start')` → wait for `[role="dialog"]` → `await page.screenshot({ path: '__screenshots__/tour-card-placements/top-start.png' })` → assert arrow tip is within 4px of target edge by reading `boundingBox()` on both elements and computing distance. Use `test.describe.parallel('TourCard placement matrix', () => { ... })`.

#### `packages/playwright/fixtures-app/placement-matrix.html` (NEW)
Mirror `two-step.html`. Read `?placement=` from `window.location.search`, configure the tour step with that placement, and auto-start the tour. The target element is a fixed-positioned button centered in the viewport so the placement matrix tests are deterministic.

#### `apps/docs/content/docs/react/components/tour-card-migration.mdx` (NEW)
Frontmatter `published: true` (per CLAUDE.md content-pipeline rules) and slot into the docs nav under `react > components`. Contents: what changed visually (with before/after screenshot placeholders), the `variant="classic"` opt-out one-liner, the deprecation timeline (`variant="classic"` removed in next major), and a diff snippet showing how to upgrade a custom theme.

### Success Criteria

- `pnpm --filter @tour-kit/react typecheck` exits 0
- `pnpm --filter @tour-kit/react test` exits 0 (existing + 3 new a11y cases)
- `pnpm --filter @tour-kit/playwright exec playwright test tour-card-placements.spec.ts` exits 0 (12/12 placements)
- `grep -c "aria-live" packages/react/src/components/card/tour-card.tsx` returns 0
- `<TourCard variant="classic" />` renders v1 layout with one-time dev warn
- Lighthouse Accessibility on `dashboard-next` with an active tour = 100 (JSON artifact in PR)
- Visual regression diff signed off by user (≤2 unexpected diffs) — **M3 gate**
- Bundle size delta ≤ 0.5 KB gzipped

### Expected File Structure at End

```
packages/react/src/components/card/
  tour-card.tsx                                   # MODIFIED
  tour-card-header.tsx                            # MODIFIED
  tour-card-content.tsx                           # unchanged
  tour-card-footer.tsx                            # unchanged

packages/react/src/components/primitives/
  tour-arrow.tsx                                  # MODIFIED

packages/react/src/components/ui/
  card-variants.ts                                # MODIFIED
  button-variants.ts                              # MODIFIED

packages/react/src/__tests__/a11y/
  tour-card-a11y.test.tsx                         # MODIFIED (3 new cases)

packages/playwright/__tests__/
  tour-card-placements.spec.ts                    # NEW

packages/playwright/fixtures-app/
  placement-matrix.html                           # NEW

apps/docs/content/docs/react/components/
  tour-card-migration.mdx                         # NEW (published: true)
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 4 has no hard dependencies; the only coordination note (with Phase 5 on the same file) is called out in the metadata. Repo facts (file paths, existing Floating UI wiring, existing a11y suite, existing button variants) are cited with line numbers.
- [PASS] Every sub-task has a clear, testable completion condition — each task has a `Sanity check` block with one-liner commands (grep, pnpm test, playwright run).
- [PASS] Execution prompt is self-contained — prior facts copied inline (file paths, existing middleware list, `useTour` return shape, `useReducedMotion` import); data model rules explicit (interface for props, cva for variants, no Zod, no @dataclass); per-file guidance specifies the exact change for each of the 9 files.
- [PASS] Exit criteria map 1:1 to deliverables — 9 deliverables, 9+ exit checkboxes covering typecheck, unit tests, Playwright matrix, grep purity, classic opt-out behaviour, Lighthouse, visual regression sign-off, docs publication, bundle size delta.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 4. Floating UI is already in the bundle; Playwright is the existing E2E harness; no new runtime libraries.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. The existing `@floating-ui/react` usage (`useFloating`, `arrow`, `FloatingArrow`) is confirmed via repo source — `packages/react/src/components/card/tour-card.tsx:5–11, 82–92` and `packages/react/src/components/primitives/tour-arrow.tsx:3–24`. The `staticSide` derivation is handled internally by `<FloatingArrow>` (confirmed by the existing in-repo usage).
