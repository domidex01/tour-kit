# Phase 5 — Testing: `@tour-kit/testing-library` (#85)

**Scope:** New package `@tour-kit/testing-library`. `virtualTarget(rect?)` Floating-UI factory; `expectStepVisible`/`advanceTour`/`previousTour`/`skipTour`/`completeTour`/`goToStep` helpers; `TourKitTestingError`; `setupTourKitTesting({ positionShim? })` with LAZY-imported `jsdom-testing-mocks`; subpath export `./setup`; default path leaves `Element.prototype` untouched.
**Key Pattern:** Integration-style phase — tests this library against the REAL `<TourProvider>` + `<TourCard>` from `@tour-kit/react`. Zero consumer-side `await act(...)` in test files (helpers handle the flush internally). `jsdom-testing-mocks` is OPTIONAL and only loaded when `positionShim: true` — verified by lazy-import spy.
**Dependencies:** `vitest@^4.1.0`, `@testing-library/react@^16.3.1`, `@testing-library/user-event@^14.6.1`, `jsdom@^27.3.0`, `jsdom-testing-mocks@^1.13.0` (optional peer; required as devDep here), `@tour-kit/core`, `@tour-kit/react` (workspace dev deps).

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a test author, I want `expectStepVisible('id')` to resolve without writing `await act(...)` myself | `floating-ui-integration.test.tsx` test calls helper against real `<TourCard>`; `grep -c 'await act' src/__tests__/*.tsx` returns 0 | Helper resolves; element returned; consumer code contains zero `await act` |
| US-2 | As a consumer who hates global monkey-patches, I want the default setup to leave `Element.prototype` untouched | `floating-ui-integration.test.tsx` captures `Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')` before/after `setupTourKitTesting()` | Descriptor's `.value` is unchanged; `.get`/`.set` are undefined |
| US-3 | As a consumer who DOES need a non-zero rect for my own assertions, I want `setupTourKitTesting({ positionShim: true })` to lazy-import `jsdom-testing-mocks` so non-opt-in users pay nothing | Spy on dynamic `import()`; assert it's called only when `positionShim: true` | Without opt-in: spy not called; with opt-in: spy called once with `'jsdom-testing-mocks'` |
| US-4 | As a debugger, I want failure messages to name the helper + stepId + timeout so I don't have to read the stack trace | `error.test.ts` TestErrorMetadata | thrown `TourKitTestingError.stepId === 'missing'`; message includes `'within 50ms'` |
| US-5 | As a CommonJS consumer (legacy test runner), I want `require('@tour-kit/testing-library')` to resolve | `entry-points.test.ts` spawns a node `require(...)` smoke | exit 0; stdout includes `'function'` for `expectStepVisible` |
| US-6 | As a bundle-size watcher, I want the package gzipped <4KB | `pnpm size` entry | size-limit reports <4KB |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `<TourProvider>` + `<TourCard>` (real, from `@tour-kit/react`) | No mock — workspace dev dep | Helpers actually advance the tour | US-1 |
| `expectStepVisible(id)` | No mock — exercise against real `<TourCard>` | Returns the `[data-tour-step="id"]` element; throws `TourKitTestingError` after timeout | US-1, US-4 |
| `advanceTour()` / `previousTour()` / `skipTour()` | No mock — drive real `userEvent.click` against the rendered Next/Prev/Skip buttons | After call: next/prev step becomes visible OR `isActive=false` | US-1 |
| `completeTour(tourId)` | No mock — loops clicking Next/Finish | After call: no step card visible; `useTour().isActive === false` | US-1 |
| `goToStep(id)` | Use the INTERNAL probe component pattern (render a hidden `<HookProbe />` that captures `useTour()` via a module-level setter) | After call: requested step is visible | US-1 |
| `virtualTarget(rect?)` | No mock — pure factory | Returns object with `getBoundingClientRect()` returning the merged rect; default rect has non-zero width/height | (helper) |
| `TourKitTestingError` | No mock — `new TourKitTestingError(...)` | `instanceof Error` AND `instanceof TourKitTestingError`; `stepId`/`tourId` populated; `cause` preserved | US-4 |
| `Element.prototype` baseline | No mock — capture descriptor before/after | `value`, `get`, `set` unchanged after `setupTourKitTesting()` | US-2 |
| `setupTourKitTesting({ positionShim: true })` lazy import | `vi.spyOn(globalThis, 'eval')` won't work for `import()`; use `vi.mock('jsdom-testing-mocks', { spy: true })` OR use vitest's `vi.doMock` with a sentinel | Sentinel is loaded only when `positionShim: true` | US-3 |
| Subpath `./setup` resolution | Spawn `node -e "require('@tour-kit/testing-library/setup')"` child process | Exit 0; `setupTourKitTesting` available | US-5 |
| Main entry CJS resolution | Spawn `node -e "require('@tour-kit/testing-library')"` child process | Exit 0; `expectStepVisible` available | US-5 |
| Bundle size | `pnpm size` | <4KB gzipped | US-6 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (helper + error) | `vitest`, `@testing-library/react`, real `@tour-kit/react` | <5s | Every push |
| Integration (Floating UI round-trip) | jsdom + real Tour Kit components | <8s | Every push |
| Entry-point smoke | `node` child process for CJS/ESM require/import | <3s | Every push (after build) |
| Bundle size | `size-limit` | <10s | Every push (CI) |

