# Sprint 1 — TS-First DX + AdoptionFunnel

**Status:** spec / pre-implementation
**Author:** Claude (project-spec skill)
**Date:** 2026-05-12
**Repo state:** branch `main` @ 38c89fb
**Bundles 6 prioritized ideas from `update-idea.md`:** #32, #34, #91, #85, #86, #84, #1

---

## 1. Problem statement & value

Tour Kit's adoption is bottlenecked by **support load** and **credibility gaps**, not feature breadth. The current `update-idea.md` "first sprint" picks six items that share one diagnostic theme: *the library is fast to install but hard to operate, type, validate, test, migrate to, and visualize*. This spec bundles them as a single coherent ship.

### 1.1 The six fragments

| # | Idea | Pain today | Code touchpoint |
|---|---|---|---|
| #32 | Why-didn't-this-fire diagnostic | `matchesAudience()` returns `boolean`; consumers see "tour silently didn't show", no reason. Top GitHub-issue category for both Tour Kit and React Joyride. | `packages/core/src/lib/audience.ts:10` |
| #34 | Type-safe step IDs | `TourStep.id: string` (`packages/core/src/types/step.ts:44`). String typos in `goToStep('biling')` only fail at runtime. Marketing positions "TS-first" but the compiler doesn't prove it. | `packages/core/src/types/step.ts:44` |
| #91 | Zod schemas for flow definitions | Flows loaded from JSON/CMS/MDX hit `validateTour()` (`packages/core/src/lib/validate-tour.ts`) which only checks hidden-step structural constraints. Malformed data fails deep inside the renderer with a stack trace pointing at React internals. | New: `packages/core/src/lib/schemas/` |
| #85 | RTL test helpers | jsdom doesn't compute layout → Floating UI emits `{ x: 0, y: 0 }` → assertions are flaky. Floating UI's documented testing patterns (virtual elements + `act()` flush) are correct but not packaged. Every team re-derives them. | New: `packages/testing-library/` |
| #86 | Playwright fixtures | No first-party `test.extend` for tours. E2E test code per consumer is hand-rolled boilerplate. | New: `packages/playwright/` |
| #84 | Codemods (Joyride / Shepherd / Driver.js → Tour Kit) | "Tour Kit vs X" comparison articles convert poorly without a migration path. Every blog post ends with "now rewrite your code." | New: `packages/codemods/` |
| #1 | `<AdoptionFunnel featureId>` widget | `AdoptionDashboard` (`packages/adoption/src/components/dashboard/`) ships stats grid + table + category chart. Missing the single most-requested PLG chart: step-by-step drop-off with % retained between checkpoints. | New: `packages/adoption/src/components/dashboard/adoption-funnel.tsx` |

### 1.2 Value analysis

