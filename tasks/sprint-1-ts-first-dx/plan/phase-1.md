# Phase 1 — Type-Safe Step IDs (#34)

**Duration:** Day 3 (~7–8 hours)
**Depends on:** Phase 0 (specifically 0.2 — type-test harness)
**Blocks:** Phase 2 (schemas reference `TourStep<TId>`), Phase 5 (`goToStep` helper signature)
**Risk Level:** LOW — pure widening; default `TId = string` preserves every existing call site at runtime AND at the type level
**Stack:** typescript

---

## Objective

Add a generic `TId extends string = string` parameter to `TourStep`, `Tour`, and `useTour().goToStep` so that const-authored tours get compile-time misspelling errors on `goToStep('biling')` while dynamic tours (server-fetched JSON, JIT-built arrays) keep the wide `string` behavior they have today. Marketing positions Tour Kit as "TS-first" — this phase makes the compiler back the claim without breaking a single existing consumer.

## What Success Looks Like

1. `pnpm --filter @tour-kit/core typecheck` exits 0 with the new generics in place.
2. `pnpm --filter @tour-kit/core typecheck:types` exits 0 against the four new `*.test-d.ts` fixtures (const-tuple narrowing, dynamic widening, `useTour().goToStep`, `startTour(id, stepId)`).
3. Removing one `@ts-expect-error` from `step-id.test-d.ts` makes `typecheck:types` exit non-zero (proves the harness catches drift).
4. `pnpm --filter @tour-kit/core test` exits 0 — no runtime test changes required because the change is type-only.
5. `pnpm --filter @tour-kit/react test` exits 0 with no source edits in `@tour-kit/react` other than re-exports / type-only updates.
6. `useTour().goToStep` exists at the call site (previously the imperative ref had it; `useTour()` did not).

---

## Architecture / Key Design Decisions

```
TourStep<TId extends string = string>
   ▲
   │ extends
Tour<TStep extends TourStep = TourStep>
   ▲
   │ infer
StepIdOf<typeof steps>  ──► literal union ('welcome' | 'pricing' | ...)
   │ feeds
useTour<TId>().goToStep(id: TId)
TourContextValue<TStep>.actions.goToStep(id: TStep['id'])
startTour<TId>(tourId: string, stepId?: TId)
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Public surface (TourStep, Tour, useTour) | `interface`/`type` with generic params | TypeScript-only; cannot use Zod for generics-over-tuples; default param keeps back-compat |
| Helper for inference | `type StepIdOf<T extends ReadonlyArray<{ id: string }>>` | Pure TS conditional/indexed-access type, zero runtime cost |
| Type-test fixtures | `.test-d.ts` with `@ts-expect-error` and conditional-type assertions | Runs through the Phase-0 harness; no runtime overhead |

**Other critical rules for this phase:**
- **Default `string` is non-negotiable.** Every existing consumer that writes `TourStep` (no type arg) MUST keep compiling. Adding `<TId extends string = string>` widens the surface; never tighten it.
- **`Tour<TourStep<string>>` widens back.** Document this as the escape hatch for dynamic-tour authors who want the old behavior explicit.
- **Imperative ref vs `useTour()` parity.** Spec §4.2 calls out that the imperative ref has `goToStep` today but `useTour()` does not. Fix the parity gap in this phase — same signature on both.
- **No runtime changes.** If any test in the existing suite needs a code change beyond a `<TId>` type arg, you've drifted from the goal. Stop and re-read the spec.

---

## Tasks

### Task 1.1 — Generic `TourStep<TId>` and `StepOptions<TId>` (1h)

**Depends on:** 0.2

```ts
// packages/core/src/types/step.ts (modify)
export interface TourStep<TId extends string = string> {
  id: TId
  // ... all existing fields unchanged
}

export type StepOptions<TId extends string = string> = Omit<TourStep<TId>, 'id'>

export type StepIdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id']
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0. Existing call sites in `@tour-kit/react`, `@tour-kit/adoption`, examples still compile without edit.

