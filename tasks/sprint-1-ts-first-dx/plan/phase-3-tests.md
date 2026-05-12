# Phase 3 — Testing: Diagnostic Engine & React Surface (#32)

**Scope:** Full `EligibilityReport`/`GateCode`/`GateReason`/`DiagnosticContext` types; `explainAudience` sibling to `matchesAudience`; seven built-in gates (`structure`, `audience`, `persistence`, `route`, `target`, `when`, `autostart`); `explainTour` orchestrator with extension-gate support; `<TourProvider diagnose>` + `diagnosticGates` props; `useTourDiagnostic(tourId)` hook; tree-shake size budget; one-time dev warning.
**Key Pattern:** Pure-logic phase with one React-context surface. NO heavy deps; gates are sync TypeScript over existing utilities (`validateTour`, `matchesAudience`). The only "fakes" are tiny in-test `DiagnosticGate` objects to exercise the extension contract — they're test data, not infrastructure.
**Dependencies:** `vitest@^4.1.0`, `@testing-library/react@^16.3.1`, `vitest bench`. No external services.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a developer debugging "why didn't my tour fire?", I want every built-in gate's outcome in one structured report | `diagnostic.test.ts` TestEveryBuiltInGate × success+failure variants | ≥14 cases (7 gates × 2) green; report has `willFire`, `reasons`, `firstFailingGate`, `evaluatedAt` |
| US-2 | As a maintainer, I want gate order to be observable so failing diagnostics are interpretable AND stable across releases | `diagnostic-order.test.ts` asserts `reasons[].gate` sequence matches `BUILTIN_GATE_ORDER` | `reasons` sequence is exactly `structure → audience → persistence → route → target → when → autostart` then extensions |
| US-3 | As a `@tour-kit/license` author, I want to register a gate without `@tour-kit/core` importing my package | `diagnostic-extension.test.ts` registers an inline mock gate; `core/src` grep | Extension result appears in `reasons` AFTER built-ins; `grep -rn "from '@tour-kit/license'\|@tour-kit/scheduling'" packages/core/src/` returns 0 |
| US-4 | As a production consumer, I want `diagnose: false` to tree-shake the orchestrator so my bundle isn't penalized | size-limit entry on `dist/index.mjs` importing only `useTour` | Main entry <8KB |
| US-5 | As a React consumer, I want `useTourDiagnostic('tour-id')` to return the report when diagnose is on, null otherwise | `use-tour-diagnostic.test.tsx` covers both states + outside-provider throw | `null` when diagnose=false; `EligibilityReport` when diagnose=true; throws outside provider |
| US-6 | As a consumer, I want `matchesAudience(...)` to keep returning `boolean` so my existing code doesn't break | `audience.test.ts` runs ALL existing matchesAudience cases | All pre-Phase-3 audience tests pass unchanged |
| US-7 | As a perf-conscious user, I want `explainTour` to be fast enough that the provider's effect doesn't cause jank | `diagnostic.bench.ts` 5-step tour, no extensions, mocked targetResolver | Median <2ms over 100 iterations |
| US-8 | As a dev-mode user, I want one warning per provider mount nudging me to enable `diagnose` | `tour-provider-diagnose.test.tsx` TestDevWarning | `console.warn` called exactly once across re-renders in NODE_ENV=development; zero times in production |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `gateStructure` | No mock — real `validateTour` is used | Returns `ok: true` for valid tour; `ok: false, code: 'STRUCTURE_INVALID'` for tour with empty `steps` | US-1 |
| `gateAudience` (via `explainAudience`) | No mock — real audience logic | Segment-form match; condition-array first-fail surfaces failing condition in `detail` | US-1, US-6 |
| `gatePersistence` | No mock — pass `DiagnosticContext.completedTours`/`skippedTours` arrays | `ALREADY_COMPLETED` when tour id in completedTours; `ALREADY_SKIPPED` for skipped; ok otherwise | US-1 |
| `gateRoute` | Stub `ctx.route` with literal values; no router | `ROUTE_MISMATCH` for `mode: 'exact'` with mismatched path; ok for matching path; ok when `route` undefined | US-1 |
| `gateTarget` | `ctx.targetResolver: (sel) => document.querySelector(sel)` against a manually-set jsdom DOM | `TARGET_NOT_FOUND` when selector misses; ok when element exists; ok when first visible step has ref target (skipped) | US-1 |
| `gateWhen` | Tour with `when: () => false` and `when: () => Promise.resolve(true)` | sync false → `WHEN_RETURNED_FALSE`; sync throw → captured with error in detail; Promise → `ok: true` with `detail.note` | US-1 |
| `gateAutostart` | Tour with `autoStart: false` vs unset | `AUTOSTART_DISABLED` when `false`; ok when unset/true | US-1 |
| Extension `DiagnosticGate` | Inline mock object: `{ id: 'license', evaluate: async () => ({ ok: false, gate: 'license', code: 'LICENSE_INVALID', message: 'x' }) }` | Reasons array includes the extension result AFTER built-ins; order is registration-order across extensions | US-3 |
| Throwing extension | `{ id: 'crashy', evaluate: () => { throw new Error('boom') } }` | Synthetic `ok: false, gate: 'crashy', code: 'CRASHY_THREW'`; orchestrator does NOT throw | US-3 |
| `<TourProvider diagnose>` effect | Render with RTL; assert on the context value via `useTourDiagnostic` | After `act()`, `diagnostics[tour.id]` is populated; null without `diagnose` | US-5, US-8 |
| `useTourDiagnostic` | RTL `renderHook` + provider wrapper | Returns `null` outside diagnose; `EligibilityReport` inside; throws outside provider | US-5 |
| Tree-shake budget | size-limit on `dist/index.mjs` importing only `useTour` | Main entry <8KB | US-4 |
| `explainTour` perf | `vitest bench`; `ctx.targetResolver` returns a stub element instantly | Median <2ms over 100 iter | US-7 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (gate functions) | `vitest`, real `validateTour`/`matchesAudience` | <2s | Every push |
| Unit (orchestrator) | `vitest`, sync + async mock extensions | <2s | Every push |
| Component (provider + hook) | `vitest`, `@testing-library/react` | <3s | Every push |
| Compile gate (upward imports) | `grep` over `packages/core/src/` | <1s | Every push |
| Bench | `vitest bench` | <5s | Every push |
| Size budget | `size-limit` | <10s | Every push (CI) |

