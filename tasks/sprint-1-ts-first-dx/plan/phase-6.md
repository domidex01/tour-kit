# Phase 6 — Playwright Fixtures & Test Bridge (#86)

**Duration:** Days 16–17 (~10–12 hours)
**Depends on:** Phase 3 (`EligibilityReport` for `getDiagnostic`); Phase 0 (catalog `@playwright/test` is already pinned)
**Blocks:** Nothing in Sprint 1; sets the contract every E2E example app will use going forward
**Risk Level:** MEDIUM — `window.__tourKit__` is a production attack-surface concern; gating MUST default off and consumers MUST be steered toward dev-only activation
**Stack:** typescript

---

## Objective

Ship two artifacts: (1) an opt-in test bridge in `@tour-kit/core` exposing `window.__tourKit__` ONLY when `<TourProvider enableTestBridge>` is true (default `false`); (2) `@tour-kit/playwright` package with a `test.extend({ tour })` fixture so Playwright tests can write `await tour.next()` / `await tour.waitForStep('id')` / `await tour.getDiagnostic('id')` without re-deriving boilerplate. The bridge surface is read-mostly and mirrors the existing public ref. Production builds tree-shake the bridge away. Smoke E2E proves the round-trip works in a real browser — not just jsdom.

## What Success Looks Like

1. `<TourProvider tours={[t]}>` (no `enableTestBridge` prop) renders a tree where `window.__tourKit__` is `undefined` — verified by a vitest+RTL test AND by the Playwright smoke test.
2. `<TourProvider tours={[t]} enableTestBridge>` exposes `window.__tourKit__` with shape `{ start, next, previous, goToStep, complete, skip, getDiagnostic }`.
3. Provider mounts in dev mode (`NODE_ENV !== 'production'`) with `enableTestBridge` ALSO logs a single `console.warn` per mount: "Test bridge enabled. Disable for production."
4. Provider unmount removes `window.__tourKit__` (no leak across React re-tree).
5. `pnpm --filter @tour-kit/playwright build && pnpm --filter @tour-kit/playwright typecheck && pnpm --filter @tour-kit/playwright test` exit 0.
6. `import { test } from '@tour-kit/playwright'` exposes `test.extend<{ tour: TourHelpers }>` AND re-exports `expect` from `@playwright/test`.
7. Smoke E2E in a tiny fixture app (or the existing `examples/` app) demonstrates: `await tour.start('demo')`, `await tour.waitForStep('welcome')`, `await tour.next()`, `await tour.waitForStep('pricing')` — all green in headless Chromium.
8. Fixture types resolve with NO `any` in the resulting `.d.ts`; `tour.getDiagnostic('demo')` returns an `EligibilityReport` (from Phase 3) with strict typing.

---

## Architecture / Key Design Decisions

```
@tour-kit/core                                @tour-kit/playwright
──────────────                                ─────────────────────
TourProvider                                  test.extend({ tour })
  │  enableTestBridge={true} (dev only)         │
  ▼                                             ▼ page.evaluate(window.__tourKit__.start(id))
window.__tourKit__: TestBridge                  │
  ┌─ start(id)         ◄── ref.start            │
  ├─ next/previous     ◄── ref.next/prev        │
  ├─ goToStep(id)      ◄── ref.goToStep         │
  ├─ complete/skip     ◄── ref.complete/skip    │
  └─ getDiagnostic(id) ◄── ctx.diagnostics[id]  │
                                                ▼ Playwright assertions
                                            await page.waitForSelector('[data-tour-step="..."]')
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `TestBridge` contract | `interface` exported from `@tour-kit/core` | Read-mostly surface; mirrors the existing imperative ref so we don't invent a new API |
| `Window.__tourKit__` ambient typing | `declare global { interface Window { __tourKit__?: TestBridge } }` in `@tour-kit/core` | Single ambient declaration consumed everywhere; optional (`?`) because default is undefined |
| `TourHelpers` fixture type | `interface` in `@tour-kit/playwright` | Strict Playwright test typing; each method `Promise<void>` or `Promise<EligibilityReport>` |
| Provider option | `enableTestBridge?: boolean` prop on `TourProvider` | Single switch; default `false`; gated by `process.env.NODE_ENV` in docs example |

**Other critical rules for this phase:**
- **`enableTestBridge` defaults `false`.** Production must NEVER have `window.__tourKit__` unless the consumer explicitly opted in. Spec §6 (Risk 6) is explicit: this is a production-attack-surface item.
- **Bridge is READ-MOSTLY.** `start`, `next`, `previous`, `goToStep`, `complete`, `skip` mirror the existing imperative ref. `getDiagnostic` only reads. No new control verbs.
- **Single `console.warn` per mount.** Use a `useRef` flag — don't spam.
- **Cleanup on unmount.** Delete `window.__tourKit__` in the `useEffect` cleanup. Tests assert this.
- **Tree-shake friendly.** When `enableTestBridge` is `false`, the bridge effect's body must be removable by static analysis. Either short-circuit at the top of the effect or pull the body behind a dynamic check that minifiers can prove dead.
- **Playwright fixture types must be strict.** No `any` in the generated `.d.ts`. Smoke test asserts this — see `tsc --noEmit` against the fixture file with `--strict`.
- **Cold-start budget.** Fixture setup overhead <200ms per test on the CI runner (spec §5).

---

## Tasks

### Task 6.1 — `TestBridge` type + ambient `Window` (1h)

**Depends on:** Phase 3 (`EligibilityReport` exists)

```ts
// packages/core/src/types/test-bridge.ts (new)
import type { EligibilityReport } from './diagnostic'