No browser tier — Phase 6 owns Playwright. This package is jsdom-only by design.

---

## Fake / Mock Implementations

**Two test fixtures + one spy pattern.**

```tsx
// packages/testing-library/src/__tests__/_fixtures.tsx
import type { Tour } from '@tour-kit/core'

export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '[data-test=welcome-target]', content: 'Hi' },
    { id: 'pricing', target: '[data-test=pricing-target]', content: 'Pay' },
  ],
}

// JSX consumed by every integration test — keep it small and consistent.
export function TwoStepFixture({ enableTestBridge = false }: { enableTestBridge?: boolean }) {
  const { TourProvider, TourCard } = require('@tour-kit/react') as typeof import('@tour-kit/react')
  return (
    <>
      <div data-test="welcome-target" />
      <div data-test="pricing-target" />
      <TourProvider tours={[twoStepTour]} initialTour="demo" {...(enableTestBridge ? { enableTestBridge: true } : {})}>
        <TourCard />
      </TourProvider>
    </>
  )
}
```

**Lazy-import spy pattern for `setupTourKitTesting({ positionShim: true })`:**

```ts
// inside floating-ui-integration.test.tsx
import { vi } from 'vitest'

// Use vitest's `vi.mock` factory to intercept the dynamic import
let jdmLoadCount = 0
vi.mock('jsdom-testing-mocks', async (importOriginal) => {
  jdmLoadCount++
  return importOriginal()
})

// Per-test reset
beforeEach(() => { jdmLoadCount = 0 })
```

`vi.mock` is hoisted; the dynamic `await import('jsdom-testing-mocks')` inside `setupTourKitTesting` goes through it. The counter proves the import happened.

**No fake `Element.prototype`** — that's the whole point of US-2: the default code path doesn't touch it.

---

## Test File List

```
packages/testing-library/src/
├── __tests__/
│   ├── _fixtures.tsx                                # twoStepTour + TwoStepFixture JSX
│   ├── floating-ui-integration.test.tsx             # ≥12 cases: helpers against real <TourCard>; zero consumer act()
│   ├── error.test.ts                                # TourKitTestingError shape, instanceof, cause, stepId/tourId
│   ├── virtual-target.test.ts                       # virtualTarget(rect?) merges; default rect non-zero
│   ├── setup-position-shim.test.ts                  # positionShim:false (default) → no jsdom-testing-mocks import; :true → exactly one
│   ├── prototype-untouched.test.ts                  # Element.prototype.getBoundingClientRect descriptor unchanged
│   └── entry-points.test.ts                         # ESM + CJS resolution of `.` and `./setup`
```

The integration test file is the heaviest; everything else stays small.

---

## `setup` / Fixtures Structure

**New setup at `packages/testing-library/vitest.config.ts` + `vitest.setup.ts`:**

```ts
// packages/testing-library/vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
})
```

```ts
// packages/testing-library/vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// CRUCIAL: do NOT patch Element.prototype.getBoundingClientRect here.
// Phase 5's promise is that the DEFAULT path leaves it alone.
// Any per-test rect mocking goes through setupTourKitTesting({ positionShim: true })
// inside the specific tests that need it.
```

