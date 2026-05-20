# Phase 3 — Testing: Hint Presets

**Scope:** Three new `<HintHotspot>` variants (`badge`, `beacon-with-label`, `what-s-new-pill`) in `@tour-kit/hints` plus the `hintHotspotVariants` cva extension; factored `getHotspotPosition` helper; a Next fixture route `examples/next-app/src/app/hint-variants/page.tsx`; six Playwright snapshots in `e2e/next/hint-variants.localhost.spec.ts` (3 variants × 2 themes); a `apps/docs/content/docs/hints/variants.mdx` page; **byte-identity** preservation on the un-variant path.
**Key Pattern:** Component composition + visual regression — unit-test each variant's prop handling and semantic a11y in jsdom with `vitest-axe`; pin the un-variant snapshot byte-identical against `main`; verify the three-tier reduced-motion defense by mocking `useReducedMotion → true` for `what-s-new-pill`; use Playwright for the six rendered-size/theme screenshots where real layout and contrast matter.
**Dependencies:** vitest, @testing-library/react, `vitest-axe` (existing devDep), jsdom env, Playwright (root harness — `next-localhost` project matched by filename suffix), no new runtime libs.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a consumer with a 6px-dot complaint, I want `<HintHotspot variant="badge" />` to render at ≥24×24 px so users see the affordance | Unit test pins the size class/style contract; Playwright fixture verifies the rendered bounding box | Unit: class/style contains the 24px minimum; Playwright: `boundingBox().width >= 24 && height >= 24` |
| US-2 | As a badge consumer, I want an optional `count` slot that clamps to "99+" | `badge.test.tsx` with `count={3}` and `count={150}` | Renders `"3"` and `"99+"` respectively |
| US-3 | As a screen-reader user, I want the beacon-with-label's visible label to NOT cause double-read; `aria-label` lives on the button | `beacon-with-label.test.tsx` a11y assertion | Visible `<span>` has `aria-hidden="true"`; button has `aria-label="Show hint"` |
| US-4 | As a reduced-motion user, I want `what-s-new-pill` to disappear (not just fade) after first interaction so it doesn't stay focusable | `whats-new-pill.test.tsx` with `useReducedMotion → true` | After `pointerdown`, `queryByRole('button')` is `null` |
| US-5 | As an a11y reviewer, I want each variant to pass WCAG 2.1 AA contrast on light AND dark backgrounds | `vitest-axe` semantic scan plus deterministic contrast-ratio checks for the resolved foreground/background tokens; Playwright screenshots backstop the rendered result | Axe reports no structural violations; contrast helper returns ratio ≥4.5:1 (or ≥3:1 for large/non-text affordances) for both themes |
| US-6 | As a v1 consumer, I want `<HintHotspot />` (no variant) to render byte-identically — zero diff after this PR | Existing `hint-hotspot.test.tsx` snapshot | Snapshot file unchanged (no `--update`) |
| US-7 | As a visual regression reviewer, I want each new variant covered on light and dark themes | Playwright spec generates 6 screenshots (3 variants × 2 themes) at one fixed placement. The 12-placement geometry matrix belongs to Phase 4 TourCard. | 6 `toHaveScreenshot()` assertions pass within tolerance |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `<HintBadge>` (extracted variant) | No mock — render with `targetRect: new DOMRect(0,0,100,40)`, `position: 'top-right'` | Unit test checks the minimum-size class/style contract and count clamping; Playwright checks actual `boundingBox()` pixels | US-1, US-2 |
| `<HintBeaconWithLabel>` | No mock — render with `label="New"`, `side="left"`/`"right"` | Visible label has `aria-hidden="true"`; button `aria-label="Show hint"`; `flex-row-reverse` applied when `side='left'` | US-3 |
| `<HintWhatsNewPill>` (reduced-motion gate) | Mock `@tour-kit/core` `useReducedMotion` via `vi.mock` to return `true`; do NOT mock matchMedia (the JS gate is the load-bearing tier) | Before pointerdown: `getByRole('button')` exists; after pointerdown under reduce: `queryByRole('button')` is `null` (component returned `null`) | US-4 |
| `<HintHotspot variant="...">` delegation | No mock — render the parent and assert it delegates to the variant; existing un-variant render path | Variant-set renders the variant component; un-variant render is byte-identical to `main` (existing snapshot) | US-6 |
| Contrast checks | No mock — run `axe(container)` for semantics, then run a small contrast-ratio helper against the resolved token colors for light/dark backgrounds | No axe structural violations; token contrast ratios meet WCAG thresholds | US-5 |
| Playwright `next-localhost` project | No mock — real Next dev server (existing webServer config) | 6 `toHaveScreenshot()` assertions match baseline (committed) | US-7 |
| `useReducedMotion()` for `beacon-with-label` second case | Same `vi.mock` pattern as US-4 | Under reduce, className chain does NOT contain `animate-tour-pulse` | US-4 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit (variant render + a11y) | vitest + @testing-library/react + vitest-axe (jsdom) | <3s total | Every push |
| Snapshot (un-variant byte-identity) | vitest + existing `hint-hotspot.test.tsx` snapshot | <1s | Every push |
| Visual regression (Playwright) | `pnpm e2e:next` + `next-localhost` project | ~30–60s | Pre-merge CI |
| Docs build | `pnpm --filter @tour-kit/docs build` | ~10–20s | Pre-merge CI |

