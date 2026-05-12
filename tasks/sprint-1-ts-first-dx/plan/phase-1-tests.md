# Phase 1 — Testing: Type-Safe Step IDs (#34)

**Scope:** Generic `TourStep<TId>`, `Tour<TStep>`, `TourActions<TStep>`, `TourContextValue<TStep>`, `useTour<TStep>()`, `useTour().goToStep` exposed top-level (parity fix vs imperative ref), `StepIdOf<typeof steps>` helper. Optional `createTour` (Option B).
**Key Pattern:** Pure-types phase — the change is type-only; runtime tests cover nothing new. The contract is split between (1) `.test-d.ts` fixtures running through Phase 0's `typecheck:types` harness and (2) downstream typecheck commands proving no consumer broke.
**Dependencies:** `typescript@^5.9.3` (uses `const` generics, `satisfies`, indexed access — all stable). No new runtime deps.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a developer with const-authored tours, I want `goToStep('biling')` to fail to compile so I catch typos before runtime | `step-id-narrowing.test-d.ts` const-tuple fixture with `@ts-expect-error` on misspelled ID | `pnpm --filter @tour-kit/core typecheck:types` exits 0 with the line present; exits non-zero after removing it |
| US-2 | As a developer with server-fetched tours, I want `Tour` without a generic arg to keep accepting `string` step IDs so I don't have to rewrite my code | `step-id-dynamic.test-d.ts` dynamic-steps fixture | `pnpm --filter @tour-kit/core typecheck:types` exits 0; no `@ts-expect-error` needed because the type widens naturally |
| US-3 | As a developer, I want `useTour().goToStep('id')` (no `.actions.` prefix) so the hook matches the spec docs | `use-tour-go-to-step.test-d.ts` calls `useTour<...>().goToStep(...)` directly | Compiles; `useTour().actions` is no longer required for this method |
| US-4 | As a downstream package author (react/adoption/hints), I want my existing code to keep compiling so generics-widening is non-breaking | Each filter package's `typecheck` script | `pnpm --filter @tour-kit/{react,adoption,hints} typecheck` all exit 0 with zero source edits |
| US-5 | As a Phase 5 implementer, I want `useTour().goToStep` to exist so my testing-library `goToStep(id)` helper has something to wire to | Smoke runtime test renders provider, asserts hook surface | `useTour().goToStep` is `typeof === 'function'`; no thrown error when called with a known ID |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `TourStep<TId>` / `StepIdOf<...>` | No mock — assert in `.test-d.ts` via assignability + `@ts-expect-error` | `StepIdOf<typeof steps>` resolves to `'welcome' \| 'pricing'`; `'biling'` assignment fails | US-1 |
| `Tour<TStep>` default-widening | No mock — `Tour = { id, steps: TourStep[] }` literal assigned without generic | Compiles with no edits | US-2 |
| `useTour().goToStep` (top-level surface) | Real provider + RTL `renderHook` | `result.current.goToStep` is a function; calling with a valid id doesn't throw; calling with an invalid id has compile error in a `.test-d.ts` peer | US-3, US-5 |
| `useTour().startTour(tourId, stepId)` | `.test-d.ts` with explicit step-id literal | Narrowed `stepId` rejects unknown literals; widens with default `<TId = string>` | US-1 |
| Downstream consumers (`@tour-kit/react`, `@tour-kit/adoption`, `@tour-kit/hints`) | No mock — run each package's own `typecheck` | Exit 0; no source edits required | US-4 |
| Optional `createTour` (Option B) | If Option A shipped → no test; if Option B shipped → `.test-d.ts` proving const-tuple inference | `createTour({ id, steps: [...] as const })` narrows `TStep['id']` | US-1 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Type-test | `typescript`, `tsconfig.type-tests.json` from Phase 0 | <3s | Every push; gates the PR |
| Runtime smoke | `vitest`, `@testing-library/react`, real `TourProvider` | <2s | Every push |
| Cross-package compile gate | `tsc --noEmit` on `@tour-kit/{react,adoption,hints}` | <8s combined | Every push — proves the default param is back-compat |

No integration / E2E tier — type changes don't need them.

---

## Fake / Mock Implementations

**No fakes needed (Pure-Types Phase).** All assertions are either compile-time (via `.test-d.ts` and `tsc --noEmit`) or one runtime smoke that exercises the real `TourProvider` + `useTour()` hook. The Phase 0 harness already provides everything.

The one runtime helper is a tiny test-only tour fixture in `src/__tests__/_fixtures.ts`:

```ts
// packages/core/src/__tests__/_fixtures.ts (add if absent)
import type { Tour } from '../types/tour'
export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}
```

Re-use across this phase's runtime tests AND Phase 3+ tests that need a known tour shape.

---

## Test File List

```
packages/core/src/__tests__/types/
├── step-id-narrowing.test-d.ts          # const-tuple narrowing; @ts-expect-error on misspelling; StepIdOf<typeof steps>
├── step-id-dynamic.test-d.ts            # dynamic JSON.parse() steps → Tour without generic arg compiles
├── use-tour-go-to-step.test-d.ts        # useTour<TourStep<'a'|'b'>>(); .goToStep('a') ok; 'c' @ts-expect-error
├── start-tour-step-id.test-d.ts         # startTour(tourId, stepId?) narrowing mirrors goToStep
└── tour-callback-step.test-d.ts         # onStepChange callback receives narrowed TStep

packages/core/src/__tests__/hooks/
└── use-tour-surface.test.tsx            # Runtime: useTour() exposes goToStep top-level; calling it doesn't throw

packages/core/src/__tests__/_fixtures.ts # twoStepTour reusable fixture
```

All five `.test-d.ts` files live under `src/__tests__/types/` so Phase 0's `tsconfig.type-tests.json#include` already picks them up via `src/**/*.test-d.ts`.

Cross-package compile gates (NOT new files — existing scripts):
- `pnpm --filter @tour-kit/react typecheck`
- `pnpm --filter @tour-kit/adoption typecheck`
- `pnpm --filter @tour-kit/hints typecheck`

---

## `setup` / Fixtures Structure

**Additions to existing setup at `packages/core/src/__tests__/setup.ts`** — no changes needed. The existing jsdom setup (ResizeObserver, matchMedia, scrollTo, offsetParent) covers the one runtime test.

Add `_fixtures.ts` next to it:

```ts
// packages/core/src/__tests__/_fixtures.ts (new — shared across runtime suites)
import type { Tour, TourStep } from '../types'

export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}

// Narrowed-ID variant for runtime + type assertions
export type DemoStepId = 'welcome' | 'pricing'
export const twoStepTourTyped: Tour<TourStep<DemoStepId>> = twoStepTour as Tour<TourStep<DemoStepId>>
```

No new pytest_addoption / vitest CLI flag — every assertion runs on the default test command.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Type tests use `.test-d.ts` + native `tsc --noEmit`, not `expect-type` | Re-use Phase 0 harness | Zero new deps; harness self-check (US-1 mutation) catches drift |
| One `@ts-expect-error` per file, on the SAME LINE as the broken assertion | Inline | If the comment ends up on the wrong line after a refactor, the harness will flag it — comments survive parsers; line-relative directives don't |
| Don't write a runtime "goToStep advances the step" test in this phase | Defer to existing tour-card test or Phase 5 | Phase 1 is type-only; behavior testing belongs where the action runs |
| Smoke test asserts `typeof goToStep === 'function'`, not behavior | `renderHook` + shallow surface check | Phase 5's testing-library suite asserts behavior end-to-end against real `<TourCard>` |
| Cross-package typecheck gates are PART of the test plan | Listed in run commands AND CI | Default-param widening is "non-breaking" ONLY if every downstream package agrees — exercise that, don't trust it |
| `_fixtures.ts` is shared infrastructure, not a phase artifact | Created here, consumed in Phase 3/5/6 | Reduces churn — Phase 3's `diagnostic.test.ts` and Phase 6's `test-bridge.test.tsx` already need `twoStepTour` |
| If Phase 1 ships Option B (`createTour`), add a single `.test-d.ts` covering const-generic inference | Defer until the call is made | Avoid speculative tests for an API that may not ship |

---

## Example Test Case

```ts
// packages/core/src/__tests__/types/step-id-narrowing.test-d.ts
import type { Tour, TourStep, StepIdOf } from '@tour-kit/core'

// Const-tuple authoring — the canonical narrowing pattern from spec §2.2.2
const steps = [
  { id: 'welcome', target: '#a', content: 'a' },
  { id: 'pricing', target: '#b', content: 'b' },
] as const satisfies ReadonlyArray<TourStep>

type Ids = StepIdOf<typeof steps>            // expect: 'welcome' | 'pricing'

const ok: Ids = 'welcome'                     // ok
// @ts-expect-error misspelling — removing this line MUST break typecheck:types
const bad: Ids = 'biling'
void ok; void bad

// Reverse direction: assignability check confirming the union is exactly two members
declare const onlyTwo: Ids
const _w: 'welcome' | 'pricing' = onlyTwo
void _w
```

