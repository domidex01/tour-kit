# Phase 6 — Testing: Checklist Imperative + Completion Celebration

**Scope:** `<ChecklistLauncher>` ref widening (`forwardRef<ChecklistLauncherRef>` exposing `{ open, close, toggle }` via `useImperativeHandle`; new `buttonRef` prop preserves DOM-node access); new `<ChecklistCompletion>` component with `variant: 'confetti' | 'checkmark' | 'none'`; new `useChecklistCelebration(id)` one-shot edge hook; `canvas-confetti` as **optional** peer dep + dev-dep; barrel re-exports including `useReducedMotion`; docs page + sidebar slot.
**Key Pattern:** Pure logic + component composition + peer-optional dynamic-import — unit-test the imperative ref, the one-shot celebration edge (state-machine across mount/unmount), the reduced-motion JS gate (tier 3) that prevents the dynamic import from ever running, AND the missing-peer fallback. The literal `ChecklistCompletionVariant` union is pinned to prevent silent drift.
**Dependencies:** vitest, @testing-library/react (jsdom), `canvas-confetti` (devDep — workspace install resolves the dynamic import; production consumers install the peer themselves), `vi.doMock` for the missing-peer simulation, `vi.mock('@tour-kit/core', ...)` for `useReducedMotion`.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a demo author, I want to open the checklist panel from a navbar link via `launcherRef.current?.open()` | `checklist-launcher.imperative.test.tsx` | After `act(() => ref.current!.open())`, `getByRole('dialog', { name: /checklist/i })` is in the document |
| US-2 | As the same author, I want `toggle()` to flip open ↔ close on consecutive calls | Same file | Toggle 4× alternates `open, close, open, close` |
| US-3 | As a consumer who previously used `ref` to grab the DOM button (focus management), I want a `buttonRef` prop so I can keep that wiring | Same file | `buttonRef.current` is an `HTMLButtonElement` and is the same node as `getByRole('button', { name: /open checklist/i })` |
| US-4 | As an admin watching completion, I want `<ChecklistCompletion variant="confetti">` to fire confetti exactly once on the false→true completion edge | `checklist-completion.reduced-motion.test.tsx` (happy path) | `confettiSpy` call count is exactly 1 with `{ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, disableForReducedMotion: true }` |
| US-5 | As the same admin, I want re-renders after firing to NOT re-fire | Same file | Spy count remains 1 across forced re-renders |
| US-6 | As a reduced-motion user, I want NEVER to load `canvas-confetti` — render the static badge instead | Same file with `vi.mock('@tour-kit/core', ...)` returning `useReducedMotion → true` and `vi.doMock('canvas-confetti', factory)` | factory NEVER invoked (assert via `factory.mock.calls.length === 0`); static badge in DOM with `data-tk-reduced-motion="true"` |
| US-7 | As a `variant="checkmark"` consumer, I want a static badge with no dynamic import | Same file | Spy/factory NEVER called; badge rendered with default label "Done!" |
| US-8 | As a `variant="none"` consumer, I want nothing rendered | Same file | `container.firstChild === null`; no dynamic import attempted |
| US-9 | As a consumer who didn't install `canvas-confetti`, I want a graceful fallback — one dev `console.warn` + static badge | Same file with missing-peer mock | `console.warn` called once with substring `'canvas-confetti'`; static badge rendered |
| US-10 | As CI, I want the variant literal `'confetti' \| 'checkmark' \| 'none'` pinned — silent drift breaks the build | Same file (pinned tuple) | `expect(VARIANTS).toHaveLength(3)` and `as const satisfies readonly ChecklistCompletionVariant[]` |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `<ChecklistLauncher>` imperative ref | No mock — real render inside the existing `test-utils.tsx` harness; `React.createRef<ChecklistLauncherRef>()` | `ref.current.open()` opens dialog; `close()` closes it; `toggle()` alternates; `buttonRef.current` is the underlying `<button>` | US-1, US-2, US-3 |
| `useChecklistCelebration(id)` one-shot hook | No mock — exercise through `<ChecklistCompletion>` mounting + state transitions | `shouldFire` is true on exactly one render (the edge); `hasCelebrated` flips and stays | US-4, US-5 |
| `canvas-confetti` (peer-optional) — present case | `vi.doMock('canvas-confetti', () => ({ default: vi.fn() }))` | `confettiSpy` called exactly once with the pinned args; called zero times on re-render | US-4, US-5 |
| `canvas-confetti` — absent case | `vi.doMock('canvas-confetti', () => { throw new Error('not installed') })` | Static badge rendered; one `console.warn` containing `'canvas-confetti'`; spy never called | US-9 |
| `canvas-confetti` — reduced-motion case | Register `const factory = vi.fn(() => ({ default: vi.fn() }))` via `vi.doMock('canvas-confetti', factory)` AS WELL AS `vi.mock('@tour-kit/core', ...)` returning `useReducedMotion → true`. The factory function must NEVER be invoked. | `factory.mock.calls.length === 0`; the spy is also 0; static badge rendered | US-6 |
| `useReducedMotion()` | `vi.mock('@tour-kit/core', async (orig) => ({ ...await orig(), useReducedMotion: vi.fn(() => false) }))` with `mockReturnValueOnce(true)` per case | Branches behave correctly per variant + motion combination | US-6, US-7 |
| `variant="checkmark"` / `variant="none"` paths | No mock — real component render | `checkmark` renders static badge with no dynamic import (factory.calls.length === 0); `none` renders nothing | US-7, US-8 |
| Pinned variant literal | No mock — `as const satisfies readonly ChecklistCompletionVariant[]` | Length 3; values are exactly `['confetti', 'checkmark', 'none']` | US-10 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit (hook + variant + imperative ref) | vitest + @testing-library/react (jsdom) | <4s total | Every push |
| Peer-optional dynamic-import simulation | `vi.doMock('canvas-confetti', ...)` per case | <2s | Every push |
| Bundle smoke (consumer with `variant="checkmark"` only) | Manual or scripted import-graph check — built entry has no static `from "canvas-confetti"` / `require("canvas-confetti")` import | <5s | Pre-merge CI |
| Docs build | `pnpm --filter @tour-kit/docs build` | ~10–20s | Pre-merge CI |

