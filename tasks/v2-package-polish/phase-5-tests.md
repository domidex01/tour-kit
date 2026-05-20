# Phase 5 — Testing: target-as-ref + MultiTourKit Compose

**Scope:** New `packages/core/src/types/target.ts` exporting `TourTarget` union + `resolveTarget()` resolver; widening of `target` field on `TourStepConfig` and `HintConfig`; route every runtime dereference through `resolveTarget` (hooks: `use-step.ts`, `use-element-position.ts`, `lib/wait-for-step-target.ts`, `utils/dom.ts`, plus four React card/overlay consumers); compose-mode docs + deeply-nested `useTour()` test for `<MultiTourKitProvider>`; new jscodeshift codemod `target-to-ref` with 5 fixture pairs + an idempotency check.
**Key Pattern:** Pure resolver + integration — unit-test `resolveTarget` against jsdom's `document.querySelector`, real ref-shaped objects, thunk targets, and explicit SSR (`globalThis.document = undefined`); integration-test that string/ref/thunk targets all render the same tour surface without warnings, and keep browser geometry out of jsdom; fixture-based codemod tests mirroring the existing flat `from-driver.test.ts` + `_helpers.ts` template.
**Dependencies:** vitest + jsdom env, @testing-library/react, jscodeshift (existing devDep), no new runtime libs.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a portal-using consumer, I want `<TourStep target={ref} />` to resolve through `RefObject.current` so dynamic IDs don't break | `target.test.ts` ref-set case | `resolveTarget({current: el}) === el` |
| US-2 | As a lazy-mounting consumer, I want `target={() => document.querySelector('[data-cy="cta"]')}` to resolve at step-enter | `target.test.ts` thunk case + `tour-card.target-back-compat.test.tsx` getter case | Resolver returns the element; integration test renders the active tour for the thunk target without throwing |
| US-3 | As a v1 consumer using `target="#welcome"`, I want zero regressions and zero console warnings | `tour-card.target-back-compat.test.tsx` | String-target render remains warning-free and produces the same active dialog/content as ref/thunk targets |
| US-4 | As an SSR consumer (Next.js RSC, Remix), I want the resolver to never throw `ReferenceError: document is not defined` | `target.test.ts` SSR case | With `globalThis.document = undefined`, `resolveTarget('#x')` returns `null` and does NOT throw |
| US-5 | As a deeply-nested consumer, I want `useTour()` to work from a child five `<div>`s under `<MultiTourKitProvider>` | `multi-tour-kit-compose.test.tsx` | `renderHook(useTour, { wrapper })` returns a controller (not null, not thrown); registry contains the tour id |
| US-6 | As a migrating consumer, I want a codemod that rewrites `target="#foo"` to `target={fooRef}` when `useRef` is in scope | `target-to-ref.test.ts` happy-path fixture | Output file matches expected fixture byte-for-byte |
| US-7 | As a defensive migrating consumer, I want the codemod to leave ambiguous cases untouched and emit a TODO | `target-to-ref.test.ts` no-ref-in-scope fixture | Original attribute unchanged; `// TODO(tour-kit): target-to-ref` comment attached as leading comment |
| US-8 | As a codemod re-runner, I want idempotency — running twice produces the same output as once | `target-to-ref.test.ts` idempotency case | Second-pass output equals first-pass output byte-for-byte |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `resolveTarget(t: TourTarget)` (pure) | No mock — exercise directly | Each branch returns the right shape (`HTMLElement \| null`); branches are non-overlapping | US-1, US-2 |
| Backwards-compat for string targets | No mock — render real `<TourCard>` inside `<TourProvider>` with `target="#a"` in jsdom; do not assert real geometry in jsdom | Active dialog/content renders for string/ref/thunk targets; `console.warn` never fires; resolver unit tests pin the target branches | US-3 |
| SSR safety | Stub `globalThis.document = undefined` in a `vi.stubGlobal` block; restore in `afterEach` | `resolveTarget('#x')` returns `null` without throwing | US-4 |
| `<MultiTourKitProvider>` compose-mode | No mock — render real provider wrapping five `<div>`s; use `renderHook(useTour, { wrapper })` | Hook returns a controller; `useTourRegistryContext().tours` has the registered tour id; re-render of leaf does not duplicate the entry (existing `registerTour` idempotency) | US-5 |
| Codemod `target-to-ref` | jscodeshift fixture pattern — mirror `packages/codemods/src/__tests__/from-driver.test.ts` and import `runTransform` from `_helpers.ts` | Output equals expected fixture; running twice is a no-op | US-6, US-7, US-8 |
| `todo-emitter` helper | No mock — use the existing helper at `packages/codemods/src/lib/todo-emitter.ts` | Leading comment attached; idempotency via substring check on existing comments | US-7, US-8 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit (resolver) | vitest + jsdom | <1s | Every push |
| Component (back-compat + compose) | vitest + @testing-library/react + jsdom | <3s | Every push |
| Codemod fixtures | vitest + jscodeshift | <2s | Every push |
| Audit grep | `rg` against `packages/core/src packages/react/src` | <1s | Pre-merge CI |
| Docs build | `pnpm --filter @tour-kit/docs build` | ~10–20s | Pre-merge CI |