```ts
// packages/core/src/__tests__/types/use-tour-go-to-step.test-d.ts
import { useTour } from '@tour-kit/core'
import type { TourStep } from '@tour-kit/core'

// Narrowed-id generic instantiation
type Steps = readonly [TourStep<'welcome'>, TourStep<'pricing'>]

declare const tour: ReturnType<typeof useTour<Steps[number]>>

tour.goToStep('welcome')         // ok — literal in union
tour.goToStep('pricing')         // ok
// @ts-expect-error not assignable to 'welcome' | 'pricing'
tour.goToStep('biling')

// Default-widening path — no generic arg
declare const dynamicTour: ReturnType<typeof useTour>
dynamicTour.goToStep('anything-goes')  // ok — TStep defaults to TourStep<string>
```

```tsx
// packages/core/src/__tests__/hooks/use-tour-surface.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import { twoStepTour } from '../_fixtures'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TourProvider tours={[twoStepTour]}>{children}</TourProvider>
)

describe('useTour() surface — Phase 1 parity fix', () => {
  it('exposes goToStep at the top level (no .actions prefix)', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(typeof result.current.goToStep).toBe('function')
  })

  it('exposes startTour at the top level', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(typeof result.current.startTour).toBe('function')
  })

  it('calling goToStep with a known id does not throw', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(() => result.current.goToStep('welcome')).not.toThrow()
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 1 of Tour Kit's Sprint 1 — Type-Safe Step IDs (issue #34).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo (pnpm + Turborepo + Vitest). `@tour-kit/core` holds the framework-agnostic types and hooks; `@tour-kit/react`/`@tour-kit/adoption`/`@tour-kit/hints` consume them. Sprint 1 marketing says "TS-first" — Phase 1 makes the compiler back the claim by adding a generic `TId extends string = string` to `TourStep`, propagating it through `Tour`/`TourActions`/`useTour`, and surfacing `goToStep` at the top level of `useTour()`.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | `goToStep('biling')` fails compile when steps are const-authored | `.test-d.ts` with `@ts-expect-error` on misspelling | typecheck:types passes; removing the line breaks it |
| US-2 | Dynamic `Tour` (no generic arg) still compiles | `step-id-dynamic.test-d.ts` | typecheck:types passes |
| US-3 | `useTour().goToStep('id')` is top-level | runtime smoke + `.test-d.ts` | `typeof === 'function'`; no throw |
| US-4 | Existing react/adoption/hints code compiles unchanged | each package's `typecheck` | all exit 0 |
| US-5 | `goToStep` exists so Phase 5 can wire to it | runtime smoke | `result.current.goToStep` defined |

### Why Fakes Are Required
**None.** This is a pure-types phase. `.test-d.ts` files run through Phase 0's `typecheck:types` harness. The one runtime smoke uses the real `TourProvider` and `useTour()` — there is no heavy dependency to fake.

### What NOT to Test
- Don't test `goToStep` *behavior* (advancing the step, firing callbacks) — that's existing tour-card / Phase 5 territory.
- Don't add `tsd` or `expect-type` — the native `tsc --noEmit` harness is the contract.
- Don't write tests for `onStart`/`onComplete`/`onSkip` callbacks — they take `TourCallbackContext`, NOT a step; Phase 1 doesn't touch them.
- Don't test `Option B` `createTour` unless Task 1.4 actually shipped it (check `packages/core/src/utils/create-tour.ts` exists).
- Don't validate at runtime that misspelled IDs are caught — that's the type system's job; the runtime correctly accepts any string.

### Critical: Fake Implementations

No fakes. Add one shared fixture file:

```ts
// packages/core/src/__tests__/_fixtures.ts
import type { Tour, TourStep } from '../types'

export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}

export type DemoStepId = 'welcome' | 'pricing'
export const twoStepTourTyped: Tour<TourStep<DemoStepId>> = twoStepTour as Tour<TourStep<DemoStepId>>
```

### Test Files to Create

```
packages/core/src/__tests__/
├── _fixtures.ts                                  # shared twoStepTour
├── types/
│   ├── step-id-narrowing.test-d.ts               # US-1
│   ├── step-id-dynamic.test-d.ts                 # US-2
│   ├── use-tour-go-to-step.test-d.ts             # US-1 + US-3 type side
│   ├── start-tour-step-id.test-d.ts              # mirror of goToStep
│   └── tour-callback-step.test-d.ts              # onStepChange receives narrowed TStep
└── hooks/
    └── use-tour-surface.test.tsx                 # US-3 + US-5 runtime
