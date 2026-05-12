# Phase 5 — Testing-Library Package (#85)

**Duration:** Days 13–15 (~12–14 hours)
**Depends on:** Phase 1 (`useTour().goToStep` exists); Phase 0 (catalog has `jsdom-testing-mocks`)
**Blocks:** Nothing in Sprint 1; Phase 6's docs reference RTL helpers as the in-process counterpart
**Risk Level:** MEDIUM — new package + Floating UI testing pitfalls; the temptation to monkey-patch `Element.prototype` is the trap to avoid
**Stack:** typescript

---

## Objective

Ship `@tour-kit/testing-library` so React Testing Library consumers can write `await expectStepVisible('welcome')` and `await advanceTour()` without re-deriving the Floating UI virtual-element + `act()`-flush pattern in every test suite. The default setup does NOT monkey-patch `Element.prototype` — it relies on Floating UI's documented virtual-element pattern. An optional `setupTourKitTesting({ positionShim: true })` lazily peer-deps `jsdom-testing-mocks` for consumers whose own assertions still need a non-zero `getBoundingClientRect`. Every helper resolves cleanly under jsdom without consumers writing `await act(async () => {})` themselves.

## What Success Looks Like

1. `pnpm --filter @tour-kit/testing-library build && pnpm --filter @tour-kit/testing-library typecheck && pnpm --filter @tour-kit/testing-library test` all exit 0.
2. `import { expectStepVisible, advanceTour, completeTour, skipTour } from '@tour-kit/testing-library'` works in ESM AND CJS test harnesses.
3. `import { setupTourKitTesting } from '@tour-kit/testing-library/setup'` resolves through the dedicated subpath.
4. ≥12 integration tests in `packages/testing-library/__tests__/` exercise the helpers against real `<TourCard>` + `<TourProvider>` fixtures from `@tour-kit/react` and `@tour-kit/core`.
5. NONE of those integration tests call `await act(async () => {})` from the consumer side — the helpers handle the flush internally.
6. Default setup leaves `Element.prototype` untouched: `Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')` is the JSDOM stock descriptor (verify with a test).
7. With `setupTourKitTesting({ positionShim: true })`, the shim correctly delegates to `jsdom-testing-mocks#mockElementBoundingClientRect()` (verify it's called).
8. `expectStepVisible` fails with `TourKitTestingError` containing `stepId`, `tourId`, and timeout context — not a generic `Element not found`.
9. Bundle: package gzipped <4KB.

---

## Architecture / Key Design Decisions

```
Consumer test                                Behind the scenes
─────────────                                ─────────────────
import { expectStepVisible } from
  '@tour-kit/testing-library'        ──► find [data-tour-step="id"]
                                          │
                                          ▼
                                     await act(async () => {})   ← Floating UI flush
                                          │
                                          ▼
                                     virtualTarget(rect?)         ← provide getBoundingClientRect
                                          │
                                          ▼
                                     assert visible + return el


setupTourKitTesting({ positionShim: true })
                                     ──► lazy import jsdom-testing-mocks
                                          │
                                          ▼
                                     mockElementBoundingClientRect()
                                     (opt-in only — default touches nothing)
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Public helper signatures (`expectStepVisible`, `advanceTour`, etc.) | `interface`/`type` | TypeScript-only API; helpers are pure functions over RTL primitives |
| `TourKitTestingError` | Plain ES `class extends Error` (TS) | Provides `stepId`, `tourId`, `cause` for failure context; preserves `instanceof` |
| `VirtualTargetRect` | `interface` mirroring `DOMRect` shape | Pure DTO consumed by Floating UI's `refs.setReference(...)` |
| Setup options | `interface SetupOptions { positionShim?: boolean \| { defaultRect?: DOMRect } }` | Discriminate "off" vs "on with custom rect" without a separate flag |

**Other critical rules for this phase:**
- **NEVER monkey-patch `Element.prototype` by default.** The big-plan §3 spec and §6.1 risk-register make this explicit: default setup must leave the prototype untouched. Verify with a test.
- **`await act(...)` lives INSIDE the helpers, not in consumer tests.** Spec §5 (Phase 5 testing thresholds) calls out the regression-baseline: `packages/react/__tests__/tour-card.test.tsx` currently requires consumer flushes. The helpers fix that — verify by running against the actual fixture.
- **Floating UI virtual-element pattern is the default.** Memory entry #180 confirms this is officially documented at `floating-ui.com/docs/virtual-elements`. Use `refs.setReference({ getBoundingClientRect: () => rect })` — no prototype patching.
- **Optional shim is a thin wrapper.** `setupTourKitTesting({ positionShim: true })` peer-deps `jsdom-testing-mocks` LAZILY (dynamic import inside the function) so consumers who don't opt in don't pay for the dep.
- **Helpers throw `TourKitTestingError`, not generic `Error`.** Failure messages name the helper, the step ID, and the timeout. Operators don't want to grep through stack traces.
- **No `Sleep`. No `wait(ms)`.** Use RTL's `waitFor` for retry loops, and `act` for microtask flushes.
- **Peer dep, not direct dep.** `@testing-library/react`, `@testing-library/user-event`, `vitest`, `jsdom`, `react`, `react-dom` are all peers (mostly already in repo catalog).

---

## Tasks

### Task 5.1 — Scaffold `@tour-kit/testing-library` package (1.5h)

**Depends on:** Phase 0 (catalog already has the relevant deps)

Create directory and minimal package.json. Mirror the conventions used by `packages/core` and `packages/react` so Turbo picks it up automatically.

```jsonc
// packages/testing-library/package.json
{
  "name": "@tour-kit/testing-library",
  "version": "0.1.0",
  "description": "React Testing Library helpers for Tour Kit",
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
    "./setup": {
      "import": "./dist/setup.mjs",
      "require": "./dist/setup.cjs",
      "types": "./dist/setup.d.ts"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tour-kit/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^4.0.0",
    "jsdom-testing-mocks": "^1.13.0"
  },
  "peerDependenciesMeta": {
    "jsdom-testing-mocks": { "optional": true }
  },
  "devDependencies": {
    "@tour-kit/react": "workspace:*",
    "@testing-library/react": "catalog:",
    "@testing-library/user-event": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "jsdom-testing-mocks": "catalog:"
  }
}
```

Add `tsup.config.ts`:

```ts
import { defineConfig } from 'tsup'
export default defineConfig({
  entry: { index: 'src/index.ts', setup: 'src/setup.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  external: ['react', 'react-dom', '@testing-library/react', '@testing-library/user-event', 'vitest', 'jsdom-testing-mocks'],
})
```

Add `tsconfig.json` extending the root config and `vitest.config.ts` with `environment: 'jsdom'`. Add `tsconfig.type-tests.json` for the harness if any `.test-d.ts` lands here.

**Sanity check:** `pnpm install` exits 0 and `pnpm --filter @tour-kit/testing-library build` produces `dist/index.{mjs,cjs,d.ts}` and `dist/setup.{mjs,cjs,d.ts}`.

---

### Task 5.2 — Confirm peers & devDeps (1h)

**Depends on:** 5.1

Verify `pnpm-workspace.yaml` catalog has every entry used above. `jsdom-testing-mocks ^1.13.0` was added in Phase 0 — confirm presence. `@testing-library/user-event` is already at `^14.6.1` (per spec §7). If anything missing, add it.

Run `pnpm install` at root and confirm no peer-dep warnings for the new package.

**Sanity check:** `pnpm why jsdom-testing-mocks` shows it's reachable from the package as a peer.

---

### Task 5.3 — `virtualTarget(rect?)` + `setupTourKitTesting({ positionShim })` (2h)

**Depends on:** 5.2

```ts
// packages/testing-library/src/helpers/virtual-target.ts (new)
// Confirmed via memory #180 (2026-05-12). Library: @floating-ui/react.
// Pattern: refs.setReference({ getBoundingClientRect: () => rect })

const DEFAULT_RECT = { x: 0, y: 0, width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100, toJSON() { return this } }

export interface VirtualTargetRect extends DOMRect {}

export interface VirtualTarget {
  getBoundingClientRect: () => VirtualTargetRect
  contextElement?: Element
}

export function virtualTarget(rect: Partial<VirtualTargetRect> = {}): VirtualTarget {
  const merged = { ...DEFAULT_RECT, ...rect }
  return { getBoundingClientRect: () => merged as VirtualTargetRect }
}
```

```ts
// packages/testing-library/src/setup.ts (new — distinct entry point)
export interface SetupOptions {
  positionShim?: boolean | { defaultRect?: Partial<DOMRect> }
}

export async function setupTourKitTesting(opts: SetupOptions = {}): Promise<void> {
  if (opts.positionShim) {
    // Lazy import — consumers who don't opt in pay nothing.
    const { mockElementBoundingClientRect } = await import('jsdom-testing-mocks')
    const customRect = typeof opts.positionShim === 'object' ? opts.positionShim.defaultRect : undefined
    if (customRect) {
      // jsdom-testing-mocks ^1.13 — mockElementBoundingClientRect(element, rect)
      // For a global default, mock the prototype getter via a single call after first element creation.
      // The cleanest API: provide a helper consumers call per-element. Document the limitation.
      // For the global default, fall through to per-test setup with the consumer providing the element.
    }
    // The cleanest opt-in: a top-level `beforeEach` consumers add themselves,
    // calling mockElementBoundingClientRect(el, rect) per fixture. Document this.
  }
}
```

**Implementation notes:**
- `setupTourKitTesting` is a sync setup orchestration function. The async signature is needed only because `jsdom-testing-mocks` is dynamically imported.
- READ `jsdom-testing-mocks` README at npm before assuming the call signature. The most common APIs are `mockElementBoundingClientRect(element, rect)` and `mockGetComputedStyle()`. Verify before coding.
- **Default path (`positionShim: false` or omitted):** function returns immediately, touches nothing. Document this loudly.

**Sanity check:** Render `<TourProvider tours={[t]}>` with `setupTourKitTesting()` (no args) — `Element.prototype.getBoundingClientRect` is still the JSDOM default (verify by capturing the descriptor before/after).

---

### Task 5.4 — Interaction helpers (3h)

**Depends on:** 5.3; Phase 1 (`useTour().goToStep` is top-level)

```ts
// packages/testing-library/src/helpers/expect-step-visible.ts (new)
import { act, waitFor, screen } from '@testing-library/react'
import { TourKitTestingError } from '../error'

export interface ExpectStepVisibleOptions {
  timeout?: number
  container?: HTMLElement
}

export async function expectStepVisible(
  stepId: string,
  opts: ExpectStepVisibleOptions = {}
): Promise<HTMLElement> {
  const { timeout = 1000 } = opts
  try {
    // First, flush Floating UI microtasks. Confirmed pattern (memory #180).
    await act(async () => {})
    return await waitFor(
      () => {
        const el = (opts.container ?? document).querySelector<HTMLElement>(
          `[data-tour-step="${stepId}"]`
        )
        if (!el) throw new Error(`step "${stepId}" not in DOM`)
        return el
      },
      { timeout }
    )
  } catch (e) {
    throw new TourKitTestingError(`expectStepVisible: step "${stepId}" not visible within ${timeout}ms`, {
      cause: e,
      stepId,
    })
  }
}
```

```ts
// packages/testing-library/src/helpers/advance-tour.ts (new)
import userEvent from '@testing-library/user-event'
import { act, screen } from '@testing-library/react'

export async function advanceTour(opts: { steps?: number; user?: ReturnType<typeof userEvent.setup> } = {}): Promise<void> {
  const user = opts.user ?? userEvent.setup()
  const steps = opts.steps ?? 1
  for (let i = 0; i < steps; i++) {
    const btn = screen.getByRole('button', { name: /next/i })
    await user.click(btn)
    await act(async () => {})
  }
}

// packages/testing-library/src/helpers/previous-tour.ts — mirror with /previous|back/i
// packages/testing-library/src/helpers/skip-tour.ts            — match /skip/i
// packages/testing-library/src/helpers/complete-tour.ts        — loop until isActive=false; bound by timeout
// packages/testing-library/src/helpers/go-to-step.ts           — uses internal context via useTour ref
```

For `goToStep`, expose an internal hook from `@tour-kit/react` (or re-use Phase 1's `useTour().goToStep`). The helper renders an invisible test-bridge component into the same provider tree that imperatively calls `useTour().goToStep(id)` when the helper is invoked. Avoids reaching into internals.

```ts
// packages/testing-library/src/helpers/complete-tour.ts (new)
import { advanceTour } from './advance-tour'
import { TourKitTestingError } from '../error'
import { screen, waitFor, act } from '@testing-library/react'

export async function completeTour(tourId: string, opts: { timeout?: number; maxSteps?: number } = {}): Promise<void> {
  const { timeout = 5000, maxSteps = 50 } = opts
  const start = Date.now()
  for (let i = 0; i < maxSteps; i++) {
    if (Date.now() - start > timeout) {
      throw new TourKitTestingError(`completeTour: tour "${tourId}" not complete within ${timeout}ms`, { tourId })
    }
    const next = screen.queryByRole('button', { name: /next|finish|done/i })
    if (!next) return
    await advanceTour({ steps: 1 })
  }
  throw new TourKitTestingError(`completeTour: tour "${tourId}" exceeded ${maxSteps} steps`, { tourId })
}
```

**Sanity check:** Helpers compile clean. Import path resolves: `import { expectStepVisible } from '@tour-kit/testing-library'`.

---

### Task 5.5 — `TourKitTestingError` (0.75h)

**Depends on:** 5.4

```ts
// packages/testing-library/src/error.ts (new)
export interface TourKitTestingErrorOptions {
  cause?: unknown
  stepId?: string
  tourId?: string
}

export class TourKitTestingError extends Error {
  stepId?: string
  tourId?: string
  constructor(message: string, opts: TourKitTestingErrorOptions = {}) {
    super(message, { cause: opts.cause })
    this.name = 'TourKitTestingError'
    this.stepId = opts.stepId
    this.tourId = opts.tourId
    // Restore prototype chain across compiled targets.
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
```

**Sanity check:** `new TourKitTestingError('x', { stepId: 's' }) instanceof TourKitTestingError` is `true` AND `instanceof Error` is `true`.

---

### Task 5.6 — Integration tests against real Tour Kit components (3h)

**Depends on:** 5.4, 5.5

Use the existing `<TourCard>` + `<TourProvider>` from `@tour-kit/react` as fixtures. NO consumer-side `act()` in any of these tests — that's the whole point of the package.

```ts
// packages/testing-library/src/__tests__/floating-ui-integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { TourProvider, TourCard } from '@tour-kit/react'
import { expectStepVisible, advanceTour, completeTour, skipTour, setupTourKitTesting } from '..'

beforeEach(async () => {
  await setupTourKitTesting()   // no shim — default path
})

const baseTour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '[data-test=welcome-target]', content: 'Hi' },
    { id: 'pricing', target: '[data-test=pricing-target]', content: 'Pay' },
  ],
}

describe('@tour-kit/testing-library — Floating UI integration', () => {
  it('expectStepVisible resolves without consumer act() flush', async () => {
    render(
      <>
        <div data-test="welcome-target" />
        <div data-test="pricing-target" />
        <TourProvider tours={[baseTour]} initialTour="demo">
          <TourCard />
        </TourProvider>
      </>
    )
    const el = await expectStepVisible('welcome')
    expect(el).toBeInTheDocument()
  })

  it('advanceTour moves to next step', async () => {
    render(/* same */)
    await expectStepVisible('welcome')
    await advanceTour()
    await expectStepVisible('pricing')
  })

  it('completeTour clicks Next until finish', async () => {
    render(/* same */)
    await completeTour('demo')
    expect(/* no step card visible */).toBeTruthy()
  })

  it('skipTour clicks the Skip button', async () => {
    render(/* tour with skippable steps */)
    await expectStepVisible('welcome')
    await skipTour()
    /* assert isActive false via context, or absence of step card */
  })

  it('default setup does NOT patch Element.prototype', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')
    // jsdom's stock value is a function with no custom getter/setter
    expect(descriptor?.value).toBe(Element.prototype.getBoundingClientRect)
    expect(descriptor?.get).toBeUndefined()
  })

  it('positionShim:true lazy-imports jsdom-testing-mocks', async () => {
    // spy on dynamic import; verify the function is invoked
    await setupTourKitTesting({ positionShim: true })
    // verify a sentinel from jsdom-testing-mocks is now available, or that
    // a known per-element mockElementBoundingClientRect call works
  })

  it('expectStepVisible throws TourKitTestingError on timeout', async () => {
    render(/* tour with non-existent target */)
    await expect(expectStepVisible('not-a-step', { timeout: 50 })).rejects.toThrow(/not visible within 50ms/)
  })

  it('TourKitTestingError carries stepId and tourId', async () => {
    try {
      await expectStepVisible('missing', { timeout: 50 })
    } catch (e) {
      expect(e).toBeInstanceOf(TourKitTestingError)
      expect((e as TourKitTestingError).stepId).toBe('missing')
    }
  })

  // Plus tests for: goToStep, previousTour, container option, axe pass.
})
```

Target ≥12 cases across the file.

**Sanity check:** `pnpm --filter @tour-kit/testing-library test` exits 0. Confirm by grep: zero `await act` calls in the test file other than in commented-out reference patterns.

---

### Task 5.7 — Docs (1.5h)

**Depends on:** 5.6

New guide: `apps/docs/content/docs/guides/testing.mdx` (or extend an existing testing page). Cover:

1. Install: `pnpm add -D @tour-kit/testing-library @testing-library/react @testing-library/user-event vitest jsdom`.
2. Quick start: `setupTourKitTesting()` in a global setup file; one canonical test using `expectStepVisible` + `advanceTour`.
3. The Floating UI virtual-element pattern (memory-anchored — link to `floating-ui.com/docs/virtual-elements`).
4. **Caveat:** default setup does NOT patch `Element.prototype`. Most teams need nothing more. If your own assertions need a non-zero `getBoundingClientRect`, pass `positionShim: true`.
5. `TourKitTestingError` shape.
6. Assertion-of-presence-not-position philosophy (link to Phase 6 Playwright for pixel-perfect positioning tests).

Update `apps/docs/content/docs/guides/meta.json` if new page is added.

**Sanity check:** `pnpm --filter docs build` exits 0.

---

## Deliverables

```
packages/testing-library/                          # (+) entire new package
├── package.json                                   # peers, exports, scripts
├── tsconfig.json
├── tsup.config.ts                                 # two entries (index, setup)
├── vitest.config.ts
├── src/
│   ├── index.ts                                   # barrel: helpers + error + virtualTarget
│   ├── setup.ts                                   # setupTourKitTesting (subpath entry)
│   ├── error.ts                                   # TourKitTestingError
│   └── helpers/
│       ├── virtual-target.ts                      # Floating UI factory
│       ├── expect-step-visible.ts
│       ├── advance-tour.ts
│       ├── previous-tour.ts
│       ├── skip-tour.ts
│       ├── complete-tour.ts
│       └── go-to-step.ts
└── src/__tests__/
    └── floating-ui-integration.test.tsx           # ≥12 cases, zero consumer act()