No `pytest_addoption`-style CLI flags; vitest config is enough.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Integration tests use the REAL `@tour-kit/react` package | Workspace dev dep | The whole point of Phase 5 is "helpers work against real `<TourCard>`" — mocking it would test nothing |
| `grep -c 'await act' src/__tests__/*.tsx` enforced as a CI gate | Shell command in `entry-points.test.ts` OR a CI script step | Zero consumer-side `act` is the headline contract |
| `vi.mock('jsdom-testing-mocks', importOriginal)` to spy on lazy import | Hoisted mock with side-effect counter | Vitest doesn't make `import()` directly spy-able; `vi.mock` is the idiomatic way |
| Prototype-descriptor capture is its own test, not just an assert inside the integration | Separate file with single focused test | If this regresses, the failure must be unambiguous and easy to grep for |
| Entry-point smoke via spawned `node` process | `child_process.execFileSync('node', ['-e', '...'])` | Tests true CJS/ESM resolution against real `dist/` — not a fake `createRequire` |
| `TwoStepFixture` shared across integration tests | One JSX component | Prevents drift between cases that differ only in helper-under-test |
| `goToStep` helper uses a probe component, not `window.__tourKit__` | Render `<HookProbe />` that captures `useTour()` via a module setter | Phase 6 owns `window.__tourKit__`; Phase 5 must work without Phase 6 |
| `completeTour` test asserts on "isActive false" via context, not screen state | Render with a `<HookProbe />` exposing `useTour().isActive` | Screen state is brittle (next button absence has many causes); context state is authoritative |
| Don't try to test `setupTourKitTesting`'s custom `defaultRect` plumbing | Note the limitation in the JSDoc, not in tests | Per Task 5.3 the API is per-element; testing a "global default" would require implementation Phase 5 doesn't actually ship |

---

## Example Test Case

```tsx
// packages/testing-library/src/__tests__/floating-ui-integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import {
  expectStepVisible, advanceTour, previousTour, skipTour, completeTour, goToStep,
  setupTourKitTesting, TourKitTestingError,
} from '..'
import { TwoStepFixture } from './_fixtures'

// Spy on lazy import — see "Lazy-import spy pattern" in the test plan
let jdmLoadCount = 0
vi.mock('jsdom-testing-mocks', async (importOriginal) => { jdmLoadCount++; return importOriginal() })
beforeEach(() => { jdmLoadCount = 0 })

beforeEach(async () => { await setupTourKitTesting() }) // default — no shim

describe('@tour-kit/testing-library — integration against real <TourCard>', () => {
  it('expectStepVisible resolves without consumer act()', async () => {
    render(<TwoStepFixture />)
    const el = await expectStepVisible('welcome')
    expect(el).toBeInTheDocument()
  })

  it('advanceTour moves to the next step', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await advanceTour()
    await expectStepVisible('pricing')
  })

  it('previousTour goes back one step', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await advanceTour()
    await previousTour()
    await expectStepVisible('welcome')
  })

  it('completeTour finishes a 2-step tour', async () => {
    render(<TwoStepFixture />)
    await completeTour('demo')
    // After completion, no step card mounts. Probe via the absent selector:
    expect(document.querySelector('[data-tour-step]')).toBeNull()
  })

  it('skipTour invokes the Skip action', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await skipTour()
    expect(document.querySelector('[data-tour-step]')).toBeNull()
  })

  it('goToStep jumps to a non-adjacent step', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await goToStep('pricing')
    await expectStepVisible('pricing')
  })

  it('expectStepVisible throws TourKitTestingError on timeout', async () => {
    render(<TwoStepFixture />)
    await expect(expectStepVisible('not-a-step', { timeout: 50 })).rejects.toThrow(/not visible within 50ms/)
  })

  it('TourKitTestingError carries stepId', async () => {
    render(<TwoStepFixture />)
    try {
      await expectStepVisible('missing', { timeout: 50 })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(TourKitTestingError)
      expect((e as TourKitTestingError).stepId).toBe('missing')
    }
  })

  it('default setup does NOT lazy-import jsdom-testing-mocks', async () => {
    await setupTourKitTesting()      // default — no positionShim
    expect(jdmLoadCount).toBe(0)
  })

  it('positionShim:true triggers ONE lazy import', async () => {
    await setupTourKitTesting({ positionShim: true })
    expect(jdmLoadCount).toBe(1)
  })

  it('container option scopes queries', async () => {
    const { container } = render(<TwoStepFixture />)
    const el = await expectStepVisible('welcome', { container })
    expect(container.contains(el)).toBe(true)
  })

  it('axe a11y pass on the rendered TourCard fixture', async () => {
    const { axe } = await import('@axe-core/react')
    const { container } = render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
```