---

### Task 1.2 — Generic `Tour<TStep>` and step-aware callbacks (1h)

**Depends on:** 1.1

```ts
// packages/core/src/types/tour.ts (modify)
export interface Tour<TStep extends TourStep = TourStep> {
  id: string
  steps: TStep[]
  // ...
  onStepChange?: (step: TStep, index: number, context: TourCallbackContext) => void
  // other callbacks unchanged
}

export type TourOptions<TStep extends TourStep = TourStep> = Omit<Tour<TStep>, 'id' | 'steps'>
```

**Implementation note:** Update only the callbacks that receive a step (`onStepChange`). `onStart`, `onComplete`, `onSkip` take a `TourCallbackContext`, not a step — leave them alone.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` clean. Existing `onStepChange?: (step: TourStep, ...)` consumers still type-check because of the default.

---

### Task 1.3 — Propagate through actions / context / `useTour` (2h)

**Depends on:** 1.1, 1.2

Touchpoints:

```ts
// packages/core/src/types/state.ts (modify)
export interface TourActions<TStep extends TourStep = TourStep> {
  startTour: <TId extends TStep['id'] = TStep['id']>(tourId: string, stepId?: TId) => void
  goToStep: <TId extends TStep['id'] = TStep['id']>(id: TId) => void
  // ... existing actions unchanged
}

// packages/core/src/context/tour-context.ts (modify)
export interface TourContextValue<TStep extends TourStep = TourStep> {
  actions: TourActions<TStep>
  // ... existing fields unchanged
}

// packages/core/src/hooks/use-tour.ts (modify)
export function useTour<TStep extends TourStep = TourStep>(): {
  isActive: boolean
  currentStep: TStep | null
  goToStep: (id: TStep['id']) => void
  // ... mirror the existing surface
}
```

**Critical:** if `useTour()` currently re-exports `actions` from the provider context, surface `goToStep` at the top level — spec §4.2 + §2.2.2 require call sites to write `useTour().goToStep('id')` not `useTour().actions.goToStep('id')`. If the existing API is already top-level, leave the shape; just add the generic.

**Sanity check:** Open `packages/react/src/index.ts` and confirm `useTour` is re-exported (or that the `useTour` from `@tour-kit/core` is exported directly). `pnpm --filter @tour-kit/react typecheck` exits 0.

---

### Task 1.4 — `defineTour` / `createTour` inference helper if needed (1h)

**Depends on:** 1.2

Inference for `Tour<typeof steps[number]>` is awkward — TypeScript infers `TourStep<string>` unless the user adds `as const satisfies ReadonlyArray<TourStep>`. Decide between two approaches:

**Option A (preferred — no helper):** Document `as const satisfies` in the type-tests and the docs page. Zero new API.

**Option B (helper):** Add `createTour<const TSteps>(opts: { id: string; steps: TSteps; ...}): Tour<TSteps[number] extends TourStep ? TSteps[number] : never>`. Only ship if test-fixture authors complain about ergonomics.

For Sprint 1, ship Option A unless Task 1.5's fixtures prove it doesn't work. Re-evaluate after the type tests are written.

```ts
// packages/core/src/utils/create-tour.ts (only if Option B is chosen)
export function createTour<const TSteps extends ReadonlyArray<TourStep>>(
  opts: TourOptions<TSteps[number]> & { id: string; steps: TSteps }
): Tour<TSteps[number]> {
  return opts as Tour<TSteps[number]>
}
```

**Sanity check:** if Option A, Task 1.5's `const-tuple` fixture compiles and narrows correctly. If Option B, the helper appears in `packages/core/src/index.ts` re-exports.

---

### Task 1.5 — Type tests (1.5h)

**Depends on:** 1.3, 1.4

Four `*.test-d.ts` files under `packages/core/src/__tests__/types/`:

```ts
// step-id-narrowing.test-d.ts
import type { Tour, TourStep, StepIdOf } from '@tour-kit/core'