---

## 4. No Fake Implementations (Pure Resolver + Integration Phase)

Phase 5 has no heavy dependencies. The resolver is 12 lines; jsdom already provides `document.querySelector`. Refs are real React refs. Thunks are inline arrow functions. The `MultiTourKitProvider` is a real provider — no fake. The codemod is a pure AST transform — fixture-based testing is the right granularity.

The only test-only utility is `vi.stubGlobal('document', undefined)` for the SSR case, paired with `afterEach(() => vi.unstubAllGlobals())`.

---

## 5. Test File List

```
packages/core/src/__tests__/
└── types/
    └── target.test.ts                                         # NEW — 6 cases: string, ref-set, ref-null,
                                                               #       thunk-elem, thunk-null, SSR-no-document

packages/react/src/__tests__/components/
├── card/
│   └── tour-card.target-back-compat.test.tsx                  # NEW — string-selector parity, ref parity, thunk parity
└── provider/
    └── multi-tour-kit-compose.test.tsx                        # NEW — five-deep useTour; registry has id; idempotent register

packages/codemods/src/__tests__/
├── target-to-ref.test.ts                                      # NEW — 5 fixture cases + idempotency
└── fixtures/target-to-ref/
    ├── happy-path-single.input.tsx                            # NEW
    ├── happy-path-single.output.tsx                           # NEW
    ├── happy-path-multi.input.tsx                             # NEW
    ├── happy-path-multi.output.tsx                            # NEW
    ├── no-ref-in-scope.input.tsx                              # NEW
    ├── no-ref-in-scope.output.tsx                             # NEW
    ├── already-ref.input.tsx                                  # NEW
    ├── already-ref.output.tsx                                 # NEW
    ├── mixed-bag.input.tsx                                    # NEW
    └── mixed-bag.output.tsx                                   # NEW
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `target.test.ts` | Unit | 6 | string→`querySelector` happy path; ref-set; ref-null; thunk→element; thunk→null; SSR `globalThis.document=undefined` returns null without throw. |
| `tour-card.target-back-compat.test.tsx` | Component | ≥3 | `target="#a"`, `target={refToA}`, and `target={() => el}` all render the active tour surface without throwing; `console.warn` never called. Geometry is covered by resolver + existing browser-level tests, not jsdom rectangles. |
| `multi-tour-kit-compose.test.tsx` | Component | ≥3 | Five-deep `useTour()` returns controller; registry contains tour id; re-render is idempotent (existing `registerTour` body). |
| `target-to-ref.test.ts` | Codemod | 6 | Five fixture pairs + idempotency (second pass on `happy-path-single` equals first pass). |

---

## 6. Test Setup (Vitest + jsdom)

**Additions to existing `packages/core/vitest.config.ts`:** none. `target.test.ts` runs under the existing jsdom config.

For the SSR case in `target.test.ts`:

```ts
import { afterEach, beforeEach, vi } from 'vitest'

let savedDocument: typeof globalThis.document
beforeEach(() => { savedDocument = globalThis.document })
afterEach(() => { vi.unstubAllGlobals(); (globalThis as any).document = savedDocument })