```ts
// packages/testing-library/src/__tests__/prototype-untouched.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTourKitTesting } from '..'

let baseline: PropertyDescriptor | undefined

beforeAll(() => {
  baseline = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')
})

describe('default setup — prototype untouched', () => {
  it('Element.prototype.getBoundingClientRect descriptor matches the JSDOM baseline after setupTourKitTesting()', async () => {
    await setupTourKitTesting()
    const after = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')
    expect(after?.value).toBe(baseline?.value)
    expect(after?.get).toBe(baseline?.get)
    expect(after?.set).toBe(baseline?.set)
  })
})
```

```ts
// packages/testing-library/src/__tests__/error.test.ts
import { describe, it, expect } from 'vitest'
import { TourKitTestingError } from '..'

describe('TourKitTestingError', () => {
  it('is instanceof Error', () => {
    expect(new TourKitTestingError('x')).toBeInstanceOf(Error)
  })
  it('is instanceof TourKitTestingError', () => {
    expect(new TourKitTestingError('x')).toBeInstanceOf(TourKitTestingError)
  })
  it('preserves stepId and tourId', () => {
    const e = new TourKitTestingError('x', { stepId: 's', tourId: 't' })
    expect(e.stepId).toBe('s')
    expect(e.tourId).toBe('t')
  })
  it('preserves cause', () => {
    const inner = new Error('inner')
    const e = new TourKitTestingError('outer', { cause: inner })
    expect(e.cause).toBe(inner)
  })
  it('name === "TourKitTestingError"', () => {
    expect(new TourKitTestingError('x').name).toBe('TourKitTestingError')
  })
})
```

```ts
// packages/testing-library/src/__tests__/entry-points.test.ts
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const PKG = join(__dirname, '..', '..')
const MAIN_CJS = join(PKG, 'dist', 'index.cjs')
const SETUP_CJS = join(PKG, 'dist', 'setup.cjs')

const distExists = existsSync(MAIN_CJS) && existsSync(SETUP_CJS)

describe('entry points', () => {
  if (!distExists) { it.skip('dist/ not built; run `pnpm --filter @tour-kit/testing-library build`', () => {}); return }

  it('CJS require of main entry resolves expectStepVisible', () => {
    const out = execFileSync('node', ['-e', `const m = require('${MAIN_CJS}'); process.stdout.write(typeof m.expectStepVisible)`], { encoding: 'utf8' })
    expect(out).toBe('function')
  })

  it('CJS require of ./setup resolves setupTourKitTesting', () => {
    const out = execFileSync('node', ['-e', `const m = require('${SETUP_CJS}'); process.stdout.write(typeof m.setupTourKitTesting)`], { encoding: 'utf8' })
    expect(out).toBe('function')
  })

  it('test files contain ZERO consumer-side await act() calls', () => {
    const out = execFileSync('grep', ['-rEc', 'await\\s+act\\b', 'src/__tests__'], { cwd: PKG, encoding: 'utf8' })
    // grep -c per file with sum=0 — each line is "file:count"; total of counts must be 0
    const total = out.split('\n').filter(Boolean).reduce((s, line) => s + Number(line.split(':').at(-1) ?? 0), 0)
    expect(total).toBe(0)
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 5 of Tour Kit's Sprint 1 — `@tour-kit/testing-library` (issue #85).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. Tour positioning uses `@floating-ui/react`. Under jsdom, Floating UI emits `{x:0, y:0}` because jsdom doesn't compute layout — so "is this step visible" assertions are flaky without the documented virtual-element pattern + an `act()` flush. Every consumer team re-derives that pattern by hand today. Phase 5 packages it once. The default setup leaves `Element.prototype` untouched; an opt-in `setupTourKitTesting({ positionShim: true })` lazy-imports `jsdom-testing-mocks` for the rare team that needs a non-zero `getBoundingClientRect` for its own assertions.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | Helpers handle act() flush internally | grep + integration test | `grep -c 'await act' src/__tests__/` returns 0; helpers resolve |
| US-2 | Default setup leaves `Element.prototype` alone | prototype-untouched.test.ts | descriptor.value/.get/.set unchanged |
| US-3 | `positionShim:true` lazy-imports `jsdom-testing-mocks` | vi.mock counter | counter=0 default; counter=1 with shim |
| US-4 | Errors carry stepId+tourId+cause and name the helper | error.test.ts | TourKitTestingError instanceof Error; fields set |
| US-5 | ESM + CJS entry points resolve | entry-points.test.ts | spawned node prints 'function' |
| US-6 | Package <4KB gzipped | pnpm size | budget passes |

### Why Fakes Are Required
Phase 5 IS a test library — the fakes ARE the artifact. But within the test suite itself: **none beyond a small fixture component (`TwoStepFixture`).** We use the REAL `@tour-kit/react` package because Phase 5's job is to make tests against real `<TourCard>` ergonomic. Mocking it would invalidate the whole phase.

### What NOT to Test
- Don't test `@floating-ui/react` positioning math — Phase 5 doesn't change it; the virtual-element pattern just makes the math have something to chew on.
- Don't test that `expectStepVisible` returns the EXACT element instance after re-renders — RTL's `waitFor` retries; the element identity may change.
- Don't add a test that patches `Element.prototype` to "prove the prototype-untouched test would fail" — manual verification once is enough; don't put state-modifying tests in the suite.
- Don't try to test that `setupTourKitTesting({ positionShim: { defaultRect: {...} } })` mutates global rects — per Task 5.3 the API is per-element via `mockElementBoundingClientRect`; a global default isn't shipped.
- Don't add a Playwright test — Phase 6 owns browser. Phase 5 is jsdom-only.
- Don't snapshot the helpers' source — the integration test is the contract.

### Critical: Fake Implementations

```tsx
// packages/testing-library/src/__tests__/_fixtures.tsx
import type { Tour } from '@tour-kit/core'
import { TourProvider, TourCard } from '@tour-kit/react'