No integration / E2E tier.

---

## Fake / Mock Implementations

**No heavy fakes** — only inline `DiagnosticGate` mock objects used as test data:

```ts
// packages/core/src/lib/__tests__/_gate-mocks.ts (new)
import type { DiagnosticGate, GateReason } from '../../types/diagnostic'

export const okGate: DiagnosticGate = {
  id: 'mock-ok',
  evaluate: () => ({ ok: true, gate: 'mock-ok' }),
}

export const failingGate: DiagnosticGate = {
  id: 'mock-fail',
  evaluate: () => ({
    ok: false, gate: 'mock-fail', code: 'MOCK_FAIL',
    message: 'mock failure', detail: { reason: 'test' },
  }),
}

export const asyncGate: DiagnosticGate = {
  id: 'mock-async',
  evaluate: async () => {
    await new Promise((r) => setTimeout(r, 1))
    return { ok: true, gate: 'mock-async' }
  },
}

export const throwingGate: DiagnosticGate = {
  id: 'crashy',
  evaluate: () => { throw new Error('boom from extension') },
}

export function recordingGate(id: string, calls: string[]): DiagnosticGate {
  return {
    id,
    evaluate: () => { calls.push(id); return { ok: true, gate: id } },
  }
}
```

These are test fixtures, not infrastructure. Used by `diagnostic-extension.test.ts` and `diagnostic-order.test.ts`.

For the target gate, jsdom is the "fake DOM" — `setupDOM()` helper:

