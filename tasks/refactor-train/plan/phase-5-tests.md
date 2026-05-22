# Phase 5 — Testing: TourProvider Navigation Extraction

**Scope:** Extract `navigateToStep` and `handleBranchTarget` from `packages/core/src/context/tour-provider.tsx` (currently 1802 LOC, 5 complexity ignores) into `packages/core/src/lib/tour-engine/{navigate-to-step,handle-branch-target,context}.ts`. Move `TourAction` / `TourReducerState` types to `packages/core/src/types/tour-reducer.ts`. Provider keeps reducer, flow restore, and `prev`. Target: 5 ignores → 3. Optionally split into Phase 5a (reducer types + `TourEngineContext` + `handleBranchTarget`) and Phase 5b (`navigateToStep` + cleanup).
**Key Pattern:** **Highest-risk phase in the train.** The extracted functions are pure orchestrators with many closure reads. The mock strategy is a `FakeTourEngineContext` builder that satisfies the new `TourEngineContext` interface — every test constructs a fresh instance via a factory with overrides. Existing provider integration tests stay unchanged and are the **regression net**.
**Dependencies:** vitest, @testing-library/react, jsdom, real `tour-reducer.ts` types, real `RouterAdapter` shapes from `packages/core/src/types/router.ts`, real `TourValidationError` / `TourRouteError`.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a tour author with branching tours, I want `handleBranchTarget` to behave identically across all 11 branch cases (null, complete, skip, restart, cross-tour-missing, cross-tour-named, BranchWait, current-index, loop, when-false-next, when-false-empty), so my live tours don't regress | `handle-branch-target.test.ts` — 11 named test cases | Each case asserts the expected `dispatch` calls, `completeTour`/`skipTour`/`setData` calls, and `onStepError` invocation when applicable |
| US-2 | As a route-aware tour user, I want `navigateToStep` to honor `routeChangeStrategy: 'auto' \| 'manual' \| 'prompt'` exactly as it does today, so hidden→route→hidden chains and abort-on-unmount still work | `navigate-to-step.test.ts` — 11 navigation cases | Each strategy asserts expected `router.navigate`/`onNavigationRequired` calls; abort signal aborts mid-chain; `maxHiddenChain` is enforced |
| US-3 | As a maintainer, I want existing provider integration tests (`tour-provider-hidden.test.tsx`, `branching.test.tsx`, `tour-provider-flow-session.test.tsx`, `tour-provider.test.tsx`, `test-bridge.test.tsx`) to pass UNCHANGED after extraction, so the React wiring is provably identical | Existing test suites | `pnpm --filter @tour-kit/core test` exits 0; none of the 5 files modified |
| US-4 | As a reader of the provider, I want only 3 `noExcessiveCognitiveComplexity` ignores remaining (reducer, flow restore, `prev`), so the file's complexity actually went down | `provider-complexity-ignores.test.ts` (source-grep) | `rg -n "noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx` returns exactly 3 lines |
| US-5 | As a tour-engine consumer, I want a stable refs-and-getters `TourEngineContext` interface, so navigation reads fresh state even across async boundaries (the stale-closure risk in the risk register) | `tour-engine-context.test.ts` + branch tests | A mutated state via `dispatch` is visible on the NEXT `getState()` call inside extracted functions; refs are not snapshotted |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|--------------|----------------|------------|
| `TourEngineContext` | `createFakeEngineContext(overrides)` builder — returns full object with `vi.fn()` for every callback and getter-backed mutable state | Each extracted function reads through getters/refs; mutating state via `setState` makes the next `getState()` return new value | US-1, US-2, US-5 |
| `navigateToStep` (extracted) | Real implementation called with FakeEngineContext | Branch-by-branch: `dispatch` calls, `router.navigate` calls, `onNavigationRequired` calls, abort behavior, `maxHiddenChain` enforcement | US-2 |
| `handleBranchTarget` (extracted) | Real implementation called with FakeEngineContext | 11 named cases produce expected side effects in `dispatch`, `completeTour`, `skipTour`, `setData`, `onStepError` | US-1 |
| `RouterAdapter` | `{ navigate: vi.fn().mockResolvedValue(true), getCurrentRoute: vi.fn(() => '/'), subscribe: vi.fn(() => () => {}) }` | `navigate` called with expected route; `getCurrentRoute` checked for route-skip detection | US-2 |
| `dispatch` | `vi.fn()` | Specific `TourAction` shapes asserted via `.toHaveBeenCalledWith(expect.objectContaining({ type: 'GO_TO_STEP', ... }))` | US-1, US-2 |
| `AbortController` ref | Real `new AbortController()` wrapped in a `{ current: AbortController \| null }` ref | After `abort()`, `signal.aborted === true`; navigateToStep returns false / throws (per existing behavior) | US-2 |
| `waitForStepTarget` | `vi.fn().mockResolvedValue(undefined)` for happy path; `.mockRejectedValue(new TourRouteError(...))` for error path | Called with expected step + signal; throws surface as `onStepError(err)` | US-2 |
| `tourKitContext` | `{ tours: new Map([...]), getTour: vi.fn() }` or set to `null` for cross-tour-missing case | Cross-tour branch reads from this; null → `onStepError` | US-1 |
| Existing provider tests | NO mocks — real provider + RTL render | Files unchanged; suite passes | US-3 |
| Source-grep gate | `readFileSync(tour-provider.tsx)` | Exactly 3 `noExcessiveCognitiveComplexity` matches: reducer, flow restore, `prev` (per [`phase-5.md`'s expected results](../phase-5.md#5-remove-provider-complexity-ignores)) | US-4 |
| Source-grep gate (engine) | `readFileSync` over `tour-engine/*.ts` | Zero `noExcessiveCognitiveComplexity` matches in extracted engine files | US-4 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Engine unit | `FakeTourEngineContext`; no RTL, no jsdom DOM | <10s | Every push |
| Provider integration (existing) | Real `<TourProvider>` via RTL + jsdom; existing suites unchanged | <30s | Every push (regression net) |
| Type tests | `expectTypeOf` for `TourEngineContext` shape; verifies refs/getters not snapshots | <5s | Every push |
| Source-grep gate | `readFileSync` + regex | <1s | Every push |
| Manual smoke | `dashboard-next` dev server, 6 manual flows | ~10 min | Pre-merge only — per [`phase-5.md`'s Manual Smoke Check](../phase-5.md#manual-smoke-check) |

---

## Fake / Mock Implementations

### `FakeTourEngineContext` — replaces real engine context for unit tests

```ts
// packages/core/src/lib/tour-engine/__tests__/_helpers/fake-engine-context.ts

import { vi } from 'vitest'
import type { Tour, TourStep, RouterAdapter } from '../../../types'
import type { TourAction, TourReducerState } from '../../../types/tour-reducer'
import type { TourEngineContext } from '../../tour-engine/context'

export interface FakeEngineOverrides {
  state?: Partial<TourReducerState>
  currentTour?: Tour | null
  data?: Record<string, unknown>
  stepIdMap?: Map<string, number>
  router?: Partial<RouterAdapter>
  autoNavigate?: boolean
  maxHiddenChain?: number
  tourKitContext?: TourEngineContext['tourKitContext']
  onNavigationRequired?: TourEngineContext['onNavigationRequired']
  onStepError?: TourEngineContext['onStepError']
  abortSignal?: AbortSignal | null
}

export function createFakeEngineContext(overrides: FakeEngineOverrides = {}): {
  ctx: TourEngineContext
  mocks: {
    dispatch: ReturnType<typeof vi.fn>
    completeTour: ReturnType<typeof vi.fn>
    skipTour: ReturnType<typeof vi.fn>
    setData: ReturnType<typeof vi.fn>
    router: { navigate: ReturnType<typeof vi.fn>; getCurrentRoute: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> }
    onNavigationRequired: ReturnType<typeof vi.fn>
    onStepError: ReturnType<typeof vi.fn>
  }
  setState: (next: Partial<TourReducerState>) => void
} {
  // Mutable backing for getter semantics — proves refs/getters work, not snapshots
  let state: TourReducerState = {
    currentTourId: 't1',
    currentStepIndex: 0,
    isActive: true,
    transitioning: false,
    completedTourIds: [],
    skippedTourIds: [],
    ...overrides.state,
  } as TourReducerState

  let currentTour = overrides.currentTour ?? null
  let data = overrides.data ?? {}
  let stepIdMap = overrides.stepIdMap ?? new Map<string, number>()

  const dispatch = vi.fn<(action: TourAction) => void>()
  const completeTour = vi.fn<() => void>()
  const skipTour = vi.fn<() => void>()
  const setData = vi.fn<(key: string, value: unknown) => void>((k, v) => {
    data = { ...data, [k]: v }
  })

  const router = {
    navigate: vi.fn<(route: string) => Promise<boolean>>().mockResolvedValue(true),
    getCurrentRoute: vi.fn<() => string>(() => '/'),
    subscribe: vi.fn<() => () => void>(() => () => {}),
    ...overrides.router,
  }

  const onNavigationRequired = vi.fn<(route: string, stepId: string) => void>(
    overrides.onNavigationRequired ?? (() => {})
  )
  const onStepError = vi.fn<(err: Error) => void>(overrides.onStepError ?? (() => {}))

  const abortControllerRef = { current: null as AbortController | null }
  if (overrides.abortSignal) {
    abortControllerRef.current = new AbortController()
    if (overrides.abortSignal.aborted) abortControllerRef.current.abort()
  }

  const ctx: TourEngineContext = {
    getState: () => state,
    getCurrentTour: () => currentTour,
    getData: () => data,
    getStepIdMap: () => stepIdMap,
    dispatch,
    router: router as unknown as RouterAdapter,
    autoNavigate: overrides.autoNavigate ?? true,
    abortControllerRef,
    onNavigationRequired,
    onStepError,
    completeTour,
    skipTour,
    setData,
    tourKitContext: overrides.tourKitContext ?? null,
    maxHiddenChain: overrides.maxHiddenChain ?? 10,
  }

  return {
    ctx,
    mocks: { dispatch, completeTour, skipTour, setData, router, onNavigationRequired, onStepError },
    setState(next) {
      state = { ...state, ...next } as TourReducerState
    },
  }
}
```

**Matches real call:**
```ts
// Real:  navigateToStepImpl(engineContextRef.current, stepIndex)
// Fake:  navigateToStepImpl(createFakeEngineContext().ctx, stepIndex)
```

### `makeStep` and `makeTour` step factories

```ts
// packages/core/src/lib/tour-engine/__tests__/_helpers/make-tour.ts
import type { Tour, TourStep, VisibleTourStep, HiddenTourStep } from '../../../types'

export const visibleStep = (id: string, extras: Partial<VisibleTourStep> = {}): VisibleTourStep => ({
  id,
  target: '#x',
  content: 'hi',
  ...extras,
})

export const hiddenStep = (id: string, extras: Partial<HiddenTourStep> = {}): HiddenTourStep => ({
  id,
  kind: 'hidden',
  ...extras,
})

export const makeTour = (id: string, steps: TourStep[], extras: Partial<Tour> = {}): Tour => ({
  id,
  steps,
  ...extras,
})
```

---

## Test File List

```
packages/core/src/lib/tour-engine/                            # NEW directory
├── __tests__/
│   ├── _helpers/
│   │   ├── fake-engine-context.ts                            # NEW: FakeTourEngineContext factory + mock accessors
│   │   └── make-tour.ts                                      # NEW: visibleStep, hiddenStep, makeTour factories
│   ├── handle-branch-target.test.ts                          # NEW: 11 branch cases
│   ├── navigate-to-step.test.ts                              # NEW: 11 navigation cases
│   └── tour-engine-context.test.ts                           # NEW: refs/getters not snapshots; type tests for context shape
└── (source files written by implementation: context.ts, navigate-to-step.ts, handle-branch-target.ts)

packages/core/src/types/
└── tour-reducer.ts                                           # NEW source — types-only file; smoke-test via existing barrel-exports test

packages/core/src/__tests__/types/
└── tour-engine-context.test-d.ts                             # NEW: TourEngineContext uses getters and refs, not snapshot fields

packages/core/src/__tests__/lib/
└── provider-complexity-ignores.test.ts                       # NEW: source-grep, exactly 3 ignores remaining in tour-provider.tsx; 0 in tour-engine/*

# Existing provider integration tests — MUST PASS UNCHANGED (regression net)
packages/core/src/__tests__/context/
├── tour-provider-hidden.test.tsx                             # NO CHANGE
├── branching.test.tsx                                        # NO CHANGE
├── tour-provider-flow-session.test.tsx                       # NO CHANGE
├── tour-provider.test.tsx                                    # NO CHANGE
├── tour-autostart.test.tsx                                   # NO CHANGE
└── when-condition.test.tsx                                   # NO CHANGE

packages/core/src/context/__tests__/
└── test-bridge.test.tsx                                      # NO CHANGE
```

Every branch listed in [`phase-5.md`'s Steps 3 and 4](../phase-5.md#3-extract-handlebranchtarget-first) has at least one row in `handle-branch-target.test.ts` or `navigate-to-step.test.ts`.

---

## `conftest.ts` Equivalent — Vitest Setup Additions

**Additions to** the existing `packages/core/src/__tests__/setup.ts` and `packages/core/vitest.config.ts`. Do not replace.

Verify the `include` glob in `packages/core/vitest.config.ts:7` covers `src/lib/tour-engine/__tests__/**/*.test.ts`. The current pattern `src/**/*.{test,spec}.{ts,tsx}` should match — confirm by running `pnpm --filter @tour-kit/core test -- --reporter=verbose tour-engine` and checking the file is picked up.

No new CLI flags needed. The smoke check is manual (per `phase-5.md`'s Manual Smoke Check section).

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Engine tests use a FakeEngineContext, NOT a real `<TourProvider>` | Direct invocation: `await navigateToStepImpl(fakeCtx, 2)` | Direct tests catch closure-read bugs (the stale-closure risk in the register). Provider tests catch React wiring. Both are needed. |
| FakeEngineContext uses getters with mutable backing, not frozen snapshots | `getState: () => state` reads a mutable closure variable | Phase 5's stale-closure risk: if getters captured a snapshot, the test would pass while the real wiring would fail under async. Mutable backing proves freshness. |
| Existing provider tests stay UNCHANGED | List them explicitly in the test plan with "NO CHANGE" annotation | They are the regression net. Modifying them while extracting hides regressions. Per [`phase-5.md`'s Tests section](../phase-5.md#tests). |
| Source-grep complexity-ignore count | `readFileSync` + regex match count assertion | M5 gate: 5 → 3 ignores. Co-located so future PRs can't sneak ignores back in. |
| Test loop detection explicitly | Construct a tour where step A's branch target is A; assert `onStepError` called with loop error | Memory: loop detection is one of the named branches in [`phase-5.md`'s coverage list](../phase-5.md#3-extract-handlebranchtarget-first) |
| Test `maxHiddenChain` enforcement | Chain N+1 hidden steps where N = `maxHiddenChain`; assert termination via `dispatch` or `onStepError` | Hidden chain overflow is the highest-risk branch in `navigateToStep` per [`phase-5.md`'s navigate cases](../phase-5.md#4-extract-navigatetostep) |
| Test `routeChangeStrategy` switch matrix | Three sub-describes: `auto`, `manual`, `prompt` | Each strategy has distinct call paths through the router; one test per strategy catches mode-routing bugs early |
| Test abort mid-navigation | Set `abortControllerRef.current.abort()` before calling navigateToStepImpl; assert it short-circuits | Aborts come from unmount or tour-restart; not testing this risks half-completed navigations after teardown |
| Don't test cross-tour with full tourKitContext setup | Use a minimal `{ tours: new Map([...]) }` stub | The real `TourKitProvider` brings too much weight to unit tests; cross-tour navigation is a contract check, not a wiring check |
| Type-test the TourEngineContext interface | `expectTypeOf<TourEngineContext['getState']>().toEqualTypeOf<() => TourReducerState>()` | Prevents a future refactor from accidentally typing `state: TourReducerState` (a snapshot) instead of `getState: () => TourReducerState` |
| Phase 5a/5b split alignment | If split is taken, `handle-branch-target.test.ts` ships in 5a, `navigate-to-step.test.ts` ships in 5b | Each PR must be independently revertible — tests must travel with their target code |
| Use `expect.objectContaining` for dispatch assertions | `expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'GO_TO_STEP', payload: expect.objectContaining({ stepIndex: 2 }) }))` | TourAction has many fields; exact-match assertions break on additive payload changes; objectContaining catches the intent |

---

## Example Test Case

```ts
// packages/core/src/lib/tour-engine/__tests__/handle-branch-target.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleBranchTargetImpl } from '../handle-branch-target'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { hiddenStep, makeTour, visibleStep } from './_helpers/make-tour'

describe('handleBranchTargetImpl', () => {
  describe('null target', () => {
    it('clears the transitioning flag and returns', async () => {
      const { ctx, mocks } = createFakeEngineContext({
        state: { transitioning: true } as any,
      })

      await handleBranchTargetImpl(ctx, null)

      expect(mocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringMatching(/SET_TRANSITIONING|CLEAR_TRANSITIONING/) })
      )
    })
  })

  describe('terminal targets', () => {
    it('"complete" calls completeTour exactly once', async () => {
      const { ctx, mocks } = createFakeEngineContext()
      await handleBranchTargetImpl(ctx, 'complete')
      expect(mocks.completeTour).toHaveBeenCalledTimes(1)
      expect(mocks.skipTour).not.toHaveBeenCalled()
    })

    it('"skip" calls skipTour exactly once', async () => {
      const { ctx, mocks } = createFakeEngineContext()
      await handleBranchTargetImpl(ctx, 'skip')
      expect(mocks.skipTour).toHaveBeenCalledTimes(1)
      expect(mocks.completeTour).not.toHaveBeenCalled()
    })

    it('"restart" dispatches RESTART_TOUR', async () => {
      const { ctx, mocks } = createFakeEngineContext()
      await handleBranchTargetImpl(ctx, 'restart')
      expect(mocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringMatching(/RESTART|GO_TO_STEP/) })
      )
    })
  })

  describe('cross-tour branch', () => {
    it('missing target tour → onStepError', async () => {
      const { ctx, mocks } = createFakeEngineContext({
        tourKitContext: { tours: new Map(), getTour: () => null } as any,
      })

      await handleBranchTargetImpl(ctx, { tourId: 'does-not-exist' })

      expect(mocks.onStepError).toHaveBeenCalledTimes(1)
    })

    it('named step in target tour → triggers cross-tour navigation', async () => {
      const targetTour = makeTour('t2', [visibleStep('step-x'), visibleStep('step-y')])
      const { ctx, mocks } = createFakeEngineContext({
        tourKitContext: {
          tours: new Map([['t2', targetTour]]),
          getTour: (id: string) => (id === 't2' ? targetTour : null),
        } as any,
      })

      await handleBranchTargetImpl(ctx, { tourId: 't2', stepId: 'step-y' })

      // The exact dispatch shape depends on implementation; assert SOMETHING dispatched
      // and that onStepError was NOT called
      expect(mocks.onStepError).not.toHaveBeenCalled()
      expect(mocks.dispatch).toHaveBeenCalled()
    })
  })

  describe('loop detection', () => {
    it('target that would loop back to current step → onStepError', async () => {
      const tour = makeTour('t1', [
        visibleStep('a', { branch: { target: 'a' } as any }),
      ])
      const { ctx, mocks, setState } = createFakeEngineContext({
        currentTour: tour,
        state: { currentTourId: 't1', currentStepIndex: 0 } as any,
        stepIdMap: new Map([['a', 0]]),
      })

      await handleBranchTargetImpl(ctx, { stepId: 'a' })

      expect(mocks.onStepError).toHaveBeenCalledTimes(1)
      const err = mocks.onStepError.mock.calls[0]?.[0]
      expect(String(err)).toMatch(/loop/i)
    })
  })

  describe('when-condition false', () => {
    it('target.when returns false AND next visible step exists → advance to next visible', async () => {
      const tour = makeTour('t1', [
        visibleStep('current'),
        visibleStep('target', { when: () => false } as any),
        visibleStep('next-visible'),
      ])
      const { ctx, mocks } = createFakeEngineContext({
        currentTour: tour,
        state: { currentTourId: 't1', currentStepIndex: 0 } as any,
        stepIdMap: new Map([['current', 0], ['target', 1], ['next-visible', 2]]),
      })

      await handleBranchTargetImpl(ctx, { stepId: 'target' })

      expect(mocks.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringMatching(/GO_TO_STEP/),
          payload: expect.objectContaining({ stepIndex: 2 }),
        })
      )
    })

    it('target.when returns false AND no visible step exists → completeTour', async () => {
      const tour = makeTour('t1', [
        visibleStep('current'),
        visibleStep('target', { when: () => false } as any),
        hiddenStep('h1'),
      ])
      const { ctx, mocks } = createFakeEngineContext({
        currentTour: tour,
        state: { currentTourId: 't1', currentStepIndex: 0 } as any,
        stepIdMap: new Map([['current', 0], ['target', 1], ['h1', 2]]),
      })

      await handleBranchTargetImpl(ctx, { stepId: 'target' })

      expect(mocks.completeTour).toHaveBeenCalledTimes(1)
    })
  })

  describe('stale closure regression (US-5)', () => {
    it('reads the CURRENT state after a setState mutation, not the initial snapshot', async () => {
      const tour = makeTour('t1', [visibleStep('a'), visibleStep('b')])
      const { ctx, setState } = createFakeEngineContext({
        currentTour: tour,
        state: { currentTourId: 't1', currentStepIndex: 0 } as any,
      })

      // Simulate an async navigation that mutates state mid-flight
      setState({ currentStepIndex: 1 } as any)

      // The next getState() call inside the engine should see index 1
      expect(ctx.getState().currentStepIndex).toBe(1)
    })
  })
})

// ─── Companion: source-grep gate ─────────────────────────────────────────────
// packages/core/src/__tests__/lib/provider-complexity-ignores.test.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Phase 5 — provider complexity ignores (M5 gate)', () => {
  it('provider has exactly 3 noExcessiveCognitiveComplexity ignores', () => {
    const src = readFileSync(
      resolve(__dirname, '../../context/tour-provider.tsx'),
      'utf-8'
    )
    const matches = src.match(/noExcessiveCognitiveComplexity/g) ?? []
    expect(matches.length).toBe(3)
  })

  it('extracted engine files have ZERO complexity ignores', () => {
    const engineFiles = [
      '../../lib/tour-engine/context.ts',
      '../../lib/tour-engine/navigate-to-step.ts',
      '../../lib/tour-engine/handle-branch-target.ts',
    ]
    for (const file of engineFiles) {
      const src = readFileSync(resolve(__dirname, file), 'utf-8')
      const matches = src.match(/noExcessiveCognitiveComplexity/g) ?? []
      expect(matches.length, `${file} should have 0 ignores`).toBe(0)
    }
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session:

---
You are writing the complete test suite for Phase 5 of the **Tour Kit Refactor Train** — TourProvider Navigation Extraction.

### What This Project Is
`@tour-kit/core`'s `TourProvider` (`packages/core/src/context/tour-provider.tsx`, currently 1802 LOC) is the largest, riskiest file in the monorepo. It has 5 `noExcessiveCognitiveComplexity` ignores covering reducer, flow restore, `navigateToStep`, `handleBranchTarget`, and `prev`. Phase 5 extracts ONLY `navigateToStep` and `handleBranchTarget` into `packages/core/src/lib/tour-engine/`, leaving reducer/flow-restore/`prev` for a later phase. Target: 5 ignores → 3.

The high risk is **stale-closure reads**: the extracted functions must read fresh state across async boundaries, so the new `TourEngineContext` uses getters and refs, not snapshot fields.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | `handleBranchTarget` covers 11 branch cases identically | handle-branch-target.test.ts | Each case asserts expected dispatch + callback calls |
| US-2 | `navigateToStep` covers 11 navigation cases identically | navigate-to-step.test.ts | Each routeChangeStrategy asserts router calls; abort short-circuits; maxHiddenChain enforced |
| US-3 | Existing provider tests pass UNCHANGED | listed below | `pnpm --filter @tour-kit/core test` exits 0; 5 listed files have no diff |
| US-4 | Provider has exactly 3 complexity ignores | provider-complexity-ignores.test.ts | `rg` returns 3 matches; engine files have 0 matches |
| US-5 | Engine context uses getters/refs, not snapshots | tour-engine-context.test.ts + .test-d.ts | mutated state visible on next `getState()` call; type is `() => State`, not `State` |

### Why Fakes Are Required
The real engine context is built inside `TourProvider` via `React.useRef` + `React.useEffect`. Unit-testing the extracted functions through `<TourProvider>` would be slow (full React render), brittle (jsdom interactions), and would hide the stale-closure risk. A `FakeTourEngineContext` factory:
- Satisfies the full `TourEngineContext` interface
- Uses mutable backing variables under getter functions (proves refs/getters work, not snapshots)
- Returns the context + a `mocks` accessor for asserting `dispatch`/`completeTour`/`skipTour`/`onStepError`/`router.navigate`
- Returns a `setState` mutator to simulate async state changes between calls

### What NOT to Test
- Don't re-test reducer, flow restore, or `prev` — they stay in provider; existing tests cover them.
- Don't modify any of these provider integration files. They are the regression net:
  - `packages/core/src/__tests__/context/tour-provider-hidden.test.tsx`
  - `packages/core/src/__tests__/context/branching.test.tsx`
  - `packages/core/src/__tests__/context/tour-provider-flow-session.test.tsx`
  - `packages/core/src/__tests__/context/tour-provider.test.tsx`
  - `packages/core/src/context/__tests__/test-bridge.test.tsx`
- Don't write E2E tests — the manual smoke flow in `phase-5.md`'s Manual Smoke Check covers that.
- Don't mount `<TourKitProvider>` in engine unit tests — pass a minimal `tourKitContext` stub instead.
- Don't assert exact `TourAction` payloads — use `expect.objectContaining` (TourAction has many fields).
- Don't add complexity ignores to the new engine files. If they need one, the extraction wasn't deep enough — per [`phase-5.md`'s step 5](../phase-5.md#5-remove-provider-complexity-ignores).

### Critical: Fake Engine Context Factory

```ts
// packages/core/src/lib/tour-engine/__tests__/_helpers/fake-engine-context.ts

import { vi } from 'vitest'
import type { Tour, RouterAdapter } from '../../../types'
import type { TourAction, TourReducerState } from '../../../types/tour-reducer'
import type { TourEngineContext } from '../../tour-engine/context'

export interface FakeEngineOverrides {
  state?: Partial<TourReducerState>
  currentTour?: Tour | null
  data?: Record<string, unknown>
  stepIdMap?: Map<string, number>
  router?: Partial<RouterAdapter>
  autoNavigate?: boolean
  maxHiddenChain?: number
  tourKitContext?: TourEngineContext['tourKitContext']
  onNavigationRequired?: TourEngineContext['onNavigationRequired']
  onStepError?: TourEngineContext['onStepError']
  abortSignal?: AbortSignal | null
}

export function createFakeEngineContext(overrides: FakeEngineOverrides = {}) {
  let state: TourReducerState = {
    currentTourId: 't1',
    currentStepIndex: 0,
    isActive: true,
    transitioning: false,
    completedTourIds: [],
    skippedTourIds: [],
    ...overrides.state,
  } as TourReducerState

  let currentTour = overrides.currentTour ?? null
  let data = overrides.data ?? {}
  let stepIdMap = overrides.stepIdMap ?? new Map<string, number>()

  const dispatch = vi.fn<(action: TourAction) => void>()
  const completeTour = vi.fn<() => void>()
  const skipTour = vi.fn<() => void>()
  const setData = vi.fn<(k: string, v: unknown) => void>((k, v) => {
    data = { ...data, [k]: v }
  })

  const router = {
    navigate: vi.fn<(route: string) => Promise<boolean>>().mockResolvedValue(true),
    getCurrentRoute: vi.fn<() => string>(() => '/'),
    subscribe: vi.fn<() => () => void>(() => () => {}),
    ...overrides.router,
  }

  const onNavigationRequired = vi.fn(overrides.onNavigationRequired ?? (() => {}))
  const onStepError = vi.fn(overrides.onStepError ?? (() => {}))

  const abortControllerRef = { current: null as AbortController | null }
  if (overrides.abortSignal) {
    abortControllerRef.current = new AbortController()
    if (overrides.abortSignal.aborted) abortControllerRef.current.abort()
  }

  const ctx: TourEngineContext = {
    getState: () => state,
    getCurrentTour: () => currentTour,
    getData: () => data,
    getStepIdMap: () => stepIdMap,
    dispatch,
    router: router as unknown as RouterAdapter,
    autoNavigate: overrides.autoNavigate ?? true,
    abortControllerRef,
    onNavigationRequired,
    onStepError,
    completeTour,
    skipTour,
    setData,
    tourKitContext: overrides.tourKitContext ?? null,
    maxHiddenChain: overrides.maxHiddenChain ?? 10,
  }

  return {
    ctx,
    mocks: { dispatch, completeTour, skipTour, setData, router, onNavigationRequired, onStepError },
    setState(next: Partial<TourReducerState>) {
      state = { ...state, ...next } as TourReducerState
    },
  }
}
```

### Test Files to Create

```
packages/core/src/lib/tour-engine/__tests__/
├── _helpers/
│   ├── fake-engine-context.ts                # NEW — paste full content above
│   └── make-tour.ts                          # NEW — step factories
├── handle-branch-target.test.ts              # NEW — 11 named branch cases
├── navigate-to-step.test.ts                  # NEW — 11 named navigation cases
└── tour-engine-context.test.ts               # NEW — refs/getters not snapshots; stale-closure regression

packages/core/src/__tests__/types/
└── tour-engine-context.test-d.ts             # NEW — type-level assertions on context shape

packages/core/src/__tests__/lib/
└── provider-complexity-ignores.test.ts       # NEW — source-grep M5 gate
```

### Per-File Coverage Guidance

#### `handle-branch-target.test.ts` — 11 cases (one per [`phase-5.md`'s step 3 list](../phase-5.md#3-extract-handlebranchtarget-first))
Group as `describe` blocks:
1. `describe('null target')` — clears transitioning, returns
2. `describe('terminal targets')` — "complete", "skip", "restart"
3. `describe('cross-tour branch')` — missing target tour → onStepError; named step in target tour → cross-tour dispatch
4. `describe('BranchWait')` — with `then` chain
5. `describe('current-index target')` — resolves to current index → no-op or specific handling
6. `describe('loop detection')` — branch target = current step
7. `describe('when-condition false')` — next visible step exists → advance; no visible → completeTour
8. `describe('successful target navigation')` — tracks step view; calls onStepChange (assert via dispatch action)
9. `describe('stale closure regression (US-5)')` — setState mutation visible on next getState call

#### `navigate-to-step.test.ts` — 11 cases (one per [`phase-5.md`'s step 4 list](../phase-5.md#4-extract-navigatetostep))
Group as `describe` blocks:
1. `describe('no current tour')` — early return
2. `describe('visible step without route')` — direct dispatch GO_TO_STEP
3. `describe('autoNavigate: false')` — emits onNavigationRequired, no router.navigate
4. `describe('routeChangeStrategy: "manual"')` — onNavigationRequired called
5. `describe('routeChangeStrategy: "prompt"')` — assert behavior matches existing impl (read the source first if unclear)
6. `describe('routeChangeStrategy: "auto"')` — router.navigate called; success path
7. `describe('router returns false')` — graceful failure path
8. `describe('waitForStepTarget throws TourRouteError')` — onStepError called with the error
9. `describe('abort signal already aborted')` — short-circuit, no dispatch
10. `describe('hidden step without branch')` — advance to next index
11. `describe('hidden chain enforcement')` — chain of N+1 hidden steps where N = maxHiddenChain → termination

#### `tour-engine-context.test.ts`
- `getState()` reflects post-setState mutations (the stale-closure regression test)
- `getCurrentTour()` reflects mutations between calls
- `abortControllerRef.current.abort()` makes the signal `aborted: true` on the same ref

#### `tour-engine-context.test-d.ts`
```ts
import { expectTypeOf } from 'vitest'
import type { TourEngineContext } from '../../lib/tour-engine/context'
import type { TourReducerState } from '../../types/tour-reducer'

expectTypeOf<TourEngineContext['getState']>().toEqualTypeOf<() => TourReducerState>()
expectTypeOf<TourEngineContext['getCurrentTour']>().returns.toBeObject() // or null
// @ts-expect-error — would-be snapshot field; not allowed
type _BadShape = TourEngineContext extends { state: TourReducerState } ? true : never
```

#### `provider-complexity-ignores.test.ts`
- `readFileSync` `tour-provider.tsx`; match count of `noExcessiveCognitiveComplexity` MUST equal 3
- Iterate over the three engine files; each must have 0 matches

### Data Model Notes
- `TourAction` and `TourReducerState` should be imported from `packages/core/src/types/tour-reducer.ts` (new file Phase 5 creates)
- `expect.objectContaining` for dispatch assertions — payloads are wide and may add fields later
- For `abortControllerRef`, use a real `AbortController` so `.signal.aborted` toggles naturally
- The Phase 5a/5b split (per [`phase-5.md`'s Cut Point](../phase-5.md#cut-point)): if taken, ship `handle-branch-target.test.ts` in 5a, `navigate-to-step.test.ts` in 5b. Each PR must independently revert.

### Success Criteria
- `pnpm --filter @tour-kit/core test` exits 0 (engine tests + unchanged provider tests)
- `pnpm --filter @tour-kit/core typecheck` exits 0
- `pnpm --filter @tour-kit/react test` exits 0
- `pnpm typecheck` exits 0
- `pnpm build` exits 0
- `pnpm lint` exits 0
- `wc -l packages/core/src/context/tour-provider.tsx` reports materially fewer lines than 1802
- `rg -n "noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx` returns 3 lines (reducer, flow restore, `prev`)
- `rg -n "noExcessiveCognitiveComplexity" packages/core/src/lib/tour-engine/` returns 0 lines
- The 5 listed existing provider test files have NO diff in this PR
- Manual smoke (per [`phase-5.md`'s Manual Smoke Check](../phase-5.md#manual-smoke-check)) passes the 6 flows

### Expected File Structure at End
```
packages/core/src/
├── context/
│   └── tour-provider.tsx                                  (thinner; 3 complexity ignores)
├── types/
│   └── tour-reducer.ts                                    (NEW; types-only)
└── lib/
    └── tour-engine/                                       (NEW directory)
        ├── context.ts
        ├── navigate-to-step.ts
        ├── handle-branch-target.ts
        └── __tests__/
            ├── _helpers/
            │   ├── fake-engine-context.ts
            │   └── make-tour.ts
            ├── handle-branch-target.test.ts
            ├── navigate-to-step.test.ts
            └── tour-engine-context.test.ts
```
---

---

## Run Commands

```bash
# Engine-only fast feedback loop (the new tests)
pnpm --filter @tour-kit/core test -- tour-engine

# Single branch case
pnpm --filter @tour-kit/core test -- -t "loop detection"
pnpm --filter @tour-kit/core test -- -t "hidden chain enforcement"
pnpm --filter @tour-kit/core test -- -t "stale closure regression"

# Source-grep gate alone
pnpm --filter @tour-kit/core test -- provider-complexity-ignores

# The regression net (existing provider tests, MUST PASS unchanged)
pnpm --filter @tour-kit/core test -- tour-provider-hidden
pnpm --filter @tour-kit/core test -- branching
pnpm --filter @tour-kit/core test -- tour-provider-flow-session
pnpm --filter @tour-kit/core test -- tour-provider.test
pnpm --filter @tour-kit/core test -- test-bridge

# Full package
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/core typecheck

# Type tests (engine context shape)
pnpm --filter @tour-kit/core typecheck:types

# Pre-merge gates (mirrors phase-5.md Validation Gates)
wc -l packages/core/src/context/tour-provider.tsx
rg -n "noExcessiveCognitiveComplexity" packages/core/src/context/tour-provider.tsx
rg -n "noExcessiveCognitiveComplexity" packages/core/src/lib/tour-engine/
pnpm test
pnpm typecheck
pnpm build
pnpm lint

# Manual smoke (read phase-5.md Manual Smoke Check before running)
pnpm --filter dashboard-next dev
```