export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '[data-test=welcome-target]', content: 'Hi' },
    { id: 'pricing', target: '[data-test=pricing-target]', content: 'Pay' },
  ],
}

export function TwoStepFixture() {
  return (
    <>
      <div data-test="welcome-target" />
      <div data-test="pricing-target" />
      <TourProvider tours={[twoStepTour]} initialTour="demo">
        <TourCard />
      </TourProvider>
    </>
  )
}
```

```ts
// vi.mock pattern for lazy-import spy (inside floating-ui-integration.test.tsx)
import { vi, beforeEach } from 'vitest'
let jdmLoadCount = 0
vi.mock('jsdom-testing-mocks', async (importOriginal) => { jdmLoadCount++; return importOriginal() })
beforeEach(() => { jdmLoadCount = 0 })
```

### Test Files to Create

```
packages/testing-library/
├── vitest.config.ts                               # jsdom environment, setup file
├── vitest.setup.ts                                # cleanup + DO NOT patch prototype
└── src/__tests__/
    ├── _fixtures.tsx                              # TwoStepFixture
    ├── floating-ui-integration.test.tsx           # ≥12 cases — helpers against real <TourCard>
    ├── error.test.ts                              # TourKitTestingError shape
    ├── virtual-target.test.ts                     # virtualTarget(rect) factory
    ├── setup-position-shim.test.ts                # positionShim lazy-import behavior
    ├── prototype-untouched.test.ts                # descriptor unchanged after default setup
    └── entry-points.test.ts                       # CJS/ESM resolution + zero-act grep