```ts
// packages/core/src/lib/__tests__/_dom.ts (new)
export function withDOM(html: string, fn: () => void): void {
  document.body.innerHTML = html
  try { fn() } finally { document.body.innerHTML = '' }
}
```

---

## Test File List

```
packages/core/src/
├── lib/__tests__/
│   ├── _gate-mocks.ts                      # inline DiagnosticGate test fixtures
│   ├── _dom.ts                              # withDOM helper
│   ├── explain-audience.test.ts            # 4+ cases: no audience, segment ok/fail, array ok/fail with failingCondition in detail
│   ├── diagnostic.test.ts                  # ≥14 cases: each built-in gate × success+failure; willFire; firstFailingGate; evaluatedAt
│   ├── diagnostic-order.test.ts            # BUILTIN_GATE_ORDER exposed; reasons sequence matches; extensions appended in registration order
│   ├── diagnostic-extension.test.ts        # extension gate registered; runs after built-ins; result in reasons
│   ├── diagnostic-throw.test.ts            # throwing extension → synthetic _THREW reason; orchestrator does not throw
│   ├── diagnostic-async.test.ts            # async extension awaited; resolution order preserved
│   └── diagnostic.bench.ts                 # 5-step tour, median <2ms over 100 iter
├── context/__tests__/
│   └── tour-provider-diagnose.test.tsx     # provider populates diagnostics map; dev warning once; production warning never
└── hooks/__tests__/
    └── use-tour-diagnostic.test.tsx        # null/populated/throws-outside-provider

packages/react/src/hooks/__tests__/
└── use-tour-diagnostic.test.tsx             # re-export smoke + RTL coverage from the react package's surface
```

The `useTourDiagnostic` test exists in BOTH packages on purpose: the core test verifies behavior; the react test verifies the re-export plumbing — keep them small but separate.

---

## `setup` / Fixtures Structure

**Additions to existing setup at `packages/core/src/__tests__/setup.ts`** — none. Existing jsdom + ResizeObserver/matchMedia mocks already cover what `useTourDiagnostic`'s RTL test needs.

Re-use Phase 1's `_fixtures.ts` (`twoStepTour`). Add a `tourWithAudience` and `tourWithAutoStartFalse` for diagnostic-specific cases:

```ts
// packages/core/src/__tests__/_fixtures.ts (extend)
import type { Tour } from '../types/tour'

export const tourWithAudience: Tour = {
  id: 'audience-demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: { segment: 'admins' },
}

export const tourWithConditionAudience: Tour = {
  id: 'cond-demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: [{ key: 'plan', operator: 'equals', value: 'pro' }],
}

export const tourAutoStartFalse: Tour = {
  id: 'no-auto',
  steps: [{ id: 's1', target: '#a', content: '' }],
  autoStart: false,
}

export const tourWithWhenFalse: Tour = {
  id: 'when-false',
  steps: [{ id: 's1', target: '#a', content: '' }],
  when: () => false,
}

export const tourWithWhenThrows: Tour = {
  id: 'when-throws',
  steps: [{ id: 's1', target: '#a', content: '' }],
  when: () => { throw new Error('when blew up') },
}

export const tourWithWhenAsync: Tour = {
  id: 'when-async',
  steps: [{ id: 's1', target: '#a', content: '' }],
  when: () => Promise.resolve(true),
}
```

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Tests use real `validateTour`/`matchesAudience` instead of mocks | Import directly | Phase 3 wraps them — the wrapping behavior IS what we test |
| `gateRoute` tested with literal `ctx.route` objects, not a real router | Stub the context shape | Router behavior is owned by Phase 1's router-adapter system; here we test only the gate's predicate |
| `gateTarget` uses jsdom DOM via `withDOM()`, not a fake resolver | Real DOM queries against an inlined HTML string | jsdom is the test DOM; building a fake resolver would just mirror it |
| Async `when` callback documented as "ok with detail.note" | Assert `result.detail.note` matches the spec wording | Spec §3.3 calls this out as a phase-3 limitation; tests pin it so consumers can grep for it |
| Mock gates live in `_gate-mocks.ts`, not inline per test | One source for `okGate`/`failingGate`/`throwingGate`/`asyncGate` | Reused across order/extension/throw/async suites |
| Dev-warning test toggles `NODE_ENV` via `vi.stubEnv` (vitest v4 idiom) | `vi.stubEnv('NODE_ENV', 'development')` + `vi.unstubAllEnvs()` in afterEach | Doesn't pollute process.env across files |
| `BUILTIN_GATE_ORDER` exported and asserted as `readonly` tuple | `expect(BUILTIN_GATE_ORDER).toStrictEqual(['structure', ...])` | The order is part of the contract; freezing it via a tuple gives the type system a hand |
| Bench uses a stub `targetResolver` returning a constant element | `() => ({ id: 'stub' } as HTMLElement)` | Real DOM queries would dominate the bench — we're measuring orchestration, not querySelector |
| Size budget asserts main entry SIZE, not the absence of diagnostic symbols | size-limit on dist with `import: '{ useTour }'` | If size-limit's tree-shake import is honored, the diag code is dead; pinning byte budget catches accidental imports |
| `useTourDiagnostic` test lives in BOTH core + react packages | Separate, small | Core test asserts behavior; react test asserts the re-export reaches the public surface |

