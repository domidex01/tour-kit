# Phase 4 — Testing: AdoptionFunnel Widget (#1)

**Scope:** `calculateFunnelMetrics(steps)` pure helper; `<AdoptionFunnel steps>` data-first component (native CSS bars; `role="img"` + `aria-label`; visually-hidden SR `<table>` mirror); `useFunnelData({ featureIds })` provider-backed selector; reduced-motion compliance; ≤2KB bundle delta; no new peer dep.
**Key Pattern:** Pure-logic helper + React component phase. NO heavy deps; the chart is native CSS (Phase 0 decision). Test fakes are limited to a small `<AdoptionProvider>` mock-context wrapper for the hook test — the COMPONENT path uses no provider (data-first is the headline UX).
**Dependencies:** `vitest@^4.1.0`, `@testing-library/react@^16.3.1`, `@axe-core/react` (already in repo), `jsdom`.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As an analyst, I want `<AdoptionFunnel steps={data}>` to render without any provider so I can drop it into any tree | `adoption-funnel.test.tsx` TestProviderLessRender | Component mounts without `<AdoptionProvider>` wrapper; labels + bars present |
| US-2 | As an analyst, I want retention/drop-off math computed correctly so I trust the numbers | `calculate-funnel-metrics.test.ts` × `adoption-funnel.test.tsx` retention case | 100→60 shows 60.0% retention; 60→30 shows 50.0%; first step retention 100%; zero-entered first step has no NaN |
| US-3 | As a screen-reader user, I want an SR-only `<table>` mirroring the numbers so I get the same information | `adoption-funnel.test.tsx` TestSRTable | `getByRole('table', { hidden: true })` returns ≥1+N rows; cells include `entered`/`completed`/`retentionFromPrev` |
| US-4 | As a keyboard user, I want to activate funnel steps with Enter and Space so I don't need a mouse | `adoption-funnel.test.tsx` TestKeyboardActivation | Pressing Enter on a step fires `onStepClick`; Space same |
| US-5 | As a consumer in a provider tree, I want `useFunnelData({ featureIds })` to return current adoption state in `FunnelStep[]` shape so I can hand it straight to the component | `use-funnel-data.test.tsx` mock-context test | Two features in context → `steps` length 2; `entered`/`completed` numbers match mock |
| US-6 | As an a11y reviewer, I want axe to report zero violations on the default render | `adoption-funnel.test.tsx` TestAxe | `axe(container).violations` is empty array |
| US-7 | As a release engineer, I want zero new peer deps in `@tour-kit/adoption` | `package-json-deps.test.ts` reads package.json | `peerDependencies` matches main-branch snapshot; no `recharts`/`d3`/`victory` keys |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `calculateFunnelMetrics` | No mock — pure function | `conversion`, `retentionFromPrev`, `dropoffFromPrev` correct; no NaN/Infinity on zero entered | US-2 |
| `<AdoptionFunnel>` provider-less | No mock; render bare | Mounts; renders labels in order; bar widths proportional to `entered/max` | US-1, US-2 |
| `<AdoptionFunnel>` empty state | No mock | Default `<p>No funnel data yet.</p>` when `steps=[]`; `emptyState` prop overrides | US-1 |
| `<AdoptionFunnel>` click + keyboard | `vi.fn()` for `onStepClick`; `fireEvent.keyDown` for Enter/Space | Handler called with `(step, index)`; only when prop provided does `role='button'` appear | US-4 |
| SR `<table>` | No mock — render and query | `getByRole('table', { hidden: true })`; `1 + N` rows; cells contain expected numeric strings | US-3 |
| `aria-label` builder | No mock | Default label matches `/Adoption funnel: 100 → 60 → 30/`; override via `ariaLabel` prop replaces default | US-3 |
| Axe a11y | `@axe-core/react`'s `axe(container)` | `results.violations === []` | US-6 |
| `useFunnelData` | Mock `<AdoptionProvider>` value — render `<AdoptionProvider value={{ byFeature: {...}, loading: false, error: null }}>` via the context object directly | `result.steps[0].entered` and `.completed` match mock; `loading`/`error` pass-through correct | US-5 |
| `useAdoptionStats` (real existing hook) | No mock at function-level — mock the CONTEXT it consumes by providing a mock context value | The hook works against the real provider's API surface | US-5 |
| Reduced-motion compliance | Visual check in test: `@media (prefers-reduced-motion: reduce)` regex over CSS source OR `useReducedMotion()` return → class absence | If any entrance animation lands, `motion-safe:` prefix or `@media` wrapper present | (cross-cutting) |
| Bundle delta | `pnpm size` after build | `@tour-kit/adoption` delta vs main <2KB gzipped | (cross-cutting) |
| `package.json` peer deps | No mock — `JSON.parse(readFileSync)` | `peerDependencies` keys subset of pre-Phase-4 snapshot | US-7 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (pure helper) | `vitest` | <1s | Every push |
| Component (RTL) | `vitest`, `@testing-library/react`, `jsdom` | <3s | Every push |
| A11y | `@axe-core/react` | <2s | Every push |
| Hook (mock context) | `vitest`, RTL `renderHook`, provider context | <2s | Every push |
| Build hygiene (deps + size) | `pnpm build`, `size-limit` | <12s | Every push (CI) |