---

## 4. Fake / Mock Implementations — `canvas-confetti` (peer-optional)

`canvas-confetti` is the only external this phase touches. It's a peer-optional dep loaded via `await import('canvas-confetti')` inside a `useEffect`. Tests cover three operational states:

```ts
// PRESENT — happy-path test
vi.doMock('canvas-confetti', () => ({ default: vi.fn() }))
// (re-import the module so the dynamic import sees the mock)
// On the completion edge with variant='confetti' and useReducedMotion → false,
// the default export should be called exactly once with:
//   { particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, disableForReducedMotion: true }

// ABSENT — missing-peer fallback
vi.doMock('canvas-confetti', () => { throw new Error('Cannot find module canvas-confetti') })
// On the completion edge, the try/catch swallows the import error.
// Static badge renders; console.warn fires once with substring 'canvas-confetti'.

// REDUCED-MOTION — must NOT call the import factory
const factory = vi.fn(() => ({ default: vi.fn() }))
vi.doMock('canvas-confetti', factory)
vi.mocked(useReducedMotion).mockReturnValueOnce(true)
// On the completion edge, the JS gate (tier 3) returns BEFORE the await import().
// Assert: factory.mock.calls.length === 0 — the module was never loaded.
```

`vi.doMock` is preferred over `vi.mock` for these tests because the import is dynamic and the desired peer state changes per test. Register the `vi.doMock` before completing the checklist edge that triggers `await import('canvas-confetti')`, and call `vi.doUnmock('canvas-confetti')` / `vi.resetModules()` in cleanup when a test imports the component module after changing mocks.

---

## 5. Test File List

```
packages/checklists/src/__tests__/
├── checklist-launcher.imperative.test.tsx          # NEW — ref API: open/close/toggle/buttonRef
└── checklist-completion.reduced-motion.test.tsx    # NEW — variant matrix + reduced-motion gate +
                                                    #       missing-peer fallback + pinned literal +
                                                    #       state-machine (mount/unmount/reset)
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `checklist-launcher.imperative.test.tsx` | Unit | ≥4 | `ref.open()` opens dialog; `close()` closes; `toggle()` alternates 4×; `buttonRef.current === <button>` node. |
| `checklist-completion.reduced-motion.test.tsx` | Unit + peer-optional | ≥9 | Happy path (confetti fires exactly once); one-shot guarantee (no re-fire on re-render); reduced-motion gate (factory never called); `variant="checkmark"` (no import); `variant="none"` (nothing rendered); missing-peer fallback (one warn); pinned variant tuple; state-machine cases (empty checklist, single-task, 99%→100%, unmount-remount-recomplete, within-mount reset-recomplete). |

---

## 6. Test Setup (Vitest + jsdom + mock patterns)

**Additions to existing `packages/checklists/vitest.config.ts`:** none. The config already covers `src/**/*.test.tsx` under jsdom.

Boilerplate for `checklist-completion.reduced-motion.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, act } from '@testing-library/react'