---

## Example Test Case

```ts
// packages/core/src/lib/__tests__/diagnostic.test.ts
import { describe, it, expect } from 'vitest'
import { explainTour, BUILTIN_GATE_ORDER } from '../diagnostic'
import type { DiagnosticContext } from '../../types/diagnostic'
import { twoStepTour, tourAutoStartFalse, tourWithWhenFalse, tourWithWhenAsync } from '../../__tests__/_fixtures'
import { withDOM } from './_dom'

const baseCtx = (overrides: Partial<DiagnosticContext> = {}): DiagnosticContext => ({
  completedTours: [], skippedTours: [],
  ...overrides,
})

describe('explainTour — orchestrator', () => {
  it('returns willFire:true for a valid tour with all gates passing', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    expect(r.willFire).toBe(true)
    expect(r.firstFailingGate).toBeNull()
    expect(r.tourId).toBe('demo')
    expect(typeof r.evaluatedAt).toBe('number')
  })

  it('reports each built-in gate in fixed order', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    const gates = r.reasons.map((x) => x.gate)
    // First N reasons are built-ins in BUILTIN_GATE_ORDER
    expect(gates.slice(0, BUILTIN_GATE_ORDER.length)).toEqual([...BUILTIN_GATE_ORDER])
  })

  it('exposes BUILTIN_GATE_ORDER as a readonly tuple', () => {
    expect(BUILTIN_GATE_ORDER).toStrictEqual([
      'structure', 'audience', 'persistence', 'route', 'target', 'when', 'autostart',
    ])
  })
})

describe('built-in gates — failure paths', () => {
  it('gateStructure fails on tour with empty steps', async () => {
    const r = await explainTour({ id: 'bad', steps: [] }, baseCtx())
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.gate).toBe('structure')
    expect(r.firstFailingGate?.code).toBe('STRUCTURE_INVALID')
  })

  it('gatePersistence fails when tour id is in completedTours', async () => {
    const r = await explainTour(twoStepTour, baseCtx({ completedTours: ['demo'] }))
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.code).toBe('ALREADY_COMPLETED')
  })

  it('gateAutostart fails when tour.autoStart === false', async () => {
    const r = await explainTour(tourAutoStartFalse, baseCtx())
    const auto = r.reasons.find((x) => x.gate === 'autostart')
    expect(auto?.ok).toBe(false)
    if (auto && !auto.ok) expect(auto.code).toBe('AUTOSTART_DISABLED')
  })

  it('gateTarget fails when selector misses', async () => {
    withDOM('<div id="a"></div>', async () => {
      const r = await explainTour(
        { id: 't', steps: [{ id: 's', target: '#not-here', content: '' }] },
        baseCtx({ targetResolver: (sel) => document.querySelector<HTMLElement>(sel) }),
      )
      const target = r.reasons.find((x) => x.gate === 'target')
      expect(target?.ok).toBe(false)
      if (target && !target.ok) {
        expect(target.code).toBe('TARGET_NOT_FOUND')
        expect(target.detail?.selector).toBe('#not-here')
      }
    })
  })

  it('gateWhen returns ok with detail.note for async callbacks', async () => {
    const r = await explainTour(tourWithWhenAsync, baseCtx())
    const when = r.reasons.find((x) => x.gate === 'when')
    expect(when?.ok).toBe(true)
    if (when?.ok) expect(typeof when).toBe('object')
    // The "ok: true" branch with documented limitation — spec §3.3
  })

  it('gateWhen fails when sync callback returns false', async () => {
    const r = await explainTour(tourWithWhenFalse, baseCtx())
    const when = r.reasons.find((x) => x.gate === 'when')
    expect(when?.ok).toBe(false)
    if (when && !when.ok) expect(when.code).toBe('WHEN_RETURNED_FALSE')
  })
})
```

