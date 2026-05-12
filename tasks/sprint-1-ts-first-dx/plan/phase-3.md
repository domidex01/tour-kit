# Phase 3 — Diagnostic Engine & React Surface (#32)

**Duration:** Days 7–10 (~17–18 hours)
**Depends on:** Phase 0 (DiagnosticGate stub; decision log), Phase 1 (`Tour<TStep>`)
**Blocks:** Phase 6 (`getDiagnostic` in test bridge consumes `EligibilityReport`); future `<TourDebugger>` (#90)
**Risk Level:** MEDIUM — wide new surface in core; the upward-import rule is easy to violate by reflex
**Stack:** typescript

---

## Objective

Replace the silent "tour didn't fire" failure mode with a structured `EligibilityReport`. `explainTour(tour, ctx, gates?)` runs every built-in gate (structure, audience, persistence, route, target, when, autostart) AND any registered `DiagnosticGate`s (license, scheduling, etc.) without `@tour-kit/core` importing those packages. The provider opts in via `<TourProvider diagnose>`; consumers read state via `useTourDiagnostic(tourId)`. This is the data layer a future `<TourDebugger>` overlay (#90) will render on top of — and the substrate that `tour.getDiagnostic()` exposes to the Phase 6 Playwright bridge.

## What Success Looks Like

1. `pnpm --filter @tour-kit/core test -- diagnostic` exits 0 with ≥18 tests covering each built-in gate (success + failure shapes), the orchestrator (`willFire`, `firstFailingGate`, `evaluatedAt`), and at least one custom gate registered via `diagnosticGates`.
2. `grep -rn "from '@tour-kit/license'\|from '@tour-kit/scheduling'" packages/core/src/` returns nothing.
3. `import { matchesAudience } from '@tour-kit/core'` still returns `boolean` — back-compat preserved.
4. `explainTour` evaluates a 5-step tour in median <2ms over 100 iterations excluding any async DOM wait (`vitest bench`).
5. `useTourDiagnostic('demo')` in a React Testing Library suite returns an `EligibilityReport` whose `firstFailingGate` is `{ ok: false, gate: 'target', code: 'TARGET_NOT_FOUND', ... }` when the target selector is missing.
6. `pnpm --filter @tour-kit/react test` exits 0 with the new hook covered.
7. Bundle: diagnostic code is opt-in. With `diagnose: false` (default), tree-shake removes the orchestrator from the consumer bundle. Verify with a `size-limit` entry: `@tour-kit/core` main entry still <8KB when only `useTour` is imported.

---

## Architecture / Key Design Decisions

```
useTourDiagnostic(tourId) ──► provider.diagnostics[tourId] ──► EligibilityReport
                                       ▲
                                       │
                       <TourProvider diagnose={true}
                                     diagnosticGates={[licenseGate, scheduleGate]}>
                                       │
                                       ▼
                                explainTour(tour, ctx, [
                                  // BUILT-IN gates run in fixed order:
                                  structure, audience, persistence,
                                  route, target, when, autostart,
                                  // then EXTENSION gates from props:
                                  licenseGate, scheduleGate,
                                ])
                                       │
                                       ▼
                                {
                                  tourId,
                                  willFire,                ← all ok
                                  reasons: GateReason[],    ← every gate result
                                  firstFailingGate,         ← first ok:false (null if willFire)
                                  evaluatedAt: Date.now(),
                                }
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Diagnostic types (`GateCode`, `GateReason`, `EligibilityReport`, `DiagnosticContext`) | `interface`/`type` | Internal — never crosses a JSON boundary; `detail` carries `unknown` so callers don't have to widen at the call site |
| `DiagnosticGate` extension contract | `interface` (from Phase 0) | Pure structural — upper packages implement it without core knowing they exist |
| Provider context diagnostic map | `Record<string, EligibilityReport>` in `TourProvider` state | Per-tour cache; invalidated by provider re-render or explicit refresh |
| Hook surface (`useTourDiagnostic`) | Standard React hook returning `EligibilityReport \| null` | `null` when `diagnose: false` or tour not registered |

**Other critical rules for this phase:**
- **NEVER throw from `explainTour`.** Any internal error becomes `{ ok: false, code: 'STRUCTURE_INVALID', detail: { error: e.message } }`. Diagnostics that crash defeat their purpose.
- **`matchesAudience` keeps its boolean signature.** Add `explainAudience` as a sibling export that returns the structured `GateReason`. Don't rewrite the old function.
- **Order of evaluation is fixed and observable.** Tests assert that `firstFailingGate` matches the documented order: structure → audience → persistence → route → target → when → autostart → extensions (in registration order). This stability is part of the contract.
- **`diagnose` defaults to `false`.** In production, the orchestrator must not run. In dev, log a one-time `console.warn` hinting that `diagnose` is available — but only when `process.env.NODE_ENV !== 'production'`.
- **Extension gates run AFTER built-ins.** License/scheduling decisions only matter if the structural/audience/persistence checks pass. This keeps the failure reason informative.

---

## Tasks

### Task 3.1 — Full diagnostic types (1.5h)

**Depends on:** Phase 0 (stub already in place)

Replace the Phase-0 stub with the full type set. Preserve the interfaces, add the rest.

```ts
// packages/core/src/types/diagnostic.ts (modify — Phase 0 had a stub)
export type GateCode =
  | 'STRUCTURE_INVALID'
  | 'AUDIENCE_MISMATCH'
  | 'ALREADY_COMPLETED'
  | 'ALREADY_SKIPPED'
  | 'OUT_OF_WINDOW'
  | 'LICENSE_INVALID' | 'LICENSE_EXPIRED'
  | 'TARGET_NOT_FOUND'
  | 'WHEN_RETURNED_FALSE'
  | 'ROUTE_MISMATCH'
  | 'AUTOSTART_DISABLED'

export type GateName =
  | 'structure' | 'audience' | 'persistence'
  | 'scheduling' | 'license' | 'target' | 'when'
  | 'route' | 'autostart'
  | (string & {})   // string-literal escape for extension gates

export type GateReason =
  | { ok: true; gate: GateName }
  | { ok: false; gate: GateName; code: GateCode | (string & {}); message: string; detail?: Record<string, unknown> }

export interface EligibilityReport {
  tourId: string
  willFire: boolean
  reasons: GateReason[]
  firstFailingGate: Extract<GateReason, { ok: false }> | null
  evaluatedAt: number
}

export interface DiagnosticContext {
  userContext?: Record<string, unknown>
  completedTours: readonly string[]
  skippedTours: readonly string[]
  schedule?: { from?: Date; to?: Date }
  route?: { current: string; matcher: string; mode: 'exact' | 'startsWith' | 'contains' }
  targetResolver?: (selector: string) => HTMLElement | null
}

export interface DiagnosticGate {
  id: string
  evaluate: (ctx: DiagnosticContext) => GateReason | Promise<GateReason>
}
```

Re-export from `src/types/index.ts` so `@tour-kit/core` exposes them publicly.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0. `import type { EligibilityReport } from '@tour-kit/core'` works in a smoke file.

---

### Task 3.2 — `explainAudience` next to `matchesAudience` (1.5h)

**Depends on:** 3.1

```ts
// packages/core/src/lib/audience.ts (modify)

// Existing function unchanged — boolean back-compat.
export function matchesAudience(audience, ctx): boolean { /* existing */ }

// New sibling — structured result.
export function explainAudience(
  audience: AudienceProp | undefined,
  userContext: Record<string, unknown> | undefined
): GateReason {
  if (!audience) return { ok: true, gate: 'audience' }
  // Re-use matchesAudience logic but capture which condition failed.
  // If audience is { segment: 'admins' }, surface that mismatch shape.
  // If audience is array, surface the FIRST failing condition with key/operator/expected/actual.
  if (matchesAudience(audience, userContext)) {
    return { ok: true, gate: 'audience' }
  }
  return {
    ok: false,
    gate: 'audience',
    code: 'AUDIENCE_MISMATCH',
    message: 'User context did not satisfy audience filter',
    detail: { audience, userContext },
  }
}
```

**Implementation note:** Don't duplicate the condition-evaluation logic. Refactor `matchesAudience` internally to share a helper that returns `{ matched: boolean; failingCondition?: AudienceCondition }`, then `matchesAudience` returns `.matched` and `explainAudience` builds the `GateReason` from both fields. Keep the public signature of `matchesAudience` unchanged.

**Sanity check:** Existing audience tests pass. Add ≥3 new tests for `explainAudience` covering segment-form, array-form-pass, array-form-fail (with failing condition surfaced in `detail`).

---

### Task 3.3 — Built-in core gates (4h)

**Depends on:** 3.1, 3.2

Implement seven evaluators in `packages/core/src/lib/diagnostic.ts`. Each returns `GateReason` synchronously where possible; `target` may need async (selector resolution).

```ts
// packages/core/src/lib/diagnostic.ts (new)
import type { Tour } from '../types/tour'
import type { GateReason, DiagnosticContext, EligibilityReport } from '../types/diagnostic'
import { validateTour } from './validate-tour'
import { explainAudience } from './audience'

function gateStructure(tour: Tour): GateReason {
  try {
    validateTour(tour)
    return { ok: true, gate: 'structure' }
  } catch (e) {
    return {
      ok: false, gate: 'structure', code: 'STRUCTURE_INVALID',
      message: (e as Error).message ?? 'Tour failed structural validation',
      detail: { error: (e as Error).message },
    }
  }
}

function gatePersistence(tour: Tour, ctx: DiagnosticContext): GateReason {
  if (ctx.completedTours.includes(tour.id))
    return { ok: false, gate: 'persistence', code: 'ALREADY_COMPLETED', message: `Tour ${tour.id} already completed`, detail: { tourId: tour.id } }
  if (ctx.skippedTours.includes(tour.id))
    return { ok: false, gate: 'persistence', code: 'ALREADY_SKIPPED', message: `Tour ${tour.id} previously skipped`, detail: { tourId: tour.id } }
  return { ok: true, gate: 'persistence' }
}

function gateRoute(tour: Tour, ctx: DiagnosticContext): GateReason {
  if (!ctx.route) return { ok: true, gate: 'route' }
  // Compare ctx.route.current against tour-level route or first-step route.
  // Map mode → matcher predicate.
  // Return ROUTE_MISMATCH with { expected, actual, mode } on miss.
}

function gateTarget(tour: Tour, ctx: DiagnosticContext): GateReason {
  if (!ctx.targetResolver) return { ok: true, gate: 'target' }
  const firstVisibleStep = tour.steps.find(s => s.kind !== 'hidden')
  if (!firstVisibleStep) return { ok: true, gate: 'target' }
  if (typeof firstVisibleStep.target !== 'string') return { ok: true, gate: 'target' } // refs aren't checked in diagnostic mode
  const el = ctx.targetResolver(firstVisibleStep.target)
  return el
    ? { ok: true, gate: 'target' }
    : { ok: false, gate: 'target', code: 'TARGET_NOT_FOUND', message: `Selector ${firstVisibleStep.target} did not resolve`, detail: { selector: firstVisibleStep.target } }
}

function gateWhen(tour: Tour, ctx: DiagnosticContext): GateReason {
  // Only evaluate `tour.when` if present (tour-level when callback).
  // Step-level when() is evaluated at runtime, not in diagnostic.
  // If callback throws → STRUCTURE_INVALID-style envelope under code 'WHEN_RETURNED_FALSE' with the error message in detail.
  // If returns false → WHEN_RETURNED_FALSE.
  // If returns a Promise → not evaluated in sync diagnostic; mark { ok: true } and document the limitation.
}

function gateAutostart(tour: Tour): GateReason {
  // Tour.autoStart === false → AUTOSTART_DISABLED.
  // Tour has no autoStart field or null → ok (manual start is valid).
  if (tour.autoStart === false) return { ok: false, gate: 'autostart', code: 'AUTOSTART_DISABLED', message: 'Tour has autoStart: false', detail: {} }
  return { ok: true, gate: 'autostart' }
}

// Audience gate uses explainAudience() from 3.2.
```

**Implementation notes:**
- Read `packages/core/src/lib/validate-tour.ts` first — its existing error format informs `STRUCTURE_INVALID.detail`.
- Read `packages/core/src/lib/audience.ts` for the existing condition-evaluation logic — reuse via the shared helper from Task 3.2.
- `gateRoute`: respect `step.routeMatch` (`exact` | `startsWith` | `contains`). When the tour has no top-level `route` and only step-level routes, evaluate against the first visible step's route.
- `gateWhen`: keep it sync-only in diagnostic mode. If the callback returns a Promise, return `{ ok: true, gate: 'when' }` with a `detail.note` documenting the limitation. Async-when validation belongs to runtime.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0. Hand-write a 3-line smoke: call `gateAutostart({ id: 't', steps: [], autoStart: false })` → expect `{ ok: false, code: 'AUTOSTART_DISABLED' }`.

---

### Task 3.4 — Orchestrator `explainTour(tour, ctx, gates?)` (2h)

**Depends on:** 3.3

```ts
// packages/core/src/lib/diagnostic.ts (continued)
export const BUILTIN_GATE_ORDER = [
  'structure', 'audience', 'persistence',
  'route', 'target', 'when', 'autostart',
] as const

export async function explainTour(
  tour: Tour,
  ctx: DiagnosticContext,
  extensions: DiagnosticGate[] = []
): Promise<EligibilityReport> {
  const reasons: GateReason[] = []
  const evaluatedAt = Date.now()

  // 1. Built-ins, fixed order.
  reasons.push(gateStructure(tour))
  if (!reasons.at(-1)!.ok) return finalize(tour.id, reasons, evaluatedAt) // structure failure short-circuits everything else
  reasons.push(explainAudience(tour.audience, ctx.userContext))
  reasons.push(gatePersistence(tour, ctx))
  reasons.push(gateRoute(tour, ctx))
  reasons.push(gateTarget(tour, ctx))
  reasons.push(gateWhen(tour, ctx))
  reasons.push(gateAutostart(tour))

  // 2. Extensions, registration order.
  for (const gate of extensions) {
    try {
      const result = await gate.evaluate(ctx)
      reasons.push(result)
    } catch (e) {
      reasons.push({
        ok: false, gate: gate.id, code: `${gate.id.toUpperCase()}_THREW`,
        message: (e as Error).message ?? 'Gate threw',
        detail: { error: (e as Error).message },
      })
    }
  }

  return finalize(tour.id, reasons, evaluatedAt)
}

function finalize(tourId: string, reasons: GateReason[], evaluatedAt: number): EligibilityReport {
  const firstFailingGate = reasons.find((r): r is Extract<GateReason, { ok: false }> => !r.ok) ?? null
  return {
    tourId,
    willFire: firstFailingGate === null,
    reasons,
    firstFailingGate,
    evaluatedAt,
  }
}
```

**Implementation notes:**
- Structure failure short-circuits: nothing else matters when the tour shape is invalid.
- All other built-ins run to completion. Operators care about ALL reasons, not just the first.
- Extension gates run AFTER built-ins. They can be async; built-ins are sync.
- Wrap each extension `evaluate()` in try/catch — extensions can't crash the orchestrator.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0. Write a 5-line test: pass a valid tour with `autoStart: false`; expect `willFire: false`, `firstFailingGate.gate === 'autostart'`.

---

### Task 3.5 — Provider wiring: `diagnose` and `diagnosticGates` (2h)

**Depends on:** 3.4

Modify `packages/core/src/context/tour-provider.tsx`:

```tsx
// Provider prop additions
interface TourProviderProps {
  // ... existing
  diagnose?: boolean
  diagnosticGates?: DiagnosticGate[]
}

export function TourProvider({ diagnose = false, diagnosticGates = [], ...rest }: TourProviderProps) {
  const [diagnostics, setDiagnostics] = useState<Record<string, EligibilityReport>>({})

  // After tours register, when diagnose is true, run explainTour for each.
  useEffect(() => {
    if (!diagnose) return
    let cancelled = false
    const ctx: DiagnosticContext = {
      userContext, completedTours, skippedTours,
      route: routeFromAdapter,
      targetResolver: (sel) => document.querySelector<HTMLElement>(sel),
    }
    Promise.all(tours.map(t => explainTour(t, ctx, diagnosticGates).then(r => [t.id, r] as const)))
      .then(pairs => {
        if (cancelled) return
        setDiagnostics(Object.fromEntries(pairs))
      })
    return () => { cancelled = true }
  }, [diagnose, tours, completedTours, skippedTours, userContext, /* deps */])

  // Dev-mode hint when diagnose is unset
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (diagnose) return
    // One-time hint per provider mount
    console.warn('[Tour Kit] Tip: pass <TourProvider diagnose> in dev to see why a tour did not fire.')
  }, [])

  // Add diagnostics map to context value
  return <TourContext.Provider value={{ /* existing */, diagnostics }}>{children}</TourContext.Provider>
}
```

**Implementation note:** The dev warning fires once per provider mount, not once per render. Use a `useRef` flag if needed. Don't spam the console.

**Sanity check:** Render `<TourProvider tours={[validTour]} diagnose>` in a vitest+RTL test; assert `diagnostics[validTour.id]` is populated after the next tick.

---

### Task 3.6 — `useTourDiagnostic(tourId)` hook (1h)

**Depends on:** 3.5

```ts
// packages/core/src/hooks/use-tour-diagnostic.ts (new)
import { useContext } from 'react'
import { TourContext } from '../context/tour-context'
import type { EligibilityReport } from '../types/diagnostic'

