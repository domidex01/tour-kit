# Phase 4 — AdoptionFunnel Widget (#1)

**Duration:** Days 11–12 (~9–10 hours)
**Depends on:** Phase 0 (chart-dep decision: native CSS)
**Blocks:** Nothing in Sprint 1; sets up future analytics-backed historical funnels (deferred per spec)
**Risk Level:** LOW — additive component in an existing package; no new peer deps unless Phase 0 flipped the chart decision
**Stack:** react

---

## Objective

Ship `<AdoptionFunnel steps={...}>` as a data-first component that takes pre-computed funnel data and renders it with the same native-CSS approach the existing `AdoptionDashboard` uses. Add `useFunnelData({ featureIds })` as a current-state selector over `useAdoptionStats` for teams that want a one-line integration — clearly documented as current-state, NOT historical. No new chart dep, no Recharts peer (decision locked in Phase 0). The funnel closes the single most-requested commercial-dashboard gap (Pendo/Userpilot parity) without introducing a bundle-size regression.

## What Success Looks Like

1. `pnpm --filter @tour-kit/adoption test -- adoption-funnel` exits 0 with ≥10 tests (render, labels, metrics math, click handler, empty state, axe zero-violations, hook returns correct current-state shape, hook handles missing feature, table fallback rendered for SR).
2. `pnpm --filter @tour-kit/adoption typecheck` exits 0; `FunnelStep` and `AdoptionFunnelProps` resolve cleanly.
3. `<AdoptionFunnel steps={[...]} />` renders WITHOUT an `<AdoptionProvider>` wrapper — provider-less usage is a hard requirement.
4. `<AdoptionFunnel ... />` inside an `<AdoptionProvider>` renders the funnel from `useFunnelData({ featureIds })` (consumer doesn't pass `steps`).
5. `@axe-core/react` reports zero violations on the default render in a Vitest+RTL run.
6. Visually-hidden `<table>` mirrors the bar values for screen readers.
7. `pnpm --filter @tour-kit/adoption build` exits 0 with NO new peer deps unless Phase 0's decision log flipped to Recharts.
8. Bundle: `@tour-kit/adoption` gzipped delta < 2KB (verify with `size-limit`).

---

## Architecture / Key Design Decisions

```
┌──────────────────────────────────┐
│ <AdoptionFunnel steps={...}>     │  ← provider-less path (explicit data)
│   ↳ FunnelStep[] in              │
│   ↳ calculateFunnelMetrics       │
│   ↳ native CSS bars + table SR   │
└──────────────────────────────────┘
            ▲
            │ steps prop omitted
            │
┌──────────────────────────────────┐
│ useFunnelData({ featureIds })    │  ← in-provider path
│   ↳ useAdoptionStats() per id    │
│   ↳ aggregate into FunnelStep[]  │
│   ↳ current-state, NOT historical│
└──────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Public props (`FunnelStep`, `AdoptionFunnelProps`) | `interface` (TypeScript) | Component API surface; no runtime validation needed (developer-supplied) |
| Computed metrics (drop-off %, retention) | Pure function returning a plain object | Testable in isolation; no React dependency |
| Hook return (`useFunnelData`) | `{ steps: FunnelStep[]; loading: boolean; error: Error \| null }` | Mirrors `useAdoptionStats` ergonomics |
| Visual layer | Native CSS bars (matches existing `AdoptionDashboard`) | Avoids Recharts peer dep; bundle-size friendly; consistent with current dashboard style |

**Other critical rules for this phase:**
- **Data-first.** `<AdoptionFunnel steps={data} />` MUST work without any provider. Anyone with funnel data can drop the component into any tree.
- **No new chart peer.** Phase 0 decided native CSS. If product asks for Recharts mid-sprint, re-open the Phase 0 decision; do not silently add the peer.
- **Hook semantics are documented honestly.** `useFunnelData` derives a CURRENT-STATE funnel (today's users at each step) from `useAdoptionStats`. Historical date-range funnels require an analytics event-store API that doesn't exist yet — DO NOT pretend the hook supports it.
- **No nested cards.** Match the existing dashboard's flat panel layout — read `packages/adoption/src/components/dashboard/AdoptionDashboard.tsx` first.
- **A11y is non-negotiable.** `role="img"` on the chart with `aria-label` summarizing the funnel. Visually-hidden `<table>` providing the same numbers for screen readers (per `apps/docs/content/docs/guides/accessibility.mdx`).

---

## Tasks

### Task 4.1 — Types (0.75h)

**Depends on:** Phase 0 chart decision logged

```ts
// packages/adoption/src/types/feature.ts (modify — append) OR
// packages/adoption/src/components/dashboard/adoption-funnel.types.ts (new, package-local)

export interface FunnelStep {
  id: string
  label: string
  entered: number
  /** Optional — if omitted, treated as 0 (no one progressed past this step). */
  completed?: number
}

export interface AdoptionFunnelProps {
  steps: readonly FunnelStep[]
  title?: React.ReactNode
  onStepClick?: (step: FunnelStep, index: number) => void
  emptyState?: React.ReactNode
  className?: string
  /** Default: 'Adoption funnel — {N} steps'. Use this for SR summary override. */
  ariaLabel?: string
}
```

**Implementation note:** Spec §4.7 uses `reached` + `retentionFromPrev`. Big-plan §3 uses `entered` + `completed`. Big-plan is the more recent revision (2026-05-12 after package analysis) — go with `entered` / `completed` and let `calculateFunnelMetrics` derive retention/drop-off downstream.

**Sanity check:** `pnpm --filter @tour-kit/adoption typecheck` exits 0.

---

### Task 4.2 — Pure `calculateFunnelMetrics` helper (1h)

**Depends on:** 4.1

```ts
// packages/adoption/src/lib/calculate-funnel-metrics.ts (new)

export interface FunnelStepMetrics {
  id: string
  label: string
  entered: number
  completed: number
  /** Percentage of users who completed this step (completed / entered). 0..1. */
  conversion: number
  /** Percentage of users retained from the previous step (entered / prev.entered). 1.0 for first step. */
  retentionFromPrev: number
  /** Absolute drop-off from previous step (prev.entered − entered). 0 for first step. */
  dropoffFromPrev: number
}

export function calculateFunnelMetrics(steps: readonly FunnelStep[]): FunnelStepMetrics[] {
  return steps.map((step, i) => {
    const entered = step.entered
    const completed = step.completed ?? 0
    const prev = steps[i - 1]
    return {
      id: step.id,
      label: step.label,
      entered,
      completed,
      conversion: entered > 0 ? completed / entered : 0,
      retentionFromPrev: i === 0 ? 1 : (prev?.entered ?? 0) > 0 ? entered / prev!.entered : 0,
      dropoffFromPrev: i === 0 ? 0 : Math.max(0, (prev?.entered ?? 0) - entered),
    }
  })
}
```

Add unit tests covering: empty array → empty result, single step → retention 1, two steps with drop-off, zero-entered guards (no NaN/Infinity).

**Sanity check:** `pnpm --filter @tour-kit/adoption test -- calculate-funnel-metrics` exits 0.

---

### Task 4.3 — `useFunnelData({ featureIds })` hook (1.5h)

**Depends on:** 4.1

Read `packages/adoption/src/hooks/use-adoption-stats.ts` (or whatever the existing `useAdoptionStats` is named) first to confirm its return shape.

```ts
// packages/adoption/src/hooks/use-funnel-data.ts (new)
import { useMemo } from 'react'
import { useAdoptionStats } from './use-adoption-stats'
import type { FunnelStep } from '../types/feature'

export interface UseFunnelDataInput {
  featureIds: readonly string[]
  labels?: Partial<Record<string, string>>
}

export interface UseFunnelDataResult {
  steps: FunnelStep[]
  loading: boolean
  error: Error | null
}

export function useFunnelData({ featureIds, labels }: UseFunnelDataInput): UseFunnelDataResult {
  const stats = useAdoptionStats()  // expects { byFeature: Record<id, FeatureUsage>, loading, error }
  return useMemo(() => {
    if (stats.loading || stats.error) {
      return { steps: [], loading: stats.loading, error: stats.error ?? null }
    }
    const steps: FunnelStep[] = featureIds.map((id, i) => {
      const usage = stats.byFeature?.[id]
      const entered = usage?.usersWhoTried ?? 0
      const completed = usage?.usersWhoCompleted ?? 0
      return {
        id,
        label: labels?.[id] ?? id,
        entered,
        completed,
      }
    })
    return { steps, loading: false, error: null }
  }, [stats, featureIds, labels])
}
```

**Implementation notes:**
- READ the existing `useAdoptionStats` return shape before naming `usersWhoTried` / `usersWhoCompleted`. Use the actual field names from the current dashboard implementation.
- The hook ASSUMES `AdoptionProvider`. Throw a clear error from `useAdoptionStats` (existing) if used outside it.
- Document at the JSDoc level: "Returns current adoption state. For historical date-range analysis, see (future) analytics flow events API."

**Sanity check:** Write a small RTL test that renders `<AdoptionProvider>` with a mock provider value and calls the hook from a test component — assert `steps[0].entered` matches the mock.

---

### Task 4.4 — `<AdoptionFunnel>` native CSS component (2h)

**Depends on:** 4.2

Read `packages/adoption/src/components/dashboard/AdoptionDashboard.tsx` and any existing native CSS chart helpers FIRST. Match their styling primitives.

```tsx
// packages/adoption/src/components/dashboard/adoption-funnel.tsx (new)
import { useMemo } from 'react'
import { cn } from '@tour-kit/core'
import { calculateFunnelMetrics } from '../../lib/calculate-funnel-metrics'
import type { AdoptionFunnelProps } from '../../types/feature'

export function AdoptionFunnel({
  steps,
  title,
  onStepClick,
  emptyState,
  className,
  ariaLabel,
}: AdoptionFunnelProps) {
  const metrics = useMemo(() => calculateFunnelMetrics(steps), [steps])
  if (!steps.length) return <>{emptyState ?? <p>No funnel data yet.</p>}</>

  const max = Math.max(...metrics.map(m => m.entered), 1)
  const summary = ariaLabel ?? buildAriaLabel(metrics)

  return (
    <div className={cn('tk-funnel', className)} role="img" aria-label={summary}>
      {title ? <header className="tk-funnel__title">{title}</header> : null}
      <ul className="tk-funnel__list">
        {metrics.map((m, i) => {
          const widthPct = (m.entered / max) * 100
          const handleClick = onStepClick
            ? () => onStepClick({ id: m.id, label: m.label, entered: m.entered, completed: m.completed }, i)
            : undefined
          return (
            <li
              key={m.id}
              className="tk-funnel__step"
              onClick={handleClick}
              onKeyDown={handleClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() } : undefined}
              role={handleClick ? 'button' : undefined}
              tabIndex={handleClick ? 0 : undefined}
            >
              <div className="tk-funnel__label">{m.label}</div>
              <div
                className="tk-funnel__bar"
                style={{ width: `${widthPct}%` }}
                aria-hidden="true"
              >
                <span className="tk-funnel__value">{m.entered}</span>
              </div>
              {i > 0 && (
                <span className="tk-funnel__retention" aria-hidden="true">
                  {(m.retentionFromPrev * 100).toFixed(1)}%
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <FunnelTableForScreenReaders metrics={metrics} />
    </div>
  )
}

function buildAriaLabel(metrics: FunnelStepMetrics[]): string {
  const nums = metrics.map(m => m.entered).join(' → ')
  const finalRate = metrics.length > 1
    ? ((metrics.at(-1)!.entered / metrics[0]!.entered) * 100).toFixed(0)
    : '100'
  return `Adoption funnel: ${nums}, ${finalRate}% end-to-end retention`
}
```

**Implementation notes:**
- Use existing Tailwind classes / CSS modules in `packages/adoption/src/styles/` if any; otherwise add a small CSS file co-located with the component.
- The `aria-hidden` on the bar + retention is intentional — the table fallback (Task 4.5) is the SR-accessible representation.
- Honor `prefers-reduced-motion` per `CLAUDE.md` cross-package patterns: if the funnel adds entrance animations, prefix with `motion-safe:` (`tailwindcss-animate`) or wrap custom keyframes in `@media (prefers-reduced-motion: reduce)`.

**Sanity check:** Vitest+RTL: render `<AdoptionFunnel steps={[{ id:'a', label:'A', entered:100 }, { id:'b', label:'B', entered:40 }]} />` — verify both labels appear, the second bar's width style is `40%`, retention text shows `40.0%`.

---

### Task 4.5 — Empty state, clicks, keyboard, table fallback (1.5h)

**Depends on:** 4.4

Add the `FunnelTableForScreenReaders` subcomponent referenced above:

```tsx
function FunnelTableForScreenReaders({ metrics }: { metrics: FunnelStepMetrics[] }) {
  return (
    <table className="sr-only">
      <caption>Adoption funnel data</caption>
      <thead>
        <tr>
          <th scope="col">Step</th>
          <th scope="col">Entered</th>
          <th scope="col">Completed</th>
          <th scope="col">Retention from previous</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map((m) => (
          <tr key={m.id}>
            <th scope="row">{m.label}</th>
            <td>{m.entered}</td>
            <td>{m.completed}</td>
            <td>{(m.retentionFromPrev * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Add the `.sr-only` class if it doesn't already exist in `packages/adoption/src/styles/` — standard CSS-only visually-hidden pattern (1px clip, no display:none which hides from SRs too).

Empty-state handling already lives in `<AdoptionFunnel>` (Task 4.4); verify the empty-state prop overrides the default `<p>No funnel data yet.</p>` text.

**Sanity check:** RTL queries: `getByRole('table', { hidden: true })` finds the SR table; `getAllByRole('row')` returns `1 + N` rows.

---

### Task 4.6 — Component tests (2h)

**Depends on:** 4.4, 4.5

```ts
// packages/adoption/src/components/dashboard/__tests__/adoption-funnel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from '@axe-core/react'
import { AdoptionFunnel } from '../adoption-funnel'

describe('<AdoptionFunnel>', () => {
  const steps = [
    { id: 'view', label: 'Viewed', entered: 100, completed: 60 },
    { id: 'click', label: 'Clicked', entered: 60, completed: 30 },
    { id: 'convert', label: 'Converted', entered: 30, completed: 30 },
  ]

  it('renders step labels in order', () => {
    render(<AdoptionFunnel steps={steps} />)
    const labels = screen.getAllByText(/Viewed|Clicked|Converted/)
    expect(labels.map(n => n.textContent)).toEqual(['Viewed', 'Clicked', 'Converted'])
  })

  it('calculates retention from previous step', () => {
    render(<AdoptionFunnel steps={steps} />)
    expect(screen.getByText('60.0%')).toBeInTheDocument()  // 60/100
    expect(screen.getByText('50.0%')).toBeInTheDocument()  // 30/60
  })

  it('renders empty state when steps is empty', () => {
    render(<AdoptionFunnel steps={[]} emptyState={<p>Nothing yet</p>} />)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })

  it('invokes onStepClick with step + index', () => {
    const handler = vi.fn()
    render(<AdoptionFunnel steps={steps} onStepClick={handler} />)
    fireEvent.click(screen.getByText('Clicked').closest('li')!)
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'click' }), 1)
  })

  it('supports keyboard activation when clickable', async () => {
    const handler = vi.fn()
    render(<AdoptionFunnel steps={steps} onStepClick={handler} />)
    const step = screen.getByText('Viewed').closest('li')!
    step.focus()
    fireEvent.keyDown(step, { key: 'Enter' })
    expect(handler).toHaveBeenCalled()
  })

  it('renders SR table mirroring values', () => {
    render(<AdoptionFunnel steps={steps} />)
    const table = screen.getByRole('table', { hidden: true })
    expect(table).toBeInTheDocument()
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3)
  })

  it('passes axe a11y check with zero violations', async () => {
    const { container } = render(<AdoptionFunnel steps={steps} />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })

  it('builds informative aria-label by default', () => {
    render(<AdoptionFunnel steps={steps} />)
    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute('aria-label', expect.stringMatching(/Adoption funnel: 100 → 60 → 30/))
  })

  it('respects ariaLabel override', () => {
    render(<AdoptionFunnel steps={steps} ariaLabel="Custom summary" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Custom summary')
  })

  it('renders without AdoptionProvider', () => {
    // No provider wrapper — must still mount.
    render(<AdoptionFunnel steps={steps} />)
    expect(screen.getByText('Viewed')).toBeInTheDocument()
  })
})
```

Plus a hook test:

```ts
// packages/adoption/src/hooks/__tests__/use-funnel-data.test.tsx
// Render <AdoptionProvider> with a mock context; assert hook output matches.
// At minimum: 2 features map to 2 steps with correct entered/completed.
```

**Sanity check:** `pnpm --filter @tour-kit/adoption test -- adoption-funnel` exits 0 with ≥10 cases green.

---

### Task 4.7 — Exports + docs (1h)

**Depends on:** 4.6

```ts
// packages/adoption/src/components/dashboard/index.ts (modify)
export { AdoptionFunnel } from './adoption-funnel'
export type { AdoptionFunnelProps, FunnelStep } from '../../types/feature'

// packages/adoption/src/hooks/index.ts (modify)
export { useFunnelData } from './use-funnel-data'
export type { UseFunnelDataInput, UseFunnelDataResult } from './use-funnel-data'

// packages/adoption/src/index.ts (modify)
// Confirm the dashboard barrel and hooks barrel are already re-exported. If not, add them.
```

Docs page: extend `apps/docs/content/docs/adoption/dashboard.mdx` (or whichever existing dashboard page covers components). Cover:

1. Provider-less usage: `<AdoptionFunnel steps={data} />`
2. Provider-backed usage: `useFunnelData({ featureIds })` + `<AdoptionFunnel steps={steps} />`
3. **CURRENT-STATE caveat** — be honest about what the hook returns.
4. A11y notes: chart `role="img"`, SR table fallback, `ariaLabel` override.
5. Reduced-motion compliance.

Update `apps/docs/content/docs/adoption/meta.json` if a new page is added (preferred: extend existing).

**Sanity check:** `pnpm --filter docs build` exits 0. Existing dashboard page references the new component.

---

## Deliverables

```
packages/adoption/src/
├── types/feature.ts                                             # (M) FunnelStep, AdoptionFunnelProps
├── lib/calculate-funnel-metrics.ts                              # (+) pure helper
├── lib/__tests__/calculate-funnel-metrics.test.ts               # (+)
├── components/dashboard/
│   ├── adoption-funnel.tsx                                      # (+) native CSS funnel + SR table
│   ├── index.ts                                                 # (M) export AdoptionFunnel
│   └── __tests__/adoption-funnel.test.tsx                       # (+) ≥10 cases incl. axe
├── hooks/
│   ├── use-funnel-data.ts                                       # (+) current-state selector
│   ├── index.ts                                                 # (M)
│   └── __tests__/use-funnel-data.test.tsx                       # (+)
├── styles/funnel.css (or extend existing styles)                # (+/M)
└── index.ts                                                     # (M) confirm re-exports

apps/docs/content/docs/adoption/
└── dashboard.mdx (modified) + meta.json (if new page)
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/adoption typecheck && pnpm --filter @tour-kit/adoption test` exits 0.
- [ ] `pnpm --filter @tour-kit/adoption test -- adoption-funnel` reports ≥10 cases green.
- [ ] `<AdoptionFunnel steps={data} />` renders provider-less in an RTL test (proven by the dedicated test case).
- [ ] `useFunnelData` consumed inside `<AdoptionProvider>` returns a `steps` array whose shape matches `useAdoptionStats` output (mock test).
- [ ] `@axe-core/react` reports zero violations on default render.
- [ ] `pnpm --filter @tour-kit/adoption build` exits 0; bundle delta <2KB gzipped (verified via `size-limit`).
- [ ] No new entries in `package.json#peerDependencies` beyond what existed in Phase 0 (chart decision = native CSS).
- [ ] Docs page documents both usage modes AND the current-state caveat explicitly.
- [ ] CSS honors `prefers-reduced-motion: reduce` for any animation introduced.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 4 of Tour Kit's Sprint 1 — the AdoptionFunnel widget (issue #1).

### What This Project Is
Tour Kit's commercial `@tour-kit/adoption` package ships `<AdoptionDashboard>` with stats / table / category chart. The single most-requested missing feature is a step-by-step funnel chart with drop-off percentages — Pendo and Userpilot both ship one. This phase adds `<AdoptionFunnel>` using the SAME native-CSS approach the existing dashboard uses; no new chart peer dep.

### Established in Prior Phases
- Phase 0 decision log (`tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md`) records "Chart dependency: native CSS — no recharts peer." DO NOT add recharts unless the user explicitly re-opens that decision.
- Phase 0 catalog adds (jscodeshift, etc.) don't affect this phase.
- `@tour-kit/adoption` v1.0.2 depends on `@tour-kit/core` (Phase 1 generics, Phase 3 diagnostics) and `@tour-kit/license`; optional peer `@tour-kit/analytics`. The package already exports `AdoptionProvider`, `useAdoptionStats`, and `<AdoptionDashboard>`.
- `cn()` is available from `@tour-kit/core` (single canonical source per the project's cross-package patterns).
- `useReducedMotion()` is available from `@tour-kit/core` and re-exported through `@tour-kit/adoption` for in-package use.

### Your Goal for This Phase
Ship `<AdoptionFunnel>` as a data-first component (provider-less usage works) plus `useFunnelData({ featureIds })` as a current-state selector for in-provider consumers. Match existing dashboard styling (native CSS bars, no nested cards). Include an SR-only `<table>` fallback. Zero new peer deps.

### Data Model Rules (follow exactly)
- `FunnelStep`, `AdoptionFunnelProps`, hook input/output: `interface` (TypeScript). No Zod — this is developer-supplied data, not a JSON boundary.
- `calculateFunnelMetrics(steps)`: pure function, no React, no side-effects, fully unit-testable.
- `useFunnelData`: derives current-state from `useAdoptionStats`. Documented as CURRENT-STATE, never claim historical date-range support.
- Visual layer: native CSS bars matching `<AdoptionDashboard>`. No SVG charts unless Phase 0 decision flipped.

### Architecture
- The component is data-first: `<AdoptionFunnel steps={data} />` must mount without any provider.
- The hook is provider-backed: throws (via existing `useAdoptionStats`) if used outside `<AdoptionProvider>`.
- A11y: `role="img"` + descriptive `aria-label` on the chart. The visual bars carry `aria-hidden="true"`. A visually-hidden `<table>` provides the same numbers for screen readers.
- Reduced-motion: any entrance animation goes through `useReducedMotion()` or a `prefers-reduced-motion: reduce` media query — per the project's cross-package guarantee.
- No nested cards. Read `packages/adoption/src/components/dashboard/AdoptionDashboard.tsx` FIRST to match the existing flat-panel layout.

### Confirmed Library APIs
No new external libraries. Internal APIs:
- `useAdoptionStats()` from `@tour-kit/adoption` — READ its current return shape (`packages/adoption/src/hooks/use-adoption-stats.ts`) before naming fields in `useFunnelData`.
- `cn(...)` from `@tour-kit/core` — class-merging utility.
- `@axe-core/react` for the axe test (already in repo).
- `@testing-library/react` for RTL tests (already in repo catalog at `^16.3.1`).

### Files to Create / Modify

#### `packages/adoption/src/types/feature.ts` (modify — append)
Export `FunnelStep { id, label, entered, completed? }` and `AdoptionFunnelProps { steps, title?, onStepClick?, emptyState?, className?, ariaLabel? }`. Use `readonly FunnelStep[]` for the steps prop.

#### `packages/adoption/src/lib/calculate-funnel-metrics.ts` (new)
Pure function `(steps) => FunnelStepMetrics[]` with fields: `id`, `label`, `entered`, `completed`, `conversion` (completed/entered), `retentionFromPrev` (entered/prev.entered; 1.0 for first), `dropoffFromPrev` (prev.entered − entered; 0 for first). Guard against divide-by-zero — no NaN/Infinity in the output.

#### `packages/adoption/src/lib/__tests__/calculate-funnel-metrics.test.ts` (new)
≥5 cases: empty input, single step, two-step retention, zero-entered first step (no NaN), large numbers.

#### `packages/adoption/src/components/dashboard/adoption-funnel.tsx` (new)
Implements `<AdoptionFunnel>` exactly as in Task 4.4 above. Reads existing AdoptionDashboard styling to match the flat-panel look. Includes the `FunnelTableForScreenReaders` subcomponent. Uses `cn()`. Honors reduced-motion if any animation is added.

#### `packages/adoption/src/components/dashboard/__tests__/adoption-funnel.test.tsx` (new)
≥10 cases: order, retention math, empty state override, onStepClick, keyboard activation (Enter + Space), SR table presence, axe zero-violations, default aria-label format, ariaLabel override, provider-less render.

#### `packages/adoption/src/components/dashboard/index.ts` (modify)
Export `AdoptionFunnel` and re-export the related types.

#### `packages/adoption/src/hooks/use-funnel-data.ts` (new)
`useFunnelData({ featureIds, labels? })` returning `{ steps, loading, error }`. Uses `useAdoptionStats` internally. Memoize the derived array. JSDoc clearly says "current-state, not historical."

#### `packages/adoption/src/hooks/__tests__/use-funnel-data.test.tsx` (new)
Render `<AdoptionProvider>` with a mocked context value supplying two features; verify the hook returns two `FunnelStep` entries with the expected `entered`/`completed`.

#### `packages/adoption/src/hooks/index.ts` (modify)
Export `useFunnelData` + types.

#### `packages/adoption/src/styles/funnel.css` (new or extend existing)
Class names `.tk-funnel`, `.tk-funnel__title`, `.tk-funnel__list`, `.tk-funnel__step`, `.tk-funnel__bar`, `.tk-funnel__value`, `.tk-funnel__retention`, plus `.sr-only` if not already defined elsewhere in the package. Animations (if any) wrapped in `@media (prefers-reduced-motion: reduce) { animation: none; }`.

#### `packages/adoption/src/index.ts` (modify)
Confirm `AdoptionFunnel`, `FunnelStep`, `AdoptionFunnelProps`, `useFunnelData` reach the package's public surface.

#### `apps/docs/content/docs/adoption/dashboard.mdx` (modify — or add `funnel.mdx`)
Section for `<AdoptionFunnel>`. Show:
1. Provider-less example with hard-coded `steps` data.
2. In-provider example with `useFunnelData({ featureIds })`.
3. Honest caveat that `useFunnelData` returns CURRENT-STATE, not historical.
4. A11y notes (role="img", SR table, `ariaLabel` override).
5. Cross-link to reduced-motion guide.

If a new page is added, update `apps/docs/content/docs/adoption/meta.json`.

### Success Criteria
- `pnpm --filter @tour-kit/adoption typecheck && pnpm --filter @tour-kit/adoption test && pnpm --filter @tour-kit/adoption build` all exit 0.
- `pnpm --filter @tour-kit/adoption test -- adoption-funnel` reports ≥10 green cases.
- Provider-less render test passes (the component mounts without `<AdoptionProvider>` wrapper).
- `<AdoptionFunnel steps={[two-step data]}>` shows the correct retention percentage (e.g., `40 / 100 → 40.0%`).
- axe-core reports zero violations.
- `package.json#peerDependencies` has NO new entries vs. main branch.
- `pnpm --filter docs build` exits 0; docs page contains both usage examples and the current-state caveat.

### Expected File Structure at End
```
packages/adoption/src/
├── types/feature.ts (modified)
├── lib/
│   ├── calculate-funnel-metrics.ts
│   └── __tests__/calculate-funnel-metrics.test.ts
├── components/dashboard/
│   ├── adoption-funnel.tsx
│   ├── index.ts (modified)
│   └── __tests__/adoption-funnel.test.tsx
├── hooks/
│   ├── use-funnel-data.ts
│   ├── index.ts (modified)
│   └── __tests__/use-funnel-data.test.tsx
├── styles/funnel.css (or extension of existing)
└── index.ts (modified)

apps/docs/content/docs/adoption/
├── dashboard.mdx (modified) or funnel.mdx (new)
└── meta.json (modified if new page)
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 0 chart decision; existing `useAdoptionStats`, `cn`, `useReducedMotion` from `@tour-kit/core`.
- [PASS] Every sub-task has a clear, testable completion condition (typecheck/test/build commands; specific RTL assertions).
- [PASS] Execution prompt is self-contained: project context, prior facts (chart decision, `useReducedMotion` re-export), per-file guidance, exact a11y rules.
- [PASS] Exit criteria map 1:1 to deliverables (component → component tests; hook → hook tests; helper → unit tests; a11y → axe; bundle → size-limit; docs → docs build).
- [PASS] No heavy external deps — pure React + existing repo utilities; `@axe-core/react` already in repo.
- [PASS] No new libraries; the Phase 0 chart-decision artifact replaces any need for Context7 confirmation on recharts (memory #175 also confirms recharts in case the decision is ever flipped).