export interface TestBridge {
  /** Programmatically start a tour by id. */
  start: (tourId: string) => void
  /** Advance to the next step. */
  next: () => void
  /** Go back one step. */
  previous: () => void
  /** Jump to a specific step. */
  goToStep: (stepId: string) => void
  /** Mark the active tour completed. */
  complete: () => void
  /** Skip the active tour. */
  skip: () => void
  /** Read the diagnostic for a registered tour (requires diagnose=true). */
  getDiagnostic: (tourId: string) => EligibilityReport | null
}

// packages/core/src/types/window-augment.ts (new) — ambient module
declare global {
  interface Window {
    /**
     * Tour Kit dev-mode test bridge. Set by <TourProvider enableTestBridge>.
     * NEVER present in production unless the consumer explicitly opted in.
     */
    __tourKit__?: TestBridge
  }
}
export {}
```

Re-export `TestBridge` from `packages/core/src/index.ts`. Ensure `window-augment.ts` is included in tsup's build so the type ships in the consumer's `.d.ts`.

**Sanity check:** In a smoke `.ts` file inside the repo, `window.__tourKit__?.start('x')` typechecks without errors.

---

### Task 6.2 — Provider wiring: `enableTestBridge` prop (2h)

**Depends on:** 6.1

```tsx
// packages/core/src/context/tour-provider.tsx (modify)
import type { TestBridge } from '../types/test-bridge'

interface TourProviderProps {
  // ... existing including diagnose, diagnosticGates from Phase 3
  enableTestBridge?: boolean
}

export function TourProvider({ enableTestBridge = false, ...rest }: TourProviderProps) {
  // ... existing setup including diagnose/diagnostics from Phase 3
  const ref = useRef<TourKitRef>(null)
  const warnedRef = useRef(false)

  useEffect(() => {
    if (!enableTestBridge) return            // tree-shake-friendly short-circuit
    if (typeof window === 'undefined') return // SSR guard

    if (process.env.NODE_ENV !== 'production' && !warnedRef.current) {
      console.warn('[Tour Kit] Test bridge enabled. Disable for production.')
      warnedRef.current = true
    }

    const bridge: TestBridge = {
      start: (id) => ref.current?.start(id),
      next: () => ref.current?.next(),
      previous: () => ref.current?.previous(),
      goToStep: (id) => ref.current?.goToStep(id),
      complete: () => ref.current?.complete(),
      skip: () => ref.current?.skip(),
      getDiagnostic: (id) => diagnostics[id] ?? null,
    }
    window.__tourKit__ = bridge
    return () => {
      // Restore prior state cleanly
      if (window.__tourKit__ === bridge) delete window.__tourKit__
    }
  }, [enableTestBridge, /* deps: ref.current's identity is stable; diagnostics map */])

  // Wire `ref` to the existing imperative ref / controller so `start` etc. actually advance the tour.
  return <TourContext.Provider value={...}>
    {children}
    {/* Render whatever invisible element currently exposes the imperative ref */}
  </TourContext.Provider>
}
```

**Implementation notes:**
- READ `packages/core/src/context/tour-provider.tsx` for the existing imperative-ref / controller pattern. Wire the bridge to whatever already implements `start`/`next`/`previous`/`goToStep`/`complete`/`skip`.
- `getDiagnostic` reads the same `diagnostics` map Phase 3 created. If `diagnose: false`, this map is empty and `getDiagnostic` returns `null` for every call — that's expected.
- The `useEffect` short-circuit at `!enableTestBridge` is the tree-shake hint. Modern bundlers won't strip the effect itself but the closures and the bridge object will be dead-code-eliminated when the prop literal is `false` in a production build.

**Sanity check:** RTL test renders provider, mounts, and `window.__tourKit__` is defined; unmount, and it's `undefined` again.

---

### Task 6.3 — Bridge tests (2h)

**Depends on:** 6.2

```ts
// packages/core/src/context/__tests__/test-bridge.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { TourProvider } from '../tour-provider'