---

## 4. No Fake Implementations (Pure Component Phase)

Phase 3 has no heavy dependencies. Every new file is a forwardRef component composing existing utilities (`cn`, `useUILibrary`, `useReducedMotion`, `getHotspotPosition`). The only "mock" pattern is `vi.mock('@tour-kit/core', async (orig) => ({ ...await orig(), useReducedMotion: vi.fn(() => true) }))` for the reduced-motion gate test in `whats-new-pill.test.tsx`.

No fake DOM, no fake matchMedia (the JS gate is the load-bearing tier — testing it through `useReducedMotion` directly is more honest than mocking `matchMedia`).

---

## 5. Test File List

```
packages/hints/src/__tests__/variants/
├── badge.test.tsx                          # NEW — render at minimal props, count clamping, ≥24×24, axe contrast
├── beacon-with-label.test.tsx              # NEW — label aria-hidden, side-flip, reduced-motion strips pulse class
├── whats-new-pill.test.tsx                 # NEW — fade-on-interaction in default jsdom, null-on-interaction under reduce
└── (existing) hint-hotspot.test.tsx        # UNCHANGED — un-variant path snapshot is the byte-identity guard

examples/next-app/src/app/hint-variants/
└── page.tsx                                # NEW — 6 anchored sections with data-testid for Playwright

e2e/next/
└── hint-variants.localhost.spec.ts         # NEW — 6 snapshots: {badge,beacon-with-label,whats-new-pill}.{light,dark}.png
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `badge.test.tsx` | Unit | ≥4 | Render at minimal props; minimum-size class/style contract; count `3` renders `"3"`; count `150` clamps to `"99+"`; axe semantic scan + token contrast helper on white/dark. |
| `beacon-with-label.test.tsx` | Unit | ≥4 | Render with `label="New"`; visible label has `aria-hidden`; button has `aria-label="Show hint"`; `side="left"` adds `flex-row-reverse`; under `useReducedMotion→true`, className does NOT contain `animate-tour-pulse`. |
| `whats-new-pill.test.tsx` | Unit | ≥3 | Initial render shows button; `pointerdown` adds `opacity-0` class (default motion); under `useReducedMotion→true`, `pointerdown` makes button `null`; axe semantic scan + token contrast helper on white/dark. |
| `hint-hotspot.test.tsx` (existing) | Snapshot | unchanged | The un-variant snapshot must not regenerate. CI fails if it does. |
| `hint-variants.localhost.spec.ts` | Playwright | 6 | One snapshot per `{variant, theme}` pair; tolerance per repo defaults. |

---

## 6. Test Setup (Vitest + @testing-library/react + vitest-axe + Playwright)

**Additions to existing `packages/hints/vitest.config.ts`:** none — config already covers `src/**/*.test.tsx` under jsdom.

`useReducedMotion` mock pattern (per-file, not global setup):

```ts
// packages/hints/src/__tests__/variants/whats-new-pill.test.tsx (excerpt)
import { vi } from 'vitest'
vi.mock('@tour-kit/core', async (orig) => ({
  ...(await orig<typeof import('@tour-kit/core')>()),
  useReducedMotion: vi.fn(() => false),  // default; override per test via mockReturnValueOnce
}))
import { useReducedMotion } from '@tour-kit/core'
```

`vitest-axe` + token contrast helper:

```tsx
// Reusable in each variant test file
import { axe } from 'vitest-axe'