```

### Per-File Coverage Guidance

#### `types/step-id-narrowing.test-d.ts`
Const-tuple of two steps with `as const satisfies ReadonlyArray<TourStep>`. Assert `StepIdOf<typeof steps>` is exactly `'welcome' | 'pricing'` via a reverse-assignability check. One `@ts-expect-error` line on a misspelled id assignment. Comment block at the top: "Removing the @ts-expect-error MUST break typecheck:types."

#### `types/step-id-dynamic.test-d.ts`
`const dynamicSteps: TourStep[] = JSON.parse('[]')`. Assign to `const dynamic: Tour = { id: 'd', steps: dynamicSteps }`. Must compile because of the default `TStep = TourStep` param. Add a second assertion: `const widened: Tour<TourStep<string>> = dynamic` — proves the explicit-widening escape hatch.

#### `types/use-tour-go-to-step.test-d.ts`
`declare const tour: ReturnType<typeof useTour<TourStep<'welcome' | 'pricing'>>>`. Call `tour.goToStep('welcome')` ok; `tour.goToStep('biling')` with `@ts-expect-error`. Then the default-widening path: `declare const dyn: ReturnType<typeof useTour>` and `dyn.goToStep('anything-goes')` — must compile without an error.

#### `types/start-tour-step-id.test-d.ts`
Mirror of the goToStep test but for `startTour(tourId, stepId?)`. Include both: stepId omitted (always ok), stepId valid literal (ok), stepId invalid literal (`@ts-expect-error`).

#### `types/tour-callback-step.test-d.ts`
Construct a `Tour<TourStep<'a' | 'b'>>` literal with an `onStepChange` callback that destructures `(step) => step.id`. Assert `step.id` is `'a' | 'b'`, not `string`. Add a `@ts-expect-error` line: `const wrong: 'c' = step.id`.

#### `hooks/use-tour-surface.test.tsx`
Runtime suite. `renderHook` wrapped in `<TourProvider tours={[twoStepTour]}>`. Three cases:
- `typeof result.current.goToStep === 'function'`
- `typeof result.current.startTour === 'function'`
- `() => result.current.goToStep('welcome')` does not throw

If `useTour()` currently nests `goToStep` under `actions`, this test FAILS — which is the whole point. The implementation must add the top-level alias.

### Data Model Notes
- `TourStep<TId extends string = string>` — default makes existing `TourStep` calls back-compat
- `StepIdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id']` — indexed-access type
- `Tour<TStep extends TourStep = TourStep>` — default makes existing `Tour` calls back-compat
- `useTour<TStep extends TourStep = TourStep>()` — returns object with top-level `goToStep` and `startTour`

### Success Criteria
- `pnpm --filter @tour-kit/core typecheck:types` exits 0 with five new `.test-d.ts` files present.
- Manually remove ONE `@ts-expect-error` line from any of the five files — typecheck:types MUST exit non-zero. Restore.
- `pnpm --filter @tour-kit/core test -- use-tour-surface` exits 0; three cases pass.
- `pnpm --filter @tour-kit/react typecheck` exits 0 with ZERO source edits in `@tour-kit/react/src/`.
- `pnpm --filter @tour-kit/adoption typecheck` exits 0 with ZERO source edits.
- `pnpm --filter @tour-kit/hints typecheck` exits 0 with ZERO source edits.

### Expected File Structure at End
```
packages/core/src/__tests__/
├── _fixtures.ts
├── types/
│   ├── step-id-narrowing.test-d.ts
│   ├── step-id-dynamic.test-d.ts
│   ├── use-tour-go-to-step.test-d.ts
│   ├── start-tour-step-id.test-d.ts
│   └── tour-callback-step.test-d.ts
└── hooks/
    └── use-tour-surface.test.tsx
```
---

---

## Run Commands

```bash
# All Phase 1 type tests
pnpm --filter @tour-kit/core typecheck:types

# Runtime smoke for useTour() surface
pnpm --filter @tour-kit/core test -- use-tour-surface

# Cross-package back-compat gates (US-4)
pnpm --filter @tour-kit/react typecheck && \
  pnpm --filter @tour-kit/adoption typecheck && \
  pnpm --filter @tour-kit/hints typecheck

# Full type check across all packages
pnpm typecheck

# Manually verify harness sensitivity: pick one .test-d.ts, delete one @ts-expect-error, expect non-zero
# (Don't commit the deletion — it's a harness self-check.)
pnpm --filter @tour-kit/core typecheck:types     # expect non-zero after the deletion
```