| Lever | Estimate | How measured |
|---|---|---|
| GitHub-issue load reduction (#32) | -30% to -50% of `tour-not-firing` issues | Triage label, 30 days post-merge. Baseline: ~11 of last 30 issues in that category. |
| Migration funnel uplift (#84) | +3-7× CTR on competitor comparison articles | Plausible/GA4 event on `/blog/<x>-vs-tour-kit` "codemod" CTA, 60 days post-launch. |
| Test-confidence ceiling (#85/86) | Unblocks "tested tour" badge in npm README + docs | Qualitative — surveys, churn-feedback from `tour-kit-mcp` field testing. |
| Dashboard parity (#1) | Closes single most-requested commercial feature gap | Compare feature matrix vs Pendo/Userpilot — Funnel is line item that flips from ✗ to ✓. |
| TS-first credibility (#34 + #91) | Headline change: "string IDs caught at runtime" → "step IDs typed at compile time, flows validated at boundary" | Reflected in README, landing page, comparison docs. |
| Foundation for future work (#91) | Unblocks #37 (DB flow source), #38 (CMS adapters), #41 (approval workflow), #46 (`<TourPreview>`) | Dependency graph documented in §6. |

### 1.3 What this enables

- **`@tour-kit/codemods`** becomes the artifact every "X alternative" SEO page links to. Pure acquisition leverage.
- **`tourSchema`** (#91) is the same validator a hosted dashboard would use for user-submitted flow JSON — Phase 0 for the hosted-admin direction noted in `update-idea.md:159`.
- **`explainTour()`** (#32) is the data layer a future `<TourDebugger />` overlay (#90 in the master list) renders on top of.

---

## 2. Architecture overview

### 2.1 Package topology

```
                  ┌─────────────────────────────────────────────┐
                  │            @tour-kit/core                    │
                  │  ─────────────────────────────────────────   │
                  │  + lib/schemas/                  (#91)       │
                  │     └ tour.schema.ts, step.schema.ts         │
                  │     └ parseTour(), parseTours()              │
                  │  + lib/diagnostic.ts              (#32)      │
                  │     └ explainTour(tour, ctx)                 │
                  │     └ explainStep(step, ctx)                 │
                  │  + types/step.ts                  (#34)      │
                  │     └ StepId<S>, TourStep<TId>               │
                  │  + types/diagnostic.ts            (#32)      │
                  │     └ EligibilityReport, GateReason          │
                  └────────────▲───────────────▲────────────────┘
                               │               │
              ┌────────────────┘               └────────────────┐
              │                                                  │
   ┌──────────────────┐                              ┌───────────────────┐
   │ @tour-kit/react  │                              │ @tour-kit/adoption│
   │  ──────────────  │                              │  ──────────────── │
   │  + dev-tools     │                              │  + AdoptionFunnel │  (#1)
   │    diagnostic    │  (#32 surface)               │    component      │
   │    wiring        │                              │    (recharts)     │
   └──────────────────┘                              └───────────────────┘

   ─── new top-level packages ───

   ┌──────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────┐
   │ @tour-kit/testing-library│  │ @tour-kit/playwright   │  │ @tour-kit/codemods         │
   │  ──────────────────────  │  │  ────────────────────  │  │  ────────────────────────  │
   │  (#85)                   │  │  (#86)                 │  │  (#84)                     │
   │  - expectStepVisible     │  │  - test.extend({ tour })│  │  - bin: tour-kit-migrate   │
   │  - advanceTour           │  │  - waitForStep         │  │  - transforms/             │
   │  - completeTour          │  │  - completeTour fixture│  │     from-joyride.ts        │
   │  - jsdomPositionShim     │  │  - tour-kit-trace      │  │     from-shepherd.ts       │
   │                          │  │    annotation          │  │     from-driver.ts         │
   └──────────────────────────┘  └────────────────────────┘  └────────────────────────────┘
```

All five touchpoints depend on `@tour-kit/core` (no cross-deps between new packages). `@tour-kit/adoption` adds `recharts` as a peer dep gated behind tree-shake-safe re-export.

### 2.2 Data flow per idea

#### 2.2.1 #32 — `explainTour()` diagnostic

```
useTourEligibility(tour) ──► explainTour(tour, ctx)
                              ├─ gate: validateTour()    → ok | { code: 'STRUCTURE_INVALID', detail }
                              ├─ gate: audience match    → ok | { code: 'AUDIENCE_MISMATCH', condition, expected, actual }
                              ├─ gate: persistence       → ok | { code: 'ALREADY_COMPLETED' | 'ALREADY_SKIPPED' }
                              ├─ gate: scheduling        → ok | { code: 'OUT_OF_WINDOW', windowStart, windowEnd, now }
                              ├─ gate: license           → ok | { code: 'LICENSE_INVALID' | 'LICENSE_EXPIRED' }
                              ├─ gate: target found      → ok | { code: 'TARGET_NOT_FOUND', selector, timeoutMs }
                              ├─ gate: when() callback   → ok | { code: 'WHEN_RETURNED_FALSE', stepId }
                              └─ gate: route match       → ok | { code: 'ROUTE_MISMATCH', expected, actual }

Result: EligibilityReport { willFire: boolean; reasons: GateReason[]; firstFailingGate: GateReason | null }
```

Each existing gate gets a structured `{ ok: true } | { ok: false, code, ...detail }` return at a dedicated explainer. `matchesAudience()` keeps its boolean signature for back-compat; new `explainAudience()` returns the structured form. The provider opts into explain-mode by setting `diagnose: true` and surfaces results via a new `useTourDiagnostic(tourId)` hook.

#### 2.2.2 #34 — Generic step IDs

```ts
// Current — packages/core/src/types/step.ts:43-44
export interface TourStep { id: string; ... }

// New — generic, defaults to string for back-compat
export interface TourStep<TId extends string = string> { id: TId; ... }

// Helper that infers a literal-string union from a const tuple of steps
export type StepIdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id']

// New goToStep signature on the imperative ref
goToStep<TId extends string = string>(id: TId): void
```

Consumer pattern:

```ts
const steps = [
  { id: 'welcome', target: '#hero', content: '...' },
  { id: 'pricing', target: '#price', content: '...' },
] as const satisfies ReadonlyArray<TourStep>

type Id = StepIdOf<typeof steps>      // 'welcome' | 'pricing'

tourRef.current?.goToStep('biling')   // TS error: not assignable to 'welcome' | 'pricing'
```

Default `string` parameter preserves the entire existing public surface — pure widening.

#### 2.2.3 #91 — Zod schemas

```ts
// packages/core/src/lib/schemas/tour.schema.ts
export const audienceConditionSchema = z.object({
  key: z.string().min(1),
  operator: z.enum(['equals','not_equals','contains','not_contains','in','not_in','exists','not_exists']),
  value: z.unknown().optional(),
})

export const audienceSchema = z.union([
  z.array(audienceConditionSchema),
  z.object({ segment: z.string().min(1) }),
])

export const tourStepSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['visible','hidden']).optional(),
  target: z.string().min(1),  // string only — refs aren't JSON-serializable; parseTour rejects ref targets explicitly
  content: z.unknown(),       // ReactNode at runtime, JSON value at boundary
  title: z.unknown().optional(),
  audience: audienceSchema.optional(),
  // ... full surface
})

export const tourSchema = z.object({
  id: z.string().min(1),
  steps: z.array(tourStepSchema).min(1),
  audience: audienceSchema.optional(),
  autoStart: z.boolean().optional(),
  // ... full surface
})

export function parseTour(input: unknown): Tour { return tourSchema.parse(input) as Tour }
export function safeParseTour(input: unknown) { return tourSchema.safeParse(input) }
```

**Type-parity check (compile-time guarantee):**

```ts
// packages/core/src/lib/schemas/__tests__/parity.test-d.ts
type SchemaTour = z.infer<typeof tourSchema>
type _AssertSchemaIsAssignableToTour = SchemaTour extends Tour ? true : never
type _AssertTourIsAssignableToSchema = Tour extends SchemaTour ? true : never
const _ok1: _AssertSchemaIsAssignableToTour = true
const _ok2: _AssertTourIsAssignableToSchema = true
```

When `TourStep` adds a field, this typecheck fails until the schema is updated. Keeps the two in lockstep without runtime overhead.

#### 2.2.4 #85 — Testing-library helpers

```
@tour-kit/testing-library
├ src/
│   ├ helpers/
│   │   ├ expect-step-visible.ts     ← finds [data-tour-step="id"], asserts visibility (wraps act() flush)
│   │   ├ advance-tour.ts            ← user-event click on "Next" button
│   │   ├ complete-tour.ts           ← async loop: advance until isActive=false
│   │   ├ go-to-step.ts              ← imperative jump via internal ref
│   │   └ virtual-target.ts          ← injects { getBoundingClientRect } for Floating UI tests
│   └ setup.ts                        ← single-call setup; `positionShim: true` lazily peer-deps jsdom-testing-mocks
```

**jsdom positioning approach (revised after Floating UI docs review, 2026-05-12):**

Floating UI documents two officially-supported testing patterns; the spec uses both:

1. **Virtual elements** (preferred) — pass a custom object `{ getBoundingClientRect: () => ({ x:0, y:0, width:200, height:100, ... }) }` to `refs.setReference()`. Documented at `floating-ui.com/docs/virtual-elements`. No global prototype patching. Tour Kit's `expectStepVisible()` injects a virtual ref derived from the actual target element's `data-mock-rect` attribute or a default.
2. **`act()`-based flush** — Floating UI's React testing guide requires `await act(async () => {})` to flush microtasks before positioning state is ready. `expectStepVisible()` wraps this internally so consumers don't manage it.

**Optional global shim** (for non-Floating-UI assertions that still need a non-zero `getBoundingClientRect`): expose `setupTourKitTesting({ positionShim: true })` which uses [`jsdom-testing-mocks`](https://www.npmjs.com/package/jsdom-testing-mocks) (peer dep) for `mockElementBoundingClientRect()`. Avoids hand-rolling a prototype patch when an established package already does this correctly.

Decision: prefer virtual-elements for Tour Kit's own assertion helpers (zero side-effects); offer the global shim only as opt-in for consumer-authored assertions outside Floating UI's path.

#### 2.2.5 #86 — Playwright fixtures

```ts
// @tour-kit/playwright
import { test as base, expect } from '@playwright/test'

export interface TourHelpers {
  start(tourId: string): Promise<void>
  waitForStep(stepId: string, opts?: { timeout?: number }): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
  complete(tourId: string): Promise<void>
  skip(): Promise<void>
  getDiagnostic(tourId: string): Promise<EligibilityReport>  // bridges to #32
}

export const test = base.extend<{ tour: TourHelpers }>({
  tour: async ({ page }, use) => {
    await use({
      start: async (id) => page.evaluate((id) => window.__tourKit__?.start(id), id),
      waitForStep: async (id, opts) =>
        page.waitForSelector(`[data-tour-step="${id}"]`, { state: 'visible', timeout: opts?.timeout }),
      next: async () => page.getByRole('button', { name: /next/i }).click(),
      // ...
    })
  },
})
export { expect } from '@playwright/test'
```

A small `window.__tourKit__` bridge is exposed in dev-mode only by `TourProvider`, behind a documented `enableTestBridge` prop, default `false`.

#### 2.2.6 #84 — Codemods

```
@tour-kit/codemods
├ bin/
│   └ tour-kit-migrate.ts            ← CLI entry, parses --from flag
├ transforms/
│   ├ from-joyride.ts                 ← jscodeshift transform
│   ├ from-shepherd.ts                ← jscodeshift transform
│   └ from-driver.ts                  ← jscodeshift transform
├ docs/
│   ├ from-joyride.md                 ← coverage matrix, supported / unsupported
│   ├ from-shepherd.md
│   └ from-driver.md
└ __tests__/
    └ fixtures/                        ← input.tsx → expected.tsx pairs per transform
```

CLI:

```bash
npx @tour-kit/codemods migrate --from joyride ./src
npx @tour-kit/codemods migrate --from shepherd ./src --dry-run
npx @tour-kit/codemods migrate --from driver ./src --parser tsx
```

Each transform documents its coverage matrix up-front (e.g., "Joyride: steps, run, callback → onComplete/onSkip mapped; styles deferred; spotlight reverse-clicks not supported"). Coverage gaps are explicit, not implicit failures.

#### 2.2.7 #1 — `<AdoptionFunnel>` widget

```tsx
// packages/adoption/src/components/dashboard/adoption-funnel.tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts'

export interface FunnelStep {
  id: string
  label: string
  reached: number          // absolute users
  retentionFromPrev: number  // 0..1, percent retained from previous step
}

export interface AdoptionFunnelProps {
  featureId: string
  steps?: FunnelStep[]                // injected for testing / override
  range?: { from: Date; to: Date }
  className?: string
  onBarClick?: (step: FunnelStep) => void
}

export function AdoptionFunnel({ featureId, steps, range, ... }: AdoptionFunnelProps) {
  const computed = steps ?? useFunnelData(featureId, range)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={computed} layout="vertical">
        <XAxis type="number" />
        <YAxis dataKey="label" type="category" />
        <Tooltip />
        <Bar dataKey="reached">
          <LabelList dataKey="retentionFromPrev" formatter={fmtPct} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

Data source: `useFunnelData(featureId, range)` hook aggregates `FeatureUsage` events from the existing analytics queue (`packages/adoption/src/engine/usage-tracker.ts`) into ordered checkpoints. A flow's `TourStep[]` defines the checkpoint sequence — the funnel is "users who reached `step.id`" per step.

**Chart choice:** horizontal BarChart over recharts `FunnelChart`. Reason: BarChart's `layout="vertical"` produces the canonical PLG drop-off bars users expect; `FunnelChart` renders trapezoidal segments which are visually distinct from the Pendo/Userpilot convention. Both APIs exist at recharts **v3.8+** (FunnelChart confirmed to remain in v3 per the migration guide). The v2→v3 breaking changes (Cell→shape deprecation, CategoricalChartState removal, internal-prop removal) do **not** affect this widget's surface — we use only `BarChart`, `Bar`, `LabelList`, `ResponsiveContainer`, `XAxis`, `YAxis`, `Tooltip`.

### 2.3 Sequencing & ship order

Six ideas, one sprint, dependency-aware ship order:

1. **#34** (typed step IDs) — pure widening, lands first, unblocks better types for #91 schema parity test.
2. **#91** (zod schemas) — independent of #34, but the parity test consumes the generic.
3. **#32** (explain mode) — independent. Lands in parallel with #34/#91.
4. **#1** (AdoptionFunnel) — independent, recharts dependency only. Lands in parallel.
5. **#85** (RTL helpers) — fully independent of #86. RTL renders in-process and reaches the provider's React context directly via a small internal `useTourImperative()` export from `@tour-kit/react`; no `window.__tourKit__` bridge involved. Can land any time after #34/#91 stabilize the public types.
6. **#86** (Playwright) — depends on the `window.__tourKit__` test-bridge contract (Playwright is out-of-process, so it can only reach the tour via a runtime global). The bridge is self-contained to `@tour-kit/core` + `@tour-kit/playwright`. Land after #32 if `getDiagnostic()` should be part of the bridge surface (recommended); else can land any time.
7. **#84** (codemods) — fully independent of the other five. Can land any time, but suggest *last* so the README examples it produces match the final #34/#91 surface.

---

## 3. Data model strategy

Tour Kit's data lives in three layers — each picks a different validation tool:

| Layer | Where | Tool | Why |
|---|---|---|---|
| Public boundary (JSON, CMS, MDX, user input) | `parseTour()`, `safeParseTour()`, `flowSourceSchema` | **Zod v4** | Runtime validation, friendly errors, single source of truth for shape, JSON-derivable. |
| Internal types (hand-authored TS) | `Tour`, `TourStep`, `AudienceCondition`, `EligibilityReport`, `GateReason`, `FunnelStep` | **`interface` / `type`** (TS only) | Already in place; refs and `ReactNode` aren't JSON-serializable so a Zod schema would always carry `z.unknown()` for them. |
| Test/dev contracts | `TourHelpers` (Playwright fixture), `TestBridge` (`window.__tourKit__`, Playwright-only out-of-process channel) | **`interface`** + JSDoc | Pure surface, no validation needed. RTL helpers (#85) use the in-process React-context channel, not the bridge. |

### 3.1 Zod-vs-hand-authored-TS boundary

**Use Zod for:**
- `tourSchema`, `tourStepSchema`, `audienceConditionSchema` — anything that crosses a serialization boundary (JSON.parse, fetch response, MDX frontmatter).
- `flowSourceSchema` — top-level schema for `tours.json` files, CMS payloads, server-side flow stores.

**Keep as plain TS:**
- `EligibilityReport`, `GateReason` — internal-only, never crosses a boundary, ReactNode is fine.
- `TourStep<TId>` — generic over a literal-union, Zod can't express a generic-over-tuple cleanly.
- `FunnelStep` — internal aggregation type, hand-authored.

### 3.2 Parity guarantee

A `*.test-d.ts` file in `packages/core/src/lib/schemas/__tests__/` asserts via conditional types that `z.infer<typeof tourSchema>` is bi-directionally assignment-compatible with `Tour`. When either drifts, the test-d typecheck fails. No runtime cost; the parity check ships zero bytes.

### 3.3 Zod version pin

Set `zod` as **peerDependency** with range `"^3.25.0 || ^4.0.0"` — Zod 4 was shipped *inside* the `zod@^3.25.0` npm package via the `zod/v4` subpath before the package root flipped to v4. The dual range matches the canonical pattern documented at [zod.dev/v4/versioning](https://zod.dev/v4/versioning) and prevents resolution conflicts in consumer apps still on v3-only deps.

Latest verified version: **4.4.3** (2026-05-12 web check; we'd previously cached 4.0.1 from Context7 — same major, but the spec should pin the range, not the patch).

Import path: `'zod'` (root export is v4 at npm-latest); the legacy `'zod/v4'` subpath continues to work forever per the Zod team's compatibility commitment. Use `'zod'` in all new code; document `'zod/v4'` as acceptable for consumers mid-migration.

Bundle impact: Zod 4 core is ~57% smaller than v3 (~2.3× reduction). Zod-validating consumers pay the cost only when they import from `@tour-kit/core/schemas` (tree-shake-safe subpath barrel).

---

## 4. Module / component / CLI contracts

### 4.1 #32 — `explainTour()` & friends

```ts
// packages/core/src/lib/diagnostic.ts (new)

export type GateCode =
  | 'STRUCTURE_INVALID'
  | 'AUDIENCE_MISMATCH'
  | 'ALREADY_COMPLETED'
  | 'ALREADY_SKIPPED'
  | 'OUT_OF_WINDOW'
  | 'LICENSE_INVALID'
  | 'LICENSE_EXPIRED'
  | 'TARGET_NOT_FOUND'
  | 'WHEN_RETURNED_FALSE'
  | 'ROUTE_MISMATCH'
  | 'AUTOSTART_DISABLED'

export type GateReason =
  | { ok: true; gate: 'structure' | 'audience' | 'persistence' | 'scheduling' | 'license' | 'target' | 'when' | 'route' | 'autostart' }
  | { ok: false; gate: string; code: GateCode; message: string; detail?: Record<string, unknown> }

export interface EligibilityReport {
  tourId: string
  willFire: boolean
  reasons: GateReason[]
  firstFailingGate: Extract<GateReason, { ok: false }> | null
  evaluatedAt: number  // Date.now()
}

export function explainTour(
  tour: Tour,
  ctx: {
    userContext?: Record<string, unknown>
    completedTours: string[]
    skippedTours: string[]
    schedule?: { from?: Date; to?: Date }
    licenseStatus?: 'valid' | 'invalid' | 'expired'
    route?: { current: string; matcher: string; mode: 'exact'|'startsWith'|'contains' }
    targetResolver?: (selector: string) => HTMLElement | null
  }
): EligibilityReport

// Hook surface in @tour-kit/react
export function useTourDiagnostic(tourId: string): EligibilityReport | null
```

**Errors:** `explainTour()` never throws; structural errors come back as `{ code: 'STRUCTURE_INVALID', detail }`.

**Opt-in:** existing call sites (`matchesAudience`, persistence check, scheduling) keep their boolean signatures. New `explain*` siblings return structured results. The provider exposes diagnostics via `<TourProvider diagnose={true}>` (default `false` to avoid evaluation cost in production).

### 4.2 #34 — Type-safe step IDs

```ts
// packages/core/src/types/step.ts (changed)

export interface TourStep<TId extends string = string> {
  id: TId
  // ... existing surface unchanged
}

// packages/core/src/types/tour.ts (changed)
export interface Tour<TStep extends TourStep = TourStep> {
  id: string
  steps: TStep[]
  // ... unchanged
}

// packages/core/src/types/step.ts (new export)
export type StepIdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id']

// packages/react/src/hooks/use-tour.ts (changed)
export function useTour<TId extends string = string>(): {
  goToStep(id: TId): void
  // ...
}
```

**Errors:** runtime behavior unchanged. Compile-time error message comes from TS's standard "not assignable" diagnostic; we add a curated lint rule example in docs.

**Migration:** zero changes required — default `string` parameter keeps every existing consumer compiling. Opt-in via `as const satisfies`.

### 4.3 #91 — Zod schemas

```ts
// packages/core/src/lib/schemas/index.ts (new — barrel)
export { tourSchema, tourStepSchema, audienceConditionSchema, audienceSchema } from './tour.schema'
export { flowSourceSchema } from './flow-source.schema'
export { parseTour, safeParseTour, parseTours, safeParseTours } from './parse'

// packages/core/src/lib/schemas/parse.ts (new)
export function parseTour(input: unknown): Tour {
  // .parse() throws ZodError; consumer-facing message preserved.
  return tourSchema.parse(input) as Tour
}

export function safeParseTour(input: unknown):
  | { success: true; data: Tour }
  | { success: false; error: ZodError } {
  return tourSchema.safeParse(input) as never
}
```

**Errors:** `parseTour()` throws `ZodError` (has `.format()`, `.flatten()`); `safeParseTour()` returns a tagged union. Both bubble Zod's path-aware error structure unchanged.

**JSON-incompatible fields:** `target` accepts only `string` in the schema (ref-targets aren't serializable); `content`, `title`, `description` accept `z.unknown()` because they can be ReactNodes — schema validation guarantees presence, not shape, for these.

### 4.4 #85 — `@tour-kit/testing-library`

```ts
// Public API
export function expectStepVisible(stepId: string, opts?: { timeout?: number }): Promise<HTMLElement>
export function advanceTour(opts?: { steps?: number }): Promise<void>
export function previousTour(opts?: { steps?: number }): Promise<void>
export function completeTour(tourId: string, opts?: { timeout?: number }): Promise<void>
export function skipTour(): Promise<void>
export function goToStep(stepId: string): Promise<void>

// Setup (vitest setupFiles entry)
export function setupTourKitTesting(opts?: {
  positionShim?: boolean | { defaultRect?: DOMRect }
}): void

// Re-export for ergonomics
export { render, screen, fireEvent } from '@testing-library/react'
```

**Module structure:** subpath exports — `@tour-kit/testing-library` (default barrel) and `@tour-kit/testing-library/setup` (one-call vitest `setupFiles` entry). No `/shims` subpath in the default approach — virtual targets are co-located with the helpers that use them.

**Errors:** every helper throws on timeout with `TourKitTestingError` (`name`, `message`, `cause`, `stepId?`, `tourId?`).

### 4.5 #86 — `@tour-kit/playwright`

```ts
// Public API (re-exports + custom test)
export interface TourHelpers { /* see §2.2.5 */ }
export const test: TestType<{ tour: TourHelpers } & PlaywrightTestArgs, PlaywrightWorkerArgs>
export { expect } from '@playwright/test'

// Companion: dev-mode bridge type (lives in @tour-kit/core)
// @tour-kit/core exports declare global { interface Window { __tourKit__?: TestBridge } }
export interface TestBridge {
  start(tourId: string): void
  next(): void
  previous(): void
  goToStep(stepId: string): void
  complete(): void
  skip(): void
  getDiagnostic(tourId: string): EligibilityReport
}
```

**Activation:** consumers add `<TourProvider enableTestBridge={process.env.NODE_ENV !== 'production'}>`. Production builds tree-shake the bridge away.

**Errors:** every fixture helper throws Playwright's standard `TimeoutError` on missing elements; `tour.getDiagnostic()` returns an `EligibilityReport` (#32 type) — never throws.

### 4.6 #84 — `@tour-kit/codemods` CLI

```
USAGE
  tour-kit migrate --from <source> [options] <paths...>

SOURCES
  joyride       react-joyride v2.x
  shepherd      shepherd.js v11+
  driver        driver.js v1+

OPTIONS
  --parser <tsx|ts|babel>     Parser for jscodeshift (default: tsx)
  --dry-run                   Print diff, don't write files
  --print                     Print transformed source to stdout
  --extensions <list>         Comma-separated, default: ts,tsx,js,jsx
  --verbose                   Verbose output

EXIT CODES
  0   All files transformed (or dry-run completed without errors)
  1   One or more files failed to parse
  2   Invalid arguments / unsupported --from value
  3   No files matched
```

**Coverage matrix (committed to docs per source):**

```
from-joyride.md  (handles BOTH legacy JSX-prop API and modern useJoyride hook API)
  Legacy <Joyride> JSX form:
    ✓ <Joyride steps={...} run callback={...} /> → <TourProvider tours={[{id, steps}]}> + <TourCard />
    ✓ callback({ action: 'next'|'prev'|'skip'|'close', index, status, type }) → onComplete / onSkip / onStepChange routing
    ✓ run, continuous, showProgress, showSkipButton → mapped where Tour Kit has equivalents

  Modern useJoyride hook form (current Joyride v2.x, 2026):
    ✓ const { controls, Tour } = useJoyride({ continuous, steps }) → const tourRef = useRef<TourKitRef>(null); <TourProvider tours={...}> + <TourCard /> + controls.start() → tourRef.current?.start()
    ✓ onEvent: EventHandler (EventData with action/index/status/type/lifecycle) → onStepChange + onComplete + onSkip dispatcher
    ✓ Step.before (async pre-step hook) → TourStep.onBeforeShow
    ✓ Step.after → TourStep.onShow

  Shared step shape:
    ✓ Step.target (CSS selector | () => Element) → TourStep.target (string only — function-targets emit a TODO since Tour Kit expects refs or selectors)
    ✓ Step.content, Step.title → TourStep.content, TourStep.title
    ✓ Step.placement (incl. 'auto', 'center') → TourStep.placement (with 'center' mapping to body-target + spotlight=false)
    ✓ Step.scrollOffset → TourStep.spotlightPadding (approximate)
    ✓ Step.id, Step.data → TourStep.id, custom data via tour.data
    ✓ Step.spotlightPadding (object form) → TourStep.spotlightPadding (number — emit TODO if non-uniform)
    ✓ Step.disableBeacon / skipBeacon → no-op (Tour Kit has no beacon-by-default; warning comment)

  Not migrated (each emits a `// TODO: <link>` comment):
    ✗ Step.styles / options.styles → theme docs link
    ✗ Step.tooltipComponent / Step.beaconComponent → custom component slot docs link
    ✗ Step.spotlightTarget / Step.scrollTarget (alternate targets) → not supported, manual port
    ✗ Step.isFixed → no Tour Kit equivalent
    ✗ portalElement (custom mount node) → docs link
```

Each `✗` is documented up-front, not a silent failure. The `useJoyride` hook coverage matters for 2026 Joyride users — the legacy `<Joyride>` JSX form is older but still seen in long-lived codebases, so both are supported.

### 4.7 #1 — `<AdoptionFunnel>` component

```tsx
export interface FunnelStep {
  id: string
  label: string
  reached: number
  retentionFromPrev: number  // 0..1
}

export interface AdoptionFunnelProps {
  featureId: string
  steps?: FunnelStep[]
  range?: { from: Date; to: Date }
  height?: number              // default 320
  className?: string
  onBarClick?: (step: FunnelStep) => void
  emptyState?: React.ReactNode
}

export function AdoptionFunnel(props: AdoptionFunnelProps): JSX.Element

// Companion hook
export function useFunnelData(
  featureId: string,
  range?: { from: Date; to: Date }
): { steps: FunnelStep[]; loading: boolean; error: Error | null }
```

**Errors:** rendering falls back to `emptyState` (default: `<p>No funnel data yet.</p>`) when `steps.length === 0`. Hook surfaces `error` for analytics-source failures.

**Accessibility:** chart wrapped in `role="img"` with `aria-label` summarizing absolute drop-off (`"Funnel: 1,200 → 920 → 410 → 180, 14% end-to-end"`); a `<table>` fallback rendered visually-hidden for screen readers per [`apps/docs/content/docs/guides/accessibility.mdx`](apps/docs/content/docs/guides/accessibility.mdx).

---

## 5. Quality thresholds (numbers, not adjectives)

| Idea | Threshold | Measurement |
|---|---|---|
| #32 — diagnostic | `explainTour()` p95 < **2 ms** evaluating all gates for a 5-step tour | Vitest microbenchmark in `packages/core/src/lib/__tests__/diagnostic.perf.test.ts` |
| #32 | Adds < **0.5 KB** gzipped to `@tour-kit/core` (tree-shakable when `diagnose: false`) | `size-limit` check in CI, separate budget line |
| #34 — typed IDs | **Zero** runtime cost (types only); existing tests pass unchanged | `pnpm test` green on `main` rebase + `tsc --noEmit` clean |
| #34 | Type test (`*.test-d.ts`) covers all 4 generic surfaces (TourStep, Tour, useTour, goToStep) | New test-d files in `packages/core/src/__tests__/types/` |
| #91 — Zod schemas | `parseTour()` p95 < **5 ms** for 5-step tour, < **20 ms** for 50-step tour | Vitest benchmark in `packages/core/src/lib/schemas/__tests__/parse.perf.test.ts` |
| #91 | Schema-Tour parity test passes (`z.infer<typeof tourSchema>` ≡ `Tour`) | `*.test-d.ts` in CI |
| #91 | `@tour-kit/core` bundle stays under **8 KB** gzipped without Zod imports; Zod opt-in via `@tour-kit/core/schemas` subpath only | `size-limit` budgets enforced per subpath |
| #85 — RTL helpers | Package gzipped < **4 KB** (devDep, less critical but still measured) | `size-limit` |
| #85 | `expectStepVisible` succeeds in **< 50 ms** on hot path, < **500 ms** with waitTimeout | Vitest in `packages/testing-library/src/__tests__/perf.test.ts` |
| #85 | `expectStepVisible()` resolves on **100%** of Floating-UI-positioned cards in `packages/core` + `packages/react` test suites without manual `act()` flushes by the consumer (regression baseline: today's `packages/react/__tests__/tour-card.test.tsx` requires hand-rolled flushes) | New `packages/testing-library/__tests__/floating-ui-integration.test.tsx` runs the helpers against TourCard fixtures |
| #86 — Playwright | Cold fixture setup overhead < **200 ms** per test on CI runner | Smoke test logging timings |
| #86 | `test.extend` types resolve without `any` (strict mode) | `tsc --noEmit` against fixture file |
| #84 — codemods | Joyride transform passes on **≥ 80%** of fixtures in `__tests__/fixtures/joyride/` (committed corpus of 25+ real-world Joyride patterns from open-source repos) | CI green; uncovered patterns emit `// TODO` comments with link to migration guide |
| #84 | Each transform documented with explicit ✓ / ✗ table (no silent failures) | Manual review of `docs/from-*.md` |
| #1 — AdoptionFunnel | Renders < **100 ms** for 10-step funnel on a 4× CPU-throttle CI runner | React profiler in `packages/adoption/src/__tests__/adoption-funnel.perf.test.tsx` |
| #1 | Bundle adds < **18 KB** gzipped (recharts ^2.13 is ~17 KB; we add ~1 KB component) | `size-limit` |
| #1 | A11y: passes `axe-core` zero-violations on default render | Vitest + `@axe-core/react` in component test |

**Cross-cutting:**

- Combined sprint adds < **2 KB** to `@tour-kit/core` baseline (all opt-in).
- 80%+ test coverage on every new module (existing repo gate).
- Type coverage 100% on every new module (`tsc --strict` clean).
- All accessibility-bearing surfaces (#1 chart, #32 dev overlay if any) pass axe-core defaults.

---

## 6. Key risks & mitigations

### Risk 1 — jsdom positioning fidelity (#85)

**The fear:** Floating UI's positioning depends on real layout. A faked `getBoundingClientRect` makes tests pass that would fail in a real browser. Teams trust the helpers, ship broken tours, blame Tour Kit.

**Mitigation:**
- Lean on **Floating UI's own documented testing surface** — virtual elements + `await act(async () => {})` — rather than monkey-patching `Element.prototype`. Documented at [`floating-ui.com/docs/virtual-elements`](https://floating-ui.com/docs/virtual-elements) and the React testing section of [`floating-ui.com/docs/react`](https://floating-ui.com/docs/react). When Floating UI ships, the patterns ship with it.
- For the optional global shim (`positionShim: true`), peer-dep [`jsdom-testing-mocks`](https://www.npmjs.com/package/jsdom-testing-mocks) instead of hand-rolling a prototype patch. Reduces our maintenance surface and lets us inherit upstream bug fixes.
- Document helpers as **"assertion-of-presence, not assertion-of-position."** Position-correctness assertions belong in `@tour-kit/playwright`. One-page guide: `apps/docs/content/docs/guides/testing-positioning.mdx`.
- Regression net: smoke test asserts virtual-element pattern returns the rect we supplied and that `expectStepVisible` resolves within the same tick after `await act(async()=>{})` flush.

### Risk 2 — Zod dual-major peer-dependency range (#91)

**The fear:** Zod 4 was shipped *inside* `zod@^3.25.0` via the `zod/v4` subpath before the npm-latest tag flipped to v4. A consumer locked to `zod@~3.24.0` (or earlier) cannot satisfy a `peerDependencies: { "zod": "^4.0.0" }` range — install fails or silently downgrades. Conversely, pinning only `^3.25.0` would block v4-only consumer apps.

**Mitigation:**
- Set peer range to `"zod": "^3.25.0 || ^4.0.0"` — the canonical library pattern per the Zod team. Works whether the consumer is on the transition-version v3 (where Zod 4 lives at `zod/v4`) or on v4-as-root.
- All Tour Kit imports use `'zod'` (root). The `'zod/v4'` subpath continues to work for older consumer code mid-migration — Tour Kit doesn't need to care.
- Schema subpath: `@tour-kit/core/schemas` — tree-shakes Zod out for consumers who don't validate.
- Set `peerDependenciesMeta.zod.optional = true` so installs don't fail when consumers don't validate at all.
- Documented compatibility note in `apps/docs/content/docs/core/schemas.mdx`.
- Fallback: if dual-range proves messy in user reports within 30 days (e.g., Yarn-PnP resolution oddities), tighten to `^4.0.0` only and move v3-on-root consumers to a `@tour-kit/core/schemas-v3` subpath. Unlikely.

### Risk 3 — `jscodeshift` types & TS-codemod ergonomics (#84)

**The fear:** `jscodeshift` is a CommonJS-first JS toolkit; its `@types/jscodeshift` lags. Writing transforms in TS is doable but generates type friction (loose `any` on `j(file.source)`). Worst case: transforms ship but their typecheck pipeline is brittle and CI flakes.

**Mitigation:**
- Use `@types/jscodeshift` ^0.12+ (the typed `Collection<n>` API is mature enough at jscodeshift v17.3.0).
- Write transforms in TypeScript with `parser: 'tsx'` (`module.exports.parser = 'tsx'`); commit compiled `.cjs` artifacts for npm publish.
- **Fallback:** if `jscodeshift` types prove too fragile, evaluate `ts-morph` (v22+) — slower codemods but stronger typing. Plan a 2-day spike on the Joyride transform with both tools before locking in.
- The corpus-based ≥80% threshold (§5) catches regressions; a transform that compiles but mangles output fails the fixture diff test.

### Risk 4 — Type-safe step IDs surface (#34)

**The fear:** Despite generic defaulting to `string`, edge consumers ((e.g.) constructing tours dynamically from server JSON) may experience inferred-type narrowing they didn't ask for. Could prompt "TS got harder" complaints despite zero runtime change.

**Mitigation:**
- Document the `Tour<TStep>` and `TourStep<TId>` parameters explicitly, with a "dynamic tours" example using `Tour<TourStep<string>>` to widen back to today's behavior.
- Type-test (`*.test-d.ts`) covers both the const-tuple narrowing case and the dynamic `Tour[]` wide case to prevent regression.
- Ship behind a minor release; flag clearly in changelog as "non-breaking widening."

### Risk 5 — Codemod fidelity claims (#84)

**The fear:** "We support migrating from X" is a strong claim. Coverage gaps that aren't surfaced explicitly produce a worse user experience than no codemod (consumer trusts the migration, ships broken code).

**Mitigation:**
- Every transform ships with a `from-<source>.md` coverage matrix listing ✓ / ✗ patterns with code samples.
- Transforms emit `// TODO: <description>` comments at sites they can't migrate, with a link to the matching docs section.
- The 25+ fixture corpus is committed to the repo; PRs that expand corpus coverage land regularly post-launch (community contributions welcome).
- Marketing/docs language: "migrate the common case in seconds; review the changelog comments for the rest." Not "one-click migration."

### Risk 6 — `window.__tourKit__` test bridge as production attack surface (#85/#86)

**The fear:** The dev-mode bridge becomes accidentally enabled in production (e.g., consumer wraps `<TourProvider enableTestBridge={true}>` and forgets to gate). Exposes internal control over flows.

**Mitigation:**
- `enableTestBridge` default is `false`.
- When `true`, log a single `console.warn` at provider mount: `"[Tour Kit] Test bridge enabled. Disable for production."`
- Docs example wraps it in `process.env.NODE_ENV !== 'production'`.
- Bridge surface is **read-mostly** — `start/next/previous/goToStep` mirror the existing public ref API; `getDiagnostic` reads only.

---

## 7. Confirmed library versions

| Library | Version (range / latest) | Source | Key API confirmed |
|---|---|---|---|
| `recharts` | peer `^3.8.0` (latest 3.8.1) | Web 2026-05-12 ([releases](https://github.com/recharts/recharts/releases)) + Context7 `/recharts/recharts` | `BarChart` + `Bar` + `LabelList` + `ResponsiveContainer` unchanged from v2; `FunnelChart` retained in v3; v3 breaking changes (Cell→shape, CategoricalChartState removal, internal-prop removal) **do not affect our surface** |
| `zod` | peer `"^3.25.0 \|\| ^4.0.0"` (latest 4.4.3) | Web 2026-05-12 ([zod.dev/v4/versioning](https://zod.dev/v4/versioning)) + Context7 `/colinhacks/zod` | `z.object`, `z.discriminatedUnion('kind', [...])`, `z.infer<typeof T>`, `z.custom<T>()`; import path `'zod'`; v4 ships at npm-latest, legacy `'zod/v4'` subpath remains compatible |
| `jscodeshift` | `^17.3.0` | Context7 2026-05-12 (`/facebook/jscodeshift`) | Transform exports `function(fileInfo, api, options) { const j = api.jscodeshift; ... return root.toSource() }`; `module.exports.parser = 'tsx'`; `findImportDeclarations`, `renameImportDeclaration`, `hasImportDeclaration`, `insertImportDeclaration` |
| `@playwright/test` | peer `^1.58.0` (verified `^1.58.2`) | Context7 2026-05-12 (`/microsoft/playwright/v1.58.2`) | `base.extend<{ tour: TourHelpers }>({ tour: async ({ page }, use) => { await use(...) } })`; `{ scope: 'test' \| 'worker' }`; `{ option: true }` |
| `@floating-ui/react` | (transitive — already in `@tour-kit/core`) | Context7 2026-05-12 (`/floating-ui/floating-ui`) | Virtual-element pattern: `refs.setReference({ getBoundingClientRect: () => ({...}) })`; React testing: `await act(async () => {})` flushes positioning microtasks before assertions |
| `jsdom-testing-mocks` | peer (opt-in) `^1.x` | Web 2026-05-12 ([npm](https://www.npmjs.com/package/jsdom-testing-mocks)) | Optional, used only when `setupTourKitTesting({ positionShim: true })` is called; provides `mockElementBoundingClientRect()` |
| `vitest` | `^4.1.0` | Repo catalog (`package.json:14`) | — stable, no upstream fetch needed |
| `@testing-library/react` | `^16.3.1` | Repo catalog (`package.json:19`) | — stable, no upstream fetch needed |
| `@testing-library/user-event` | `^14.6.1` | Repo catalog (`package.json:22`) | `userEvent.click(...)` for `advanceTour()` |
| `jsdom` | `^27.3.0` | Repo catalog (`package.json:15`) | Required for `act()` flush + virtual-element pattern |
| `typescript` | `^5.9.3` | Repo catalog (`package.json:16`) | Generic constraints (`extends string = string`), const-tuple inference (`as const satisfies`), conditional types for parity tests |

**New peer dependencies introduced:**

- `@tour-kit/core` adds `zod` as `peerDependency` `"^3.25.0 || ^4.0.0"` with `peerDependenciesMeta.zod.optional = true` — only required when consumers import from `@tour-kit/core/schemas`.
- `@tour-kit/adoption` adds `recharts` as `peerDependency` `^3.8.0` with `peerDependenciesMeta.recharts.optional = true`.
- `@tour-kit/playwright` adds `@playwright/test` as `peerDependency` `^1.58.0`.
- `@tour-kit/testing-library` adds `@testing-library/react`, `@testing-library/user-event`, `vitest`, `jsdom` as peers; `jsdom-testing-mocks` as **optional** peer for the global-shim path.
- `@tour-kit/codemods` adds `jscodeshift` and `@types/jscodeshift` as runtime/dev deps (CLI ships them).

---

## Appendix A — File touchpoint summary

```
packages/core/src/
  types/step.ts                          ← (M) generic TId on TourStep
  types/tour.ts                          ← (M) generic TStep on Tour
  types/diagnostic.ts                    ← (+) EligibilityReport, GateReason, GateCode
  lib/diagnostic.ts                      ← (+) explainTour, explainAudience, explainSchedule, ...
  lib/audience.ts                        ← (M) export explainAudience (boolean-preserving back-compat)
  lib/schemas/index.ts                   ← (+) barrel
  lib/schemas/tour.schema.ts             ← (+) tourSchema, tourStepSchema
  lib/schemas/audience.schema.ts         ← (+) audienceSchema
  lib/schemas/flow-source.schema.ts      ← (+) flowSourceSchema
  lib/schemas/parse.ts                   ← (+) parseTour, safeParseTour
  lib/schemas/__tests__/parity.test-d.ts ← (+) z.infer ≡ Tour assertion
  __tests__/types/step-id.test-d.ts      ← (+) StepIdOf narrowing tests
  context/tour-provider.tsx              ← (M) accept diagnose?, enableTestBridge? props
  index.ts                               ← (M) re-export new surfaces
package.json                             ← (M) add zod peerDep

packages/react/src/
  hooks/use-tour.ts                      ← (M) generic TId on goToStep, etc.
  hooks/use-tour-diagnostic.ts           ← (+) subscribes to provider diagnostic
  index.ts                               ← (M) export new hook

packages/adoption/src/
  components/dashboard/adoption-funnel.tsx     ← (+) <AdoptionFunnel>
  components/dashboard/index.ts                ← (M) export AdoptionFunnel
  hooks/use-funnel-data.ts                     ← (+)
  hooks/index.ts                               ← (M) export
  __tests__/adoption-funnel.test.tsx           ← (+)
  __tests__/adoption-funnel.perf.test.tsx      ← (+)
package.json                                   ← (M) add recharts peerDep

packages/testing-library/                ← (+) entire new package
  src/index.ts
  src/helpers/expect-step-visible.ts
  src/helpers/advance-tour.ts
  src/helpers/complete-tour.ts
  src/helpers/go-to-step.ts
  src/helpers/virtual-target.ts         ← Floating UI virtual-element factory
  src/setup.ts                          ← `setupTourKitTesting({ positionShim? })`; lazy-imports jsdom-testing-mocks
  __tests__/...

packages/playwright/                     ← (+) entire new package
  src/index.ts
  src/fixtures/tour.ts
  __tests__/...

packages/codemods/                       ← (+) entire new package
  bin/tour-kit-migrate.ts
  src/transforms/from-joyride.ts
  src/transforms/from-shepherd.ts
  src/transforms/from-driver.ts
  __tests__/fixtures/joyride/
  __tests__/fixtures/shepherd/
  __tests__/fixtures/driver/
  docs/from-joyride.md
  docs/from-shepherd.md
  docs/from-driver.md
```

Legend: `(+)` new file, `(M)` modified.

## Appendix B — Open questions for implementation

1. **`diagnose` prop default policy.** Default `false`; provider warns when `process.env.NODE_ENV !== 'production'` and the prop is unset, hinting at the opt-in. Acceptable, or default `true` in non-prod?
2. **Recharts vs `FunnelChart`.** Spec picks horizontal `BarChart` for visual convention; FunnelChart confirmed present in v3.8. Trivial to swap if user research surfaces a preference.
3. **Codemod corpus sourcing.** Need a committed corpus of 25+ Joyride patterns, 15+ Shepherd, 10+ Driver.js. **Each Joyride codemod must cover both the legacy `<Joyride>` JSX prop API and the modern `useJoyride` hook API** (current as of Joyride v2.x, 2026). Suggest sourcing from MIT-licensed OSS repos on GitHub via a one-shot scraper. Allocate ~6 hours (was ~4; +2 hrs for dual API coverage).
4. **Bridge naming.** `window.__tourKit__` is a global namespace bet. Acceptable, or scope per-provider with a unique key (`window.__tourKit__<providerId>`) for multi-provider apps?
5. **jsdom-testing-mocks vs custom shim.** Spec leans on Floating UI's virtual-elements pattern (no shim needed). The optional `positionShim: true` opt-in peer-deps `jsdom-testing-mocks`. Confirm the optional-peer approach over bundling our own implementation.
6. **Sprint ship cadence.** Recommend 7 PRs (one per idea, with #91 split if Zod peer-dep takes investigation). Two-week sprint if each PR is ~1 day of implementation + 0.5 day of review.