describe('TestBridge', () => {
  afterEach(() => { delete (window as any).__tourKit__ })

  it('window.__tourKit__ is absent by default', () => {
    render(<TourProvider tours={[validTour]}><div /></TourProvider>)
    expect(window.__tourKit__).toBeUndefined()
  })

  it('window.__tourKit__ is defined when enableTestBridge', () => {
    render(<TourProvider tours={[validTour]} enableTestBridge><div /></TourProvider>)
    expect(window.__tourKit__).toBeDefined()
    expect(typeof window.__tourKit__!.start).toBe('function')
    expect(typeof window.__tourKit__!.getDiagnostic).toBe('function')
  })

  it('cleans up on unmount', () => {
    const { unmount } = render(<TourProvider tours={[validTour]} enableTestBridge><div /></TourProvider>)
    expect(window.__tourKit__).toBeDefined()
    unmount()
    expect(window.__tourKit__).toBeUndefined()
  })

  it('logs dev warning once per mount', () => {
    const orig = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { rerender } = render(<TourProvider tours={[validTour]} enableTestBridge><div /></TourProvider>)
    rerender(<TourProvider tours={[validTour]} enableTestBridge><div /></TourProvider>)
    expect(warn).toHaveBeenCalledTimes(1)
    process.env.NODE_ENV = orig
    warn.mockRestore()
  })

  it('skips warning in production', () => {
    const orig = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<TourProvider tours={[validTour]} enableTestBridge><div /></TourProvider>)
    expect(warn).not.toHaveBeenCalled()
    process.env.NODE_ENV = orig
    warn.mockRestore()
  })

  it('bridge.next() advances the active tour', async () => {
    render(<TourProvider tours={[twoStepTour]} initialTour={twoStepTour.id} enableTestBridge><TourCard /></TourProvider>)
    window.__tourKit__!.start(twoStepTour.id)
    // assert current step is 0
    window.__tourKit__!.next()
    // assert current step is 1
  })

  it('bridge.getDiagnostic returns EligibilityReport when diagnose', () => {
    render(<TourProvider tours={[validTour]} enableTestBridge diagnose><div /></TourProvider>)
    const report = window.__tourKit__!.getDiagnostic(validTour.id)
    expect(report).not.toBeNull()
    expect(report!.tourId).toBe(validTour.id)
  })

  it('bridge.getDiagnostic returns null when diagnose=false', () => {
    render(<TourProvider tours={[validTour]} enableTestBridge><div /></TourProvider>)
    expect(window.__tourKit__!.getDiagnostic(validTour.id)).toBeNull()
  })
})
```

Target ≥6 cases.

**Sanity check:** `pnpm --filter @tour-kit/core test -- test-bridge` exits 0.

---

### Task 6.4 — Scaffold `@tour-kit/playwright` package (1.5h)

**Depends on:** Phase 0 (catalog `@playwright/test`)

```jsonc
// packages/playwright/package.json
{
  "name": "@tour-kit/playwright",
  "version": "0.1.0",
  "description": "Playwright fixtures for Tour Kit",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "playwright test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tour-kit/core": "workspace:*"
  },
  "peerDependencies": {
    "@playwright/test": "^1.58.0"
  },
  "devDependencies": {
    "@playwright/test": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  }
}
```

`tsup.config.ts`: single entry, ESM+CJS+DTS, externalize `@playwright/test` and `@tour-kit/core`.

`playwright.config.ts` (in the package): minimal — `testDir: '__tests__'`, headless Chromium, no global setup, fixture-test pattern.

**Sanity check:** `pnpm install && pnpm --filter @tour-kit/playwright build` produces `dist/index.{mjs,cjs,d.ts}`.

---

### Task 6.5 — `test.extend({ tour })` fixtures (2.5h)

**Depends on:** 6.2, 6.4

```ts
// packages/playwright/src/index.ts (new)
// Confirmed via memory #179 (Context7 2026-05-12, /microsoft/playwright/v1.58.2).
// Library: @playwright/test ^1.58.2
import { test as base, expect, type Page } from '@playwright/test'
import type { EligibilityReport, TestBridge } from '@tour-kit/core'