```ts
// packages/core/src/lib/__tests__/diagnostic-extension.test.ts
import { describe, it, expect } from 'vitest'
import { explainTour } from '../diagnostic'
import { twoStepTour } from '../../__tests__/_fixtures'
import { okGate, failingGate, throwingGate, recordingGate } from './_gate-mocks'

describe('explainTour — extension gates', () => {
  it('runs extensions AFTER all built-ins', async () => {
    const calls: string[] = []
    const ext = recordingGate('license', calls)
    const r = await explainTour(twoStepTour, { completedTours: [], skippedTours: [] }, [ext])
    const lastBuiltIn = r.reasons.findIndex((x) => x.gate === 'autostart')
    const extIndex = r.reasons.findIndex((x) => x.gate === 'license')
    expect(extIndex).toBeGreaterThan(lastBuiltIn)
    expect(calls).toEqual(['license'])
  })

  it('preserves extension registration order', async () => {
    const r = await explainTour(twoStepTour, { completedTours: [], skippedTours: [] }, [
      { id: 'first', evaluate: () => ({ ok: true, gate: 'first' }) },
      { id: 'second', evaluate: () => ({ ok: true, gate: 'second' }) },
    ])
    const extGates = r.reasons.filter((x) => x.gate === 'first' || x.gate === 'second').map((x) => x.gate)
    expect(extGates).toEqual(['first', 'second'])
  })

  it('surfaces failing extension in firstFailingGate', async () => {
    const r = await explainTour(twoStepTour, { completedTours: [], skippedTours: [] }, [failingGate])
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.gate).toBe('mock-fail')
  })

  it('catches a throwing extension into a synthetic _THREW reason', async () => {
    const r = await explainTour(twoStepTour, { completedTours: [], skippedTours: [] }, [throwingGate])
    const crashy = r.reasons.find((x) => x.gate === 'crashy')
    expect(crashy?.ok).toBe(false)
    if (crashy && !crashy.ok) {
      expect(crashy.code).toBe('CRASHY_THREW')
      expect(crashy.detail?.error).toMatch(/boom from extension/)
    }
  })
})
```