async function expectNoA11yViolations(ui: React.ReactElement, background: '#ffffff' | '#0a0a0a') {
  const { container } = render(<div style={{ background, padding: 40 }}>{ui}</div>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}
```

Do not rely on jsdom `getBoundingClientRect()` or axe `color-contrast` as the only proof for pixels/contrast. jsdom does not lay out Tailwind classes, and axe's color-contrast rule is not a reliable rendered-pixel check outside a browser. Pin pixels in the Playwright fixture and pin colors with a deterministic helper that converts the resolved design tokens to relative luminance.

**Playwright config:** no changes needed. The root `playwright.config.ts` already runs `next-localhost` against `examples/next-app`. The new spec must include `localhost` in its filename to be picked up by the existing project filter.

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Reduced-motion is tested through `useReducedMotion`, not `matchMedia` | `vi.mock('@tour-kit/core', ...)` | The JS gate (tier 3) is the load-bearing layer per CLAUDE.md. Mocking `matchMedia` would test the hook implementation, not the variant's conditional return. |
| `whats-new-pill` under reduce asserts `queryByRole('button') === null` | Direct DOM absence check | The component returns `null` (not just `opacity: 0`) under reduce — this is the correctness guarantee that prevents a hidden but focusable element from staying in the tab order. |
| Rendered size is verified in Playwright, not jsdom | Unit tests pin the class/style contract; Playwright checks `boundingBox()` pixels | jsdom does not perform real layout for Tailwind utilities, so `getBoundingClientRect()` would return zeros unless manually stubbed. |
| Contrast is checked with tokens + browser screenshots, not jsdom axe alone | `axe(container)` covers semantics; a helper computes contrast ratios for resolved tokens; Playwright catches rendered theme drift | axe in jsdom is useful for structural a11y, but color contrast needs deterministic color math or a browser. |
| Un-variant snapshot is the byte-identity guard, not a separate test | Existing `hint-hotspot.test.tsx` snapshot | A new test would drift; reusing the existing snapshot turns "no regression" into a CI gate for free. |
| Six Playwright screenshots cover variants × themes; placement matrix is Phase 4 territory | Two themes × three variants = six | Variants are theme-sensitive (contrast). Placements are TourCard-sensitive (geometry). Keep concerns split. |
| Inline SVG sparkle icon, ≤200 bytes | No new icon-library dep | The Phase 3 plan explicitly forbids `lucide-react` etc.; the test verifies the SVG element exists with `aria-hidden="true"`. |
| Playwright snapshot tolerance defaults to `maxDiffPixels: 0`, `threshold: 0.2` | Repo defaults | If anti-aliasing flakes, raise `maxDiffPixelRatio: 0.01` per snapshot, not globally. |
| Fixture page uses fixed-size 100×40 anchor div | Deterministic positions | `getHotspotPosition(position, rect)` is deterministic given a fixed rect; the page out of public nav prevents accidental indexing. |

---

## 8. Example Test Case

The `what-s-new-pill` test is the most representative — it exercises the JS gate (tier 3 of the reduced-motion contract), the one-shot interaction state, and the a11y wiring.

```tsx
// packages/hints/src/__tests__/variants/whats-new-pill.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tour-kit/core', async (orig) => ({
  ...(await orig<typeof import('@tour-kit/core')>()),
  useReducedMotion: vi.fn(() => false),
}))

import { useReducedMotion } from '@tour-kit/core'
import { HintHotspot } from '../../components/hint-hotspot'

const targetRect = new DOMRect(100, 100, 80, 40)
const baseProps = { targetRect, position: 'top-right' as const, label: 'What\'s new' }