export function useTourDiagnostic(tourId: string): EligibilityReport | null {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTourDiagnostic must be used inside <TourProvider>')
  return ctx.diagnostics?.[tourId] ?? null
}
```

Re-export from `packages/react/src/index.ts`:

```ts
// packages/react/src/index.ts (modify)
export { useTourDiagnostic } from '@tour-kit/core'
```

**Sanity check:** `pnpm --filter @tour-kit/react typecheck` clean. Hook surfaces in the react package's public surface.

---

### Task 3.7 — Tests (3h)

**Depends on:** 3.2–3.6

Cover:

| File | Coverage |
|---|---|
| `packages/core/src/lib/__tests__/explain-audience.test.ts` | segment match/mismatch, array all-pass, array first-fail (detail surfaces failing condition) |
| `packages/core/src/lib/__tests__/diagnostic.test.ts` | each built-in gate (success + failure variants); orchestrator's evaluation order; `willFire`; `firstFailingGate`; `evaluatedAt` is set |
| `packages/core/src/lib/__tests__/diagnostic-extension.test.ts` | Register a mock `DiagnosticGate` that returns `ok: true`; another that returns `ok: false, code: 'CUSTOM_X'`; verify ordering (built-ins first, then extensions in registration order) |
| `packages/core/src/lib/__tests__/diagnostic-throw.test.ts` | Extension `evaluate()` that throws → caught, returns synthetic `ok: false` with `gate: id` and code `${ID}_THREW` |
| `packages/core/src/context/__tests__/tour-provider-diagnose.test.tsx` | Provider populates `diagnostics` map only when `diagnose` is true; dev-mode warning fires once |
| `packages/react/src/hooks/__tests__/use-tour-diagnostic.test.tsx` | Hook returns `null` outside diagnose mode; returns report inside; updates when context changes |

Target: ≥18 assertions total.

**Sanity check:** `pnpm --filter @tour-kit/core test -- diagnostic && pnpm --filter @tour-kit/react test -- diagnostic` exits 0.

---

### Task 3.8 — Perf + bundle checks (1.5h)

**Depends on:** 3.4, 3.7

Microbench:

```ts
// packages/core/src/lib/__tests__/diagnostic.bench.ts
import { bench, describe } from 'vitest'
import { explainTour } from '../diagnostic'

