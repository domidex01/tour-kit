# Phase 9 — Adoption Dashboard + NudgeAnchor

**Duration:** Days 46–51 (~10–14 hours)
**Depends on:** Nothing (the adoption package is self-contained until Phase 16)
**Blocks:** Phase 16 — `serverEventAdapter` integrates with the dashboard's time-series surface, so the `history` prop shape and the segment-filter contract defined here must not rename
**Risk Level:** MEDIUM — largest single component this roadmap (the dashboard adds 2 new props + a 1KB inline-SVG sparkline subcomponent + a segment-aware selector layer), but the blast radius is contained to `@tour-kit/adoption`; no provider rewrite, no cross-package contract change. The NudgeAnchor portal/ref plumbing is conceptually similar to Phase 5's target-as-ref union, so reviewers already know the pattern.
**Stack:** react

---

## Objective

Ship the two adoption-package surfaces consumers shouldn't have to invent. Today `@tour-kit/adoption` exposes a working dashboard (`<AdoptionDashboard>`) but it only renders bulk metrics from `useAdoptionStats`; consumers who want to (a) drill into a single tour's adoption funnel, (b) see a usage trend rather than a point-in-time count, or (c) split the dashboard by persona / plan / route end up rebuilding chunks of the dashboard themselves. Phase 9 adds three opt-in props to the existing dashboard (`tourId`, `segmentBy`, `history`) plus an inline-SVG `<Sparkline>` subcomponent, with an explicit `emptyState` slot so the dashboard never renders as a sea of zeroes when no data has been collected.

The second deliverable is `<NudgeAnchor featureId="...">` — a tiny render-prop component that registers an anchor element with the existing `useNudge()` plumbing so the next pending nudge for that feature renders **in-context next to the target element** instead of as a global toast. This closes the explicit pain point that `<AdoptionNudge>` always positions itself globally and offers no way to say "render the 'try dark mode' nudge anchored to the dark-mode toggle button." It accepts a render-prop / ref pattern that mirrors Phase 5's target-as-ref union, so consumers learn one anchoring idiom across the package family.

Both changes are additive — `<AdoptionDashboard />` and `<AdoptionNudge />` with their current prop sets continue to work unchanged.

## What Success Looks Like

1. `<AdoptionDashboard tourId="onboarding" />` renders without the consumer writing any chart code or filtering logic — verified by an RTL test that renders the dashboard inside an `<AdoptionProvider>` configured with three features (two with `resources.tourId === "onboarding"`, one without) and asserts the stats grid totals reflect 2 features, not 3.
2. `<AdoptionDashboard segmentBy="persona" />` renders one segment card per distinct persona key resolved from the new `getSegment` provider prop — verified by an RTL test that primes two personas and asserts two segment cards appear with the persona names as `data-tk-segment` attributes.
3. `<AdoptionDashboard history={[{ date, value }, ...]} />` renders an inline-SVG sparkline with one `<polyline>` element and exactly N points (one per data point) — verified by an RTL test that passes 7 points and asserts `container.querySelectorAll('polyline').length === 1` and the polyline's `points` attribute parses to 7 coordinate pairs.
4. `<AdoptionDashboard emptyState={<p>Nothing yet</p>} />` renders the supplied empty-state node when `useAdoptionStats().totalCount === 0` — verified by an RTL test that mounts the dashboard inside a provider with `features={[]}` and asserts the supplied node is rendered while `<AdoptionTable />` and `<AdoptionCategoryChart />` are not.
5. Default empty state: when no `emptyState` prop is passed and `totalCount === 0`, a sensible default message (`"No adoption data yet. Track at least one feature to see metrics."`) renders — verified by RTL.
6. `<NudgeAnchor featureId="import-csv">{(props) => <button ref={props.ref}>Import CSV</button>}</NudgeAnchor>` resolves to the correct DOM target and renders the `<AdoptionNudge>` UI positioned adjacent to that element when `useNudge()` lists `import-csv` in `pendingNudges` — verified by an RTL test that fakes a pending nudge, mounts a `<NudgeAnchor>`, and asserts the nudge's bounding rect is within 16px of the anchor's bounding rect on the requested side.
7. `<NudgeAnchor featureId="import-csv" placement="top" />` (no children) falls back to `document.getElementById('import-csv')` or a `[data-tk-feature="import-csv"]` selector — verified by an RTL test with a pre-mounted `<button data-tk-feature="import-csv" />` and assertion that the nudge anchors to that element.
8. `<NudgeAnchor>` is no-op (renders nothing) when there is no pending nudge for the given feature — verified by RTL.
9. Docs preview pages render: `apps/docs/content/docs/adoption/components/adoption-dashboard.mdx` shows three live examples (sparkline with mock data, segment-by-persona, empty state); `apps/docs/content/docs/adoption/components/nudge-anchor.mdx` shows three placement modes (`render-prop`, `selector`, `id`). Both pages appear under Adoption → Components in the sidebar.
10. Bundle delta: `pnpm --filter @tour-kit/adoption build && bash scripts/check-bundle-delta.sh adoption 8192` reports the gzipped delta of `dist/index.js` is under 8KB compared to the v2.1.0 baseline. Script is new; see Task 9.3.
11. `pnpm --filter @tour-kit/adoption typecheck` exits 0 and `pnpm --filter @tour-kit/adoption test -- --run` exits 0 with the new test files passing and zero regressions.

---

## Architecture / Key Design Decisions

```
@tour-kit/adoption
  src/components/dashboard/
    adoption-dashboard.tsx        ← UPDATED — adds tourId, segmentBy, history, emptyState props;
                                    selects via useFilteredStats / segments; renders Sparkline + segment cards
    sparkline.tsx                 ← NEW — inline-SVG line chart; <2KB; zero deps; SSR-safe;
                                    motion-safe (no animation by default; reuses prefers-reduced-motion via @tour-kit/core useReducedMotion if a future tween is added)

  src/components/
    nudge-anchor.tsx              ← NEW — registers an anchor element with useNudge() plumbing;
                                    renders <AdoptionNudge> positioned adjacent to the anchor.
                                    Anchor resolution union: render-prop ref | id | selector

  src/hooks/
    use-adoption-stats.ts          ← UPDATED — optional filter arg: { tourId?, segmentKey? };
                                    pure addition, no breaking change. Existing zero-arg call keeps current behavior.
    use-nudge-anchor.ts             ← NEW (small) — useSyncExternalStore for resolved-target rect + Floating UI placement.
                                    Only created if Floating UI dep is already present in adoption package; if not, falls back to a tiny getBoundingClientRect + resize-observer hook (decision in Architecture below).

  src/types/feature.ts             ← UPDATED — add `Persona` shape + `SegmentKey` union; pure additive types

  src/__tests__/components/
    adoption-dashboard.test.tsx    ← NEW — tourId filter, segmentBy, history sparkline, emptyState
    nudge-anchor.test.tsx          ← NEW — render-prop ref, selector fallback, id fallback, no-op when no nudge

  apps/docs/content/docs/adoption/components/
    adoption-dashboard.mdx         ← UPDATED — three new live examples (sparkline, segments, empty state)
    nudge-anchor.mdx               ← NEW — three placement examples
    meta.json                      ← UPDATED — adds nudge-anchor

  packages/playwright/__tests__/
    adoption-dashboard.spec.ts     ← NEW — three visual regression snapshots (sparkline, segments, empty)
    nudge-anchor.spec.ts           ← NEW — anchor positioning across viewport-resize and scroll
```

### Chart-library decision — **hand-rolled inline SVG (recommended)**

A repo-wide search confirmed **zero existing chart libraries** in any package (`grep -rE "from ['\"](recharts|visx|chart\.js|@nivo|victory|d3)" packages/` returns no matches; `package.json` audit across all 12 packages returns no chart deps). Three options were considered:

| Option | Bundle add | Verdict |
|--------|-----------|---------|
| `recharts` (peer-optional) | +24KB gzipped (D3 fragments + React internals) for a single sparkline | Rejected — overkill for one polyline; peer-optional adds the same DX friction as a hard dep for the consumer who *does* want the sparkline |
| `visx/sparkline` (peer-optional) | +12KB gzipped | Rejected — same overhead-to-feature ratio; we'd ship 12KB to render 5 lines of `<polyline>` |
| **Hand-rolled inline SVG** | **~0.8KB gzipped** | **Chosen** — sparkline is a single normalized polyline + optional area fill; the math is 6 lines |

Rationale: a sparkline is one of the cheapest things to draw with `<svg><polyline>`. We pay the bundle cost of a library only if we expect to add bar charts / scatter plots later. Phase 16's server-event adapter feeds the same `history` prop shape, so the inline-SVG path remains the dashboard's chart engine for the foreseeable future. If a later phase (not on this roadmap) needs richer charts, we add a peer-optional adapter the same way Phase 7 added Sonner — opt-in subpath, zero bytes in the main entry.

The inline-SVG sparkline path generator (paste verbatim into `sparkline.tsx`):

```tsx
// packages/adoption/src/components/dashboard/sparkline.tsx
'use client'

import * as React from 'react'
import { cn } from '@tour-kit/core'

export interface SparklinePoint {
  /** ISO date string for the bucket (used as React key + screen-reader label). */
  date: string
  /** Non-negative numeric value (use count, adoption %, whatever fits). */
  value: number
}

export interface SparklineProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  /** Time-series points in chronological order. */
  data: ReadonlyArray<SparklinePoint>
  /** Visible width in px (SVG viewBox sets the coordinate space). */
  width?: number
  /** Visible height in px. */
  height?: number
  /** Stroke color (defaults to currentColor so theme inheritance works). */
  stroke?: string
  /** Stroke thickness. */
  strokeWidth?: number
  /** Render a faint area fill under the line. */
  filled?: boolean
  /** Screen-reader summary. Default: `Sparkline: N1, N2, N3, …` */
  ariaLabel?: string
}

/**
 * Inline-SVG sparkline. Zero deps. Renders a single normalized <polyline>
 * (plus an optional area <path>) with an SR-only auto-label so it's accessible.
 *
 * Renders nothing when `data.length < 2` — a single point is not a trend.
 */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke,
  strokeWidth = 1.5,
  filled = false,
  ariaLabel,
  className,
  ...rest
}: SparklineProps): React.ReactElement | null {
  if (data.length < 2) return null

  const values = data.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1 // avoid div-by-zero when all values equal

  // Normalize to viewBox coordinates: [0..width] × [0..height], y inverted.
  const stepX = width / (data.length - 1)
  const points = data
    .map((p, i) => `${(i * stepX).toFixed(2)},${(height - ((p.value - min) / range) * height).toFixed(2)}`)
    .join(' ')

  const areaPath = filled
    ? `M0,${height} L${points.replaceAll(' ', ' L')} L${width},${height} Z`
    : null

  const label =
    ariaLabel ?? `Sparkline: ${values.join(', ')} (min ${min}, max ${max}, n=${data.length})`

  return (
    <svg
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('tk-sparkline', className)}
      {...rest}
    >
      {areaPath ? (
        <path d={areaPath} fill={stroke ?? 'currentColor'} fillOpacity={0.12} stroke="none" />
      ) : null}
      <polyline
        fill="none"
        stroke={stroke ?? 'currentColor'}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}
```

### `<NudgeAnchor>` shape — render-prop ref union (matches Phase 5)

`<NudgeAnchor>` accepts the same anchor-resolution union as Phase 5's `target` prop on `<TourStep>`:

```ts
export type NudgeAnchorTarget =
  | string                                  // CSS selector OR raw id (auto-detect: starts with '.' or '[' → selector; else id)
  | React.RefObject<HTMLElement | null>     // explicit ref
  | (() => HTMLElement | null)              // resolver fn

export interface NudgeAnchorRenderProps {
  /** Attach to the element you want the nudge to anchor against. */
  ref: React.MutableRefObject<HTMLElement | null>
}

export interface NudgeAnchorProps {
  /** Feature id to anchor; the next pending nudge for this id renders here. */
  featureId: string
  /** Floating-ui placement string. Default 'bottom'. */
  placement?: 'top' | 'right' | 'bottom' | 'left'
  /** Explicit anchor target — when omitted, falls back to children render-prop. */
  target?: NudgeAnchorTarget
  /**
   * Render prop. Receives a ref the consumer attaches to the anchor element.
   * When `target` is provided, children is ignored (and a dev `console.warn` fires).
   */
  children?: (props: NudgeAnchorRenderProps) => React.ReactNode
}
```

Resolution priority at render time (documented):

1. If `target` is a `RefObject` → use `target.current`.
2. If `target` is a function → call it.
3. If `target` is a string starting with `.` or `[` or `#` → `document.querySelector(target)`.
4. If `target` is any other string → first try `document.getElementById(target)`, then `document.querySelector('[data-tk-feature="' + target + '"]')`.
5. Otherwise (no `target`, only `children`) → use the ref provided to the render-prop.
6. If still null → render nothing (no-op), no warn (the anchor element may simply not be mounted yet).

When `useNudge().pendingNudges` does **not** include `featureId`, the component renders nothing regardless of anchor resolution.

The nudge content reuses the existing `<AdoptionNudge>` UI — `<NudgeAnchor>` is positional plumbing, not a redesign. Positioning uses a tiny `useNudgeAnchor()` hook that wraps `getBoundingClientRect()` + a `ResizeObserver` so the nudge reflows on viewport resize / scroll. No Floating UI dep is added (the adoption package does not currently depend on `@floating-ui/react` — confirmed via `grep "floating-ui" packages/adoption/package.json` → no match). A 30-line custom positioning hook is cheaper than adding a 6KB peer dep here.

### Segment-by-persona / plan / route — `segmentBy` resolver pattern

`segmentBy` accepts a closed union: `'persona' | 'plan' | 'route' | string` (string for custom segment keys). The resolver itself is provider-level — `<AdoptionProvider>` already accepts a `userContext` shape (see `packages/adoption/src/context/adoption-context.tsx`). Phase 9 widens `userContext` with an optional `getSegment` function:

```ts
// packages/adoption/src/types/feature.ts (additive)
export type SegmentKey = string  // open string for custom keys; 'persona' | 'plan' | 'route' are conventions

export interface AdoptionUserContext {
  // existing fields unchanged
  /** Resolves a feature + user pair to a segment label for dashboard splits. */
  getSegment?: (featureId: string, axis: SegmentKey) => string | null
}
```

When `<AdoptionDashboard segmentBy="persona">` is rendered, the dashboard:

1. Iterates `useAdoptionStats().features`.
2. For each feature, calls `userContext.getSegment(feature.id, 'persona')`.
3. Groups features by the returned label (or `'unsegmented'` when null).
4. Renders one `<AdoptionStatsGrid>` per group with a `data-tk-segment` attribute on the wrapper for testability.

If `userContext.getSegment` is undefined and `segmentBy` is passed, dev `console.warn` fires once: `[tour-kit] <AdoptionDashboard segmentBy="..."> requires AdoptionProvider userContext.getSegment to be supplied. Rendering ungrouped.` and the dashboard falls back to the existing ungrouped layout.

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `SparklinePoint`, `SparklineProps` | `interface` exported from `@tour-kit/adoption` | Public API for the new subcomponent; consumers extend SparklineProps for custom variants |
| `NudgeAnchorProps`, `NudgeAnchorTarget`, `NudgeAnchorRenderProps` | `interface` / `type` exported from `@tour-kit/adoption` | Public API; mirrors Phase 5 union shape |
| `AdoptionDashboardProps` (existing — extended) | `interface`, additive optional fields only | Backwards-compatible: existing consumers see zero diff |
| `AdoptionUserContext` (existing — extended) | `interface`, additive `getSegment` field | Provider-level, additive |
| Internal segment buckets | `Record<string, FeatureWithUsage[]>` | Hot path during render; plain object is faster than `Map.set()` in React render loops |
| Sparkline rendered coords | `string` (joined `"x,y"` pairs for the `points` attr) | The SVG attribute takes a string; no need for an intermediate array |

