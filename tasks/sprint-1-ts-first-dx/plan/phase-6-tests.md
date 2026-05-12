# Phase 6 — Testing: Playwright Fixtures & Test Bridge (#86)

**Scope:** `TestBridge` interface + ambient `Window.__tourKit__` declaration in `@tour-kit/core`; `<TourProvider enableTestBridge>` prop (default `false`); one-time dev `console.warn`; clean unmount; new package `@tour-kit/playwright` with `test.extend<{ tour: TourHelpers }>` + `expect` re-export; `assertBridge` short-circuit error; smoke E2E against headless Chromium.
**Key Pattern:** Two-layer phase: (a) jsdom unit tests for the bridge wiring + cleanup + warn-once + Phase 3 diagnostic round-trip; (b) real Playwright smoke E2E driving a tiny fixture page. No fakes — the bridge IS the test surface, and Playwright is loaded from the catalog. Strict-typing gate (`grep -c '\\bany\\b' dist/index.d.ts === 0`) is part of the test plan.
**Dependencies:** `vitest@^4.1.0`, `@testing-library/react@^16.3.1`, `@playwright/test@^1.58.2` (catalog), `@tour-kit/core` + `@tour-kit/react` (workspace), Phase 3's `EligibilityReport` + `diagnostics` map.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a security-conscious operator, I want `window.__tourKit__` absent by default so production never leaks a tour-control surface | `test-bridge.test.tsx` TestAbsentByDefault | After `render(<TourProvider tours=...>)`, `window.__tourKit__ === undefined` |
| US-2 | As a Playwright author, I want `<TourProvider enableTestBridge>` to expose the full bridge so my `page.evaluate` calls work | `test-bridge.test.tsx` TestPresentWhenEnabled | `typeof window.__tourKit__.start === 'function'`; all 7 methods present |
| US-3 | As a Strict-Mode developer, I want unmount to delete the global so test isolation is clean | `test-bridge.test.tsx` TestCleanupOnUnmount | After `unmount()`, `window.__tourKit__ === undefined` |
| US-4 | As a developer, I want ONE dev-mode warn per provider mount so I notice but don't get spammed | `test-bridge.test.tsx` TestDevWarning + TestNoProdWarning | dev: 1 call across re-renders; prod: 0 calls |
| US-5 | As a Phase 3 consumer, I want `bridge.getDiagnostic('id')` to return the live `EligibilityReport` so my Playwright test can assert on gate failures | `test-bridge.test.tsx` TestDiagnosticRoundTrip | With `diagnose`+`enableTestBridge`: `getDiagnostic(id)` returns populated report; without `diagnose`: returns null |
| US-6 | As a Playwright author, I want strict typings (no `any`) so my IDE catches errors | `entry-types.test.ts` greps built `dist/index.d.ts` | `grep -c '\\bany\\b' dist/index.d.ts` returns 0 |
| US-7 | As a Playwright author, I want a helpful error when I forgot `enableTestBridge` so I don't waste 10 minutes debugging | smoke.spec.ts TestMissingBridgeError | `tour.next()` rejects with message naming `enableTestBridge` |
| US-8 | As a release engineer, I want a smoke E2E in real Chromium so jsdom blind spots can't ship | `smoke.spec.ts` happy-path TestStartWaitNextWait | Headless Chromium completes start → wait → next → wait |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `<TourProvider>` (no `enableTestBridge`) | No mock — render in jsdom | `window.__tourKit__` undefined after mount | US-1 |
| `<TourProvider enableTestBridge>` | No mock — render in jsdom | All 7 methods (`start`/`next`/`previous`/`goToStep`/`complete`/`skip`/`getDiagnostic`) present and typed as functions | US-2 |
| Cleanup on unmount | No mock — call RTL `unmount()` | `window.__tourKit__ === undefined` post-unmount | US-3 |
| Cleanup safety — bridge replaced before unmount | Manually overwrite `window.__tourKit__` to a sentinel `{}` between mount and unmount | After unmount, sentinel survives (because the cleanup only deletes when the value matches what it set) | US-3 |
| Dev-mode `console.warn` once | `vi.stubEnv('NODE_ENV', 'development')` + `vi.spyOn(console, 'warn')` + RTL rerender | Spy called exactly 1× across initial mount + re-render | US-4 |
| Prod-mode no warn | `vi.stubEnv('NODE_ENV', 'production')` + spy | Spy not called | US-4 |
| `bridge.getDiagnostic(id)` round-trip | Render with `diagnose enableTestBridge`; wait one microtask | Returns `EligibilityReport` with `willFire`, `reasons`, `tourId` populated | US-5 |
| `bridge.getDiagnostic(id)` without `diagnose` | Render with `enableTestBridge` only | Returns `null` for every tour id | US-5 |
| `bridge.next()` advances the tour | Render with `enableTestBridge`; inspect step state via `useTour()` probe | `useTour().currentStepIndex` increments after `bridge.next()` | US-2 |
| Strict typings (no `any` in `dist/index.d.ts`) | No mock — grep against built file | `grep -c '\\bany\\b' dist/index.d.ts` returns 0 | US-6 |
| Playwright fixture `tour` | No mock — real `test.extend` over `Page` | E2E test uses `tour.start`/`tour.waitForStep`/`tour.next`/`tour.getDiagnostic` against headless Chromium | US-8 |
| `assertBridge` short-circuit | Smoke E2E navigates to a no-bridge fixture; call `tour.next()` | Promise rejects with error message containing `enableTestBridge` | US-7 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit / Component (jsdom) | `vitest`, `@testing-library/react`, real `@tour-kit/react` | <4s | Every push |
| Build typing gate | `tsup` output + `grep` | <8s (build) + <1s | Every push (CI) |
| E2E (real browser) | `@playwright/test`, headless Chromium, Vite-served fixture HTML | <30s on local | Every push (or nightly if too slow); blocking before release |
| Cold-setup timing | Playwright reporter timing | covered by E2E run | Same |