No integration / E2E tier.

---

## Fake / Mock Implementations

**Minimal fakes — one mock context value for the hook test.** No heavy dependencies to fake.

```ts
// packages/adoption/src/__tests__/_fixtures.ts (new — used by funnel + hook + future adoption tests)
import type { FunnelStep } from '../types/feature'

export const sampleSteps: readonly FunnelStep[] = [
  { id: 'view', label: 'Viewed', entered: 100, completed: 60 },
  { id: 'click', label: 'Clicked', entered: 60, completed: 30 },
  { id: 'convert', label: 'Converted', entered: 30, completed: 30 },
]

// Mock AdoptionContext value matching the existing provider's shape.
// Read packages/adoption/src/context/AdoptionContext.ts FIRST to confirm field names —
// these MUST match the real shape (usersWhoTried / usersWhoCompleted may be named differently).
export function mockAdoptionContext(features: Record<string, { tried: number; completed: number }>) {
  return {
    byFeature: Object.fromEntries(
      Object.entries(features).map(([id, v]) => [id, { usersWhoTried: v.tried, usersWhoCompleted: v.completed }]),
    ),
    loading: false,
    error: null as Error | null,
  }
}
```

For the hook test, render `<AdoptionContext.Provider value={mockAdoptionContext({...})}>` directly — bypass `<AdoptionProvider>` entirely so we don't have to construct the real provider's props. This is the cleanest way to isolate the hook's logic from provider plumbing.

**No new test classes.** Everything else uses RTL primitives + `vi.fn()` for click handlers.

---

## Test File List

```
packages/adoption/src/
├── __tests__/
│   ├── _fixtures.ts                                  # sampleSteps + mockAdoptionContext
│   └── package-json-deps.test.ts                     # no new peer deps in package.json
├── lib/__tests__/
│   └── calculate-funnel-metrics.test.ts              # ≥5 cases: empty/single/two-step/zero-entered/large
├── components/dashboard/__tests__/
│   └── adoption-funnel.test.tsx                      # ≥10 cases: order, retention, empty, click, keyboard, SR table, axe, ariaLabel default+override, provider-less mount
└── hooks/__tests__/
    └── use-funnel-data.test.tsx                      # 2+ features mapped to steps; loading/error pass-through

packages/adoption/__tests__/                          # OR via existing src/__tests__/ — match repo convention
└── (covered above)
```

---

## `setup` / Fixtures Structure

