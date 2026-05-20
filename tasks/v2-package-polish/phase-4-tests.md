# Phase 4 — Testing: TourCard Design Refresh

**Scope:** `<TourCard>` and `<TourCardHeader>` in `@tour-kit/react` (new step indicator + `aria-label` rewrite + `variant="classic"` opt-out); `<TourArrow>` (new `size` prop + explicit `aria-hidden`); `tourCardVariants` / `buttonVariants` cva extensions; existing a11y test suite extended with three new cases; Playwright placement matrix (12 placements); new docs page `tour-card-migration.mdx`; fixture route `/tour-card-placement?placement=...`.
**Key Pattern:** Visual + a11y refresh — every behavior assertion runs in jsdom against `@testing-library/react`, every visual assertion is a Playwright screenshot pinned to a baseline. The 12-placement matrix and the byte-identity check on the un-variant ("classic") path are the load-bearing gates.
**Dependencies:** vitest, @testing-library/react, vitest-axe (existing), jsdom env, Playwright (root harness, `next-localhost` project), Lighthouse CLI for the a11y artifact.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a tour author, I want a step-of-N indicator inside the card so users always see progress | `tour-card-a11y.test.tsx` new case | Header contains `<span aria-hidden="true">3 / 7</span>` AND dialog `aria-label="Step 3 of 7: <title>"` |
| US-2 | As a screen-reader user, I want exactly ONE step announcement — no aria-live duplication | grep + DOM check | `grep -c "aria-live" tour-card.tsx === 0`; `document.querySelector('[role="dialog"] [aria-live]')` returns null |
| US-3 | As an a11y reviewer, I want the arrow SVG to be decorative (not announced) | a11y test case | `[role="dialog"] svg[aria-hidden="true"]` exists |
| US-4 | As a tour author, I want the arrow tip to actually point at the target across all 12 Floating UI placements | Playwright matrix spec | 12/12 screenshots within tolerance; arrow tip within 4px of target's edge per `boundingBox()` |
| US-5 | As a v1 consumer, I want a one-minor escape hatch via `<TourCard variant="classic">` so I can stage theme updates | `tour-card-classic.test.tsx` | Classic variant: no step indicator, no `<FloatingArrow>`, current shipped Skip/Back/Next variants preserved; one-time dev `console.warn` |
| US-6 | As a keyboard user, I want a visible focus ring on the Next/Finish button | a11y test case | `Next` button has computed `outline` / focus-ring classes; `Skip` button has `aria-label="Skip tour"` |
| US-7 | As an audit reviewer, I want Lighthouse Accessibility = 100 on a tour page | JSON artifact attached to PR | `accessibility.score === 1.00` |
| US-8 | As a visual regression reviewer, I want ≤2 unexpected diffs in existing example apps | Playwright snapshots against `examples/next-app` and `examples/dashboard-next` | Reviewed + signed off; this is the M3 gate |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `<TourCard>` (refreshed default) | No mock — real render inside `<TourProvider>` | `aria-label` matches `/Step \d+ of \d+: .+/`; visible "N / M" span has `aria-hidden`; no `[aria-live]` inside the dialog | US-1, US-2 |
| `<TourCard variant="classic">` | No mock — real render with the opt-out prop; spy `console.warn` | No step indicator span; no arrow `<svg>` inside the dialog; existing button variants unchanged; `console.warn` fires once per `currentStep.id` | US-5 |
| `<TourArrow>` | No mock — real render via the parent card; assert via DOM | SVG element with `aria-hidden="true"`; `width` ≈ `2 * size`, `height` ≈ `size` per the FloatingArrow convention | US-3 |
| Floating UI `useFloating` + `arrow` middleware | No mock — already wired in the existing file; trust upstream | Placement matrix verified via Playwright, not unit tests (jsdom can't compute real geometry) | US-4 |
| `useReducedMotion()` (cross-package contract) | No mock for default rendering; spot-check the indicator transition has `motion-safe:` prefix via grep | Indicator className includes `motion-safe:` when an animation utility is present | (cross-cutting) |
| Lighthouse a11y | No mock — real Lighthouse CLI run against `pnpm --filter dashboard-next dev` | `pnpm exec lighthouse ... --only-categories=accessibility --output=json` reports `score: 1.00` for the tour page | US-7 |
| Existing visual snapshots (`examples/next-app`, `examples/dashboard-next`) | No mock — re-run existing Playwright suites with the refresh PR applied | ≤2 unexpected diffs; user signs off in the PR thread | US-8 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit / a11y (jsdom) | vitest + @testing-library/react + vitest-axe | <3s total | Every push |
| Snapshot — byte-identity for variant="classic" | vitest snapshot | <1s | Every push |
| Visual regression — placement matrix | Playwright `next-localhost` | ~30–90s | Pre-merge CI |
| Lighthouse a11y artifact | Lighthouse CLI against dashboard-next | ~30–60s | Pre-merge, attached to PR |
| Bundle size check | `pnpm --filter @tour-kit/react build` + manual gzip compare | <30s | Pre-merge |

---

## 4. No Fake Implementations (Pure Component Refresh Phase)

Phase 4 has no heavy dependencies. Every change is in styled React components composing existing utilities (`@floating-ui/react`, `cva`, `useFocusTrap`, `useReducedMotion`, `useTour`). Real implementations run in jsdom for behavior; Playwright provides real browser geometry for the placement matrix. The only "mock" is `vi.spyOn(console, 'warn')` for the `variant="classic"` deprecation-warn assertion.

---

## 5. Test File List

```
packages/react/src/__tests__/a11y/
└── tour-card-a11y.test.tsx                          # UPDATED — keep 8 existing cases green + add 3 new

packages/react/src/__tests__/components/
└── tour-card-classic.test.tsx                       # NEW — variant="classic" opt-out: no indicator, no arrow,
                                                    #       one-time warn; existing Skip/Back/Next preserved

e2e/next/
└── tour-card-placements.localhost.spec.ts           # NEW — 12 placements × screenshot + boundingBox math

examples/next-app/src/app/tour-card-placement/
└── page.tsx                                         # NEW — fixture route with ?placement= query
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `tour-card-a11y.test.tsx` | a11y (jsdom) | 11 total (8 existing + 3 new) | New: `aria-label` contains step counter; arrow svg has `aria-hidden`; no `aria-live` inside dialog. |
| `tour-card-classic.test.tsx` | Component | ≥4 | `variant="classic"` renders no indicator span; renders no `<FloatingArrow>` element; existing button variants unchanged (Skip is `link`, Back is `secondary`, Next is `default`); one-time `console.warn` per `currentStep.id`. |
| `tour-card-placements.localhost.spec.ts` | Playwright | 12 | One screenshot per placement (`top`, `top-start`, `top-end`, `bottom`, ..., `right-end`); for each, assert arrow tip within 4px of target edge via `boundingBox()` math. |

---

## 6. Test Setup (Vitest + jsdom + Playwright)

**Additions to existing `packages/react/vitest.config.ts`:** none. The config already runs `src/**/*.test.tsx` under jsdom.

For the `console.warn` deduplication assertion, the spy must be reset between renders that mount the same `currentStep.id`. Use a `beforeEach` hook clearing the module-level Set:

```ts
// packages/react/src/__tests__/components/tour-card-classic.test.tsx (excerpt)
import { beforeEach, vi } from 'vitest'

// Reset the module-level dedup Set between tests.
beforeEach(async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  await vi.resetModules()
})
```

**Playwright config:** no changes. Root `playwright.config.ts` runs `next-localhost` against `examples/next-app`. Add the spec under `e2e/next/` with `localhost` in the filename (matches project filter).

The placement fixture page reads `searchParams.placement` and configures the tour step with that placement at a fixed-position target button centered in the viewport. Keep it out of public nav.

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Step counter lives in `aria-label`, not `aria-live` | Single SR announcement source | Two sources (visible aria-live + aria-label) cause double-read; one source matches WCAG 2.4.6 (Headings and Labels) better. `grep -c "aria-live" tour-card.tsx === 0` is the CI guard. |
| Arrow position is verified by Playwright, not unit tests | Real browser geometry | jsdom doesn't compute layout — `getBoundingClientRect()` returns zeros. Placement correctness needs a real renderer; that's Playwright. |
| Placement matrix uses `boundingBox()` math, not just visual diff | Assert arrow tip within 4px of target edge | Visual diffs catch large regressions; the 4px assertion catches sub-pixel drift that a visual diff would miss. |
| `variant="classic"` is a 1-line conditional, not a parallel file | Branch inside `tour-card.tsx` | Two files = two maintenance burdens. The classic path is the deprecated escape hatch; keep it minimal. |
| Deprecation warn is deduped by `currentStep.id` via a module-level `Set<string>` | `vi.resetModules()` between tests | Without reset, the warn would fire once per test run and pass spuriously. Reset is explicit. |
| Lighthouse a11y is a JSON artifact, not a unit test | Real-browser audit | Lighthouse requires a real Chromium; running it in unit tests would be slow and brittle. JSON artifact in the PR is the right granularity. |
| Bundle size delta is manual, not automated | Compare gzipped `dist/index.js` against `main` | The 0.5 KB budget is per-phase; automating per-phase budgets across the monorepo isn't there yet. PR description carries the number. |
| Existing example-app snapshots are the M3 gate | Re-run, review diff, sign off | The refresh is by definition a visual change; consumer-theme regressions surface here, not in unit tests. ≤2 unexpected diffs is the contract. |
| Skip button gets explicit `aria-label="Skip tour"` | Even though visible text says "Skip" | Defensive — if a consumer relabels via i18n, the aria-label still communicates context. |

---

## 8. Example Test Case

The a11y additions are the most representative — they pin the new `aria-label` contract, prove the arrow is decorative, and CI-fail the moment someone adds an `aria-live` region inside the dialog.

```tsx
// packages/react/src/__tests__/a11y/tour-card-a11y.test.tsx (excerpt — three new cases)
import { render, screen, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TourProvider, useTour } from '@tour-kit/react'
import { TourCard } from '../../components/card/tour-card'