export interface TourHelpers {
  start: (tourId: string) => Promise<void>
  waitForStep: (stepId: string, opts?: { timeout?: number }) => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  complete: (tourId: string) => Promise<void>
  skip: () => Promise<void>
  goToStep: (stepId: string) => Promise<void>
  getDiagnostic: (tourId: string) => Promise<EligibilityReport | null>
}

function makeHelpers(page: Page): TourHelpers {
  // Each method does page.evaluate over a typed snippet that references window.__tourKit__.
  // If the bridge is undefined, throw a clear error pointing the user at enableTestBridge.
  const assertBridge = async () => {
    const ok = await page.evaluate(() => typeof window.__tourKit__ !== 'undefined')
    if (!ok) throw new Error('[Tour Kit] window.__tourKit__ is undefined. Did you pass enableTestBridge to TourProvider?')
  }

  return {
    start: async (id) => {
      await assertBridge()
      await page.evaluate((id) => window.__tourKit__!.start(id), id)
    },
    waitForStep: async (id, opts) => {
      await page.waitForSelector(`[data-tour-step="${id}"]`, { state: 'visible', timeout: opts?.timeout })
    },
    next: async () => {
      await assertBridge()
      await page.evaluate(() => window.__tourKit__!.next())
    },
    previous: async () => {
      await assertBridge()
      await page.evaluate(() => window.__tourKit__!.previous())
    },
    complete: async (id) => {
      await assertBridge()
      await page.evaluate((id) => window.__tourKit__!.complete(), id)
    },
    skip: async () => {
      await assertBridge()
      await page.evaluate(() => window.__tourKit__!.skip())
    },
    goToStep: async (id) => {
      await assertBridge()
      await page.evaluate((id) => window.__tourKit__!.goToStep(id), id)
    },
    getDiagnostic: async (id) => {
      await assertBridge()
      return await page.evaluate((id) => window.__tourKit__!.getDiagnostic(id), id)
    },
  }
}

export const test = base.extend<{ tour: TourHelpers }>({
  tour: async ({ page }, use) => {
    const helpers = makeHelpers(page)
    await use(helpers)
  },
})

export { expect }
```

**Implementation notes:**
- The fixture closes over `page` per-test. Default scope is `'test'` per Playwright convention.
- Each helper short-circuits with a useful error if `window.__tourKit__` is undefined — saves the user 10 minutes of confused debugging.
- `waitForStep` doesn't need the bridge — it queries the DOM directly. This is intentional: positioning bugs surface here even if the bridge isn't wired.

**Sanity check:** `pnpm --filter @tour-kit/playwright typecheck` exits 0. Open generated `dist/index.d.ts` and confirm no `any` types.

---

### Task 6.6 — Smoke E2E (2h)

**Depends on:** 6.5

Pick the smallest existing example app (or create a minimal fixture page under `packages/playwright/__tests__/fixtures/`) that:

1. Renders `<TourProvider tours={[twoStepTour]} enableTestBridge>` with two visible steps.
2. Includes `<TourCard />` and two target elements.

```ts
// packages/playwright/__tests__/smoke.spec.ts
import { test, expect } from '../src'