const tour = makeTour({ steps: 5 })
const ctx = makeCtx()

describe('explainTour', () => {
  bench('5-step tour, no extensions', async () => {
    await explainTour(tour, ctx)
  }, { iterations: 100 })
})
```

Target: median <2ms (DOM-resolution is mocked by the ctx.targetResolver returning a stub element).

Bundle check: confirm tree-shaking by adding a size-limit entry that imports ONLY `useTour` and asserts the main bundle stays under 8KB.

**Sanity check:** `pnpm --filter @tour-kit/core test -- bench` reports median <2ms. `pnpm size` (or your size-limit command) reports main entry within budget.

---

### Task 3.9 — Docs (1.5h)

**Depends on:** 3.7

New page: `apps/docs/content/docs/core/diagnostic.mdx`. Cover:

1. Why diagnostics exist (the silent-failure problem).
2. `<TourProvider diagnose>` opt-in.
3. `useTourDiagnostic(tourId)` usage with a JSX example showing the `EligibilityReport` shape.
4. Each `GateCode` with what it means and the fix.
5. **Extension gates:** how `@tour-kit/license` and `@tour-kit/scheduling` will plug in via `diagnosticGates={[licenseGate, scheduleGate]}`. Show a 6-line custom gate example. NOTE that gates run after built-ins.
6. Performance/cost note: `diagnose` defaults `false`; production builds tree-shake it away.

Update `apps/docs/content/docs/core/meta.json` for the new page.

**Sanity check:** `pnpm --filter docs build` exits 0. Page references the canonical extension-gate pattern.

---

## Deliverables

```
packages/core/src/
├── types/
│   ├── diagnostic.ts                                   # (M, was Phase-0 stub) full types
│   └── index.ts                                        # (M) re-export new types
├── lib/
│   ├── audience.ts                                     # (M) add explainAudience; share helper
│   ├── diagnostic.ts                                   # (+) gates + orchestrator
│   └── __tests__/
│       ├── explain-audience.test.ts                    # (+)
│       ├── diagnostic.test.ts                          # (+)
│       ├── diagnostic-extension.test.ts                # (+)
│       ├── diagnostic-throw.test.ts                    # (+)
│       └── diagnostic.bench.ts                         # (+)
├── context/
│   ├── tour-provider.tsx                               # (M) diagnose, diagnosticGates props
│   ├── tour-context.ts                                 # (M) add diagnostics map to value
│   └── __tests__/tour-provider-diagnose.test.tsx       # (+)
├── hooks/
│   └── use-tour-diagnostic.ts                          # (+)
└── index.ts                                            # (M) export useTourDiagnostic, explainTour, types