function TestHarness({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider
      id="test"
      steps={[
        { id: 's1', title: 'Welcome', content: 'Start here', target: '#anchor' },
        { id: 's2', title: 'Next step', content: 'Keep going', target: '#anchor' },
      ]}
    >
      <div id="anchor" style={{ position: 'fixed', top: 100, left: 100, width: 100, height: 40 }} />
      {children}
    </TourProvider>
  )
}

function StartOnce() {
  const t = useTour()
  React.useEffect(() => { t.start() }, [])
  return null
}

describe('TourCard a11y — new cases', () => {
  it('dialog aria-label contains the step counter and title', async () => {
    render(<TestHarness><TourCard /><StartOnce /></TestHarness>)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', expect.stringMatching(/^Step 1 of 2: Welcome$/))
  })

  it('arrow svg has aria-hidden="true"', async () => {
    render(<TestHarness><TourCard /><StartOnce /></TestHarness>)
    await screen.findByRole('dialog')
    const arrow = document.querySelector('[role="dialog"] svg[aria-hidden="true"]')
    expect(arrow).not.toBeNull()
  })

  it('does NOT double-read the step counter via aria-live', async () => {
    render(<TestHarness><TourCard /><StartOnce /></TestHarness>)
    await screen.findByRole('dialog')
    expect(document.querySelector('[role="dialog"] [aria-live]')).toBeNull()
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 4 of Tour Kit v2 Package Polish — TourCard Design Refresh.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages. `@tour-kit/react` ships the styled tour shell — `<TourCard>` is the most-rendered component. Phase 4 refreshes the visual look (step-of-N indicator, real arrow via Floating UI's already-wired `arrow` middleware, focus ring on Next) while preserving an explicit `variant="classic"` opt-out for one minor cycle. Stack: TypeScript strict mode, React 18+, Tailwind CSS, class-variance-authority, `@floating-ui/react`, Vitest + @testing-library/react + vitest-axe (jsdom), Playwright. Lighthouse CLI for the a11y JSON artifact.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Step-of-N indicator + aria-label | dialog attribute | `aria-label` matches `/^Step \d+ of \d+(:.+)?$/` |
| US-2 | No aria-live inside dialog | grep + DOM | `grep -c "aria-live" tour-card.tsx === 0`; `querySelector('[role="dialog"] [aria-live]') === null` |
| US-3 | Arrow svg aria-hidden | DOM query | `svg[aria-hidden="true"]` inside `[role="dialog"]` |
| US-4 | 12 placements correct | Playwright matrix | 12/12 screenshots green; arrow tip within 4px of target edge |
| US-5 | `variant="classic"` opt-out | render + spy | No indicator, no `<FloatingArrow>`; one-time `console.warn` per step id |
| US-6 | Focus ring on Next; Skip aria-label | className + role query | `Next` button has `focus-visible:ring-2`; Skip has `aria-label="Skip tour"` |
| US-7 | Lighthouse a11y = 100 | JSON artifact | `accessibility.score === 1.00` |
| US-8 | Visual regression ≤2 diffs | existing Playwright suites | User signs off in PR |

### Why Fakes Are Required

None. Phase 4 has no heavy dependencies. The only "mock" is `vi.spyOn(console, 'warn')` for the `variant="classic"` deprecation dedup test. Playwright provides real browser geometry for the 12-placement matrix; jsdom can't compute layout.

### What NOT to Test

- Don't re-test Floating UI internals (`arrow` middleware, `<FloatingArrow>` derives `staticSide` from `context.placement` automatically — confirmed by upstream docs). Trust the library; verify the wiring via Playwright.
- Don't add visual snapshots for the refreshed variant unless they pin specific colors/shadows. Playwright placement matrix is the geometry guard; visual snapshots elsewhere catch theme regressions.
- Don't test that Lighthouse a11y is 100 inside the unit suite — Lighthouse is a CLI, not a vitest helper. Run it as a PR artifact.
- Don't bump existing a11y test snapshots to make them pass after the `aria-labelledby → aria-label` swap. Rewrite the assertion (one line), not the snapshot.

### Critical: No Fake Implementations

This is a pure component-refresh phase. The only test-only utility is `vi.spyOn(console, 'warn')` plus `vi.resetModules()` between tests for the `currentStep.id`-keyed dedup Set. See §6 of this plan.

### Test Files to Create / Update

```
packages/react/src/__tests__/a11y/tour-card-a11y.test.tsx           # UPDATED — 3 new cases
packages/react/src/__tests__/components/tour-card-classic.test.tsx  # NEW
e2e/next/tour-card-placements.localhost.spec.ts                     # NEW
examples/next-app/src/app/tour-card-placement/page.tsx              # NEW
```

### Per-File Coverage Guidance

#### `packages/react/src/__tests__/a11y/tour-card-a11y.test.tsx` (UPDATED — 8 existing + 3 new)
**Update one existing case:** the test asserting `aria-labelledby` linked to title must be rewritten to assert `aria-label` matches `/Step \d+ of \d+: .+/` instead. Do NOT update its snapshot; rewrite the assertion.

**Add three new cases:**
1. `aria-label` contains the step counter — render two-step tour, `findByRole('dialog')`, assert `aria-label` matches `/Step 1 of 2: Welcome/`.
2. Arrow svg has `aria-hidden="true"` — `document.querySelector('[role="dialog"] svg[aria-hidden="true"]')` is truthy.
3. No `aria-live` element inside `[role="dialog"]` — `querySelector('[aria-live]')` returns `null`.

#### `packages/react/src/__tests__/components/tour-card-classic.test.tsx` (NEW)
≥4 cases. Use `vi.spyOn(console, 'warn').mockImplementation(() => {})` and `vi.resetModules()` per `beforeEach` to reset the dedup `Set`:
1. `<TourCard variant="classic" />` renders no step-indicator span (`querySelector('[data-slot="tour-step-indicator"]')` is null).
2. No `<FloatingArrow>` inside `[role="dialog"]` (`svg` matching the arrow shape is absent — assert via `aria-hidden` query returning null).
3. Existing button variants preserved — Skip has the `link` styling (text-only link, no border), Back is `secondary`, Next is `default` (assert via `data-variant` attribute if cva exposes it, or via className substring matching).
4. `console.warn` fires exactly once per `currentStep.id` — render the same step twice; spy is called once. Move to the next step; spy is called once more. Re-render without changing step; spy is NOT called again.

#### `e2e/next/tour-card-placements.localhost.spec.ts` (NEW)
12 tests in a `test.describe.parallel('TourCard placement matrix', ...)`. For each placement in `['top','top-start','top-end','bottom','bottom-start','bottom-end','left','left-start','left-end','right','right-start','right-end']`:
1. `await page.goto('/tour-card-placement?placement=' + p)`
2. `await page.waitForSelector('[role="dialog"]')`
3. `await expect(page.locator('[role="dialog"]')).toHaveScreenshot(`${p}.png`)`
4. Read `boundingBox()` of `[role="dialog"] svg[aria-hidden="true"]` (the arrow) and `#anchor` (the target). Assert the arrow tip's relevant edge is within 4px of the target's relevant edge per the placement axis. For `top` placements, arrow's bottom edge is within 4px of the target's top edge. Symmetric for `bottom`, `left`, `right`.

#### `examples/next-app/src/app/tour-card-placement/page.tsx` (NEW)
Reads `?placement=` from `searchParams`. Configures the tour step with that placement. Auto-starts the tour. Target element is a fixed-position button centered in the viewport (`position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 100, height: 40`). Route is out of public nav.

### Data Model Notes

- `TourCardProps` extends `React.ComponentPropsWithoutRef<'div'>` (omitting `content`) + `TourCardVariants` from cva. Phase 4 adds 4 optional props (`showStepIndicator`, `progress`, `arrowSize`, `variant`). Don't test the interface mechanics; render-time assertions cover it.
- `TourCardVariants` (from cva) gains a `variant: 'refreshed' | 'classic'` axis. The cva mechanics are owned by `class-variance-authority`'s tests.
- `<FloatingArrow>` derives `staticSide` from `context.placement` automatically — Phase 4 plan explicitly forbids manual reimplementation. Tests assert via Playwright, not by mocking the middleware.

### Success Criteria

- `pnpm --filter @tour-kit/react typecheck` exits 0
- `pnpm --filter @tour-kit/react test -- --run a11y/tour-card-a11y components/tour-card-classic` exits 0 with 8+3+4 cases green
- `pnpm e2e:next -- --project=next-localhost tour-card-placements.localhost.spec.ts` exits 0 with 12/12 placements green
- `grep -c "aria-live" packages/react/src/components/card/tour-card.tsx` returns 0
- `<TourCard variant="classic" />` renders v1 layout with one-time dev warn
- Lighthouse Accessibility on `dashboard-next` with active tour = 100 (JSON artifact attached to PR)
- Visual regression diff signed off by user (≤2 unexpected diffs)
- Bundle size delta ≤ 0.5 KB gzipped (PR description records the number)

### Expected File Structure at End

```
packages/react/src/__tests__/
├── a11y/tour-card-a11y.test.tsx                # UPDATED — 8 + 3 cases
└── components/tour-card-classic.test.tsx       # NEW
e2e/next/tour-card-placements.localhost.spec.ts # NEW (12 placements)
examples/next-app/src/app/tour-card-placement/page.tsx  # NEW
```

---

## 10. Run Commands

```bash
# Fast path — a11y suite + classic variant
pnpm --filter @tour-kit/react test -- --run a11y/tour-card-a11y components/tour-card-classic

# Full per-package suite (catches snapshot drift elsewhere)
pnpm --filter @tour-kit/react test -- --run

# Playwright placement matrix
pnpm e2e:next -- --project=next-localhost tour-card-placements.localhost.spec.ts

# Update placement baselines (first run / approved visual change)
pnpm e2e:next -- --project=next-localhost tour-card-placements.localhost.spec.ts --update-snapshots

# Lighthouse a11y artifact (run against running dashboard-next)
pnpm --filter dashboard-next dev &
DASHBOARD_PID=$!
sleep 5
pnpm exec lighthouse http://localhost:3001/onboarding --only-categories=accessibility --output=json --output-path=./lighthouse-tour-card.json
kill $DASHBOARD_PID

# Bundle size compare
pnpm --filter @tour-kit/react build
gzip -c packages/react/dist/index.js | wc -c   # compare against main
```