test.describe('@tour-kit/playwright smoke', () => {
  test('start, waitForStep, next, complete', async ({ page, tour }) => {
    await page.goto('/__fixtures__/two-step-tour.html')   // or example app URL
    await tour.start('demo')
    await tour.waitForStep('welcome')
    await tour.next()
    await tour.waitForStep('pricing')
  })

  test('window.__tourKit__ absent when enableTestBridge omitted', async ({ page }) => {
    await page.goto('/__fixtures__/no-bridge.html')
    const exists = await page.evaluate(() => typeof window.__tourKit__ !== 'undefined')
    expect(exists).toBe(false)
  })

  test('tour.getDiagnostic returns EligibilityReport when diagnose', async ({ page, tour }) => {
    await page.goto('/__fixtures__/two-step-with-diagnose.html')
    const report = await tour.getDiagnostic('demo')
    expect(report).not.toBeNull()
    expect(report!.willFire).toBe(true)
  })
})
```

The fixture HTML files load the example app's built JS or import the actual `@tour-kit/react` from the workspace via a vite dev server. The simplest viable setup: extend an existing example app under `examples/` with a `__fixtures__/` route, or use Playwright's `playwright.config.ts#webServer` to spin up Vite serving a tiny HTML.

**Sanity check:** `pnpm --filter @tour-kit/playwright test` exits 0 on local headless Chromium. Cold setup logged at <200ms.

---

### Task 6.7 — Docs (1h)

**Depends on:** 6.6

New guide: `apps/docs/content/docs/guides/playwright.mdx`. Cover:

1. Install: `pnpm add -D @tour-kit/playwright @playwright/test`.
2. Activate the bridge: `<TourProvider tours={[t]} enableTestBridge={process.env.NODE_ENV !== 'production'}>` (the conditional is the recommended pattern).
3. Write a Playwright test: `import { test, expect } from '@tour-kit/playwright'`; example with `await tour.start('demo')`, `await tour.waitForStep('welcome')`, `await tour.next()`.
4. Diagnostic integration: `await tour.getDiagnostic('demo')` returns the `EligibilityReport` from Phase 3.
5. **Security note:** `enableTestBridge` defaults `false`. Production must never receive `true` — wrap in the `NODE_ENV` guard.

Update `apps/docs/content/docs/guides/meta.json` for the new page. Cross-link from Phase 5's `testing.mdx`: "For browser-level positioning assertions, use `@tour-kit/playwright`."

**Sanity check:** `pnpm --filter docs build` exits 0.

---

## Deliverables

```
packages/core/src/
├── types/
│   ├── test-bridge.ts                                  # (+) TestBridge interface
│   └── window-augment.ts                               # (+) ambient declare global Window
├── context/
│   ├── tour-provider.tsx                               # (M) enableTestBridge prop + effect
│   └── __tests__/test-bridge.test.tsx                  # (+) ≥6 cases
└── index.ts                                            # (M) export TestBridge type

packages/playwright/                                    # (+) new package
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── playwright.config.ts
├── src/index.ts                                        # test.extend({ tour }) + makeHelpers
└── __tests__/
    ├── smoke.spec.ts                                   # ≥3 cases incl. absent-by-default
    └── fixtures/                                       # tiny HTML or example-app routes

apps/docs/content/docs/guides/
└── playwright.mdx (+ meta.json modified)
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core test -- test-bridge` exits 0 with ≥6 cases.
- [ ] `pnpm --filter @tour-kit/playwright build && pnpm --filter @tour-kit/playwright typecheck` exit 0; `dist/index.d.ts` has no `any` types (`grep -c '\bany\b' dist/index.d.ts` → `0`).
- [ ] `pnpm --filter @tour-kit/playwright test` exits 0 on headless Chromium with the smoke scenarios passing.
- [ ] Manual verification (or scripted test): `<TourProvider>` without `enableTestBridge` → `window.__tourKit__ === undefined` after mount.
- [ ] Cold-setup timing logged: each Playwright test reports <200ms fixture overhead.
- [ ] `import { test, expect } from '@tour-kit/playwright'` resolves in BOTH ESM and CJS smoke scripts.
- [ ] Docs page documents the `NODE_ENV` activation pattern AND the security note.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 6 of Tour Kit's Sprint 1 — Playwright fixtures and the dev-only test bridge (issue #86).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. Playwright is out-of-process; it can only reach the running tour state via a runtime global. Today no first-party Playwright helper exists, and every consumer writes brittle `page.click` boilerplate. This phase ships a typed fixture (`test.extend({ tour })`) backed by an OPT-IN `window.__tourKit__` bridge in `<TourProvider>`. The bridge is read-mostly and mirrors the existing imperative ref.