---

## Fake / Mock Implementations

**No heavy fakes.** The bridge IS the artifact; Playwright is real; the diagnostics map is real (Phase 3).

Two shared fixtures:

```tsx
// packages/core/src/context/__tests__/_fixtures.tsx
import type { Tour } from '../../types/tour'
export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}
```

For Playwright fixture pages, the smallest viable setup:

```html
<!-- packages/playwright/__tests__/fixtures/two-step.html (served by webServer) -->
<!DOCTYPE html>
<html><body>
  <div id="root"></div>
  <script type="module">
    import { createRoot } from 'react-dom/client'
    import { TourProvider, TourCard } from '/@workspace/tour-kit-react'  // Vite alias to the workspace package
    // ... mount <TourProvider tours=[two-step] initialTour="demo" enableTestBridge><TourCard /></TourProvider>
  </script>
</body></html>
```

The cleanest path: spin up a tiny Vite dev server in `playwright.config.ts#webServer` that serves a single React entry compiled on the fly. Adding a new test-only Vite fixture app is acceptable because Phase 6 explicitly calls it out (Task 6.6).

---

## Test File List

```
packages/core/src/context/__tests__/
├── _fixtures.tsx                                         # twoStepTour
└── test-bridge.test.tsx                                  # ≥8 cases: absent-by-default, present-on-enable, cleanup, cleanup-safety, dev-warn-once, no-prod-warn, getDiagnostic round-trip, bridge.next() advances

packages/playwright/
├── playwright.config.ts                                  # headless Chromium + webServer
└── __tests__/
    ├── fixtures/
    │   ├── two-step.html                                 # <TourProvider enableTestBridge> + <TourCard />
    │   ├── no-bridge.html                                # <TourProvider> WITHOUT enableTestBridge
    │   └── two-step-with-diagnose.html                   # diagnose AND enableTestBridge
    ├── smoke.spec.ts                                     # ≥4 cases: happy-path, absent-by-default, getDiagnostic, missing-bridge-error
    └── entry-types.test.ts                               # grep '\bany\b' dist/index.d.ts; assert 0
```

`entry-types.test.ts` lives in the `__tests__` directory but runs via vitest (not Playwright) since it's a string-grep against a built file. Add it to a separate vitest config OR run via the Playwright project's `test:types` script — whichever's cleaner. Recommend: add it to a small `vitest.config.ts` in the Playwright package, run with `pnpm --filter @tour-kit/playwright test:types`.