const steps = [
  { id: 'welcome', target: '#a', content: 'a' },
  { id: 'pricing', target: '#b', content: 'b' },
] as const satisfies ReadonlyArray<TourStep>

type Ids = StepIdOf<typeof steps>          // expect: 'welcome' | 'pricing'

const ok: Ids = 'welcome'
const _bad: Ids = 'biling'                  // @ts-expect-error misspelling
void ok; void _bad
```

```ts
// step-id-dynamic.test-d.ts
import type { Tour, TourStep } from '@tour-kit/core'
const dynamicSteps: TourStep[] = JSON.parse('[]') // simulating server JSON
const dynamic: Tour = { id: 'd', steps: dynamicSteps } // still compiles
void dynamic
```

```ts
// use-tour-go-to-step.test-d.ts
import { useTour } from '@tour-kit/core'
import type { TourStep } from '@tour-kit/core'

type Steps = readonly [
  TourStep<'welcome'>,
  TourStep<'pricing'>,
]
const tour = useTour<Steps[number]>()
tour.goToStep('welcome')
tour.goToStep('biling') // @ts-expect-error not assignable
```

```ts
// start-tour-step-id.test-d.ts
// Mirror the goToStep test for startTour(tourId, stepId?) — same narrowing.
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck:types` exits 0. Pick one `@ts-expect-error` and delete it — the script must exit non-zero. Restore it.

---

### Task 1.6 — Docs update (1h)

**Depends on:** 1.5

Touch `apps/docs/content/docs/typescript.mdx` (or whichever existing TypeScript page covers types — check `apps/docs/content/docs/getting-started/` first). Add:

- A "Typed step IDs" section with the const-tuple pattern.
- A "Dynamic tours" subsection showing `Tour<TourStep<string>>` widening.
- Cross-link to the test fixtures so readers can copy the canonical pattern.

Update `apps/docs/content/docs/meta.json` only if a new page is added (preferred: extend the existing TS page, no new page).

**Sanity check:** `pnpm --filter docs build` exits 0 OR `pnpm --filter docs dev` renders the section. The doc references the published code paths, not internal types.

---

## Deliverables

```
packages/core/src/
├── types/
│   ├── step.ts                                  # (M) TourStep<TId>, StepOptions<TId>, StepIdOf
│   ├── tour.ts                                  # (M) Tour<TStep>, TourOptions<TStep>
│   └── state.ts                                 # (M) TourActions<TStep>
├── context/tour-context.ts                      # (M) TourContextValue<TStep>
├── hooks/use-tour.ts                            # (M) useTour<TStep>, top-level goToStep
└── __tests__/types/
    ├── step-id-narrowing.test-d.ts              # (+) const-tuple narrowing
    ├── step-id-dynamic.test-d.ts                # (+) dynamic widening
    ├── use-tour-go-to-step.test-d.ts            # (+) hook narrowing
    └── start-tour-step-id.test-d.ts             # (+) startTour signature

packages/react/src/index.ts                      # (M) re-export confirmation only if needed

apps/docs/content/docs/
└── typescript.mdx (or similar)                  # (M) "Typed step IDs" section
```

(`utils/create-tour.ts` only if Task 1.4 lands Option B.)

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core typecheck` exits 0.
- [ ] `pnpm --filter @tour-kit/core typecheck:types` exits 0 with the four new test-d files.
- [ ] Removing any one `@ts-expect-error` from the test-d files makes `typecheck:types` exit non-zero (verified by hand on at least one fixture).
- [ ] `pnpm --filter @tour-kit/core test` exits 0 — no runtime test edits.
- [ ] `pnpm --filter @tour-kit/react typecheck && pnpm --filter @tour-kit/react test` exits 0.
- [ ] `pnpm --filter @tour-kit/adoption typecheck` exits 0 (widening must not break downstream consumers).
- [ ] `useTour()` exposes `goToStep` at the top level (call site: `useTour().goToStep('id')` typechecks).
- [ ] Docs page lists the const-tuple pattern AND the `Tour<TourStep<string>>` widening pattern.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 1 of Tour Kit's Sprint 1 — type-safe step IDs (issue #34).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. `@tour-kit/core` holds the framework-agnostic types and hooks; `@tour-kit/react` is a thin component layer. Core sits at the bottom of the dep graph — it must not import any other `@tour-kit/*` package.