// Mock @tour-kit/core so we can flip useReducedMotion per test
vi.mock('@tour-kit/core', async (orig) => ({
  ...(await orig<typeof import('@tour-kit/core')>()),
  useReducedMotion: vi.fn(() => false),
}))

const useReducedMotionMock = vi.mocked(
  (await import('@tour-kit/core')).useReducedMotion,
)

afterEach(() => {
  vi.doUnmock('canvas-confetti')
  useReducedMotionMock.mockReturnValue(false)
  vi.restoreAllMocks()
})
```

For `checklist-launcher.imperative.test.tsx`, reuse the existing `packages/checklists/src/__tests__/test-utils.tsx` `<ChecklistProvider>` wrapper.

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| `vi.doMock` over `vi.mock` for `canvas-confetti` | Per-test dynamic-import substitution | The import is `await import('canvas-confetti')` inside a `useEffect`. `vi.doMock` lets us register a per-test factory without poisoning the rest of the file. |
| Reduced-motion test asserts factory IS NEVER INVOKED | `factory.mock.calls.length === 0` | The contract is "tier-3 gate prevents the import" — testing only that the spy isn't called is insufficient; the import factory itself must not run. |
| One-shot per mount, not per session | `hasFiredRef.current = true` inside `useEffect` | Consumers wanting re-fire after reset must `key` the component on a session id. Documented; the test pins this contract via the state-machine "within-mount reset" case. |
| Variant literal pinned as a tuple-satisfying-readonly-union | `['confetti','checkmark','none'] as const satisfies readonly ChecklistCompletionVariant[]` | If a future contributor adds or removes a variant, the test breaks at TS level. Length assertion catches silent additions. |
| `buttonRef` prop preserves the DOM-node escape hatch | Optional prop next to `ref` | Phase 6 widens the forwarded `ref` from `HTMLButtonElement` to `ChecklistLauncherRef` — a type change. `buttonRef` is the one-line migration for consumers who used the old ref. |
| State-machine cases listed via `describe.each` rows | Six rows: empty, single-task, 99→100, unmount-remount, within-mount reset, repeated edge | Each row is one binary assertion (spy count or DOM presence); enumerated in a table to make the test self-documenting. |
| `console.warn` substring match, not exact match | `expect(warn).toHaveBeenCalledWith(expect.stringContaining('canvas-confetti'))` | The exact phrasing of the warn may evolve; the substring is the contract reviewers actually care about. |
| Bundle smoke checks built entries for static `canvas-confetti` imports | `rg "from ['\"]canvas-confetti['\"]|require\\(['\"]canvas-confetti['\"]\\)" packages/checklists/dist/index.{js,cjs}` returns no matches | A broad `grep canvas-confetti` would also catch the allowed dynamic-import string; the guard must detect only static imports/requires. |
| Missing-peer fallback is exercised, not just asserted in JSDoc | `vi.doMock(...)` that throws | A consumer who never installed the peer will hit this path in production; the test must hit it too. |

---

## 8. Example Test Case

The reduced-motion test is the most representative — it exercises the three operational states of `canvas-confetti` (present, absent, never-loaded) and the JS-gate contract that's the load-bearing tier.

```tsx
// packages/checklists/src/__tests__/checklist-completion.reduced-motion.test.tsx (excerpt)
import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChecklistProvider } from '../context/checklist-provider'
import { ChecklistCompletion } from '../components/checklist-completion'

vi.mock('@tour-kit/core', async (orig) => ({
  ...(await orig<typeof import('@tour-kit/core')>()),
  useReducedMotion: vi.fn(() => false),
}))
import { useReducedMotion } from '@tour-kit/core'

function Harness({ taskCount = 1 }: { taskCount?: number }) {
  return (
    <ChecklistProvider checklists={[{ id: 'c', tasks: Array.from({ length: taskCount }, (_, i) => ({ id: `t${i}` })) }]}>
      <ChecklistCompletion checklistId="c" variant="confetti" />
      <CompleteButton />
    </ChecklistProvider>
  )
}

afterEach(() => {
  vi.doUnmock('canvas-confetti')
  vi.mocked(useReducedMotion).mockReturnValue(false)
})