**Critical rules for this phase:**

- **No new external deps.** `recharts` / `visx` / `@floating-ui/react` are explicitly rejected for this phase. The sparkline is inline SVG; the nudge anchor uses `getBoundingClientRect` + `ResizeObserver`. The bundle-delta gate (<8KB gzipped) enforces this — adding a chart library will trip it.
- **Backwards-compatible dashboard.** `<AdoptionDashboard />` with no new props must continue to render identically. Every new prop is optional with a `?` and a sensible default behavior (no filter, no segmentation, no sparkline, default empty state text).
- **No animations.** The sparkline is static. The nudge anchor reuses `<AdoptionNudge>`'s existing animation; if any nudge animation is added later, it must follow the three-tier `prefers-reduced-motion` defense from CLAUDE.md (already enforced in the existing nudge variants).
- **No provider rewrite.** `useAdoptionStats` gains an optional argument; the underlying context shape is unchanged. The `getSegment` addition to `userContext` is a single optional field.
- **`'use client'` directives required.** Both new files (`sparkline.tsx`, `nudge-anchor.tsx`) start with `'use client'` because they use refs / `useSyncExternalStore` / event listeners. Matches the existing convention enforced by `tsup.config.ts`'s `onSuccess` banner check.
- **No `<AdoptionDashboard>` API rename.** The dashboard's `showStats`/`showTable`/`showChart`/`showFilters` props stay. `tourId`, `segmentBy`, `history`, `emptyState` are pure additions.
- **Empty state contract.** "Empty" is defined as `useAdoptionStats().totalCount === 0` **after** the `tourId` filter is applied. Filtering to an unknown `tourId` should render the empty state.
- **Segment dev-warn fires once.** Use a `useRef` flag at module scope (matches the warn-once pattern from Phase 7's Sonner adapter).

---

## Tasks

### Task 9.1 — `<AdoptionDashboard>` widget: tourId + segments + sparkline + empty state (6–8 h)

**Depends on:** —

Extend the existing `packages/adoption/src/components/dashboard/adoption-dashboard.tsx` with four new optional props. Ship the new `Sparkline` subcomponent and the `useAdoptionStats({ tourId })` signature widening.

Updated `AdoptionDashboardProps`:

```ts
// packages/adoption/src/components/dashboard/adoption-dashboard.tsx
export interface AdoptionDashboardProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionDashboardVariants {
  /* --- existing props (preserved) --- */
  showStats?: boolean
  showTable?: boolean
  showChart?: boolean
  showFilters?: boolean
  tableColumns?: ('name' | 'status' | 'category' | 'uses' | 'lastUsed' | 'premium')[]

  /* --- new props (additive, all optional) --- */
  /** Filter all rendered metrics + chart + table to features whose `resources.tourId === tourId`. */
  tourId?: string
  /**
   * Split the dashboard by a segment axis. 'persona' | 'plan' | 'route' are conventions;
   * any string is accepted and forwarded to `userContext.getSegment(featureId, axis)`.
   * When provider has no `getSegment`, renders ungrouped + dev warn.
   */
  segmentBy?: 'persona' | 'plan' | 'route' | (string & {})
  /**
   * Optional time-series for a sparkline rendered above the stats grid.
   * Skip to omit the sparkline entirely (default).
   */
  history?: ReadonlyArray<{ date: string; value: number }>
  /**
   * Replaces the default "No adoption data yet" message when `totalCount === 0`
   * (after the optional tourId filter is applied).
   */
  emptyState?: React.ReactNode
}
```

`useAdoptionStats` widening (pure addition, no rename):

```ts
// packages/adoption/src/hooks/use-adoption-stats.ts
export interface UseAdoptionStatsOptions {
  /** Restrict the returned features to those linked to this tour. */
  tourId?: string
}

export function useAdoptionStats(options?: UseAdoptionStatsOptions): AdoptionStats {
  const { features, usageMap } = useAdoptionContext()
  return React.useMemo(() => {
    const filtered = options?.tourId
      ? features.filter((f) => f.resources?.tourId === options.tourId)
      : features
    // ... existing grouping logic over `filtered` instead of `features`
  }, [features, usageMap, options?.tourId])
}
```

The dashboard's render branches:

1. Resolve `stats = useAdoptionStats({ tourId })`.
2. If `stats.totalCount === 0` → render `emptyState ?? <DefaultEmptyState />` and return (skip stats / table / chart).
3. If `segmentBy` is set → call `userContext.getSegment(featureId, segmentBy)` for each feature; bucket; render one segment group per bucket (each group is the existing dashboard layout with a `data-tk-segment={label}` wrapper + a small `<h3>` label). Sparkline (if `history` provided) renders **above** the segment groups, not per-segment, because `history` is a single aggregate series.
4. If neither `tourId`-filtered to empty nor segmented → render the existing layout (`<AdoptionStatsGrid>` + `<AdoptionTable>` + `<AdoptionCategoryChart>`) plus the sparkline at top if `history` is supplied.

Implement `<DefaultEmptyState>` inline as a tiny `function DefaultEmptyState(): JSX.Element { return <p className="tk-adoption-dashboard__empty">No adoption data yet. Track at least one feature to see metrics.</p> }`. No new cva file.

Add the `getSegment?` field to `AdoptionUserContext` in `packages/adoption/src/types/feature.ts` (or wherever `AdoptionUserContext` lives — verify by `grep -nE "AdoptionUserContext|userContext" packages/adoption/src/types/` during implementation). Update `packages/adoption/src/context/adoption-provider.tsx` to pass it through to the context value (one-line addition).

**Sanity check:** `pnpm --filter @tour-kit/adoption typecheck` exits 0; `pnpm --filter @tour-kit/adoption test -- --run adoption-dashboard` exits 0 with all new tests passing.

---

### Task 9.2 — `<NudgeAnchor featureId="…">` companion + render-prop ref / selector / id resolver (3–4 h)

**Depends on:** —

New file `packages/adoption/src/components/nudge-anchor.tsx`. Plus a small positioning hook at `packages/adoption/src/hooks/use-nudge-anchor.ts`.

The render-prop pattern (copy-paste contract — matches Phase 5's target-as-ref union shape):

```tsx
// packages/adoption/src/components/nudge-anchor.tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useNudge } from '../hooks'
import { useAdoptionContext } from '../context/adoption-context'
import { useNudgeAnchor } from '../hooks/use-nudge-anchor'
import type { Feature } from '../types'

export type NudgeAnchorTarget =
  | string
  | React.RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

export interface NudgeAnchorRenderProps {
  ref: React.MutableRefObject<HTMLElement | null>
}

export interface NudgeAnchorProps {
  featureId: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  target?: NudgeAnchorTarget
  /** Render prop receives a ref to attach to the anchor element. */
  children?: (props: NudgeAnchorRenderProps) => React.ReactNode
}

export function NudgeAnchor({
  featureId,
  placement = 'bottom',
  target,
  children,
}: NudgeAnchorProps): React.ReactElement | null {
  const { pendingNudges, dismissNudge, snoozeNudge, handleNudgeClick } = useNudge()
  const ownRef = React.useRef<HTMLElement | null>(null)

  // Resolve the anchor target every render — cheap; the ref/selector lookup
  // is sub-millisecond and the result is fed to a memoized positioning hook.
  const anchorEl = React.useMemo(() => resolveAnchor(target, ownRef), [target])

  const feature = pendingNudges.find((f) => f.id === featureId)
  const position = useNudgeAnchor(anchorEl, placement)

  // No pending nudge → render nothing (still need to render the render-prop
  // so the consumer's element mounts; the nudge itself is the conditional).
  return (
    <>
      {children?.({ ref: ownRef })}
      {feature && position && typeof document !== 'undefined'
        ? createPortal(
            <AnchoredNudgeUI
              feature={feature}
              style={positionToStyle(position)}
              onDismiss={() => dismissNudge(feature.id)}
              onSnooze={(ms) => snoozeNudge(feature.id, ms)}
              onClick={() => handleNudgeClick(feature.id)}
            />,
            document.body,
          )
        : null}
    </>
  )
}

function resolveAnchor(
  target: NudgeAnchorTarget | undefined,
  ownRef: React.MutableRefObject<HTMLElement | null>,
): HTMLElement | null {
  if (target == null) return ownRef.current
  if (typeof target === 'function') return target()
  if (typeof target === 'object' && 'current' in target) return target.current
  if (typeof document === 'undefined') return null
  // String — try selector vs id heuristics
  if (target.startsWith('.') || target.startsWith('[') || target.startsWith('#')) {
    return document.querySelector<HTMLElement>(target)
  }
  return (
    document.getElementById(target) ??
    document.querySelector<HTMLElement>(`[data-tk-feature="${cssEscape(target)}"]`)
  )
}

function cssEscape(s: string): string {
  // CSS.escape is widely supported (97%+ as of 2026); fall back to a basic strip
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replaceAll(/["\\]/g, '\\$&')
}
```

The positioning hook (`use-nudge-anchor.ts`):

```ts
// packages/adoption/src/hooks/use-nudge-anchor.ts
'use client'

import * as React from 'react'

export interface AnchorPosition {
  top: number
  left: number
}

const GAP = 8  // px between anchor and nudge

export function useNudgeAnchor(
  anchorEl: HTMLElement | null,
  placement: 'top' | 'right' | 'bottom' | 'left',
): AnchorPosition | null {
  const [pos, setPos] = React.useState<AnchorPosition | null>(null)

  React.useEffect(() => {
    if (!anchorEl || typeof window === 'undefined') {
      setPos(null)
      return
    }

    const update = () => {
      const rect = anchorEl.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      switch (placement) {
        case 'top':
          setPos({ top: rect.top + scrollY - GAP, left: rect.left + scrollX + rect.width / 2 })
          break
        case 'bottom':
          setPos({ top: rect.bottom + scrollY + GAP, left: rect.left + scrollX + rect.width / 2 })
          break
        case 'left':
          setPos({ top: rect.top + scrollY + rect.height / 2, left: rect.left + scrollX - GAP })
          break
        case 'right':
          setPos({ top: rect.top + scrollY + rect.height / 2, left: rect.right + scrollX + GAP })
          break
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(anchorEl)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [anchorEl, placement])

  return pos
}
```

`<AnchoredNudgeUI>` is a thin internal copy of `<AdoptionNudge>`'s default render — same content (title + description + Try it/Dismiss buttons), but positioned absolutely via the `style` prop instead of using the global `adoptionNudgeVariants({ position })` class. Reuses `featureButtonVariants` for the buttons so styling stays consistent.

Re-export `NudgeAnchor`, `NudgeAnchorProps`, `NudgeAnchorTarget`, `NudgeAnchorRenderProps` from `packages/adoption/src/components/index.ts` and the top-level `src/index.ts`.

**Sanity check:** `pnpm --filter @tour-kit/adoption typecheck` exits 0; `pnpm --filter @tour-kit/adoption test -- --run nudge-anchor` exits 0 with all four resolver-path tests passing.

---

### Task 9.3 — Docs MDX pages, Playwright spec, bundle-delta guard (1–2 h)

**Depends on:** 9.1, 9.2

**Docs MDX pages** (matches existing `apps/docs/content/docs/adoption/components/*.mdx` convention; no Storybook in this repo — Phase 6 already set the precedent):

- Update `apps/docs/content/docs/adoption/components/adoption-dashboard.mdx` (NEW if not present — verify by `ls apps/docs/content/docs/adoption/components/`; create if missing) with three live-preview examples:
  1. Sparkline with mock 14-point history
  2. `segmentBy="persona"` with a mock provider supplying `getSegment`
  3. Empty state (`features={[]}`)
- Create `apps/docs/content/docs/adoption/components/nudge-anchor.mdx` with three placement examples:
  1. Render-prop ref (canonical pattern)
  2. `target="[data-tk-feature='import-csv']"` selector pattern
  3. `target="import-csv"` id-then-data-attribute fallback
- Update `apps/docs/content/docs/adoption/components/meta.json` to add `"nudge-anchor"` to the `pages` array (slot alphabetically).

**Playwright spec** — `packages/playwright/__tests__/adoption-dashboard.spec.ts` and `packages/playwright/__tests__/nudge-anchor.spec.ts`:

- Dashboard spec: three snapshots — sparkline-with-data, segments-rendered (persona axis), empty-state. Run against a new fixture page `packages/playwright/fixtures-app/adoption-dashboard.html` that mounts the dashboard in three configurations behind URL query params (`?mode=sparkline|segments|empty`).
- Nudge-anchor spec: assert the rendered nudge's bounding rect is within 16px of the anchor's rect on the requested side after viewport-resize + scroll. Run against fixture `packages/playwright/fixtures-app/nudge-anchor.html`. If creating Playwright fixtures requires more than 2h of plumbing, defer the visual diff to Phase 12 and keep only the RTL positioning test from 9.2 — the bundle-delta gate and the RTL test cover the headless contract.

**Bundle-delta guard** — `packages/adoption/scripts/check-bundle-delta.sh`:

```bash
#!/usr/bin/env bash
# Usage: check-bundle-delta.sh <package> <max_bytes_added>
set -euo pipefail

PKG=${1:-adoption}
MAX_BYTES=${2:-8192}
BASELINE=$(cat .bundle-baseline 2>/dev/null || echo "0")

# tsup output -> gzip
gzip -c dist/index.js | wc -c | { read CURRENT; \
  DELTA=$(( CURRENT - BASELINE )); \
  echo "Bundle: ${CURRENT}B (baseline ${BASELINE}B, delta +${DELTA}B, max +${MAX_BYTES}B)"; \
  if [ "$DELTA" -gt "$MAX_BYTES" ]; then \
    echo "FAIL: bundle grew by ${DELTA}B (>${MAX_BYTES}B budget). Reduce or update baseline."; \
    exit 1; \
  fi; \
}
```

The `.bundle-baseline` file is created once via `gzip -c dist/index.js | wc -c > packages/adoption/.bundle-baseline` after the v2.1.0 commit hash and committed. The Phase 9 PR runs the script in `pnpm --filter @tour-kit/adoption build`'s post-build step (wired into `package.json`'s `build` script: `"build": "tsup && bash scripts/check-bundle-delta.sh adoption 8192"`).

**Sanity check:** `pnpm --filter @tour-kit/adoption build` exits 0 with the delta-guard reporting "<8KB"; `pnpm --filter docs build` exits 0 and both new MDX pages render; (optional) `pnpm --filter @tour-kit/playwright test` exits 0.

---

## Deliverables

```
packages/adoption/
├── src/
│   ├── components/
│   │   ├── nudge-anchor.tsx                              # NEW — render-prop ref / selector / id resolver; portal-positioned <AnchoredNudgeUI>
│   │   ├── index.ts                                      # UPDATED — re-exports NudgeAnchor + types
│   │   └── dashboard/
│   │       ├── adoption-dashboard.tsx                    # UPDATED — adds tourId / segmentBy / history / emptyState props; segment + sparkline rendering
│   │       ├── sparkline.tsx                             # NEW — inline-SVG <polyline> sparkline; ~0.8KB gzipped; zero deps; SSR-safe
│   │       └── index.ts                                  # UPDATED — re-exports Sparkline + SparklineProps + SparklinePoint
│   ├── hooks/
│   │   ├── use-adoption-stats.ts                         # UPDATED — accepts optional { tourId } filter
│   │   ├── use-nudge-anchor.ts                           # NEW — getBoundingClientRect + ResizeObserver + scroll/resize listener
│   │   └── index.ts                                      # UPDATED — exports useNudgeAnchor (optional; internal-only is fine)
│   ├── types/
│   │   └── feature.ts                                    # UPDATED — adds optional getSegment field to AdoptionUserContext; SegmentKey alias
│   ├── context/
│   │   └── adoption-provider.tsx                         # UPDATED — threads userContext.getSegment through context value (one-line)
│   ├── index.ts                                          # UPDATED — barrel exports NudgeAnchor, Sparkline, types
│   └── __tests__/components/
│       ├── adoption-dashboard.test.tsx                   # NEW — tourId filter; segmentBy; history sparkline; emptyState; default empty state
│       └── nudge-anchor.test.tsx                         # NEW — render-prop ref; selector fallback; id fallback; no-op when no pending nudge; positioning rect
├── scripts/
│   └── check-bundle-delta.sh                             # NEW — gzip + diff vs .bundle-baseline; fails if delta > 8KB
├── .bundle-baseline                                       # NEW — recorded gzipped byte count at v2.1.0
└── package.json                                          # UPDATED — build script wraps tsup with the delta guard

apps/docs/content/docs/adoption/components/
├── adoption-dashboard.mdx                                # UPDATED (or NEW) — three live examples: sparkline, segments, empty state
├── nudge-anchor.mdx                                      # NEW — three placement-mode examples
└── meta.json                                             # UPDATED — slot 'nudge-anchor' alphabetically

packages/playwright/
├── fixtures-app/
│   ├── adoption-dashboard.html                           # NEW — mounts dashboard in 3 modes via ?mode= query
│   └── nudge-anchor.html                                 # NEW — anchor + nudge fixture for positioning snapshot
└── __tests__/
    ├── adoption-dashboard.spec.ts                        # NEW — snapshots for sparkline, segments, empty
    └── nudge-anchor.spec.ts                              # NEW — anchor positioning after resize + scroll (optional; defer to Phase 12 if >2h)
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/adoption typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/adoption test -- --run` exits 0 with the new `adoption-dashboard.test.tsx` and `nudge-anchor.test.tsx` files passing (≥10 cases total: 5 dashboard — tourId filter, segmentBy, history sparkline, custom emptyState, default emptyState; ≥5 nudge-anchor — render-prop ref, selector fallback, id fallback, no-op when no nudge, positioning-rect within 16px)
- [ ] `pnpm --filter @tour-kit/adoption build` exits 0 AND the bundle-delta guard prints "Bundle: …B (baseline …, delta +…B, max +8192B)" with delta ≤ 8192
- [ ] `gzip -c packages/adoption/dist/index.js | wc -c` minus `cat packages/adoption/.bundle-baseline` is ≤ 8192 (independent verification of the guard)
- [ ] `<AdoptionDashboard />` (no new props) renders identically to its pre-Phase-9 output — verified by a snapshot test that diffs the rendered HTML against the pre-merge baseline
- [ ] `<AdoptionDashboard tourId="onboarding" />` with two of three features matching renders stats reflecting 2 features (assert `data-tk-total="2"` on the stats grid wrapper, or `getByText('2')` inside the Adopted/Exploring/etc. card matching the filter)
- [ ] `<AdoptionDashboard segmentBy="persona" />` with two distinct personas renders exactly two segment wrappers (`document.querySelectorAll('[data-tk-segment]').length === 2`)
- [ ] `<AdoptionDashboard history={[...14 points...]} />` renders exactly one `<polyline>` whose `points` attr parses to 14 coordinate pairs
- [ ] `<AdoptionDashboard emptyState={<p data-testid="custom">x</p>} />` with `features={[]}` renders the custom node and does NOT render `<AdoptionStatsGrid>` / `<AdoptionTable>` / `<AdoptionCategoryChart>`
- [ ] `<NudgeAnchor>` resolves to the correct DOM target across all 4 resolver paths (render-prop ref, selector, id, data-attribute fallback) — one test case per path
- [ ] `<NudgeAnchor>` renders nothing when `useNudge().pendingNudges` does not include the feature id
- [ ] `<NudgeAnchor>` positioning: after a `window.resizeTo(...)` + `window.scrollTo(...)` the nudge's `getBoundingClientRect()` is within 16px of the anchor's rect on the requested side (asserted in `nudge-anchor.test.tsx`)
- [ ] `apps/docs/content/docs/adoption/components/nudge-anchor.mdx` is present and appears in the docs sidebar; `apps/docs/content/docs/adoption/components/adoption-dashboard.mdx` is updated with three new live previews; `pnpm --filter docs build` exits 0
- [ ] `packages/adoption/src/index.ts` re-exports `NudgeAnchor`, `NudgeAnchorProps`, `NudgeAnchorTarget`, `NudgeAnchorRenderProps`, `Sparkline`, `SparklineProps`, `SparklinePoint` — verified by `grep -E "NudgeAnchor|Sparkline" packages/adoption/src/index.ts` returning ≥7 matches
- [ ] All existing adoption tests still pass: `pnpm --filter @tour-kit/adoption test -- --run` exits 0 with zero regressions on the existing 13+ test files

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 9 of Tour Kit v2 Package Polish — Adoption Dashboard + NudgeAnchor.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest + React Testing Library, Playwright (snapshot tests live in `packages/playwright/__tests__/`), pnpm. No Storybook is used in this repo — docs MDX pages with live previews + Playwright spec snapshots are the canonical demo surfaces (Phase 6 set this precedent explicitly). The `@tour-kit/adoption` package is at v2.1.0; this phase is purely additive (no version-breaking change).

### Established in Prior Phases
- **`<AdoptionDashboard>` already exists** at `packages/adoption/src/components/dashboard/adoption-dashboard.tsx` with `showStats / showTable / showChart / showFilters / tableColumns` props. It composes `<AdoptionStatsGrid>` + `<AdoptionTable>` + `<AdoptionCategoryChart>`. **You are extending it, not rewriting it.** Existing prop behavior must remain identical.
- **`<AdoptionFunnel>` already exists** at `packages/adoption/src/components/dashboard/adoption-funnel.tsx` as a data-first component; do not touch it.
- **`useAdoptionStats()` lives at** `packages/adoption/src/hooks/use-adoption-stats.ts` and currently takes zero args. Its return shape (`AdoptionStats`) is `{ features, adoptionRate, adoptedCount, totalCount, byStatus, byCategory }` — see the verbatim source below.
- **`useFunnelData({ featureIds })` lives at** `packages/adoption/src/hooks/use-funnel-data.ts` and returns `readonly FunnelStep[]`. Out of scope for this phase; do not modify.
- **`useNudge()` lives at** `packages/adoption/src/hooks/use-nudge.ts` returning `{ pendingNudges, hasNudges, showNudge, dismissNudge, snoozeNudge, handleNudgeClick }` — `<NudgeAnchor>` consumes this.
- **`AdoptionProvider` accepts a `userContext` shape**. Phase 9 widens it with an optional `getSegment(featureId, axis) => string | null` field. Provider source: `packages/adoption/src/context/adoption-provider.tsx`.
- **`FeatureResources.tourId?: string` already exists** on the `Feature` type (`packages/adoption/src/types/feature.ts` line 39) — used to link a feature to a tour. The dashboard's new `tourId` prop filters by `feature.resources?.tourId === tourId`.
- **No chart library is installed in any package** — confirmed by `grep -rE "from ['\"](recharts|visx|chart\.js|@nivo|victory|d3)" packages/` returning zero matches. Phase 9 hand-rolls an inline-SVG sparkline (~0.8KB gzipped) instead.
- **No Floating UI dep in `@tour-kit/adoption`** — confirmed by `grep "floating-ui" packages/adoption/package.json` returning no match. `<NudgeAnchor>` uses a custom 30-line `getBoundingClientRect` + `ResizeObserver` positioning hook instead of adding the dep.
- **tsup config at** `packages/adoption/tsup.config.ts` prepends `'use client';` to `dist/index.js` and `dist/index.cjs` via `onSuccess` — every new `.tsx` file that uses refs / state / event listeners must start with `'use client'`.
- **Phase 5 (target-as-ref union)** signed off the anchor-resolution union shape: `string | RefObject<HTMLElement | null> | (() => HTMLElement | null)`. `<NudgeAnchor target>` mirrors this exactly.

### Source-of-Truth Hook Signatures (verbatim from packages/adoption/src/hooks/)

```ts
// packages/adoption/src/hooks/use-adoption-stats.ts (current — pre-Phase-9)
export interface AdoptionStats {
  features: FeatureWithUsage[]
  adoptionRate: number
  adoptedCount: number
  totalCount: number
  byStatus: Record<AdoptionStatus, FeatureWithUsage[]>
  byCategory: Record<string, { adopted: number; total: number; rate: number }>
}

export function useAdoptionStats(): AdoptionStats {
  const { features, usageMap } = useAdoptionContext()
  return React.useMemo(() => {
    const featuresWithUsage: FeatureWithUsage[] = features.map((feature) => ({
      ...feature,
      usage: usageMap[feature.id] ?? createInitialUsage(feature.id),
    }))
    const adoptedCount = featuresWithUsage.filter((f) => f.usage.status === 'adopted').length
    const totalCount = features.length
    const adoptionRate = totalCount > 0 ? (adoptedCount / totalCount) * 100 : 0
    return {
      features: featuresWithUsage,
      adoptionRate,
      adoptedCount,
      totalCount,
      byStatus: groupByStatus(featuresWithUsage),
      byCategory: groupByCategory(featuresWithUsage),
    }
  }, [features, usageMap])
}
```

```ts
// packages/adoption/src/hooks/use-funnel-data.ts (DO NOT MODIFY — Phase 9 does not touch this)
export interface UseFunnelDataInput {
  featureIds: readonly string[]
  labels?: Partial<Record<string, string>>
}
export function useFunnelData({ featureIds, labels }: UseFunnelDataInput): FunnelStep[]
```

```ts
// packages/adoption/src/hooks/use-nudge.ts (verbatim — consumed by <NudgeAnchor>)
export interface UseNudgeReturn {
  pendingNudges: Feature[]
  hasNudges: boolean
  showNudge: (featureId: string) => void
  dismissNudge: (featureId: string) => void
  snoozeNudge: (featureId: string, durationMs: number) => void
  handleNudgeClick: (featureId: string) => void
}
export function useNudge(): UseNudgeReturn
```

### Your Goal for This Phase
1. Extend `<AdoptionDashboard>` with four new optional props (`tourId`, `segmentBy`, `history`, `emptyState`) and ship a new inline-SVG `<Sparkline>` subcomponent. Widen `useAdoptionStats` to accept an optional `{ tourId }` filter. Widen `AdoptionUserContext` with an optional `getSegment(featureId, axis)` resolver. All additions are backwards-compatible — existing dashboard renderings must produce identical HTML.
2. Ship `<NudgeAnchor featureId="…">` — a portal-positioned nudge that resolves its anchor element via render-prop ref / explicit ref / function / CSS selector / id / data-attribute fallback (priority order documented). Renders nothing when no pending nudge for the feature is queued. Uses a tiny `useNudgeAnchor` hook backed by `getBoundingClientRect` + `ResizeObserver` — no Floating UI dep.
3. Add docs MDX previews + a Playwright snapshot spec + a bundle-delta guard script that fails the build if `dist/index.js` grows by more than 8KB gzipped.

### Data Model Rules (follow exactly)
- **`interface` (exported):** `SparklineProps`, `SparklinePoint`, `NudgeAnchorProps`, `NudgeAnchorRenderProps` live in the components that export them. Re-exported from `packages/adoption/src/index.ts` barrel.
- **`type` (exported):** `NudgeAnchorTarget = string | RefObject<HTMLElement | null> | (() => HTMLElement | null)` — three-way union; matches Phase 5. `SegmentKey = string` (open string; conventions are `'persona' | 'plan' | 'route'`).
- **Optional additive props only.** Every new `AdoptionDashboardProps` field has `?`. Existing fields keep their current optionality.
- **No new Zod schemas this phase.** No external validation boundary is crossed.
- **No new external deps.** `recharts` / `visx` / `@floating-ui/react` are rejected — the inline-SVG sparkline + `getBoundingClientRect`-based positioning hook stay in tree-of-stdlib. Bundle-delta guard (<8KB) enforces this.
- **`'use client'` directive on every new file** (`sparkline.tsx`, `nudge-anchor.tsx`, `use-nudge-anchor.ts`). The tsup `onSuccess` banner check would catch a missing directive but be explicit at source.
- **Frozen no-op return is NOT needed.** `<NudgeAnchor>` returns `null` when no pending nudge exists; consumers don't call methods on the return value.
- **No new keyframes.** No reduced-motion three-tier defense needed — the sparkline is static; `<AnchoredNudgeUI>` reuses `<AdoptionNudge>`'s existing variant classes which already respect `motion-safe:`.

### Architecture

```
@tour-kit/adoption (additive — existing exports unchanged)
  src/components/dashboard/adoption-dashboard.tsx
    NEW PROPS: tourId, segmentBy, history, emptyState (all optional)
    branches:
      stats.totalCount === 0  → render emptyState ?? <DefaultEmptyState />
      segmentBy provided      → groupByGetSegment(features, axis) → one cluster per bucket
      history provided        → <Sparkline data={history} /> rendered above main layout
      default                 → existing layout (unchanged)
  src/components/dashboard/sparkline.tsx
    inline-SVG <polyline>; renders null when data.length < 2; aria-label auto-built
  src/components/nudge-anchor.tsx
    resolves anchor via 6-step priority list; portals <AnchoredNudgeUI> to document.body
    via createPortal; positioned absolutely via useNudgeAnchor hook
  src/hooks/use-adoption-stats.ts
    UPDATED: optional { tourId } filter applied BEFORE the existing memoized grouping
  src/hooks/use-nudge-anchor.ts
    NEW: useState + useEffect with ResizeObserver + window scroll/resize listeners
  src/types/feature.ts
    AdoptionUserContext gains optional getSegment(featureId, axis) => string | null

apps/docs/content/docs/adoption/components/
  adoption-dashboard.mdx   UPDATED — three live previews (sparkline, segments, empty)
  nudge-anchor.mdx         NEW — three placement examples
  meta.json                UPDATED — adds 'nudge-anchor' to pages array

packages/playwright/
  fixtures-app/adoption-dashboard.html  NEW
  fixtures-app/nudge-anchor.html         NEW
  __tests__/adoption-dashboard.spec.ts   NEW — three visual snapshots
  __tests__/nudge-anchor.spec.ts          NEW — positioning after resize + scroll (defer if >2h)

packages/adoption/scripts/check-bundle-delta.sh   NEW — gzip + diff vs .bundle-baseline
packages/adoption/.bundle-baseline                 NEW — recorded gzip byte count at v2.1.0
packages/adoption/package.json                     UPDATED — build wraps tsup with the guard
```

### Confirmed Library APIs

No new libraries this phase. Existing platform APIs to use:

```tsx
// React 18+ — createPortal pattern (already used by <AdoptionNudge> indirectly via cva positioning)
import { createPortal } from 'react-dom'
createPortal(<AnchoredNudgeUI ... />, document.body)
```

```ts
// ResizeObserver — DOM Living Standard; supported in all evergreen browsers + Node 18+ jsdom (>= v22).
// If running in Vitest with an older jsdom, use vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
const ro = new ResizeObserver(callback)
ro.observe(element)
// teardown: ro.disconnect()
```

```tsx
// Inline-SVG sparkline path generator — paste verbatim into src/components/dashboard/sparkline.tsx
const values = data.map((p) => p.value)
const min = Math.min(...values)
const max = Math.max(...values)
const range = max - min || 1
const stepX = width / (data.length - 1)
const points = data
  .map((p, i) => `${(i * stepX).toFixed(2)},${(height - ((p.value - min) / range) * height).toFixed(2)}`)
  .join(' ')

// Render:
//   <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
//     <polyline fill="none" stroke="currentColor" strokeWidth={1.5} points={points} />
//   </svg>
```

```ts
// CSS.escape for the data-attribute fallback (safe across all evergreen browsers as of 2026)
typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replaceAll(/["\\]/g, '\\$&')
```

### Files to Create / Update

#### `packages/adoption/src/components/dashboard/sparkline.tsx` (NEW)
Implement the `Sparkline` component exactly as shown in the Architecture section's path-generator block. Start with `'use client'`. Export `Sparkline` (named export), `SparklineProps`, `SparklinePoint`. Return `null` when `data.length < 2`. Use `role="img"` + auto-built `aria-label`. Use `currentColor` as the default stroke so theme inheritance works. Render nothing else — no axis labels, no tooltips, no animation (this is a sparkline, not a chart).

#### `packages/adoption/src/components/dashboard/adoption-dashboard.tsx` (UPDATED)
Add the four new optional props (`tourId`, `segmentBy`, `history`, `emptyState`) to `AdoptionDashboardProps`. Resolve `stats = useAdoptionStats({ tourId })`. Three render branches:
1. `stats.totalCount === 0` → render `emptyState ?? <DefaultEmptyState />`; do NOT render stats/table/chart.
2. `segmentBy` provided → resolve `userContext.getSegment` from `useAdoptionContext()`; if undefined, fire a one-time dev `console.warn` and fall through to the default branch. Otherwise, bucket `stats.features` via `getSegment(featureId, segmentBy)` (nulls → `'unsegmented'`); render one `<section data-tk-segment={label}>` per bucket containing a `<h3>` with the label + the existing dashboard internal layout filtered to that bucket. Sparkline (if `history`) renders above the buckets.
3. Default branch → preserve the existing render (`<AdoptionStatsGrid>` + `<AdoptionTable>` + `<AdoptionCategoryChart>`). Sparkline (if `history`) renders above the grid.

The `useRef` warn-once flag lives at module scope: `let segmentWarnFired = false`. Inside the segment branch: `if (!segmentWarnFired && process.env.NODE_ENV !== 'production') { console.warn('...'); segmentWarnFired = true }`.

#### `packages/adoption/src/hooks/use-adoption-stats.ts` (UPDATED)
Add `interface UseAdoptionStatsOptions { tourId?: string }`. Change the signature to `useAdoptionStats(options?: UseAdoptionStatsOptions): AdoptionStats`. Apply the `tourId` filter BEFORE the existing `featuresWithUsage` mapping — `const filtered = options?.tourId ? features.filter((f) => f.resources?.tourId === options.tourId) : features`. Update the `useMemo` deps to include `options?.tourId`. Zero-arg call must produce the existing behavior unchanged (regression: keep existing tests passing).

#### `packages/adoption/src/components/nudge-anchor.tsx` (NEW)
Implement `<NudgeAnchor>` exactly as shown in Task 9.2. Start with `'use client'`. Export `NudgeAnchor`, `NudgeAnchorProps`, `NudgeAnchorTarget`, `NudgeAnchorRenderProps`. Anchor resolution priority is: explicit `target` (RefObject → fn → string) → `children` render-prop ref → null. String resolution heuristics: starts with `.` / `[` / `#` → `querySelector`; else `getElementById` then `querySelector('[data-tk-feature="…"]')` fallback. Inner `<AnchoredNudgeUI>` is a copy of `<AdoptionNudge>`'s default render — same content, positioned via the `style` prop from `useNudgeAnchor`. Reuse `featureButtonVariants` from the existing UI variants. Use `createPortal` to `document.body`. Render nothing when `useNudge().pendingNudges` does not include the feature id.

#### `packages/adoption/src/hooks/use-nudge-anchor.ts` (NEW)
Implement exactly as shown in Task 9.2. Start with `'use client'`. Export `useNudgeAnchor` + `AnchorPosition` interface. Use `ResizeObserver` + `window.addEventListener('scroll', …, { passive: true })` + `'resize'`. Teardown on effect cleanup. Return `null` when `anchorEl` is null or `window` is undefined.

#### `packages/adoption/src/types/feature.ts` (UPDATED)
Add the optional `getSegment` field to `AdoptionUserContext` (locate the interface via `grep -nE "AdoptionUserContext|userContext" packages/adoption/src/`). Add `export type SegmentKey = string`. Both additions are pure additive — do not modify any existing field.

#### `packages/adoption/src/context/adoption-provider.tsx` (UPDATED)
If `AdoptionUserContext` is passed through the provider's context value, ensure `getSegment` is propagated (one-line addition to the `value` object). If `userContext` is not currently surfaced via `useAdoptionContext`, add it — this is a one-line change. Verify via `grep -nE "userContext" packages/adoption/src/context/adoption-context.tsx packages/adoption/src/context/adoption-provider.tsx`.

#### `packages/adoption/src/components/index.ts` + `dashboard/index.ts` + `hooks/index.ts` + `src/index.ts` (UPDATED)
Re-export `NudgeAnchor`, `NudgeAnchorProps`, `NudgeAnchorTarget`, `NudgeAnchorRenderProps` from `components/index.ts`. Re-export `Sparkline`, `SparklineProps`, `SparklinePoint` from `components/dashboard/index.ts`. Bubble both up through `src/index.ts`. `useNudgeAnchor` can stay internal-only (not exported) — it's plumbing for `<NudgeAnchor>`.

#### `packages/adoption/src/__tests__/components/adoption-dashboard.test.tsx` (NEW)
≥5 cases:
1. `tourId` filter: provider with 3 features (2 with `resources.tourId === 'onboarding'`, 1 without). Render `<AdoptionDashboard tourId="onboarding" />`. Assert the rendered stats reflect 2 features (e.g., the "Adopted" stat card or a `data-tk-total` attribute on the wrapper).
2. `segmentBy="persona"`: provider with `userContext.getSegment={(id) => id === 'a' ? 'admin' : 'viewer'}` and 2 features. Assert `document.querySelectorAll('[data-tk-segment]').length === 2`.
3. `history={[...14 points...]}`: assert exactly one `<polyline>` rendered with `points` attribute parsing to 14 coordinate pairs (`.split(' ').length === 14`).
4. `emptyState={<p data-testid="custom">x</p>}` with `features={[]}`: assert `getByTestId('custom')` resolves and the stats grid / table / chart are NOT in the tree.
5. Default empty state with `features={[]}` and no `emptyState` prop: assert the default text `/No adoption data yet/` is rendered.

Use the existing `__tests__` patterns (mock `Feature` factory + `AdoptionProvider` wrapper from `adoption-nudge.test.tsx`). Stub `ResizeObserver` globally in the test setup if jsdom < v22 — single `vi.stubGlobal('ResizeObserver', class { observe(){} disconnect(){} unobserve(){} })`.

#### `packages/adoption/src/__tests__/components/nudge-anchor.test.tsx` (NEW)
≥5 cases:
1. **Render-prop ref** (canonical): mount `<NudgeAnchor featureId="x">{(p) => <button ref={p.ref}>btn</button>}</NudgeAnchor>` inside a provider with a pending nudge for `'x'`. Assert the nudge is rendered (e.g., a `[data-tk-anchored-nudge]` element exists). Assert `getBoundingClientRect()` distance is ≤16px on the requested side.
2. **Explicit RefObject `target` prop**: pre-create a ref, mount it on a button via `<button ref={r}>`, then `<NudgeAnchor target={r}>`.
3. **CSS-selector string** (`target="[data-tk-feature='x']"`): pre-mount a button with that data attribute; assert the nudge anchors to it.
4. **Id-then-data-attribute fallback** (`target="x"`): pre-mount `<button data-tk-feature="x">`; assert the nudge anchors to it via the data-attr branch.
5. **No-op when no pending nudge**: provider with empty `pendingNudges`; assert the nudge is NOT rendered (only the consumer's render-prop output is present).

Optionally add a positioning-after-resize case: call `window.dispatchEvent(new Event('resize'))` and assert the nudge's position recomputes (rect changes by the expected delta).

#### `packages/adoption/scripts/check-bundle-delta.sh` (NEW)
Bash script as shown in Task 9.3. `chmod +x` the file. Wire into the build script: edit `packages/adoption/package.json` `"build"` from `"tsup"` to `"tsup && bash scripts/check-bundle-delta.sh adoption 8192"`.

#### `packages/adoption/.bundle-baseline` (NEW)
One-line file containing the gzipped byte count of `dist/index.js` AT THE PRE-PHASE-9 COMMIT. Generate with: `pnpm --filter @tour-kit/adoption build && gzip -c packages/adoption/dist/index.js | wc -c > packages/adoption/.bundle-baseline` BEFORE making any Phase 9 changes (or, if making changes first, record the baseline by checking out the parent commit, running the build, recording, then restoring the working tree). Commit the file in the same PR.

#### `apps/docs/content/docs/adoption/components/adoption-dashboard.mdx` (UPDATED or NEW)
First verify with `ls apps/docs/content/docs/adoption/components/` whether the file exists. If yes, append three new live-preview sections (`## Sparkline`, `## Segments`, `## Empty State`). If no, create with frontmatter `title: AdoptionDashboard`, `description: …`, an `## Overview` section, then the three new sections. Use the existing `adoption-nudge.mdx` page as a structural reference (TypeTable + Callout + code-fenced live examples).

#### `apps/docs/content/docs/adoption/components/nudge-anchor.mdx` (NEW)
Three sections covering the render-prop ref / selector / id placement modes. Use the `<NudgeAnchor>` source as the canonical example for each. Include a `## Anchor resolution priority` section listing the 6-step priority documented in Task 9.2.

#### `apps/docs/content/docs/adoption/components/meta.json` (UPDATED)
Add `"nudge-anchor"` to the `pages` array (slot alphabetically — likely after `new-feature-badge`).

#### `packages/playwright/__tests__/adoption-dashboard.spec.ts` (NEW)
Three snapshots: `?mode=sparkline`, `?mode=segments`, `?mode=empty`. Use `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })`. Fixture page at `packages/playwright/fixtures-app/adoption-dashboard.html` mounts the dashboard via the existing fixture conventions (see `packages/playwright/fixtures-app/two-step.html` for a structural reference).

#### `packages/playwright/__tests__/nudge-anchor.spec.ts` (NEW — defer if >2h)
Positioning snapshot + after-resize + after-scroll assertions. If creating the fixture takes more than 2 hours, defer this spec to a follow-up phase. The RTL test in `nudge-anchor.test.tsx` covers the headless contract; the Playwright spec is a bonus visual regression catch.

### Success Criteria
- `pnpm --filter @tour-kit/adoption typecheck` exits 0
- `pnpm --filter @tour-kit/adoption test -- --run` exits 0 with ≥10 new test cases passing (5 dashboard + 5 nudge-anchor) and zero regressions
- `pnpm --filter @tour-kit/adoption build` exits 0 AND the post-build guard prints "Bundle: …B (… delta +…B, max +8192B)" with delta ≤ 8192
- Independent verification: `gzip -c packages/adoption/dist/index.js | wc -c` minus `cat packages/adoption/.bundle-baseline` ≤ 8192
- `<AdoptionDashboard />` (zero new props) renders identically to its pre-Phase-9 output (snapshot diff)
- `<AdoptionDashboard tourId="onboarding" />` reflects only matching features
- `<AdoptionDashboard segmentBy="persona" />` produces one `[data-tk-segment]` wrapper per distinct persona
- `<AdoptionDashboard history={...14 points...} />` renders one `<polyline>` with 14 coordinate pairs
- `<AdoptionDashboard emptyState={...} features={[]} />` renders the custom node; skips stats/table/chart
- `<NudgeAnchor>` resolves correctly across all 4 string/ref/fn resolver paths and is no-op without a pending nudge
- `pnpm --filter docs build` exits 0 and both MDX pages render in the docs sidebar
- `packages/adoption/src/index.ts` re-exports `NudgeAnchor`, `Sparkline`, and their associated types (grep returns ≥7 matches)
- No new dependencies added: `git diff packages/adoption/package.json` shows zero changes under `dependencies` (only a `build` script change is acceptable)

### Expected File Structure at End

```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── phase-0-validation.md
├── phase-1.md
├── ...
└── phase-9.md

packages/adoption/
├── src/
│   ├── components/
│   │   ├── nudge-anchor.tsx                              # NEW
│   │   ├── index.ts                                       # UPDATED — re-exports NudgeAnchor + types
│   │   └── dashboard/
│   │       ├── adoption-dashboard.tsx                    # UPDATED
│   │       ├── sparkline.tsx                             # NEW
│   │       └── index.ts                                  # UPDATED
│   ├── hooks/
│   │   ├── use-adoption-stats.ts                         # UPDATED (optional tourId filter)
│   │   ├── use-nudge-anchor.ts                           # NEW
│   │   └── index.ts                                      # UPDATED (optional)
│   ├── types/feature.ts                                   # UPDATED (getSegment + SegmentKey)
│   ├── context/adoption-provider.tsx                     # UPDATED (thread getSegment)
│   ├── index.ts                                          # UPDATED (barrel)
│   └── __tests__/components/
│       ├── adoption-dashboard.test.tsx                   # NEW
│       └── nudge-anchor.test.tsx                         # NEW
├── scripts/check-bundle-delta.sh                         # NEW
├── .bundle-baseline                                       # NEW
└── package.json                                          # UPDATED — build script

apps/docs/content/docs/adoption/components/
├── adoption-dashboard.mdx                                # UPDATED or NEW
├── nudge-anchor.mdx                                      # NEW
└── meta.json                                             # UPDATED

packages/playwright/
├── fixtures-app/
│   ├── adoption-dashboard.html                           # NEW
│   └── nudge-anchor.html                                 # NEW
└── __tests__/
    ├── adoption-dashboard.spec.ts                        # NEW
    └── nudge-anchor.spec.ts                              # NEW (defer if >2h)
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 5's target-as-ref union shape is cited as the model for `NudgeAnchorTarget`; Phase 6's docs-MDX-instead-of-Storybook precedent is cited. No upstream Phase deliverable is required (Phase 9 has zero hard deps per big-plan.md dependency table). Existing source files (`adoption-dashboard.tsx`, `use-adoption-stats.ts`, `use-nudge.ts`, `tsup.config.ts`, `feature.ts` line 39 for `tourId`) are cited verbatim or with line numbers.
- [PASS] Every sub-task has a clear, testable completion condition — each of 9.1–9.3 ends with a `Sanity check` line combining typecheck + targeted test + the bundle-delta guard.
- [PASS] Execution prompt is self-contained — full project summary pasted; existing hook signatures pasted verbatim from source; inline-SVG sparkline path generator pasted verbatim; `<NudgeAnchor>` render-prop pattern pasted verbatim; data model rules listed (interface, type-alias union, additive-only, no Zod, no new deps, `'use client'` requirement); per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable shell commands.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, test, build, grep guard, docs build); the bundle-delta gate has both a script-based and an independent shell-command verification listed; the backwards-compat invariant for zero-prop `<AdoptionDashboard />` is its own checkbox.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 9. `ResizeObserver` is stubbed via `vi.stubGlobal` if running under older jsdom; the stub class is one line and included in the test guidance. No model/network/GPU deps. Marked PASS.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — **no new libraries this phase** (chart-library decision: hand-rolled inline SVG; positioning decision: native `getBoundingClientRect` + `ResizeObserver`). The decision rationale is documented in Architecture with bundle-size comparison; no Context7 call needed. The platform APIs used (`createPortal`, `ResizeObserver`, `CSS.escape`, SVG path generation) are all stable browser primitives with no version drift risk. Marked PASS.