it('SSR-safe: returns null when document is undefined', () => {
  vi.stubGlobal('document', undefined)
  expect(resolveTarget('#anything')).toBeNull()
})
```

For the compose-mode test:

```tsx
import { renderHook } from '@testing-library/react'
import { MultiTourKitProvider, useTour, useTourRegistryContext } from '@tour-kit/react'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MultiTourKitProvider>
      <div><div><div><div><div>{children}</div></div></div></div></div>
    </MultiTourKitProvider>
  )
}

const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
expect(result.current).toBeDefined()
expect(result.current.isActive).toBe(false)
```

For the codemod, mirror the existing harness — see `packages/codemods/src/__tests__/from-driver.test.ts` and `packages/codemods/src/__tests__/_helpers.ts` for the canonical runner.

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Resolver tested in isolation, not through the React tree | Pure-function tests are fast and unambiguous | The runtime resolver is the load-bearing change; testing through React would mix component concerns. |
| SSR safety tested with `vi.stubGlobal('document', undefined)` | One case in `target.test.ts` | The string-branch SSR guard is one `if`; one test pins it. Restoring in `afterEach` prevents test pollution. |
| Backwards-compat avoids jsdom geometry assertions | Render the active tour for string/ref/thunk targets and assert no warnings; rely on `resolveTarget` unit tests for branch correctness | jsdom and the package setup do not provide real Floating UI layout, so `getBoundingClientRect()` overlap would be a false signal. |
| Compose-mode test uses `renderHook`, not full app render | Smaller harness, faster, more targeted | `useTour()` is the API under test; rendering an actual tour adds noise without value. |
| Codemod fixtures live in a sibling directory, not inline strings | `__tests__/fixtures/target-to-ref/*.tsx` | Keeps the flat codemod test layout used by this repo while still letting PR reviewers diff actual before/after files. |
| Idempotency is a sixth test, not an option flag | Run transform twice on the same input | Catches regressions where a "smarter" rewrite would rewrite already-migrated code into something else. |
| TODO emit uses the existing `todo-emitter` helper, not a fresh implementation | Reuse `emitTodo` + `attachLeadingComments` | A second implementation would drift; the helper is shared across transforms for a reason. |
| Audit grep is part of CI, not just a manual check | `rg ... packages/core/src packages/react/src` returns no offenders | Catches forgotten dereference paths that bypass `resolveTarget` (e.g., a future contributor adding a new component that does `target.current` inline). |
| No new mocks for `MultiTourKitProvider` | Real provider, real registry context | The whole point of compose-mode is that no plumbing is needed; tests should reflect that. |

---

## 8. Example Test Case

The `resolveTarget` unit suite is the most representative — six cases that pin the closed union and the non-overlapping branches.

```ts
// packages/core/src/__tests__/types/target.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTarget } from '../../types/target'

describe('resolveTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="x">hello</div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('string selector → document.querySelector', () => {
    const el = document.getElementById('x')
    expect(resolveTarget('#x')).toBe(el)
  })

  it('RefObject with .current set → returns the element', () => {
    const el = document.getElementById('x')!
    expect(resolveTarget({ current: el })).toBe(el)
  })

  it('RefObject with .current null → returns null', () => {
    expect(resolveTarget({ current: null })).toBeNull()
  })

  it('thunk returning element → returns the element', () => {
    const el = document.getElementById('x')!
    expect(resolveTarget(() => el)).toBe(el)
  })

  it('thunk returning null → returns null', () => {
    expect(resolveTarget(() => null)).toBeNull()
  })

  it('SSR-safe: returns null when document is undefined and does NOT throw', () => {
    vi.stubGlobal('document', undefined)
    expect(() => resolveTarget('#x')).not.toThrow()
    expect(resolveTarget('#x')).toBeNull()
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 5 of Tour Kit v2 Package Polish — target-as-ref + MultiTourKit Compose.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages. `@tour-kit/core` ships the headless target-resolution path; `@tour-kit/react` ships the styled card/overlay consumers; `@tour-kit/codemods` ships migration transforms. Phase 5 widens the `target` prop to accept `string | RefObject<HTMLElement | null> | (() => HTMLElement | null)`, routes every dereference through a single `resolveTarget()` function, codifies compose-mode for `<MultiTourKitProvider>` (registry-based `useTour()` from any depth), and ships a best-effort jscodeshift codemod.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Ref-as-target works | `resolveTarget({current: el}) === el` | Returns the element |
| US-2 | Thunk-as-target works | `resolveTarget(() => el) === el` | Returns the element |
| US-3 | String backcompat (zero warn) | Snapshot + `console.warn` spy | Snapshot byte-identical; spy never called |
| US-4 | SSR safety | `vi.stubGlobal('document', undefined)` | Returns null without throw |
| US-5 | Deep useTour in compose-mode | `renderHook` 5-deep | Controller returned, not null/thrown |
| US-6 | Codemod happy path | Fixture parity | Output equals expected |
| US-7 | Codemod TODO on ambiguous | Fixture with no matching `useRef` | Original attribute unchanged + leading comment |
| US-8 | Codemod idempotency | Run twice | Second pass identical to first |

### Why Fakes Are Required

None. Phase 5 has no heavy dependencies (no model loads, no network, no DB). The resolver is 12 lines; jsdom provides `document.querySelector`; refs are real React refs; thunks are inline arrows. The `<MultiTourKitProvider>` is the real provider. The codemod is a pure AST transform — fixtures, not mocks. The only test-only utility is `vi.stubGlobal('document', undefined)` for the SSR case.

### What NOT to Test

- Don't test all possible JSX shapes the codemod might encounter — it's heuristic and emits TODOs on ambiguous matches. Five canonical fixtures + idempotency is the right granularity.
- Don't re-test `useTour()` itself — covered by existing `@tour-kit/core` tests. Phase 5 only tests that `useTour()` works from a deeply-nested child of `<MultiTourKitProvider>`.
- Don't test the wire `target` prop on every component — route through `resolveTarget` once; trust the consumers. The audit grep is the catch-all for missed call sites.
- Don't add a Playwright spec for this phase — backwards-compat is verified in jsdom (DOM rect overlap), which is sufficient.

### Critical: No Fake Implementations

This is a pure resolver + integration phase. See §4 of this plan. The only test-only utility is `vi.stubGlobal('document', undefined)` for the SSR case.

### Test Files to Create

```
packages/core/src/__tests__/types/target.test.ts                                            # NEW
packages/react/src/__tests__/components/card/tour-card.target-back-compat.test.tsx          # NEW
packages/react/src/__tests__/components/provider/multi-tour-kit-compose.test.tsx            # NEW
packages/codemods/src/__tests__/target-to-ref.test.ts                                      # NEW
packages/codemods/src/__tests__/fixtures/target-to-ref/                                     # NEW (10 files: 5 pairs)
```

### Per-File Coverage Guidance

#### `packages/core/src/__tests__/types/target.test.ts` (NEW — 6 cases)
Use the canonical pattern from §8 of this plan. Each `it` block is independent. The SSR case uses `vi.stubGlobal('document', undefined)` with `afterEach(() => vi.unstubAllGlobals())` cleanup. Restore the saved `document` reference manually after `unstubAllGlobals` — jsdom doesn't restore on its own.

#### `packages/react/src/__tests__/components/card/tour-card.target-back-compat.test.tsx` (NEW — ≥3 cases)
1. Mount `<TourProvider id="t" steps={[{id:'s1', target: '#a'}]}><TourCard /></TourProvider>` with a fixed-position `<div id="a">` in the DOM; start the tour; assert the active dialog/content renders.
2. Same setup with `target={refToA}` where `refToA.current` is the same DOM node; assert the same active dialog/content renders.
3. Same setup with `target={() => document.getElementById('a')}`; assert the same active dialog/content renders.
4. `console.warn` spy is never called across all three runs.

#### `packages/react/src/__tests__/components/provider/multi-tour-kit-compose.test.tsx` (NEW — ≥3 cases)
1. `renderHook` `useTour()` with a wrapper that nests five `<div>`s inside `<MultiTourKitProvider>` with a `<Tour id="x" steps={[...]} />` at the leaf. Assert `result.current.isActive === false` (controller present, not throw).
2. Assert `useTourRegistryContext().tours.has('x') === true` from the same renderHook (via a second `renderHook` reading the registry).
3. Re-render the leaf (force a re-key); assert the registry still has exactly one entry for `'x'` (no duplicate registration).

#### `packages/codemods/src/__tests__/target-to-ref.test.ts` (NEW — 6 cases)
Mirror the structure of `from-driver.test.ts` and use `runTransform` from `_helpers.ts`. For each fixture pair: read input, run transform, assert output equals expected fixture string. Five pairs (`happy-path-single`, `happy-path-multi`, `no-ref-in-scope`, `already-ref`, `mixed-bag`) plus an idempotency case that runs the transform twice on `happy-path-single.input.tsx` and asserts the second pass equals the first.

#### `packages/codemods/src/__tests__/fixtures/target-to-ref/` (NEW — 10 files)
Five `.input.tsx` + `.output.tsx` pairs:
- `happy-path-single` — one `<TourStep target="#welcome">` + `const welcomeRef = useRef(null)` → output rewrites to `target={welcomeRef}`.
- `happy-path-multi` — three steps with three matching refs → output rewrites all three.
- `no-ref-in-scope` — one step with `target="#missing"` and no matching `useRef` → output is unchanged except for a leading TODO comment.
- `already-ref` — one step already using `target={someRef}` (JSXExpressionContainer) → output identical (no-op).
- `mixed-bag` — two steps, one with matching ref + one without → first is rewritten, second carries a TODO.

### Data Model Notes

- `TourTarget` is a `type` alias (discriminated union), not an `interface` — Phase 0 §3 sign-off explicitly noted this. Tests reference the union via inferred types from `resolveTarget`'s parameter; no direct type imports needed.
- `LicenseProviderProps` is NOT touched here — license work is Phase 8.
- The audit grep is part of pre-merge CI:
  ```bash
  rg "target:.*string \|.*RefObject|currentStep\.target|step\.target|document\.querySelector<HTMLElement>\(.*target" \
    packages/core/src packages/react/src
  ```
  Returns ZERO matches when every dereference goes through `resolveTarget`.

### Success Criteria

- `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/react typecheck && pnpm --filter @tour-kit/codemods typecheck` all exit 0
- `pnpm --filter @tour-kit/core test -- --run target` exits 0 (6 cases)
- `pnpm --filter @tour-kit/react test -- --run target-string-backcompat multi-tour-kit-compose` exits 0 (≥6 cases)
- `pnpm --filter @tour-kit/codemods test -- --run target-to-ref` exits 0 (6 cases including idempotency)
- Audit grep returns no offenders
- `pnpm --filter @tour-kit/docs build` exits 0; `target-prop.mdx` appears in React-package sidebar
- No regressions: `pnpm test` at repo root exits 0

### Expected File Structure at End

```
packages/core/src/__tests__/types/target.test.ts                                          # NEW
packages/react/src/__tests__/components/card/tour-card.target-back-compat.test.tsx        # NEW
packages/react/src/__tests__/components/provider/multi-tour-kit-compose.test.tsx          # NEW
packages/codemods/src/__tests__/target-to-ref.test.ts                                    # NEW
packages/codemods/src/__tests__/fixtures/target-to-ref/                                   # NEW (10 files)
```

---

## 10. Run Commands

```bash
# Fast path — resolver + codemod
pnpm --filter @tour-kit/core test -- --run types/target
pnpm --filter @tour-kit/codemods test -- --run target-to-ref

# Full per-package suites
pnpm --filter @tour-kit/core test -- --run
pnpm --filter @tour-kit/react test -- --run target-string-backcompat multi-tour-kit-compose
pnpm --filter @tour-kit/codemods test -- --run

# Audit grep (CI guard)
rg "target:.*string \|.*RefObject|currentStep\.target|step\.target|document\.querySelector<HTMLElement>\(.*target" \
  packages/core/src packages/react/src

# Docs build
pnpm --filter @tour-kit/docs build

# Coverage on the resolver path
pnpm --filter @tour-kit/core test -- --coverage --run types/target
```