describe('<ChecklistCompletion variant="confetti">', () => {
  it('fires confetti exactly once on the false→true edge', async () => {
    const confettiSpy = vi.fn()
    vi.doMock('canvas-confetti', () => ({ default: confettiSpy }))
    const { getByText } = render(<Harness />)
    await act(async () => { getByText(/complete/i).click() })
    expect(confettiSpy).toHaveBeenCalledTimes(1)
    expect(confettiSpy).toHaveBeenCalledWith({
      particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, disableForReducedMotion: true,
    })
  })

  it('does NOT call canvas-confetti import factory under reduced-motion (tier-3 gate)', async () => {
    const factory = vi.fn(() => ({ default: vi.fn() }))
    vi.doMock('canvas-confetti', factory)
    vi.mocked(useReducedMotion).mockReturnValueOnce(true)
    const { getByText, queryByText } = render(<Harness />)
    await act(async () => { getByText(/complete/i).click() })
    expect(factory).not.toHaveBeenCalled()
    expect(queryByText(/done!/i)).toBeInTheDocument()
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 6 of Tour Kit v2 Package Polish — Checklist Imperative + Completion Celebration.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages. `@tour-kit/checklists` ships onboarding checklists with task dependencies, progress tracking, and persistence. Phase 6 widens `<ChecklistLauncher>`'s forwarded `ref` to expose imperative `{ open, close, toggle }` via `useImperativeHandle`, ships a new `<ChecklistCompletion>` component with three celebration variants, and uses `canvas-confetti` as an OPTIONAL peer dep loaded only via `await import()` inside a `useEffect`. Stack: TypeScript strict mode, React 18+, Vitest + @testing-library/react (jsdom). The library is `canvas-confetti` ^1.9.0 (Context7-confirmed 2026-05-15).

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | `launcherRef.current.open()` opens panel | render + ref call | `getByRole('dialog', { name: /checklist/i })` in DOM |
| US-2 | `toggle()` alternates | 4× toggle | open/close/open/close |
| US-3 | `buttonRef` preserves DOM-node access | createRef + render | `buttonRef.current` is `HTMLButtonElement`; same node as the button role |
| US-4 | Confetti fires once on edge | spy count | exactly 1; correct args |
| US-5 | One-shot — no re-fire on re-render | spy count after re-render | still exactly 1 |
| US-6 | Reduced-motion gate prevents import | factory call count | factory called 0 times |
| US-7 | `variant="checkmark"` — no import | factory call count | 0 calls; badge rendered |
| US-8 | `variant="none"` — nothing rendered | `container.firstChild` | === null |
| US-9 | Missing-peer fallback | `vi.doMock(throw)` + warn spy | static badge rendered; one warn |
| US-10 | Variant literal pinned | `as const satisfies` | length 3, exact tuple |

### Why Fakes Are Required

`canvas-confetti` is the only external. It's a peer-optional dep loaded via `await import()` inside a `useEffect`. The tests must cover three operational states: present (`vi.doMock` with a spy default export), absent (`vi.doMock` that throws), and never-loaded (peer is mocked but JS gate stops the import). `useReducedMotion` is mocked via `vi.mock('@tour-kit/core', ...)` so each test can flip the gate per case. No other fakes are needed.

### What NOT to Test

- Don't test `canvas-confetti` internals — it's an MIT library with its own tests. Verify our call args; trust the library.
- Don't test the existing `ChecklistProvider` or `useChecklist` hook — covered by existing tests. Phase 6 reads from them unchanged.
- Don't test the docs page contents beyond the build succeeding. Fumadocs is the parser; if it builds, the page is valid.
- Don't add a Playwright spec — the celebration is best verified via unit tests (visual proof exists via the docs page live preview).

### Critical: Fake Implementations

See §4 of this plan. Copy the `vi.doMock`-based pattern verbatim. The reduced-motion case uses `vi.fn` as the import factory (not just the default export) so we can assert "the module was never loaded" — that's the load-bearing tier-3 gate contract.

### Test Files to Create

```
packages/checklists/src/__tests__/
├── checklist-launcher.imperative.test.tsx          # NEW
└── checklist-completion.reduced-motion.test.tsx    # NEW
```

### Per-File Coverage Guidance

#### `packages/checklists/src/__tests__/checklist-launcher.imperative.test.tsx`
≥4 cases. Reuse `packages/checklists/src/__tests__/test-utils.tsx`'s `<ChecklistProvider>` wrapper.

1. `const ref = React.createRef<ChecklistLauncherRef>()`; render `<ChecklistLauncher ref={ref} checklistId="onboarding" />`; `await act(() => ref.current!.open())`; assert `getByRole('dialog', { name: /checklist/i })` is in the document.
2. After (1), call `ref.current!.close()`; assert the dialog is gone (`queryByRole('dialog')` returns null).
3. `ref.current!.toggle()` four times; assert dialog visibility alternates `open, close, open, close`.
4. `const buttonRef = React.createRef<HTMLButtonElement>()`; render with both `ref` and `buttonRef`; assert `buttonRef.current` is an `HTMLButtonElement` and equals `getByRole('button', { name: /open checklist/i })`.

#### `packages/checklists/src/__tests__/checklist-completion.reduced-motion.test.tsx`
≥9 cases organized in 4 `describe` blocks plus a pinned-literal block:

**`describe('confetti happy path')`**
- (1) `vi.doMock('canvas-confetti', () => ({ default: vi.fn() }))`; complete the last task; assert `confettiSpy.mock.calls.length === 1` with the exact args.
- (2) After (1), force re-render; assert `confettiSpy.mock.calls.length === 1` (no re-fire).

**`describe('reduced-motion gate')`**
- (3) `factory = vi.fn(() => ({ default: vi.fn() }))`; `vi.doMock('canvas-confetti', factory)`; `useReducedMotion.mockReturnValueOnce(true)`; complete the last task; assert `factory.mock.calls.length === 0` and the static badge is rendered with `data-tk-reduced-motion="true"`.

**`describe('variant matrix')`**
- (4) `variant="checkmark"`; complete the last task; assert `factory.mock.calls.length === 0` and the badge is rendered with label "Done!".
- (5) `variant="none"`; complete the last task; assert `container.firstChild === null`.

**`describe('missing peer fallback')`**
- (6) `vi.doMock('canvas-confetti', () => { throw new Error('Cannot find module canvas-confetti') })`; complete the last task; assert `console.warn` was called once with `expect.stringContaining('canvas-confetti')`; static badge is rendered.

**`describe('state machine')`** — use `it.each`
- (7) Empty checklist (zero tasks) → no celebration fires.
- (8) Single-task complete → fires once.
- (9) 99% → 100% in two steps → fires once on the final step.
- (10) Unmount → remount → re-complete → fires once after remount.
- (11) Within-mount: complete → reset → complete again → no additional fire (one-shot per mount).

**Pinned literal**
- (12) `const VARIANTS = ['confetti', 'checkmark', 'none'] as const satisfies readonly ChecklistCompletionVariant[]; expect(VARIANTS).toHaveLength(3)`.

### Data Model Notes

- `ChecklistLauncherRef` is an `interface` (per Phase 6's data-model rule); tests use `React.createRef<ChecklistLauncherRef>()`.
- `ChecklistCompletionVariant` is a closed `type` literal union. The pinned tuple is `as const satisfies readonly ChecklistCompletionVariant[]`.
- `useChecklistCelebration` returns `{ shouldFire, hasCelebrated }`; tests assert through behaviour (spy counts + badge presence), not by reading the hook's return directly.

### Success Criteria

- `pnpm --filter @tour-kit/checklists typecheck` exits 0
- `pnpm --filter @tour-kit/checklists test -- --run` exits 0 with both new test files green
- `launcherRef.current!.open()` opens the panel without simulating a DOM click
- Under `useReducedMotion → true`, the `canvas-confetti` import factory is NEVER invoked (factory.mock.calls.length === 0)
- `variant="checkmark"` and `variant="none"` paths never attempt the dynamic import
- Missing-peer fallback emits exactly one `console.warn` and renders the static badge
- Existing `<ChecklistLauncher>` tests in `packages/checklists/src/__tests__/` stay green; consumers that did NOT pass a `ref` see byte-identical behaviour
- `pnpm --filter @tour-kit/docs build` exits 0; `imperative-api.mdx` appears in the sidebar
- Build smoke: `rg "from ['\"]canvas-confetti['\"]|require\\(['\"]canvas-confetti['\"]\\)" packages/checklists/dist/index.js packages/checklists/dist/index.cjs` returns no matches (dynamic import string is allowed; static import/require is not)

### Expected File Structure at End

```
packages/checklists/src/__tests__/
├── checklist-launcher.imperative.test.tsx          # NEW
└── checklist-completion.reduced-motion.test.tsx    # NEW
```

---

## 10. Run Commands

```bash
# Fast path
pnpm --filter @tour-kit/checklists test -- --run checklist-launcher.imperative checklist-completion.reduced-motion

# Full per-package suite (catches regressions in existing tests)
pnpm --filter @tour-kit/checklists test -- --run

# Build + bundle smoke (no static canvas-confetti import)
pnpm --filter @tour-kit/checklists build
! rg "from ['\"]canvas-confetti['\"]|require\\(['\"]canvas-confetti['\"]\\)" packages/checklists/dist/index.js packages/checklists/dist/index.cjs

# Docs build
pnpm --filter @tour-kit/docs build

# Coverage
pnpm --filter @tour-kit/checklists test -- --coverage
```