apps/docs/content/docs/guides/
└── testing.mdx (new or extended) + meta.json (if new)
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/testing-library build` produces `dist/index.{mjs,cjs,d.ts}` and `dist/setup.{mjs,cjs,d.ts}`.
- [ ] `import { expectStepVisible } from '@tour-kit/testing-library'` AND `require('@tour-kit/testing-library')` both resolve.
- [ ] `import { setupTourKitTesting } from '@tour-kit/testing-library/setup'` AND CJS counterpart both resolve.
- [ ] `pnpm --filter @tour-kit/testing-library test` exits 0 with ≥12 cases.
- [ ] Integration tests contain ZERO consumer-side `await act(async () => {})` calls (`grep -c 'await act' src/__tests__/*` returns `0` — only present in helper internals).
- [ ] `Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')` test confirms NO prototype patching with default setup.
- [ ] `setupTourKitTesting({ positionShim: true })` test confirms `jsdom-testing-mocks` is dynamically imported (spy or sentinel).
- [ ] `TourKitTestingError` instances expose `stepId`/`tourId` and `instanceof Error` is true.
- [ ] `pnpm size` reports `@tour-kit/testing-library` gzipped <4KB.
- [ ] Docs guide covers default vs. shim paths; cross-links to Phase 6 for browser-positioning tests.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 5 of Tour Kit's Sprint 1 — `@tour-kit/testing-library` (issue #85).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. Tour positioning uses `@floating-ui/react`. Under jsdom, Floating UI emits `{ x: 0, y: 0 }` because jsdom doesn't compute layout — so the "is this step visible" assertion is flaky unless you use the documented virtual-element pattern + `act()` flush. Every consumer team re-derives that pattern by hand today. This package packages it once.

### Established in Prior Phases
- Phase 0 catalog has `jsdom-testing-mocks ^1.13.0` for the optional shim path.
- Phase 1 exposed `useTour().goToStep('id')` at the top level — the `goToStep` helper in this package builds on it.
- `@testing-library/react ^16.3.1`, `@testing-library/user-event ^14.6.1`, `vitest ^4.1.0`, `jsdom ^27.3.0`, `typescript ^5.9.3` are in the root catalog.
- The repo's existing `packages/react/__tests__/tour-card.test.tsx` REQUIRES hand-rolled `await act(async () => {})` flushes — this package's regression baseline is making that no longer necessary.
- `<TourProvider>` and `<TourCard>` already exist in `@tour-kit/react`.

### Your Goal for This Phase
Ship `@tour-kit/testing-library` (default barrel) and `@tour-kit/testing-library/setup` (lazy-shim entry). Default setup leaves `Element.prototype` untouched. Helpers wrap Floating UI's virtual-element pattern + the `act()` flush internally so consumer tests don't manage either. Integration tests against real `<TourCard>` confirm zero consumer-side `act()` is needed.

### Data Model Rules (follow exactly)
- `interface`/`type` only — no Zod, no runtime validation. This is a TS-only API surface.
- `TourKitTestingError extends Error` with `stepId?: string`, `tourId?: string`, `cause?: unknown`. Use `Object.setPrototypeOf(this, new.target.prototype)` for compiled-target safety.
- `VirtualTarget` extends Floating UI's expected reference shape: `{ getBoundingClientRect: () => DOMRect; contextElement?: Element }`.
- `SetupOptions` carries `positionShim?: boolean | { defaultRect?: Partial<DOMRect> }`.

### Architecture
- Two entry points: `.` and `./setup`. Build both with tsup; both ship `.mjs`, `.cjs`, `.d.ts`.
- Default `setupTourKitTesting()` (no args) does NOTHING — touches no globals, mounts no shim. Verify with a test that captures `Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')` before and after.
- `setupTourKitTesting({ positionShim: true })` LAZILY `await import('jsdom-testing-mocks')` inside the function. No top-level import. Consumers without the shim never load the dep.
- All helpers handle `await act(async () => {})` flushes internally. Zero consumer-side `act` calls.
- `TourKitTestingError` is the only thrown error type — never plain `Error`, never just rethrow a generic.
- Peer-dep, not direct-dep: `@testing-library/react`, `@testing-library/user-event`, `vitest`, `jsdom-testing-mocks` (optional), `react`, `react-dom`. The only direct dep is `@tour-kit/core`.

### Confirmed Library APIs

```ts
// @floating-ui/react — confirmed via memory #180 (Context7 2026-05-12, /floating-ui/floating-ui)
// Two officially-documented testing patterns:
// 1. Virtual elements (preferred):
refs.setReference({
  getBoundingClientRect: () => ({ x: 0, y: 0, top: 0, left: 0, bottom: H, right: W, width: W, height: H }),
})
// No prototype monkey-patching needed.
// 2. act() flush for positioning state:
await act(async () => {})
// Required before asserting on positioned UI. The helpers in this package
// wrap this so consumers don't repeat it.
```

```ts
// jsdom-testing-mocks ^1.13.0 — opt-in only, lazy-imported
// Verify the actual call signature by reading the npm README before coding —
// the most common API is mockElementBoundingClientRect(element, rect) called
// per-element in a test, not a global prototype patch.
```

```ts
// @testing-library/user-event ^14.6.1 — confirmed (repo catalog, package.json:22)
const user = userEvent.setup()
await user.click(element)
```

### Files to Create

#### `packages/testing-library/package.json`
Use the exact shape from Task 5.1 above. Two exports: `.` and `./setup`. `jsdom-testing-mocks` is in `peerDependencies` with `peerDependenciesMeta.optional = true`. Direct dep: `@tour-kit/core` only.

#### `packages/testing-library/tsconfig.json`
Extend root `tsconfig.json`. JSX `react-jsx`. Includes `src/**/*`.

#### `packages/testing-library/tsup.config.ts`
Two entries (`index`, `setup`). External: `react`, `react-dom`, `@testing-library/*`, `vitest`, `jsdom-testing-mocks`.

#### `packages/testing-library/vitest.config.ts`
`environment: 'jsdom'`. Setup files: none (Tour Kit's setup function is consumer-invoked, not auto-applied).

#### `packages/testing-library/src/error.ts`
`TourKitTestingError extends Error` with `name`, `stepId?`, `tourId?`, `cause?`. Includes `Object.setPrototypeOf` for compiled-target safety.

#### `packages/testing-library/src/helpers/virtual-target.ts`
`virtualTarget(rect?: Partial<DOMRect>): VirtualTarget` returning `{ getBoundingClientRect: () => DOMRect }`. Default rect: `{ x:0, y:0, width:200, height:100, top:0, left:0, right:200, bottom:100, toJSON: function() { return this } }`.

#### `packages/testing-library/src/helpers/expect-step-visible.ts`
Signature: `async expectStepVisible(stepId, opts?): Promise<HTMLElement>`. Internally: `await act(async () => {})` first; then `waitFor(() => container.querySelector('[data-tour-step="..."]'))` with a `timeout` (default 1000ms). On failure, throw `TourKitTestingError` with the stepId and timeout in the message.

#### `packages/testing-library/src/helpers/advance-tour.ts`
`advanceTour({ steps?, user? })`. Default `steps=1`. Uses `userEvent.setup()` if no `user` passed. After each click, `await act(async () => {})`.

#### `packages/testing-library/src/helpers/previous-tour.ts`
Mirror `advance-tour` but match `/previous|back/i` on the role button.

#### `packages/testing-library/src/helpers/skip-tour.ts`
`async skipTour(opts?)`. Match `/skip/i`.

#### `packages/testing-library/src/helpers/complete-tour.ts`
Loop calling `advanceTour({ steps: 1 })` until no Next/Finish button remains OR timeout/maxSteps exceeded. Throw `TourKitTestingError` with `tourId` on exceed.

#### `packages/testing-library/src/helpers/go-to-step.ts`
`async goToStep(stepId)`. Reaches the running `useTour()` via an internal probe-component pattern — render a hidden component that captures `useTour()` and exposes its ref through a module-level handle. NOT via window/global. Document this is in-process and won't reach across iframes.

#### `packages/testing-library/src/setup.ts`
Default export `setupTourKitTesting(opts?: SetupOptions): Promise<void>`. With no opts → returns immediately. With `positionShim: true` → `await import('jsdom-testing-mocks')` and document that consumers still need to call `mockElementBoundingClientRect(element, rect)` per fixture (the optional shim is a hint, not a global mutation).

#### `packages/testing-library/src/index.ts`
Barrel: every helper + `TourKitTestingError` + `virtualTarget`. Also re-export `render`, `screen`, `fireEvent` from `@testing-library/react` for ergonomics.

#### `packages/testing-library/src/__tests__/floating-ui-integration.test.tsx`
≥12 cases as in Task 5.6. CRUCIAL constraint: ZERO consumer-side `await act(...)` lines in this file (greppable). Cases must include:
- expectStepVisible resolves on TourCard fixture without consumer flush
- advanceTour moves to next step
- completeTour finishes a 2-step tour
- skipTour invokes skip
- default setup leaves `Element.prototype` untouched
- positionShim:true lazy-imports jsdom-testing-mocks
- TourKitTestingError carries stepId
- TourKitTestingError timeout message mentions duration
- previousTour goes back
- goToStep jumps to a non-adjacent step
- container option scopes queries
- axe a11y pass on the TourCard fixture

#### `apps/docs/content/docs/guides/testing.mdx`
Install snippet, quick-start with `setupTourKitTesting()` (no args), one canonical test using `expectStepVisible` + `advanceTour`. Section on the Floating UI virtual-element pattern (link to memory-confirmed docs URL). Section on the optional shim: when to use, what it does, why it's opt-in. Assertion-of-presence philosophy and cross-link to Phase 6 Playwright for browser-positioning tests.

### Success Criteria
- `pnpm --filter @tour-kit/testing-library build && pnpm --filter @tour-kit/testing-library typecheck && pnpm --filter @tour-kit/testing-library test` all exit 0.
- ESM import AND CJS require both resolve for `.` and `./setup` entries.
- ≥12 integration tests green; ZERO `await act` lines in the test file (`grep -c 'await act' src/__tests__/*.tsx` → `0`).
- `Element.prototype.getBoundingClientRect` descriptor is unchanged after `setupTourKitTesting()` with no args.
- `setupTourKitTesting({ positionShim: true })` dynamically imports `jsdom-testing-mocks` (spy on `import()` or assert a sentinel from the lib is reachable).
- `pnpm size` reports the package gzipped <4KB.
- Docs guide builds with `pnpm --filter docs build`.

### Expected File Structure at End
```
packages/testing-library/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── src/
│   ├── index.ts
│   ├── setup.ts
│   ├── error.ts
│   └── helpers/
│       ├── virtual-target.ts
│       ├── expect-step-visible.ts
│       ├── advance-tour.ts
│       ├── previous-tour.ts
│       ├── skip-tour.ts
│       ├── complete-tour.ts
│       └── go-to-step.ts
└── src/__tests__/floating-ui-integration.test.tsx

apps/docs/content/docs/guides/testing.mdx (+ meta.json if new page)
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 0 catalog (`jsdom-testing-mocks`), Phase 1 (`useTour().goToStep`), existing `TourProvider`/`TourCard`.
- [PASS] Every sub-task has a clear, testable completion condition (build/typecheck/test commands; grep counts; descriptor checks).
- [PASS] Execution prompt is self-contained: project context, prior facts, per-file guidance, Floating UI testing pattern with confirmed snippet from memory #180.
- [PASS] Exit criteria map 1:1 to deliverables (each helper → corresponding test case; setup function → prototype-untouched test; error → instanceof test; bundle → size-limit).
- [PASS] Heavy dependency (`jsdom-testing-mocks`) handled: lazy-imported, optional peer. No fake needed — it's small and only loaded when opted in.
- [PASS] New library `jsdom-testing-mocks` has a usage note in the execution prompt; Floating UI testing pattern is fully spelled out via memory #180.