### Established in Prior Phases
- Phase 0 added `pnpm --filter @tour-kit/core typecheck:types` powered by `tsconfig.type-tests.json`. The harness fails when any `@ts-expect-error` line is removed. Use this script for all type assertions in this phase.
- Phase 0 catalog adds (jscodeshift, jsdom-testing-mocks) are unrelated to this phase.
- `@tour-kit/core` currently exports `TourStep` (concrete `id: string`), `Tour` (concrete `steps: TourStep[]`), and `useTour()` with an `actions` namespace — spec §4.2 requires `goToStep` to be available at the top level after this phase.
- Existing imperative ref already has `goToStep<TId extends string = string>(id: TId): void`. Mirror that signature on the hook.

### Your Goal for This Phase
Add `<TId extends string = string>` to `TourStep`, propagate `<TStep>` through `Tour`, `TourActions`, `TourContextValue`, `useTour`, and expose typed `goToStep` + `startTour(tourId, stepId)` at the top level of `useTour()`. Ship four `.test-d.ts` fixtures and a docs update. ZERO runtime changes.

### Data Model Rules (follow exactly)
- `interface`/`type` with generic params + default = `string` — for all public surfaces.
- Conditional / indexed-access types only — `StepIdOf<T> = T[number]['id']`. No mapped types unless necessary.
- No Zod, no runtime helpers (unless Task 1.4 lands Option B `createTour`).
- Test fixtures use `@ts-expect-error` lines that MUST fail typecheck when removed.

### Architecture
- Default `TId = string` and `TStep = TourStep` preserve every existing call site. Verify by typechecking `@tour-kit/react`, `@tour-kit/adoption`, `@tour-kit/hints` without edits.
- `useTour()` exposes `goToStep` at the top level — fix the parity gap with the imperative ref.
- `as const satisfies ReadonlyArray<TourStep>` is the canonical pattern for users who want narrowing. Document it.
- `Tour<TourStep<string>>` is the canonical widening escape hatch for dynamic-tour authors. Document it.

### Confirmed Library APIs
No new libraries. TypeScript 5.9.3 features used:
- `const` type parameters: `<const T extends ReadonlyArray<...>>` for `createTour` if Option B ships.
- `satisfies` operator: `[...] as const satisfies ReadonlyArray<TourStep>`.
- Indexed-access types: `T[number]['id']`.

### Files to Create / Modify

#### `packages/core/src/types/step.ts` (modify)
Add `<TId extends string = string>` to `TourStep`. Keep `id: TId` (not `id: string`). Update `StepOptions` to `StepOptions<TId extends string = string> = Omit<TourStep<TId>, 'id'>`. Export `StepIdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id']`. Touch nothing else.

#### `packages/core/src/types/tour.ts` (modify)
Add `<TStep extends TourStep = TourStep>` to `Tour`. Change `steps: TourStep[]` to `steps: TStep[]`. Update `onStepChange` to receive `TStep`. Update `TourOptions<TStep>` to `Omit<Tour<TStep>, 'id' | 'steps'>`. Leave `onStart`/`onComplete`/`onSkip` alone — they take `TourCallbackContext`, not a step.

#### `packages/core/src/types/state.ts` (modify)
Add `<TStep extends TourStep = TourStep>` to `TourActions`. Type `goToStep` as `<TId extends TStep['id'] = TStep['id']>(id: TId) => void`. Type `startTour` as `<TId extends TStep['id'] = TStep['id']>(tourId: string, stepId?: TId) => void`. Other actions unchanged.