---

## `setup` / Fixtures Structure

**Additions to existing setup at `packages/core/src/__tests__/setup.ts`** — already has `cleanup()` + `clearAllMocks` in `afterEach`. The bridge test needs ONE more cleanup line to defend against test order:

```ts
// packages/core/src/__tests__/setup.ts — append to existing afterEach
afterEach(() => {
  // ... existing
  delete (window as any).__tourKit__   // belt-and-suspenders; provider cleanup already runs
})
```

For Playwright, brand-new `playwright.config.ts`:

```ts
// packages/playwright/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  webServer: {
    command: 'pnpm --filter @tour-kit/playwright fixtures:serve',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:5180',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

The `fixtures:serve` script lives in the package's `package.json` and runs `vite preview` (or `vite dev`) over the `__tests__/fixtures/` directory with appropriate aliases to the workspace `@tour-kit/react` build.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| `window.__tourKit__` cleanup test mutates the global BEFORE unmount | Manually set `(window as any).__tourKit__ = sentinel` between mount and unmount | Catches a common bug where cleanup deletes the global unconditionally and races with other libraries reassigning it |
| Dev warning test uses `vi.stubEnv` and resets between cases | `beforeEach` stubs, `afterEach` `vi.unstubAllEnvs()` | Vitest v4 idiom; no `process.env` mutation leakage |
| `bridge.next()` test asserts via `useTour()` probe, not screen state | Render a `<HookProbe />` capturing `useTour()` in a module-level setter | Same pattern as Phase 5's `goToStep` helper |
| `getDiagnostic` test waits one microtask | `await act(async () => {})` before reading | Phase 3's diagnose effect populates the map asynchronously |
| `entry-types.test.ts` greps `dist/index.d.ts` after build | Run `pnpm build` first; `it.skip` if missing | Strict-typing is the Playwright package's headline DX promise |
| Smoke E2E uses a Vite-served fixture HTML, not an example app | New `__tests__/fixtures/` with three HTML pages + a `fixtures:serve` script | Phase 6 explicitly allows either path; HTML+Vite is simplest and decouples Phase 6 from any example app's evolution |
| `tour.next()` without `enableTestBridge` rejects with a useful error | `assertBridge` check inside the fixture | This is US-7; the smoke test calls `tour.next()` on the no-bridge page and asserts the rejection message |
| Don't write a unit test for the fixture HTML | Trust the Vite + browser pipeline | The E2E test exercises the HTML end-to-end; isolating it would just re-test the HTML parser |
| Playwright config NOT shared with future packages | Local to `@tour-kit/playwright` package | Tour Kit doesn't have a monorepo-wide Playwright runner yet; defer until a second package needs one |

---

## Example Test Case

```tsx
// packages/core/src/context/__tests__/test-bridge.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { TourProvider } from '../tour-provider'
import { twoStepTour } from './_fixtures'