packages/react/src/
├── index.ts                                            # (M) re-export useTourDiagnostic
└── hooks/__tests__/use-tour-diagnostic.test.tsx        # (+)

.size-limit.json                                        # (M) entry for "main with diagnose unused"

apps/docs/content/docs/core/
├── diagnostic.mdx                                      # (+)
└── meta.json                                           # (M)
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/react typecheck` exits 0.
- [ ] `pnpm --filter @tour-kit/core test` exits 0 with ≥18 new test assertions across the diagnostic suite.
- [ ] `pnpm --filter @tour-kit/react test` exits 0; `useTourDiagnostic` test covers null + populated states.
- [ ] `grep -rn "from '@tour-kit/license'\|from '@tour-kit/scheduling'\|from '@tour-kit/analytics'\|from '@tour-kit/adoption'" packages/core/src/` returns nothing.
- [ ] `matchesAudience` from existing tests still returns `boolean` (no signature change).
- [ ] `explainTour` median <2ms for 5-step tour (vitest bench).
- [ ] `size-limit` reports `@tour-kit/core` main entry <8KB when diagnostics are tree-shaken (consumer imports only `useTour`).
- [ ] Extension gate test demonstrates a third-party gate registering, running, and surfacing in the `reasons` array AFTER all built-ins.
- [ ] Docs page lists every `GateCode` with a fix, plus the extension-gate registration pattern.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 3 of Tour Kit's Sprint 1 — the diagnostic engine (issue #32).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. `@tour-kit/core` is at the bottom of the dependency graph and must NEVER import any other `@tour-kit/*` package. This phase adds the "explain why a tour did not fire" surface — the most-requested support issue on the repo.

### Established in Prior Phases
- Phase 0 committed a TYPE-ONLY STUB at `packages/core/src/types/diagnostic.ts` with `DiagnosticGate`, `DiagnosticContext`, `GateReason`. This phase REPLACES it with the full types — keep the names and shapes compatible.
- Phase 0 decision log at `tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md` confirms the `DiagnosticGate { id, evaluate(ctx) }` extension contract.
- Phase 1 made `Tour<TStep>` generic. This phase doesn't need to be generic — `explainTour(tour: Tour, ...)` accepts the default `TStep = TourStep`.
- `@tour-kit/core` has `matchesAudience(audience, ctx): boolean` at `packages/core/src/lib/audience.ts`. Keep this signature.
- `@tour-kit/core` has `validateTour(tour)` at `packages/core/src/lib/validate-tour.ts` that throws on invalid structure. Wrap it for the `structure` gate.

### Your Goal for This Phase
Ship `explainTour(tour, ctx, gates?)` that produces an `EligibilityReport` covering seven built-in gates plus arbitrary `DiagnosticGate` extensions. Wire it into `TourProvider` behind `diagnose={true}`. Expose `useTourDiagnostic(tourId)` via `@tour-kit/core` and re-export through `@tour-kit/react`. Add an `explainAudience` sibling next to `matchesAudience`. Document every `GateCode` and the extension-gate pattern.

### Data Model Rules (follow exactly)
- All diagnostic types are `interface`/`type` — no Zod, no runtime validation. Diagnostics never cross a JSON boundary.
- `DiagnosticGate` is the extension contract — upper packages (`@tour-kit/license`, `@tour-kit/scheduling`) implement it WITHOUT this code knowing they exist.
- `GateReason` is a discriminated union on `ok: true | false`. Failure variants carry `code`, `message`, and `detail`.
- `explainTour` NEVER throws. Internal errors → `{ ok: false, code: 'STRUCTURE_INVALID' or '${id.toUpperCase()}_THREW', detail: { error } }`.
- `matchesAudience(...) → boolean` MUST remain unchanged. Add `explainAudience(...)` as a SIBLING.

### Architecture
- Evaluation order is fixed and observable: `structure → audience → persistence → route → target → when → autostart → extensions (registration order)`.
- `structure` failure short-circuits: nothing else runs. Other built-ins all run even if one fails — operators want every reason.
- Extension gates run AFTER built-ins. They can be async; built-ins are sync.
- Wrap each extension `evaluate()` in `try/catch`. A throwing extension yields a synthetic `ok: false` with code `${gate.id.toUpperCase()}_THREW`.
- Provider opts in via `diagnose={true}`. Default `false`. When `false` AND `NODE_ENV !== 'production'`, log a one-time hint suggesting the prop.
- The diagnostic orchestrator must tree-shake out when `diagnose` is false. Verify via `size-limit`.

### Confirmed Library APIs
No new external libraries. Internal APIs to wire:
- `validateTour(tour)` from `packages/core/src/lib/validate-tour.ts` — throws on failure; catch and convert to `STRUCTURE_INVALID`.
- `matchesAudience(audience, ctx)` from `packages/core/src/lib/audience.ts` — returns boolean; refactor internally to share a helper that returns the failing condition so `explainAudience` can populate `detail.failingCondition`.

### Files to Create / Modify

#### `packages/core/src/types/diagnostic.ts` (modify — Phase 0 had a stub)
Full `GateCode`, `GateName`, `GateReason`, `EligibilityReport`, `DiagnosticContext`, `DiagnosticGate` exactly as in Task 3.1. Use `(string & {})` for the extension escape hatch on `GateName` and `code` so extensions can use custom strings without losing built-in literal-union autocomplete.

#### `packages/core/src/lib/audience.ts` (modify)
Keep `matchesAudience(audience, ctx): boolean` unchanged. Add `explainAudience(audience, userContext): GateReason`. Refactor BOTH to share an internal `evaluateAudience(): { matched: boolean; failingCondition?: AudienceCondition }` helper so the boolean path doesn't duplicate the condition loop.

#### `packages/core/src/lib/diagnostic.ts` (new)
Implement seven gate functions (`gateStructure`, `gatePersistence`, `gateRoute`, `gateTarget`, `gateWhen`, `gateAutostart`, plus `explainAudience` re-imported) and the `explainTour` orchestrator. Export `BUILTIN_GATE_ORDER` as a `readonly` tuple for tests. `gateRoute` respects `step.routeMatch` (`exact` | `startsWith` | `contains`). `gateTarget` uses `ctx.targetResolver` to look up the first visible step's selector (skip ref-style targets — they aren't checked in diagnostic mode). `gateWhen` is sync-only; Promise-returning callbacks get `{ ok: true, gate: 'when', detail: { note: 'Async when() callbacks are evaluated at runtime, not in diagnostic mode' } }`.

#### `packages/core/src/context/tour-provider.tsx` (modify)
Add `diagnose?: boolean` (default `false`) and `diagnosticGates?: DiagnosticGate[]` (default `[]`). When `diagnose` is true, run `explainTour` for each registered tour in a `useEffect`; populate a `diagnostics: Record<string, EligibilityReport>` state and expose it through the context value. Cancel stale runs on re-render. Add a dev-mode `console.warn` (once per mount, gated on `process.env.NODE_ENV !== 'production'`) when `diagnose` is unset.

#### `packages/core/src/context/tour-context.ts` (modify)
Extend the context value type with `diagnostics?: Record<string, EligibilityReport>`.

#### `packages/core/src/hooks/use-tour-diagnostic.ts` (new)
Thin hook reading `ctx.diagnostics?.[tourId] ?? null`. Throws if used outside `TourProvider`.

#### `packages/core/src/index.ts` (modify)
Export `explainTour`, `explainAudience`, `useTourDiagnostic`, and the diagnostic types.

#### `packages/react/src/index.ts` (modify)
Re-export `useTourDiagnostic` from `@tour-kit/core`.

#### Tests (all under `__tests__` next to source)
- `lib/__tests__/explain-audience.test.ts` — segment-form match/mismatch, array forms, failing condition surfaced in detail.
- `lib/__tests__/diagnostic.test.ts` — every built-in gate; orchestrator order; willFire; firstFailingGate; evaluatedAt set.
- `lib/__tests__/diagnostic-extension.test.ts` — mock gate registration; built-ins run first.
- `lib/__tests__/diagnostic-throw.test.ts` — extension throws → synthetic `_THREW` reason.
- `lib/__tests__/diagnostic.bench.ts` — `vitest bench`, target median <2ms over 100 iterations.
- `context/__tests__/tour-provider-diagnose.test.tsx` — provider populates map; dev warn fires once.
- `packages/react/src/hooks/__tests__/use-tour-diagnostic.test.tsx` — null when off; populated when on.

#### `.size-limit.json` (modify)
Add an entry that imports ONLY `useTour` from `@tour-kit/core` and enforces <8KB on the main bundle.

#### `apps/docs/content/docs/core/diagnostic.mdx` (new) + `core/meta.json` (modify)
Cover: why diagnostics exist, `<TourProvider diagnose>`, `useTourDiagnostic`, every `GateCode` with a fix, extension-gate registration with a 6-line example, perf/cost note.

### Success Criteria
- `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/react typecheck` exits 0.
- `pnpm --filter @tour-kit/core test` exits 0; new tests cover every built-in gate + the orchestrator + extension contract.
- `pnpm --filter @tour-kit/react test` exits 0; hook test covers null + populated.
- `grep -rn "from '@tour-kit/" packages/core/src/` shows NO matches for other `@tour-kit/*` packages.
- `explainTour` bench median <2ms.
- `size-limit` reports main entry within 8KB when only `useTour` is imported.
- Extension test proves a custom `DiagnosticGate` runs AFTER built-ins and surfaces in `reasons`.

### Expected File Structure at End
```
packages/core/src/
├── types/diagnostic.ts           (full types)
├── lib/
│   ├── audience.ts               (explainAudience added)
│   ├── diagnostic.ts             (gates + orchestrator)
│   └── __tests__/
│       ├── explain-audience.test.ts
│       ├── diagnostic.test.ts
│       ├── diagnostic-extension.test.ts
│       ├── diagnostic-throw.test.ts
│       └── diagnostic.bench.ts
├── context/
│   ├── tour-provider.tsx         (diagnose/diagnosticGates wiring)
│   ├── tour-context.ts           (diagnostics map in value)
│   └── __tests__/tour-provider-diagnose.test.tsx
├── hooks/use-tour-diagnostic.ts
└── index.ts                      (exports added)

packages/react/src/
├── index.ts                      (re-export useTourDiagnostic)
└── hooks/__tests__/use-tour-diagnostic.test.tsx

apps/docs/content/docs/core/
├── diagnostic.mdx
└── meta.json (modified)
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 0 stub at `types/diagnostic.ts`; Phase 1 generic `Tour<TStep>`; existing `matchesAudience`, `validateTour`.
- [PASS] Every sub-task has a clear, testable completion condition (gate-specific test files; bench command; size-limit budget).
- [PASS] Execution prompt is self-contained: project description, prior-phase facts, per-file guidance, data model rules, internal-API notes (no external lib needed — diagnostic engine is pure TS).
- [PASS] Exit criteria map 1:1 to deliverables (each gate → corresponding tests; orchestrator → orchestrator test; provider wiring → provider test; hook → hook test; perf → bench; bundle → size-limit; docs → docs page).
- [PASS] No heavy external deps — diagnostic engine is pure TypeScript over existing core utilities.
- [PASS] No new libraries; the only external dep touched is conceptual (the `DiagnosticGate` interface that upper packages will implement). Confirmed snippet for that contract is committed at the end of Phase 0.