### Established in Prior Phases
- Phase 3 shipped `<TourProvider diagnose>` and the `diagnostics: Record<string, EligibilityReport>` map. The bridge's `getDiagnostic` reads from this map.
- Phase 3 exposed the `EligibilityReport` type from `@tour-kit/core`.
- `@playwright/test ^1.59.1` (root devDep) and `^1.58.0` (peer per spec §7) is in the catalog. Confirmed test.extend pattern at memory #179.
- `<TourProvider>` already has an imperative ref / controller with `start`, `next`, `previous`, `goToStep`, `complete`, `skip` methods. The bridge wires to those.

### Your Goal for This Phase
Add `enableTestBridge?: boolean` prop to `<TourProvider>` (default `false`). When `true`, set `window.__tourKit__` to a `TestBridge` object on mount and delete it on unmount. Log a one-time dev warning. Ship `@tour-kit/playwright` with `test.extend({ tour })` calling `page.evaluate` against the bridge. Smoke E2E proves the round-trip in headless Chromium.

### Data Model Rules (follow exactly)
- `interface`/`type` only — no Zod, no runtime validation. This is a TypeScript-only API surface.
- `TestBridge` is defined in `@tour-kit/core` (`src/types/test-bridge.ts`). Re-export it from the package's public surface so `@tour-kit/playwright` can type its fixture.
- `declare global { interface Window { __tourKit__?: TestBridge } }` lives in `@tour-kit/core/src/types/window-augment.ts`. The `?` is non-negotiable — default is undefined.
- `TourHelpers` interface in `@tour-kit/playwright` is strict — every method is `Promise<...>`. No `any`.

### Architecture
- `enableTestBridge` defaults `false`. Production must NEVER expose `window.__tourKit__`.
- The provider's `useEffect` short-circuits at the top when `enableTestBridge` is false. This is the tree-shake hint — when consumers pass a literal `false` (or the conditional resolves to `false` at build time), the bridge body becomes dead code.
- Dev warning fires once per mount via a `useRef` flag, gated on `process.env.NODE_ENV !== 'production'`.
- Cleanup deletes `window.__tourKit__` ONLY if it still equals the bridge we set — defensive against React Strict Mode double-effect and against other libraries that might reassign.
- `getDiagnostic` reads the same `diagnostics` map Phase 3 created. Returns `null` if `diagnose: false`.
- Playwright fixture default scope is `'test'`. Each test gets its own helper instance over its own `page`.
- Each helper short-circuits with a useful error if `window.__tourKit__` is undefined — saves debugging time.

### Confirmed Library APIs

```ts
// @playwright/test ^1.58.2 — confirmed (memory #179, Context7 2026-05-12)
import { test as base, expect, type Page } from '@playwright/test'

export interface TourHelpers { /* ... */ }

export const test = base.extend<{ tour: TourHelpers }>({
  tour: async ({ page }, use) => {
    const helpers = makeHelpers(page)
    await use(helpers)
  },
})

export { expect }

// page.evaluate signature (confirmed):
await page.evaluate((arg) => { /* runs in page context */ }, arg)
```

### Files to Create / Modify

#### `packages/core/src/types/test-bridge.ts` (new)
Export `TestBridge` interface with: `start`, `next`, `previous`, `goToStep`, `complete`, `skip` (all `(...) => void`), `getDiagnostic: (tourId: string) => EligibilityReport | null`. JSDoc on each method.

#### `packages/core/src/types/window-augment.ts` (new)
`declare global { interface Window { __tourKit__?: TestBridge } } export {}`. Document that `?` is critical — default must be `undefined`.

#### `packages/core/src/index.ts` (modify)
Export the `TestBridge` type. The ambient global is automatic (just be sure tsup includes the file).

#### `packages/core/src/context/tour-provider.tsx` (modify)
Add `enableTestBridge?: boolean = false` prop. In a `useEffect`, short-circuit when false or `typeof window === 'undefined'`. When true, set `window.__tourKit__` to a bridge object whose methods delegate to the existing imperative ref. Cleanup deletes only when the current `window.__tourKit__` is the bridge instance. Log a `console.warn` ONCE per mount (via `useRef` flag) when `NODE_ENV !== 'production'`.

#### `packages/core/src/context/__tests__/test-bridge.test.tsx` (new)
≥6 cases: absent by default, present when enabled, cleanup on unmount, dev warning once, no warning in production, `bridge.next()` advances the tour, `bridge.getDiagnostic` returns the diagnostic when `diagnose=true`, returns null when diagnose=false.