beforeEach(() => { delete (window as any).__tourKit__ })
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('TestBridge — surface & lifecycle', () => {
  it('window.__tourKit__ is undefined when enableTestBridge is unset', () => {
    render(<TourProvider tours={[twoStepTour]}><div /></TourProvider>)
    expect(window.__tourKit__).toBeUndefined()
  })

  it('exposes all 7 methods when enableTestBridge is true', () => {
    render(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    const b = window.__tourKit__!
    expect(typeof b.start).toBe('function')
    expect(typeof b.next).toBe('function')
    expect(typeof b.previous).toBe('function')
    expect(typeof b.goToStep).toBe('function')
    expect(typeof b.complete).toBe('function')
    expect(typeof b.skip).toBe('function')
    expect(typeof b.getDiagnostic).toBe('function')
  })

  it('cleans up window.__tourKit__ on unmount', () => {
    const { unmount } = render(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    expect(window.__tourKit__).toBeDefined()
    unmount()
    expect(window.__tourKit__).toBeUndefined()
  })

  it('cleanup does NOT delete a foreign value reassigned after mount', () => {
    const { unmount } = render(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    const sentinel: any = { foreign: true }
    ;(window as any).__tourKit__ = sentinel
    unmount()
    expect(window.__tourKit__).toBe(sentinel)
    delete (window as any).__tourKit__
  })

  it('logs dev warning once per mount', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { rerender } = render(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    rerender(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/Tour Kit/i)
  })

  it('does NOT warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    expect(warn).not.toHaveBeenCalled()
  })

  it('getDiagnostic returns a populated EligibilityReport when diagnose is on', async () => {
    render(<TourProvider tours={[twoStepTour]} enableTestBridge diagnose><div /></TourProvider>)
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    const report = window.__tourKit__!.getDiagnostic('demo')
    expect(report).not.toBeNull()
    expect(report!.tourId).toBe('demo')
    expect(Array.isArray(report!.reasons)).toBe(true)
  })

  it('getDiagnostic returns null without diagnose', () => {
    render(<TourProvider tours={[twoStepTour]} enableTestBridge><div /></TourProvider>)
    expect(window.__tourKit__!.getDiagnostic('demo')).toBeNull()
  })
})
```

```ts
// packages/playwright/__tests__/smoke.spec.ts
import { test, expect } from '../src'

test.describe('@tour-kit/playwright smoke', () => {
  test('start → waitForStep → next → waitForStep on real Chromium', async ({ page, tour }) => {
    await page.goto('/two-step.html')
    await tour.start('demo')
    await tour.waitForStep('welcome')
    await tour.next()
    await tour.waitForStep('pricing')
  })

  test('window.__tourKit__ is undefined when enableTestBridge prop is omitted', async ({ page }) => {
    await page.goto('/no-bridge.html')
    const exists = await page.evaluate(() => typeof (window as any).__tourKit__ !== 'undefined')
    expect(exists).toBe(false)
  })

  test('tour.next() rejects with a useful error when the bridge is missing', async ({ page, tour }) => {
    await page.goto('/no-bridge.html')
    await expect(tour.next()).rejects.toThrow(/enableTestBridge/i)
  })

  test('tour.getDiagnostic returns a populated EligibilityReport when diagnose+bridge are on', async ({ page, tour }) => {
    await page.goto('/two-step-with-diagnose.html')
    // Wait until the provider's diagnose effect has populated the map
    await page.waitForFunction(() => Boolean((window as any).__tourKit__?.getDiagnostic('demo')))
    const report = await tour.getDiagnostic('demo')
    expect(report).not.toBeNull()
    expect(report!.willFire).toBe(true)
  })
})
```

```ts
// packages/playwright/__tests__/entry-types.test.ts
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DTS = join(__dirname, '..', 'dist', 'index.d.ts')

describe('@tour-kit/playwright — strict typings', () => {
  if (!existsSync(DTS)) {
    it.skip('dist/index.d.ts not built; run `pnpm --filter @tour-kit/playwright build`', () => {})
    return
  }

  it('contains no `any` type in the public surface', () => {
    const dts = readFileSync(DTS, 'utf8')
    // Match `any` as a standalone identifier — not inside `many`, `Company`, etc.
    const matches = dts.match(/\bany\b/g) ?? []
    expect(matches.length).toBe(0)
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 6 of Tour Kit's Sprint 1 — Playwright fixtures and the dev-only test bridge (issue #86).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. Playwright runs out-of-process; it can only reach the running tour state via a runtime global. Today, every consumer writes brittle `page.click` boilerplate. Phase 6 ships a typed `test.extend({ tour })` fixture backed by an OPT-IN `window.__tourKit__` bridge in `<TourProvider>`. The bridge defaults to OFF — production never leaks the surface unless the consumer explicitly opts in.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | window.__tourKit__ absent by default | test-bridge unit test | undefined after mount |
| US-2 | All 7 bridge methods present when enabled | test-bridge unit test | typeof === 'function' × 7 |
| US-3 | Cleanup on unmount + cleanup-safety against foreign reassign | test-bridge unit tests | undefined after unmount; foreign sentinel survives |
| US-4 | One dev warn per mount; zero prod warns | test-bridge with vi.stubEnv | exactly 1 dev; 0 prod |
| US-5 | getDiagnostic round-trips Phase 3's EligibilityReport | test-bridge unit test | report.tourId/reasons populated with diagnose; null without |
| US-6 | Strict typings (no `any` in .d.ts) | entry-types.test.ts | grep returns 0 |
| US-7 | Missing-bridge error names `enableTestBridge` | smoke.spec.ts | rejection matches /enableTestBridge/ |
| US-8 | Smoke E2E on headless Chromium | smoke.spec.ts | start→wait→next→wait green |

### Why Fakes Are Required
**None heavy.** The bridge IS the artifact; Phase 3's diagnostics map is real; Playwright runs the real browser. The cleanup-safety test mutates `window.__tourKit__` to a sentinel between mount and unmount to exercise the defensive `if (window.__tourKit__ === bridge) delete ...` branch.

### What NOT to Test
- Don't test Playwright itself — `page.evaluate`, `page.waitForSelector` etc. are Playwright's contracts.
- Don't test that `enableTestBridge={false}` ZERO-allocates the bridge effect — code dead-code-elimination is the bundler's job; we assert the OUTPUT is undefined.
- Don't write a unit test for the fixture HTML files — the smoke test exercises them end-to-end.
- Don't try to test bridge behavior under React 18 vs 19 separately — both targets receive the same effect; smoke covers the deployed surface.
- Don't add `@axe-core` to the smoke spec — accessibility is owned by Phase 4/5; Phase 6 is dev-bridge mechanics.
- Don't test the precise `console.warn` MESSAGE text — assert call count + `NODE_ENV` gating + that the message includes `'Tour Kit'`. Message wording will drift.

### Critical: Fake Implementations

```tsx
// packages/core/src/context/__tests__/_fixtures.tsx
import type { Tour } from '../../types/tour'
export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}
```

Playwright fixture HTMLs live under `packages/playwright/__tests__/fixtures/`. Each is a minimal page mounting `<TourProvider tours={[twoStepTour]} initialTour="demo" {...props}><TourCard /></TourProvider>` with the appropriate target elements. Three files: `two-step.html` (enableTestBridge), `no-bridge.html` (omits enableTestBridge), `two-step-with-diagnose.html` (both diagnose and enableTestBridge).

A small Vite app at `packages/playwright/fixtures-app/` provides aliasing to the workspace `@tour-kit/react` build and a `fixtures:serve` script (`vite preview` or `vite dev`) wired in `playwright.config.ts#webServer`.

### Test Files to Create

```
packages/core/src/context/__tests__/
├── _fixtures.tsx                                         # twoStepTour
└── test-bridge.test.tsx                                  # ≥8 cases

packages/playwright/
├── playwright.config.ts                                  # headless Chromium + webServer (vite)
├── vitest.config.ts                                      # for entry-types.test.ts only
├── fixtures-app/                                         # tiny Vite app serving the three HTML fixtures
│   ├── index.html
│   ├── vite.config.ts                                    # aliases @tour-kit/* to workspace
│   └── two-step.tsx / no-bridge.tsx / diagnose.tsx
└── __tests__/
    ├── fixtures/                                         # static HTML — OR generated by Vite at build time
    ├── smoke.spec.ts                                     # ≥4 cases — happy, absent-by-default, missing-bridge-error, getDiagnostic
    └── entry-types.test.ts                               # grep `\bany\b` dist/index.d.ts
```

### Per-File Coverage Guidance

#### `packages/core/src/context/__tests__/test-bridge.test.tsx`
≥8 cases:
- **Absent by default:** render without `enableTestBridge` → `window.__tourKit__` is `undefined`.
- **Present when enabled:** render with `enableTestBridge` → all 7 methods are functions.
- **Cleanup on unmount:** `unmount()` → `window.__tourKit__` is `undefined`.
- **Cleanup safety:** between mount and unmount, manually reassign `window.__tourKit__` to a sentinel. Unmount. The sentinel SURVIVES — proves the cleanup checks identity before deleting.
- **Dev warn once:** `vi.stubEnv('NODE_ENV', 'development')`. Render, rerender with same props. `console.warn` spy called exactly 1×; message includes `'Tour Kit'`.
- **No prod warn:** `vi.stubEnv('NODE_ENV', 'production')`. Render. Warn not called.
- **getDiagnostic round-trip:** render with `enableTestBridge diagnose`. After one microtask (`await act(async () => { await new Promise(r => setTimeout(r, 0)) })`), `window.__tourKit__.getDiagnostic('demo')` returns a non-null `EligibilityReport` with `tourId === 'demo'` and `reasons` array.
- **getDiagnostic without diagnose:** render with `enableTestBridge` only. `getDiagnostic('demo')` returns `null`.

#### `packages/playwright/__tests__/smoke.spec.ts`
≥4 cases:
- Happy path: `start('demo')` → `waitForStep('welcome')` → `next()` → `waitForStep('pricing')` on `/two-step.html`.
- Absent-by-default: `page.goto('/no-bridge.html')`; `page.evaluate(() => typeof window.__tourKit__)` returns `'undefined'`.
- Missing-bridge error: on `/no-bridge.html`, `tour.next()` rejects with `/enableTestBridge/i`.
- getDiagnostic: on `/two-step-with-diagnose.html`, `tour.getDiagnostic('demo')` returns `{ willFire: true, ... }`.

#### `packages/playwright/__tests__/entry-types.test.ts`
1 case (gated on dist existing): `grep '\\bany\\b' dist/index.d.ts` matches → assert 0. Use `String.match(/\\bany\\b/g)?.length ?? 0`.

### Data Model Notes
- `TestBridge` interface lives in `@tour-kit/core/src/types/test-bridge.ts`. Re-exported from the package's index so `@tour-kit/playwright` can type its fixture.
- `declare global { interface Window { __tourKit__?: TestBridge } }` — `?` is critical; default must be `undefined`.
- `EligibilityReport` is Phase 3's shape: `{ tourId, willFire, reasons: GateReason[], firstFailingGate, evaluatedAt }`.
- `page.evaluate((arg) => { ... }, arg)` — Playwright passes `arg` via structured clone.

### Success Criteria
- `pnpm --filter @tour-kit/core test -- test-bridge` exits 0 with ≥8 cases.
- `pnpm --filter @tour-kit/playwright build && pnpm --filter @tour-kit/playwright typecheck` exit 0.
- `grep -c '\\bany\\b' packages/playwright/dist/index.d.ts` returns 0.
- `pnpm --filter @tour-kit/playwright test` exits 0 (headless Chromium).
- Smoke test for missing-bridge prints rejection containing `'enableTestBridge'`.
- Cold-setup logged by Playwright reporter <200ms per test (visible in `--reporter=list` output).

### Expected File Structure at End
```
packages/core/src/context/__tests__/
├── _fixtures.tsx
└── test-bridge.test.tsx

packages/playwright/
├── playwright.config.ts
├── vitest.config.ts
├── fixtures-app/
│   ├── index.html
│   ├── vite.config.ts
│   ├── two-step.tsx
│   ├── no-bridge.tsx
│   └── diagnose.tsx
└── __tests__/
    ├── fixtures/
    ├── smoke.spec.ts
    └── entry-types.test.ts
```
---

---

## Run Commands

```bash
# Bridge unit tests (jsdom)
pnpm --filter @tour-kit/core test -- test-bridge

# Strict-typing gate (after build)
pnpm --filter @tour-kit/playwright build && \
  pnpm --filter @tour-kit/playwright test:types

# Smoke E2E (headless Chromium)
pnpm --filter @tour-kit/playwright test

# Spawn just one smoke case (debugging)
pnpm --filter @tour-kit/playwright test smoke.spec.ts -g "happy path"

# Verify production builds have no warning leak (manual)
NODE_ENV=production pnpm --filter @tour-kit/core test -- test-bridge

# Full Phase 6 gate
pnpm --filter @tour-kit/core test -- test-bridge && \
  pnpm --filter @tour-kit/playwright build && \
  pnpm --filter @tour-kit/playwright typecheck && \
  pnpm --filter @tour-kit/playwright test:types && \
  pnpm --filter @tour-kit/playwright test
```