describe('<HintHotspot variant="what-s-new-pill">', () => {
  it('renders the pill with sparkle and label; aria-label on button', () => {
    render(<HintHotspot variant="what-s-new-pill" {...baseProps} />)
    const button = screen.getByRole('button', { name: 'What\'s new' })
    expect(button).toBeInTheDocument()
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('fades on pointerdown when motion is enabled', () => {
    render(<HintHotspot variant="what-s-new-pill" {...baseProps} />)
    const button = screen.getByRole('button', { name: 'What\'s new' })
    fireEvent.pointerDown(button)
    expect(button.className).toMatch(/opacity-0/)
    expect(button.className).toMatch(/motion-safe:transition-opacity/)
  })

  it('removes from DOM on pointerdown under reduced-motion (load-bearing tier-3 gate)', () => {
    ;(useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValueOnce(true)
    render(<HintHotspot variant="what-s-new-pill" {...baseProps} />)
    const button = screen.getByRole('button', { name: 'What\'s new' })
    fireEvent.pointerDown(button)
    expect(screen.queryByRole('button', { name: 'What\'s new' })).toBeNull()
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 3 of Tour Kit v2 Package Polish — Hint Presets.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless product-tour primitives. `@tour-kit/hints` ships `<HintHotspot>` (a persistent floating affordance outside the tour flow). Phase 3 adds three named variants — `badge`, `beacon-with-label`, `what-s-new-pill` — via a discriminated-union prop, extending the existing `cva`-driven `hintHotspotVariants` style table. Stack: TypeScript strict mode, React 18+, `class-variance-authority`, `@floating-ui/react`, Vitest + @testing-library/react + vitest-axe (jsdom env), Playwright (root `e2e/` harness). No new runtime libs.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Badge ≥24×24 | Unit class/style assertion + Playwright `boundingBox()` | Unit pins the 24px min-size contract; browser box is at least 24×24 |
| US-2 | Badge count clamps to "99+" | `count={150}` render | textContent === `"99+"` |
| US-3 | Beacon label `aria-hidden` | a11y assertion | Label span has `aria-hidden="true"`; button has `aria-label="Show hint"` |
| US-4 | What-s-new-pill returns null under reduce | mock + interaction | `queryByRole('button') === null` after pointerdown |
| US-5 | All variants pass AA contrast | axe semantic scan + contrast-ratio helper + Playwright screenshots | No axe structural violations; resolved colors meet WCAG threshold on `#ffffff` and `#0a0a0a` |
| US-6 | Un-variant byte-identical | existing snapshot | Snapshot file unchanged |
| US-7 | Six Playwright snapshots green | toHaveScreenshot | 6/6 pass within tolerance |

### Why Fakes Are Required

None. Phase 3 has no heavy dependencies — only React component composition. The single mock pattern is `vi.mock('@tour-kit/core', ...)` to override `useReducedMotion` returning `true` for the tier-3 gate test in `whats-new-pill.test.tsx`. No matchMedia mocking — the JS gate is the load-bearing layer.

### What NOT to Test

- Don't re-test `useReducedMotion` itself — covered by `@tour-kit/core` tests. Mock its return; trust the implementation.
- Don't test `cva` mechanics — covered by `class-variance-authority`'s own test suite. Verify variant → className mapping via integration (render + className assertion), not unit-test the cva table.
- Don't test all 12 Floating UI placements — that's Phase 4 TourCard territory. Phase 3 covers 3 variants × 2 themes at one fixed placement.
- Don't snapshot the un-variant path in a new test file. The existing `hint-hotspot.test.tsx` snapshot is the byte-identity guard; touching it would regress the contract.
- Don't add a Storybook configuration — the repo has no `.storybook/` for hints; live MDX preview in `apps/docs` is the canonical demo surface.

### Critical: No Fake Implementations

This is a pure component-composition phase. The only test-only utility is the `vi.mock('@tour-kit/core', ...)` override of `useReducedMotion`. See §4 of this plan for the snippet.

### Test Files to Create

```
packages/hints/src/__tests__/variants/
├── badge.test.tsx
├── beacon-with-label.test.tsx
└── whats-new-pill.test.tsx

examples/next-app/src/app/hint-variants/page.tsx
e2e/next/hint-variants.localhost.spec.ts
```

### Per-File Coverage Guidance

#### `packages/hints/src/__tests__/variants/badge.test.tsx`
≥4 cases: (a) renders without throwing on minimal props (`<HintHotspot variant="badge" targetRect={r} position="top-right" />`); (b) minimum-size class/style contract is present; (c) `count={3}` renders text `"3"`, `count={150}` renders `"99+"`; (d) axe semantic scan has no violations and a contrast helper verifies resolved light/dark token ratios; (e) `aria-label="Show hint"` on the button. The real pixel box check belongs in Playwright.

#### `packages/hints/src/__tests__/variants/beacon-with-label.test.tsx`
≥4 cases: (a) renders label text; (b) label `<span>` has `aria-hidden="true"`; (c) button has `aria-label="Show hint"`; (d) `side="left"` causes the wrapper to have `flex-row-reverse` class; (e) under `vi.mock('@tour-kit/core', ...)` returning `useReducedMotion → true`, the className chain does NOT contain `animate-tour-pulse`; (f) axe semantic scan + token contrast helper cover both backgrounds.

#### `packages/hints/src/__tests__/variants/whats-new-pill.test.tsx`
≥3 cases (plus contrast): (a) initial render has the button; (b) `fireEvent.pointerDown(button)` adds `opacity-0` className when motion is enabled; (c) under `useReducedMotion → true`, the same `pointerDown` causes `queryByRole('button')` to return `null` (component returned `null`); (d) sparkle SVG has `aria-hidden="true"`; (e) axe semantic scan + token contrast helper cover both backgrounds.

#### `examples/next-app/src/app/hint-variants/page.tsx`
Six anchored sections with stable `data-testid`s (`badge-light`, `badge-dark`, `beacon-with-label-light`, `beacon-with-label-dark`, `whats-new-pill-light`, `whats-new-pill-dark`). Each section has a fixed 100×40 anchor div. Light sections on `bg-white`; dark on `bg-[#0a0a0a]`. Route is out of public nav (no link from the home page).

#### `e2e/next/hint-variants.localhost.spec.ts`
Six tests in a `test.describe('hint variants', ...)`. Each: `await page.goto('/hint-variants#<testid>')` → `await expect(page.getByTestId('<testid>')).toHaveScreenshot('<testid>.png')`. For `badge-*`, also assert the hotspot button's `boundingBox()` is at least 24×24. First-run generates baselines; subsequent runs assert match. Use the existing `next-localhost` project (filename suffix `localhost` is the trigger).

### Data Model Notes

- `HintHotspotVariantName` is a `type` literal union — re-exported from `@tour-kit/hints`. Tests import it indirectly via the component's prop type.
- `HintHotspotVariantExtras` is a discriminated union internal to `hint-hotspot.tsx`; tests assert behaviour via render, not by importing the type.
- The three variant components are exported (`HintBadge`, `HintBeaconWithLabel`, `HintWhatsNewPill`) for advanced composition — Phase 3 tests target `<HintHotspot variant="...">` (the recommended path), not the lower-level components, except where they share the same forwardRef and test indirection would obscure intent.

### Success Criteria

- `pnpm --filter @tour-kit/hints typecheck` exits 0
- `pnpm --filter @tour-kit/hints test -- --run` exits 0 with new variant tests + existing `hint-hotspot.test.tsx` snapshot UNCHANGED
- `pnpm e2e:next -- --project=next-localhost hint-variants.localhost.spec.ts` exits 0 with 6/6 snapshots green (baselines committed in first run)
- Under mocked `useReducedMotion → true`: `whats-new-pill` returns `null` after pointerdown; `beacon-with-label` className does NOT contain `animate-tour-pulse`
- `pnpm --filter @tour-kit/docs build` exits 0; `/docs/hints/variants` renders three live previews

### Expected File Structure at End

```
packages/hints/src/__tests__/variants/
├── badge.test.tsx                                 # NEW
├── beacon-with-label.test.tsx                     # NEW
└── whats-new-pill.test.tsx                        # NEW
examples/next-app/src/app/hint-variants/page.tsx   # NEW
e2e/next/hint-variants.localhost.spec.ts           # NEW
```

---

## 10. Run Commands

```bash
# Fast path — variant unit tests
pnpm --filter @tour-kit/hints test -- --run variants/

# Full per-package suite (includes un-variant byte-identity snapshot)
pnpm --filter @tour-kit/hints test -- --run

# Playwright visual regression (6 snapshots)
pnpm e2e:next -- --project=next-localhost hint-variants.localhost.spec.ts

# Update baselines (first run / approved change)
pnpm e2e:next -- --project=next-localhost hint-variants.localhost.spec.ts --update-snapshots

# Docs build
pnpm --filter @tour-kit/docs build
```