**Additions to existing setup at `packages/adoption/src/__tests__/setup.ts`** — verify the existing setup imports `@testing-library/jest-dom/vitest` and stubs ResizeObserver/matchMedia (same as core's setup). The funnel component renders bars with computed inline-style widths; jsdom doesn't compute layout, but we only read the inline-style string (not `getBoundingClientRect`), so no extra stubs are needed.

Add the `_fixtures.ts` shown above.

For axe, the existing repo uses `@axe-core/react` — confirm with `grep -r 'axe-core' packages/adoption/package.json` before assuming. If axe isn't already a dev dep in `@tour-kit/adoption`, add it to the package's `devDependencies` (catalog entry probably exists from `@tour-kit/announcements`/`@tour-kit/surveys` a11y tests).

No new CLI flags.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Don't mock `useAdoptionStats` — mock the context VALUE it reads from | Render `<AdoptionContext.Provider value={...}>` directly | Avoids tightly coupling the hook test to the provider's internal implementation |
| Bar width tested via inline style string, not bounding box | `expect(bar.style.width).toBe('60%')` | jsdom doesn't compute layout; the inline-style is the contract |
| SR table queried with `hidden: true` | RTL's accessible-name+role query | `.sr-only` clips visually but ARIA-tree still has it — `hidden: true` opts into the hidden subtree |
| `onStepClick` keyboard test fires `keyDown` for both Enter AND Space | Two separate cases or `it.each` | Keyboard-clickable widgets must support both per WCAG 2.1 |
| Axe is part of the standard test run, not gated | `expect(results.violations).toEqual([])` | Phase 4's spec calls a11y "non-negotiable" — keep the gate in the same `pnpm test` flow |
| Bundle delta test runs after `pnpm build`; otherwise `it.skip` | `existsSync('dist/index.mjs')` guard | Local dev doesn't always rebuild; CI does |
| `package-json-deps.test.ts` snapshots `peerDependencies` | Read package.json; check no unknown keys | Catches accidental `recharts` add even if not imported in code |
| Read `useAdoptionStats` source FIRST | Manual read of `packages/adoption/src/hooks/use-adoption-stats.ts` (or equivalent) | `mockAdoptionContext` must mirror the real shape — field names will drift if hand-named blindly |
| Don't write a visual-regression snapshot of the funnel SVG/CSS | N/A — no snapshot tests | Snapshots over rendered HTML are brittle; assert on roles + computed style values explicitly |

---

## Example Test Case

```tsx
// packages/adoption/src/components/dashboard/__tests__/adoption-funnel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from '@axe-core/react'
import { AdoptionFunnel } from '../adoption-funnel'
import { sampleSteps } from '../../../__tests__/_fixtures'

describe('<AdoptionFunnel>', () => {
  describe('provider-less rendering (data-first)', () => {
    it('mounts without any provider wrapper', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      expect(screen.getByText('Viewed')).toBeInTheDocument()
      expect(screen.getByText('Clicked')).toBeInTheDocument()
      expect(screen.getByText('Converted')).toBeInTheDocument()
    })

    it('renders labels in order', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      const labelEls = screen.getAllByText(/Viewed|Clicked|Converted/)
      expect(labelEls.map((el) => el.textContent)).toEqual(['Viewed', 'Clicked', 'Converted'])
    })
  })

  describe('metrics math', () => {
    it('shows retentionFromPrev between adjacent steps', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      expect(screen.getByText('60.0%')).toBeInTheDocument()  // 60/100
      expect(screen.getByText('50.0%')).toBeInTheDocument()  // 30/60
    })

    it('does NOT show retention on the first step', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const firstStep = container.querySelector('.tk-funnel__step')!
      expect(firstStep.querySelector('.tk-funnel__retention')).toBeNull()
    })
  })

  describe('empty state', () => {
    it('renders default message when steps is empty', () => {
      render(<AdoptionFunnel steps={[]} />)
      expect(screen.getByText(/No funnel data yet/i)).toBeInTheDocument()
    })
    it('renders custom emptyState when provided', () => {
      render(<AdoptionFunnel steps={[]} emptyState={<p>nothing here</p>} />)
      expect(screen.getByText('nothing here')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('invokes onStepClick with step + index', () => {
      const onClick = vi.fn()
      render(<AdoptionFunnel steps={sampleSteps} onStepClick={onClick} />)
      fireEvent.click(screen.getByText('Clicked').closest('li')!)
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'click' }), 1)
    })

    it.each([['Enter'], [' ']])('activates onStepClick on %s key', (key) => {
      const onClick = vi.fn()
      render(<AdoptionFunnel steps={sampleSteps} onStepClick={onClick} />)
      const step = screen.getByText('Viewed').closest('li')!
      fireEvent.keyDown(step, { key })
      expect(onClick).toHaveBeenCalled()
    })

    it('omits role=button when onStepClick is undefined', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })
  })

  describe('screen-reader fallback', () => {
    it('renders an SR table mirroring values', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      const table = screen.getByRole('table', { hidden: true })
      expect(table.querySelectorAll('tbody tr')).toHaveLength(3)
      expect(table).toHaveTextContent('100')
      expect(table).toHaveTextContent('60')
      expect(table).toHaveTextContent('30')
    })
  })

  describe('a11y', () => {
    it('passes axe with zero violations', async () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const results = await axe(container)
      expect(results.violations).toEqual([])
    })

    it('default aria-label summarizes the funnel', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      const chart = screen.getByRole('img')
      expect(chart.getAttribute('aria-label')).toMatch(/Adoption funnel: 100 → 60 → 30/)
    })

    it('respects ariaLabel override', () => {
      render(<AdoptionFunnel steps={sampleSteps} ariaLabel="Custom" />)
      expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Custom')
    })
  })
})
```

```ts
// packages/adoption/src/lib/__tests__/calculate-funnel-metrics.test.ts
import { describe, it, expect } from 'vitest'
import { calculateFunnelMetrics } from '../calculate-funnel-metrics'

describe('calculateFunnelMetrics', () => {
  it('returns empty array on empty input', () => {
    expect(calculateFunnelMetrics([])).toEqual([])
  })

  it('first step has retentionFromPrev=1 and dropoffFromPrev=0', () => {
    const [m] = calculateFunnelMetrics([{ id: 'a', label: 'A', entered: 50 }])
    expect(m.retentionFromPrev).toBe(1)
    expect(m.dropoffFromPrev).toBe(0)
  })

  it('two-step retention/dropoff computed correctly', () => {
    const m = calculateFunnelMetrics([
      { id: 'a', label: 'A', entered: 100, completed: 60 },
      { id: 'b', label: 'B', entered: 40, completed: 10 },
    ])
    expect(m[0]?.conversion).toBeCloseTo(0.6)
    expect(m[1]?.retentionFromPrev).toBeCloseTo(0.4)
    expect(m[1]?.dropoffFromPrev).toBe(60)
  })

  it('does not produce NaN/Infinity when first step has entered=0', () => {
    const m = calculateFunnelMetrics([
      { id: 'a', label: 'A', entered: 0 },
      { id: 'b', label: 'B', entered: 0 },
    ])
    expect(Number.isFinite(m[0]?.conversion ?? 0)).toBe(true)
    expect(Number.isFinite(m[1]?.retentionFromPrev ?? 0)).toBe(true)
  })

  it('handles missing completed (defaults to 0)', () => {
    const [m] = calculateFunnelMetrics([{ id: 'a', label: 'A', entered: 10 }])
    expect(m.completed).toBe(0)
    expect(m.conversion).toBe(0)
  })
})
```

```tsx
// packages/adoption/src/hooks/__tests__/use-funnel-data.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { AdoptionContext } from '../../context/AdoptionContext'   // verify exact path
import { useFunnelData } from '../use-funnel-data'
import { mockAdoptionContext } from '../../__tests__/_fixtures'

describe('useFunnelData', () => {
  it('maps two features into a FunnelStep[] of length 2', () => {
    const ctxVal = mockAdoptionContext({
      onboarding: { tried: 100, completed: 60 },
      checkout: { tried: 60, completed: 30 },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdoptionContext.Provider value={ctxVal as any}>{children}</AdoptionContext.Provider>
    )
    const { result } = renderHook(
      () => useFunnelData({ featureIds: ['onboarding', 'checkout'] }),
      { wrapper },
    )
    expect(result.current.steps).toHaveLength(2)
    expect(result.current.steps[0]).toMatchObject({ id: 'onboarding', entered: 100, completed: 60 })
  })

  it('passes through loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdoptionContext.Provider value={{ byFeature: {}, loading: true, error: null } as any}>{children}</AdoptionContext.Provider>
    )
    const { result } = renderHook(() => useFunnelData({ featureIds: [] }), { wrapper })
    expect(result.current.loading).toBe(true)
  })

  it('applies label overrides via opts.labels', () => {
    const ctxVal = mockAdoptionContext({ feat: { tried: 1, completed: 0 } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdoptionContext.Provider value={ctxVal as any}>{children}</AdoptionContext.Provider>
    )
    const { result } = renderHook(
      () => useFunnelData({ featureIds: ['feat'], labels: { feat: 'Pretty Feature' } }),
      { wrapper },
    )
    expect(result.current.steps[0]?.label).toBe('Pretty Feature')
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 4 of Tour Kit's Sprint 1 — AdoptionFunnel widget (issue #1).

### What This Project Is
Tour Kit's commercial `@tour-kit/adoption` package already ships `<AdoptionDashboard>` with stats / table / category chart. The most-requested missing piece is a step-by-step funnel — Pendo and Userpilot both have one. Phase 4 adds `<AdoptionFunnel>` using the SAME native-CSS approach the existing dashboard uses (Phase 0 chart-dep decision: NO recharts). Data-first: `<AdoptionFunnel steps={data}>` works without any provider. A separate `useFunnelData({ featureIds })` hook is a CURRENT-STATE selector over the existing `useAdoptionStats` for in-provider consumers.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | Component renders without AdoptionProvider | TestProviderLessRender | mounts; labels in order |
| US-2 | Retention/drop-off math correct | calculate-funnel-metrics × component retention case | 60.0% / 50.0% / no NaN |
| US-3 | SR table mirrors values | TestSRTable | role=table hidden:true; 1+N rows |
| US-4 | Enter + Space activate clicks | TestKeyboardActivation | onStepClick called on both |
| US-5 | useFunnelData returns FunnelStep[] in provider | use-funnel-data.test | two features → two steps |
| US-6 | axe zero violations | TestAxe | violations === [] |
| US-7 | No new peer deps | package-json-deps.test | recharts/d3/victory absent |

### Why Fakes Are Required
**None heavy.** The funnel is data-first, so the component tests pass `steps` directly. The hook test mocks the `AdoptionContext` VALUE (not the provider) because (a) `useAdoptionStats` reads context, and (b) constructing the real `<AdoptionProvider>` would couple the test to provider-internal plumbing. The mock context is hand-built to match the real `byFeature: Record<string, FeatureUsage>` shape.

### What NOT to Test
- Don't add `recharts` for the test — Phase 0 decided native CSS; pulling recharts into tests would force it into the package's transitive deps.
- Don't visual-snapshot the rendered HTML — assertions on roles + computed-style strings are more robust.
- Don't test `useAdoptionStats` semantics — Phase 4 builds on top of it; the existing tests own that surface.
- Don't test the funnel's appearance under `prefers-reduced-motion` programmatically — assert on the CSS source (presence of `@media (prefers-reduced-motion: reduce)` or `motion-safe:` Tailwind prefix) instead of trying to flip the OS-level pref.
- Don't claim the hook supports historical date-range funnels — it's CURRENT-STATE only; assert this in the JSDoc, not in tests.
- Don't run `pnpm size` in the unit-test file — it's a CI step in run commands.

### Critical: Fake Implementations

```ts
// packages/adoption/src/__tests__/_fixtures.ts
import type { FunnelStep } from '../types/feature'

export const sampleSteps: readonly FunnelStep[] = [
  { id: 'view', label: 'Viewed', entered: 100, completed: 60 },
  { id: 'click', label: 'Clicked', entered: 60, completed: 30 },
  { id: 'convert', label: 'Converted', entered: 30, completed: 30 },
]

// IMPORTANT: read packages/adoption/src/context/AdoptionContext.ts FIRST.
// The field names below (usersWhoTried / usersWhoCompleted) are speculative — replace with the actual property names from the real context.
export function mockAdoptionContext(features: Record<string, { tried: number; completed: number }>) {
  return {
    byFeature: Object.fromEntries(
      Object.entries(features).map(([id, v]) => [id, { usersWhoTried: v.tried, usersWhoCompleted: v.completed }]),
    ),
    loading: false,
    error: null as Error | null,
  }
}
```

### Test Files to Create

```
packages/adoption/src/
├── __tests__/
│   ├── _fixtures.ts                                  # sampleSteps + mockAdoptionContext
│   └── package-json-deps.test.ts                     # peerDependencies snapshot — no recharts/d3/victory
├── lib/__tests__/
│   └── calculate-funnel-metrics.test.ts              # ≥5 cases
├── components/dashboard/__tests__/
│   └── adoption-funnel.test.tsx                      # ≥10 cases — see breakdown
└── hooks/__tests__/
    └── use-funnel-data.test.tsx                      # 3 cases — happy / loading / label override
```

### Per-File Coverage Guidance

#### `lib/__tests__/calculate-funnel-metrics.test.ts`
5 cases:
- empty array → `[]`
- single step → `retentionFromPrev: 1`, `dropoffFromPrev: 0`
- two steps with retention 40% and drop-off 60 — values computed correctly
- zero-entered first step → no `NaN`/`Infinity` anywhere in the output
- missing `completed` → defaults to 0, `conversion: 0`

#### `components/dashboard/__tests__/adoption-funnel.test.tsx`
≥10 cases organized into describes:
- **Provider-less rendering:** mounts without provider; labels in order
- **Metrics math:** retentionFromPrev shown between adjacent steps (60.0% / 50.0%); first step has no retention shown
- **Empty state:** default message; custom `emptyState` prop overrides
- **Interaction:** click fires `onStepClick(step, index)`; Enter activates; Space activates; without `onStepClick`, no `role='button'`
- **SR fallback:** `getByRole('table', { hidden: true })` with `1 + N` rows; cells contain expected numbers
- **A11y:** axe zero violations; default `aria-label` matches `/Adoption funnel: 100 → 60 → 30/`; `ariaLabel` prop overrides

#### `hooks/__tests__/use-funnel-data.test.tsx`
3 cases:
- two features in mock context → two-step FunnelStep[]
- loading state passes through
- `labels` prop overrides `id` in step.label

Use `<AdoptionContext.Provider value={mockAdoptionContext({...}) as any}>` as the wrapper — the `as any` is intentional because we're bypassing the real provider's type-narrowing. Add a comment explaining why.

#### `__tests__/package-json-deps.test.ts`
Read `packages/adoption/package.json`. Assert:
- `peerDependencies` does NOT include `recharts`, `d3`, `victory`, `chart.js`, `nivo`.
- Optional: snapshot the current peerDependencies object so PRs that add a new peer require explicit acknowledgement.

### Data Model Notes
- `FunnelStep.completed` is optional; defaults to 0 in `calculateFunnelMetrics`.
- The component's bar width is set via `style.width = '${pct}%'` inline — assertions read `bar.style.width`, not `getBoundingClientRect` (jsdom doesn't compute layout).
- `aria-hidden="true"` on the visual bar + retention; the SR `<table>` provides the same data. `getByRole('table', { hidden: true })` queries the hidden-from-AX-tree subtree.

### Success Criteria
- `pnpm --filter @tour-kit/adoption typecheck && pnpm --filter @tour-kit/adoption test` exit 0.
- `pnpm --filter @tour-kit/adoption test -- adoption-funnel` ≥10 cases green.
- `pnpm --filter @tour-kit/adoption test -- calculate-funnel-metrics` ≥5 cases green.
- `pnpm --filter @tour-kit/adoption test -- use-funnel-data` 3 cases green.
- Axe reports `violations: []`.
- `pnpm --filter @tour-kit/adoption build` exits 0; `pnpm size` reports adoption package delta <2KB vs main.
- `peerDependencies` snapshot test passes (no recharts).

### Expected File Structure at End
```
packages/adoption/src/
├── __tests__/
│   ├── _fixtures.ts
│   └── package-json-deps.test.ts
├── lib/__tests__/
│   └── calculate-funnel-metrics.test.ts
├── components/dashboard/__tests__/
│   └── adoption-funnel.test.tsx
└── hooks/__tests__/
    └── use-funnel-data.test.tsx
```
---

---

## Run Commands

```bash
# Pure helper tests
pnpm --filter @tour-kit/adoption test -- calculate-funnel-metrics

# Component tests (RTL + axe)
pnpm --filter @tour-kit/adoption test -- adoption-funnel

# Hook test
pnpm --filter @tour-kit/adoption test -- use-funnel-data

# Build hygiene (deps + bundle size)
pnpm --filter @tour-kit/adoption test -- package-json-deps
pnpm --filter @tour-kit/adoption build && pnpm size

# Full Phase 4 gate
pnpm --filter @tour-kit/adoption typecheck && \
  pnpm --filter @tour-kit/adoption test && \
  pnpm --filter @tour-kit/adoption build && \
  pnpm size
```