```

### Per-File Coverage Guidance

#### `src/__tests__/floating-ui-integration.test.tsx`
≥12 cases. Required:
- expectStepVisible resolves on welcome step (no consumer act)
- advanceTour moves to pricing
- previousTour goes back to welcome
- completeTour finishes the 2-step tour (no step card after)
- skipTour invokes Skip and ends tour
- goToStep jumps non-adjacent
- expectStepVisible throws `TourKitTestingError` after `timeout: 50` on a missing step
- thrown error has `stepId === 'missing'`
- default `setupTourKitTesting()` does NOT lazy-import (`jdmLoadCount === 0`)
- `setupTourKitTesting({ positionShim: true })` lazy-imports exactly once
- `container` option scopes queries
- axe zero violations on the welcome step view

**CRUCIAL:** This file MUST contain ZERO `await act(...)` calls. Run `grep -c 'await act' src/__tests__/floating-ui-integration.test.tsx` — must return 0. The `entry-points.test.ts` enforces this for the whole directory.

#### `src/__tests__/error.test.ts`
5 cases: `instanceof Error`; `instanceof TourKitTestingError`; `stepId`/`tourId` preserved; `cause` preserved; `name === 'TourKitTestingError'`.

#### `src/__tests__/virtual-target.test.ts`
3 cases: default rect has non-zero width/height; merging with partial rect yields the partial overriding defaults; `getBoundingClientRect()` returns the merged DOMRect-shaped object (has `top`/`left`/`right`/`bottom`/`width`/`height`).

#### `src/__tests__/setup-position-shim.test.ts`
4 cases:
- `setupTourKitTesting()` returns a promise that resolves (no args)
- with `positionShim: false`, no `jsdom-testing-mocks` import (counter=0)
- with `positionShim: true`, exactly one import (counter=1)
- with `positionShim: true` called twice, exactly two imports (proves the function isn't memoizing in a way that breaks per-test setup)

#### `src/__tests__/prototype-untouched.test.ts`
1 case (more is overkill): capture `Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')` in a `beforeAll` baseline; after `setupTourKitTesting()` the same descriptor's `value`/`get`/`set` match.

#### `src/__tests__/entry-points.test.ts`
3 cases (gated on `dist/` existing — `it.skip` otherwise):
- spawn `node -e "process.stdout.write(typeof require('<MAIN_CJS>').expectStepVisible)"` → stdout === `'function'`
- spawn `node -e "process.stdout.write(typeof require('<SETUP_CJS>').setupTourKitTesting)"` → stdout === `'function'`
- `grep -rEc 'await\\s+act\\b' src/__tests__` total over all files === 0

### Data Model Notes
- `TourKitTestingError extends Error` — use `Object.setPrototypeOf(this, new.target.prototype)` for cross-target safety.
- `expectStepVisible` queries `[data-tour-step="<id>"]` — verify the existing `<TourCard>` renders that attribute; if not, add it (or use the actual attribute name from `@tour-kit/react`).
- `setupTourKitTesting` is async because it `await import()`s under the hood — always `await` it in tests.
- `vi.mock('jsdom-testing-mocks', async (importOriginal) => { ... return importOriginal() })` is hoisted by vitest. The counter increment fires when the dynamic `import()` resolves.

### Success Criteria
- `pnpm --filter @tour-kit/testing-library build && pnpm --filter @tour-kit/testing-library typecheck && pnpm --filter @tour-kit/testing-library test` exit 0.
- Integration suite reports ≥12 green cases.
- `grep -rEc 'await\\s+act\\b' packages/testing-library/src/__tests__` total is 0.
- `Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')` unchanged after default setup (verified by the dedicated test).
- Spawned `node -e require(...)` for `.` and `./setup` both print `'function'`.
- `pnpm size` reports `@tour-kit/testing-library` <4KB gzipped.

### Expected File Structure at End
```
packages/testing-library/
├── vitest.config.ts
├── vitest.setup.ts
└── src/__tests__/
    ├── _fixtures.tsx
    ├── floating-ui-integration.test.tsx
    ├── error.test.ts
    ├── virtual-target.test.ts
    ├── setup-position-shim.test.ts
    ├── prototype-untouched.test.ts
    └── entry-points.test.ts
```
---

---

## Run Commands

```bash
# All Phase 5 tests (requires @tour-kit/react workspace dep available)
pnpm --filter @tour-kit/testing-library test

# Single integration suite (debugging)
pnpm --filter @tour-kit/testing-library test -- floating-ui-integration

# Prototype check
pnpm --filter @tour-kit/testing-library test -- prototype-untouched

# Entry-point smoke (requires fresh build)
pnpm --filter @tour-kit/testing-library build && \
  pnpm --filter @tour-kit/testing-library test -- entry-points

# Zero-act enforcement (independent CI step)
test "$(grep -rEc 'await\s+act\b' packages/testing-library/src/__tests__ | awk -F: '{s+=$2}END{print s}')" -eq 0

# Bundle size
pnpm size

# Full Phase 5 gate
pnpm --filter @tour-kit/testing-library typecheck && \
  pnpm --filter @tour-kit/testing-library build && \
  pnpm --filter @tour-kit/testing-library test && \
  pnpm size
```