#### `packages/playwright/package.json`
Single entry. Peer `@playwright/test ^1.58.0`. Direct dep `@tour-kit/core`. Scripts: `build`, `test`, `typecheck`. NO `"exports": "./fixtures"` subpath — the package is small enough for a single barrel.

#### `packages/playwright/tsconfig.json`
Extend root. JSX off (this is a Node-side package). `strict: true`. Include `src/**/*`.

#### `packages/playwright/tsup.config.ts`
Single entry `src/index.ts`. ESM+CJS+DTS. External `@playwright/test`, `@tour-kit/core`.

#### `packages/playwright/playwright.config.ts`
`testDir: '__tests__'`, headless Chromium, `webServer` config IF the smoke test needs to spin up a fixture app. If reusing an existing example app, point `use.baseURL` at it.

#### `packages/playwright/src/index.ts`
Exact code from Task 6.5: `TourHelpers` interface, `makeHelpers(page)` factory, `test = base.extend<{tour}>(...)`, `export { expect }`. The `assertBridge` helper throws a clear error pointing at `enableTestBridge`.

#### `packages/playwright/__tests__/smoke.spec.ts`
≥3 cases: start→waitForStep→next→waitForStep happy path, absent-by-default verification (no `enableTestBridge` → `window.__tourKit__` undefined in the browser), `tour.getDiagnostic` returns a valid `EligibilityReport`.

#### `packages/playwright/__tests__/fixtures/` (new)
Smallest viable HTML or example-app route. EITHER use Playwright's `webServer` to spin up a Vite dev server pointing at a 30-line `<TourProvider tours={[twoStep]} enableTestBridge><TourCard /></TourProvider>` page, OR add a route to an existing `examples/` app for testing. Pick whichever is simpler in the current repo state.

#### `apps/docs/content/docs/guides/playwright.mdx` + `guides/meta.json` (modify)
Install instructions, the `enableTestBridge={process.env.NODE_ENV !== 'production'}` pattern (PROMINENTLY), a 12-line example test, the diagnostic integration, and the security note. Cross-link from Phase 5's testing.mdx to this page for browser-positioning tests.

### Success Criteria
- `pnpm --filter @tour-kit/core test -- test-bridge` exits 0 with ≥6 cases.
- `pnpm --filter @tour-kit/playwright build && pnpm --filter @tour-kit/playwright typecheck` exit 0.
- `grep -c '\bany\b' packages/playwright/dist/index.d.ts` returns `0`.
- `pnpm --filter @tour-kit/playwright test` exits 0 on headless Chromium.
- Smoke test confirms: WITHOUT `enableTestBridge` prop, `await page.evaluate(() => typeof window.__tourKit__)` returns `'undefined'`.
- ESM AND CJS resolve `@tour-kit/playwright`.
- `pnpm --filter docs build` exits 0; docs page has the `NODE_ENV` guard prominently.

### Expected File Structure at End
```
packages/core/src/
├── types/
│   ├── test-bridge.ts
│   └── window-augment.ts
├── context/
│   ├── tour-provider.tsx (modified)
│   └── __tests__/test-bridge.test.tsx
└── index.ts (modified)

packages/playwright/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── playwright.config.ts
├── src/index.ts
└── __tests__/
    ├── smoke.spec.ts
    └── fixtures/

apps/docs/content/docs/guides/
├── playwright.mdx
└── meta.json (modified)
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 3 (`EligibilityReport`, `diagnostics` map) and Phase 0 (`@playwright/test` already in root devDeps + catalog).
- [PASS] Every sub-task has a clear, testable completion condition (typecheck commands, grep for `any`, smoke test exit code, RTL bridge assertions).
- [PASS] Execution prompt is self-contained: project description, prior facts (diagnostics map, imperative ref), per-file guidance, confirmed `test.extend` snippet from memory #179, security gating rules.
- [PASS] Exit criteria map 1:1 to deliverables (TestBridge type → core tests; provider wiring → bridge tests; package scaffold → build/typecheck; fixture → smoke test; docs → docs build).
- [PASS] Heavy dependency (`@playwright/test`) is a peer; the smoke test runs headless Chromium locally — no service stubs needed.
- [PASS] New library `@playwright/test` has a confirmed snippet from memory #179; bridge contract is owned by this phase and fully spelled out.