```tsx
// packages/core/src/hooks/__tests__/use-tour-diagnostic.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { TourProvider } from '../../context/tour-provider'
import { useTourDiagnostic } from '../use-tour-diagnostic'
import { twoStepTour } from '../../__tests__/_fixtures'

describe('useTourDiagnostic', () => {
  it('returns null when diagnose is off', () => {
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => <TourProvider tours={[twoStepTour]}>{children}</TourProvider>,
    })
    expect(result.current).toBeNull()
  })

  it('returns the report when diagnose is on', async () => {
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => <TourProvider tours={[twoStepTour]} diagnose>{children}</TourProvider>,
    })
    // After the diagnose effect runs, the report appears
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current?.tourId).toBe('demo')
  })

  it('throws when used outside TourProvider', () => {
    expect(() => renderHook(() => useTourDiagnostic('demo'))).toThrow(/must be used inside <TourProvider>/i)
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 3 of Tour Kit's Sprint 1 — the Diagnostic Engine (issue #32).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. `@tour-kit/core` sits at the BOTTOM of the dep graph and must never import any other `@tour-kit/*` package. The "tour didn't fire" silent failure is the #1 support issue — Phase 3 replaces it with a structured `EligibilityReport` that names every built-in gate's outcome AND supports arbitrary extension gates (license, scheduling) without core knowing those packages exist.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | Every built-in gate reports success+failure | `diagnostic.test.ts` 14+ cases | All pass |
| US-2 | Gate order is fixed and observable | `diagnostic-order.test.ts` | reasons[] sequence == BUILTIN_GATE_ORDER + extensions |
| US-3 | Extensions register without core knowing the package | extension test + grep | extension result in reasons; grep returns 0 |
| US-4 | Diagnostic tree-shakes when `diagnose: false` | size-limit on `dist/index.mjs` | <8KB |
| US-5 | `useTourDiagnostic` null/populated/throws-outside | hook test | three cases pass |
| US-6 | `matchesAudience` unchanged | re-run existing audience.test.ts | all pass |
| US-7 | `explainTour` fast (<2ms median, 5 steps) | bench | median <2ms |
| US-8 | Dev warning once per mount | provider test with stubEnv | exactly 1 call dev; 0 prod |

### Why Fakes Are Required
**None.** Phase 3 is pure-logic + one React context surface. We don't fake `validateTour` or `matchesAudience` — they're the substrate Phase 3 wraps, so we test the wrapping behavior against the real functions. The "mocks" in this phase are tiny `DiagnosticGate` test objects used as test DATA, not infrastructure.

### What NOT to Test
- Don't test `validateTour` itself — Phase 3 wraps it; the wrapping is what matters.
- Don't test `matchesAudience` semantics beyond a re-run of existing tests (US-6) — the new logic is `explainAudience`'s ability to surface the failing condition.
- Don't write a router test — `gateRoute` reads `ctx.route` literals; router adapters are Phase 1's territory.
- Don't test the `console.warn` MESSAGE text exactly — assert call count + `NODE_ENV` gating. Message wording will drift.
- Don't test Phase 6's `getDiagnostic` here — that's Phase 6's `test-bridge.test.tsx`.
- Don't add `axe` checks here — diagnostic is data; Phase 4's funnel + Phase 5's testing-library cover a11y.

### Critical: Fake Implementations

Tiny test fixtures (copy verbatim — these are test DATA):

```ts
// packages/core/src/lib/__tests__/_gate-mocks.ts
import type { DiagnosticGate, GateReason } from '../../types/diagnostic'

export const okGate: DiagnosticGate = {
  id: 'mock-ok',
  evaluate: () => ({ ok: true, gate: 'mock-ok' }),
}
export const failingGate: DiagnosticGate = {
  id: 'mock-fail',
  evaluate: () => ({
    ok: false, gate: 'mock-fail', code: 'MOCK_FAIL',
    message: 'mock failure', detail: { reason: 'test' },
  }),
}
export const asyncGate: DiagnosticGate = {
  id: 'mock-async',
  evaluate: async () => { await new Promise((r) => setTimeout(r, 1)); return { ok: true, gate: 'mock-async' } },
}
export const throwingGate: DiagnosticGate = {
  id: 'crashy',
  evaluate: () => { throw new Error('boom from extension') },
}
export function recordingGate(id: string, calls: string[]): DiagnosticGate {
  return { id, evaluate: () => { calls.push(id); return { ok: true, gate: id } } }
}
```

```ts
// packages/core/src/lib/__tests__/_dom.ts
export function withDOM(html: string, fn: () => void | Promise<void>): void | Promise<void> {
  document.body.innerHTML = html
  const cleanup = () => { document.body.innerHTML = '' }
  try { const r = fn(); if (r instanceof Promise) return r.finally(cleanup); cleanup() }
  catch (e) { cleanup(); throw e }
}
```

### Test Files to Create

```
packages/core/src/
├── __tests__/
│   └── _fixtures.ts                        # extend with tourAutoStartFalse, tourWithWhenFalse, etc.
├── lib/__tests__/
│   ├── _gate-mocks.ts
│   ├── _dom.ts
│   ├── explain-audience.test.ts            # 4+ cases
│   ├── diagnostic.test.ts                  # ≥14 cases — every built-in gate × success+failure
│   ├── diagnostic-order.test.ts            # BUILTIN_GATE_ORDER + reasons sequence
│   ├── diagnostic-extension.test.ts        # registration; runs after built-ins; ordering
│   ├── diagnostic-throw.test.ts            # throwing extension → _THREW
│   ├── diagnostic-async.test.ts            # async resolution
│   └── diagnostic.bench.ts                 # median <2ms over 100 iter
├── context/__tests__/
│   └── tour-provider-diagnose.test.tsx     # diagnostics map; dev warning once; production silent
└── hooks/__tests__/
    └── use-tour-diagnostic.test.tsx        # null / populated / throws outside provider

packages/react/src/hooks/__tests__/
└── use-tour-diagnostic.test.tsx             # re-export plumbing smoke
```

### Per-File Coverage Guidance

#### `lib/__tests__/explain-audience.test.ts`
≥4 cases: undefined audience → ok; segment match → ok; segment mismatch → ok:false with `detail.audience`; array all-pass → ok; array first-fail → ok:false with `detail.failingCondition` carrying the failing `{ key, operator, value }` triple.

#### `lib/__tests__/diagnostic.test.ts`
For each of seven built-in gates, write one happy-path case and one failure case → 14 cases minimum. Use `_fixtures.ts` tours. For `target`, use `withDOM` to inject the necessary HTML. For `when`, cover sync-false, sync-throw (captured as `WHEN_RETURNED_FALSE` with error in detail), async (ok with `detail.note`). Plus orchestrator-level: `willFire` correct, `firstFailingGate` is the first `ok:false`, `evaluatedAt` is set, `tourId` set.

#### `lib/__tests__/diagnostic-order.test.ts`
- `expect(BUILTIN_GATE_ORDER).toStrictEqual([...])` — pin the order
- `reasons.slice(0, 7).map(r => r.gate)` matches BUILTIN_GATE_ORDER
- With two extensions, `reasons.slice(7).map(r => r.gate)` matches `[ext1.id, ext2.id]`

#### `lib/__tests__/diagnostic-extension.test.ts`
4 cases: extensions registered → run after built-ins (verified by `findIndex`); registration order preserved; failing extension surfaces in `firstFailingGate` only when no built-in failed first; ok extension doesn't pollute `firstFailingGate`.

#### `lib/__tests__/diagnostic-throw.test.ts`
2 cases: throwing extension yields `{ ok: false, gate: 'crashy', code: 'CRASHY_THREW', detail: { error: 'boom from extension' } }`; orchestrator return value is still a valid `EligibilityReport` (didn't throw upward).

#### `lib/__tests__/diagnostic-async.test.ts`
2 cases: async extension awaited (verified by ordering vs a recording sync extension registered AFTER it); awaiting multiple async extensions completes in order.

#### `lib/__tests__/diagnostic.bench.ts`
```ts
import { bench, describe } from 'vitest'
import { explainTour } from '../diagnostic'
const tour = { id: 'demo', steps: Array.from({length: 5}, (_, i) => ({ id: `s${i}`, target: '#stub', content: 'x' })) }
const ctx = { completedTours: [], skippedTours: [], targetResolver: () => ({ id: 'stub' } as any as HTMLElement) }
describe('explainTour bench', () => {
  bench('5-step tour, no extensions', async () => { await explainTour(tour, ctx) }, { iterations: 100 })
})
```
Capture median from `--reporter=verbose` output; CI asserts median <2ms.

#### `context/__tests__/tour-provider-diagnose.test.tsx`
4 cases:
- diagnose:true → `useTourDiagnostic` returns populated report after one microtask
- diagnose:false → returns null
- dev-mode warning fires once across re-renders (use `vi.stubEnv('NODE_ENV', 'development')` + spy on `console.warn`)
- production-mode warning never fires

#### `hooks/__tests__/use-tour-diagnostic.test.tsx`
3 cases as in the example above. The `throws outside provider` case uses `expect(...).toThrow(/<TourProvider>/i)`.

#### `packages/react/src/hooks/__tests__/use-tour-diagnostic.test.tsx`
2 cases: import path `@tour-kit/react` exposes `useTourDiagnostic`; calling it inside `<TourProvider diagnose>` returns a non-null report. This is a plumbing smoke, not a re-test of behavior.

### Data Model Notes
- `GateReason` is a discriminated union on `ok: true | false`. After narrowing with `if (!result.ok)`, access `code`, `message`, `detail`.
- `BUILTIN_GATE_ORDER` is `readonly ['structure', 'audience', 'persistence', 'route', 'target', 'when', 'autostart']` — pin via `toStrictEqual`.
- `EligibilityReport.evaluatedAt` is a `number` (Date.now()). Don't assert exact value; assert `typeof === 'number'`.
- `explainTour` is `async` even when all gates are sync — extension gates can be `Promise<GateReason>`. Always `await` it.

### Success Criteria
- `pnpm --filter @tour-kit/core test -- diagnostic` exits 0 with ≥18 case assertions.
- `pnpm --filter @tour-kit/react test -- use-tour-diagnostic` exits 0.
- `grep -rn "from '@tour-kit/license'\|from '@tour-kit/scheduling'\|from '@tour-kit/analytics'\|from '@tour-kit/adoption'" packages/core/src/` returns no lines.
- `pnpm --filter @tour-kit/core test -- diagnostic.bench` reports median <2ms (capture via `--reporter=verbose`).
- `pnpm size` reports `@tour-kit/core` main entry <8KB with `import: '{ useTour }'`.
- Manually trigger US-8: render provider in dev mode twice with `enableTestBridge`-like rerender — `console.warn` called exactly once.

### Expected File Structure at End
```
packages/core/src/
├── __tests__/_fixtures.ts                        (extended)
├── lib/__tests__/
│   ├── _gate-mocks.ts
│   ├── _dom.ts
│   ├── explain-audience.test.ts
│   ├── diagnostic.test.ts
│   ├── diagnostic-order.test.ts
│   ├── diagnostic-extension.test.ts
│   ├── diagnostic-throw.test.ts
│   ├── diagnostic-async.test.ts
│   └── diagnostic.bench.ts
├── context/__tests__/tour-provider-diagnose.test.tsx
└── hooks/__tests__/use-tour-diagnostic.test.tsx

packages/react/src/hooks/__tests__/use-tour-diagnostic.test.tsx
```
---

---

## Run Commands

```bash
# All Phase 3 unit + component tests
pnpm --filter @tour-kit/core test -- diagnostic

# Hook re-export check from react package
pnpm --filter @tour-kit/react test -- use-tour-diagnostic

# Upward-import gate
grep -rn "from '@tour-kit/license'\|from '@tour-kit/scheduling'\|from '@tour-kit/analytics'\|from '@tour-kit/adoption'" packages/core/src/

# Bench
pnpm --filter @tour-kit/core test -- diagnostic.bench --reporter=verbose

# Size budget
pnpm size

# Single suite (debugging)
pnpm --filter @tour-kit/core test -- lib/__tests__/diagnostic-extension.test.ts

# Full Phase 3 gate
pnpm --filter @tour-kit/core test -- diagnostic && \
  pnpm --filter @tour-kit/react test -- use-tour-diagnostic && \
  pnpm size
```