#### `packages/core/src/context/tour-context.ts` (modify)
Add `<TStep>` to `TourContextValue`. Propagate to `actions: TourActions<TStep>`.

#### `packages/core/src/hooks/use-tour.ts` (modify)
Add `<TStep extends TourStep = TourStep>` generic to `useTour`. Return type must expose `goToStep` (and `startTour` if it isn't already top-level) directly — not nested under `actions`. Keep existing fields. If `useTour` already top-levels actions, just add the generic + the typed signatures.

#### `packages/core/src/__tests__/types/step-id-narrowing.test-d.ts` (new)
See Task 1.5. Const-tuple of two steps; verify `StepIdOf<typeof steps>` narrows to `'welcome' | 'pricing'`; one `@ts-expect-error` line on a misspelled ID.

#### `packages/core/src/__tests__/types/step-id-dynamic.test-d.ts` (new)
Build `dynamicSteps: TourStep[] = JSON.parse('[]')`. Assign to `Tour` — must compile because of default param.

#### `packages/core/src/__tests__/types/use-tour-go-to-step.test-d.ts` (new)
`const t = useTour<TourStep<'a' | 'b'>>()`. `t.goToStep('a')` compiles; `t.goToStep('c')` has `@ts-expect-error`.

#### `packages/core/src/__tests__/types/start-tour-step-id.test-d.ts` (new)
Same shape as the goToStep test, but for `startTour(tourId, stepId)`.

#### `apps/docs/content/docs/typescript.mdx` (modify — or create new page if no TS page exists yet)
Add a "Typed step IDs" section. Show the const-tuple narrowing pattern + the `Tour<TourStep<string>>` widening escape hatch. Reference issue #34. Link to existing tour examples in the repo.

### Success Criteria
- `pnpm --filter @tour-kit/core typecheck` exits 0.
- `pnpm --filter @tour-kit/core typecheck:types` exits 0 with all four fixtures.
- Manually remove one `@ts-expect-error` line — `typecheck:types` exits non-zero. Restore it.
- `pnpm --filter @tour-kit/core test` exits 0 (no runtime test changes).
- `pnpm --filter @tour-kit/react test && pnpm --filter @tour-kit/adoption typecheck && pnpm --filter @tour-kit/hints typecheck` all exit 0.
- `useTour().goToStep('x')` works without `.actions.` prefix at any call site.
- Existing code that writes `const t: Tour = { id, steps: [...] }` without a generic arg still compiles.

### Expected File Structure at End
```
packages/core/src/
├── types/
│   ├── step.ts        # generic TourStep<TId>, StepOptions<TId>, StepIdOf
│   ├── tour.ts        # generic Tour<TStep>, TourOptions<TStep>
│   └── state.ts       # generic TourActions<TStep>
├── context/tour-context.ts   # generic TourContextValue<TStep>
├── hooks/use-tour.ts         # generic useTour<TStep>, top-level goToStep
└── __tests__/types/
    ├── step-id-narrowing.test-d.ts
    ├── step-id-dynamic.test-d.ts
    ├── use-tour-go-to-step.test-d.ts
    └── start-tour-step-id.test-d.ts

apps/docs/content/docs/typescript.mdx   # (modified — Typed step IDs section)
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 0 type-test harness is the only hard dependency.
- [PASS] Every sub-task has a clear, testable completion condition (`typecheck` / `typecheck:types` commands + manual `@ts-expect-error` removal verification).
- [PASS] Execution prompt is self-contained: project description, prior-phase facts (harness command), per-file guidance, exact success commands.
- [PASS] Exit criteria map 1:1 to deliverables (each test-d file → typecheck:types pass; each modified type → corresponding typecheck across packages; docs change → docs build).
- [PASS] No heavy external dependencies — this phase is type-only.
- [PASS] No new libraries; TypeScript 5.9.3 features (const generics, satisfies, indexed access) are stable and don't need Context7 confirmation.
