# Phase 15 — Scheduling Polish — a11y fix + ICS

**Duration:** Days 78–82 (~7–10 hours)
**Depends on:** Nothing
**Blocks:** Phase 16 — `<ScheduleBuilder>` consumes `parseIcsFeed` (big-plan task 16.1)
**Risk Level:** MEDIUM — the a11y removal is a safe one-line swap, but the ICS parser introduces `ical.js` (~30–40 KB gzipped without timezone DB). The bundle delta is the main risk and is mitigated by lazy-loading via dynamic import per the big-plan risk register (line 576). Conflict-resolver correctness is the secondary risk, mitigated by an exhaustive 6-permutation test matrix.
**Stack:** react

---

## Objective

Three deliverables, one PR:

1. **A11y fix.** Remove the `sr-only` diagnostic banner inside `<ScheduledBanner>` and route the `"hidden: not_showable"` developer signal to `console.groupCollapsed('[tour-kit] schedule: not showable', reason)` gated on `process.env.NODE_ENV !== 'production'`. Today the diagnostic is read aloud by screen readers on every page that mounts a scheduled surface — a WCAG 2.1 SC 1.3.1 violation reported during the v1 dashboard-next pass.
2. **ICS feed import.** Ship `parseIcsFeed(input: string)` in a new `packages/scheduling/src/adapters/ics.ts` that accepts either a URL (fetches the ICS) or raw ICS text and returns `ScheduleWindow[]` matching the in-package shape. `ical.js` is `await import('ical.js')`'d on first call so the initial chunk of `@tour-kit/scheduling` does not grow.
3. **Schedule conflict resolver.** `mergeSchedules(ics, explicit): ScheduleWindow[]` in `packages/scheduling/src/lib/schedule-merge.ts` deterministically combines ICS-sourced and hand-authored windows: ICS wins for blackout windows (negative), explicit wins for whitelist windows (positive). All 6 overlap permutations are spelled out below and tested 1:1.

Phase 16 will plug `parseIcsFeed`'s output into `<ScheduleBuilder>`, so the `ScheduleWindow` shape exported here is also the input contract for that phase.

## What Success Looks Like

1. `pnpm --filter @tour-kit/scheduling test -- --run scheduled-banner.a11y` exits 0 with an axe-core scan reporting **zero violations** from tour-kit selectors on a page that mounts `<ScheduledBanner>` in the `hidden: not_showable` state — vs the current baseline where the `sr-only` diagnostic surfaces as an extra live-region announcement.
2. `parseIcsFeed(<google-us-holidays-fixture>.ics)` returns a `ScheduleWindow[]` whose blackout windows match the source calendar — verified by `pnpm --filter @tour-kit/scheduling test -- --run parse-ics-feed` against a fixture committed at `packages/scheduling/__tests__/fixtures/us-holidays-2026.ics`.
3. The conflict resolver passes **6/6** overlap permutations: `pnpm --filter @tour-kit/scheduling test -- --run schedule-merge.permutations` exits 0 with one named test per row of the matrix in §Tasks 15.3.
4. The initial chunk size of `@tour-kit/scheduling` is unchanged from the pre-Phase-15 baseline — verified by `pnpm --filter @tour-kit/scheduling test -- --run bundle-no-ical-js` which asserts `ical.js` does **not** appear in the static-import graph of `dist/index.js`. The first call to `parseIcsFeed` triggers the dynamic import (verified by a separate test that spies on `import()` resolution).
5. Running Lighthouse a11y on a dashboard-next page that mounts `<ScheduledBanner>` returns **100** (no regression from current 100; the diagnostic banner is the only known a11y blocker in the package).
6. `pnpm --filter @tour-kit/scheduling typecheck` and `pnpm --filter docs build` both exit 0; the new `apps/docs/content/docs/scheduling/ics.mdx` renders in the sidebar.

---

## Architecture / Key Design Decisions

```
                 ┌──────────────────────────────────────────────────────────┐
                 │  packages/scheduling/src/components/scheduled-banner.tsx │
                 │  - render path unchanged                                  │
                 │  - DELETE <span class="sr-only">…</span> diagnostic       │
                 │  + ADD  console.groupCollapsed(…) on "not_showable"       │
                 │         gated by process.env.NODE_ENV !== 'production'    │
                 └──────────────────────────────────────────────────────────┘

                 ┌──────────────────────────────────────────────────────────┐
                 │  packages/scheduling/src/adapters/ics.ts                 │
                 │  parseIcsFeed(input: string): Promise<ScheduleWindow[]>  │
                 │    1. fetch(input) if input.startsWith('http')           │
                 │    2. const ICAL = await import('ical.js')   ← LAZY      │
                 │    3. new ICAL.Component(ICAL.parse(text))               │
                 │    4. for each vevent → ScheduleWindow                   │
                 │    5. expand recurring via RecurExpansion (bounded)      │
                 └──────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                 ┌──────────────────────────────────────────────────────────┐
                 │  packages/scheduling/src/lib/schedule-merge.ts           │
                 │  mergeSchedules(ics: SW[], explicit: SW[]): SW[]         │
                 │  policy: ICS wins for blackout, explicit wins for       │
                 │          whitelist (see permutation table below)        │
                 └──────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Public exported shape (`ScheduleWindow`) | `interface` exported from `@tour-kit/scheduling/types` | Phase 16's `<ScheduleBuilder>` consumes it; needs structural extension |
| Internal ICS parser intermediate (`IcsEvent`) | `interface` (module-private to `adapters/ics.ts`) | Not exported; rewritten as needed without semver impact |
| Merge policy (`MERGE_POLICY`) | `const` object literal `as const` | Pins ICS-wins-for-blackout / explicit-wins-for-whitelist at the type level |
| `ical.js` module reference | `let` cache (`let icalModule: typeof import('ical.js') \| null = null`) | First call awaits the dynamic import; subsequent calls reuse the cached module — no re-import cost |

**Other critical rules for this phase:**

- **`ical.js` is `await import('ical.js')`'d at the top of `parseIcsFeed`, not at module top level.** Memory entry [Polar API Findings] is unrelated; the relevant memory note is **#188 (ical.js)** which states the library is **~30–40 KB gzipped without the timezone DB**. That's smaller than the big-plan risk register's "80 KB" estimate (line 576), so static import would be defensible. **The big-plan still calls for dynamic import**, so this phase ships with `await import(...)` and notes the memory-vs-plan delta in the CHANGELOG; if a Phase 16 perf test shows the dynamic boundary creates a UX pause, we can revisit. Honoring the plan today is the conservative choice.
- **`ScheduleWindow` is additive** — does **not** replace the existing `BlackoutPeriod` shape in `packages/scheduling/src/types/schedule.ts`. The merge utility outputs `ScheduleWindow[]`; downstream code adapts via a thin `windowToBlackout(window)` helper in `lib/schedule-merge.ts`. No breaking change to existing `Schedule.blackouts`.
- **`console.groupCollapsed` is dev-only.** Wrap in `if (process.env.NODE_ENV !== 'production')`. The bundler (tsup) tree-shakes the block in prod builds when `NODE_ENV` is statically replaced. Verify with the bundle-no-ical-js test.
- **Recurring expansion is bounded.** ICS calendars with `RRULE:FREQ=DAILY` without `UNTIL` can iterate forever. `parseIcsFeed` accepts an optional `{ rangeStart, rangeEnd }` second argument defaulting to `[now, now + 1 year]` — and refuses to expand beyond `rangeEnd`. Document this in `ics.mdx`.
- **Conflict resolver is pure.** `mergeSchedules` takes two arrays and returns a new array — no mutation, no side effects, no analytics emission. Easy to test, easy to memoize in Phase 16.

### 6-Permutation Conflict Resolution Matrix

| # | ICS window | Explicit window | Output behaviour | Rationale |
|---|------------|-----------------|------------------|-----------|
| 1 | blackout `[2026-12-25, 2026-12-26]` | (none) | ICS blackout passes through unchanged | ICS-only blackout — trivially preserved |
| 2 | (none) | blackout `[2026-12-25, 2026-12-26]` | Explicit blackout passes through unchanged | Explicit-only blackout — trivially preserved |
| 3 | blackout `[2026-12-24, 2026-12-26]` | whitelist `[2026-12-25, 2026-12-25]` | ICS blackout wins on the overlap → final = ICS blackout `[2026-12-24, 2026-12-26]` | Calendar source-of-truth for "do not show" beats author optimism; document as the safer default |
| 4 | whitelist `[2026-12-24, 2026-12-26]` | blackout `[2026-12-25, 2026-12-25]` | Explicit blackout wins on the overlap → final = whitelist `[2026-12-24, 2026-12-26]` minus blackout `[2026-12-25, 2026-12-25]` | Author intent overrides ICS "office open" hours — explicit beats imported |
| 5 | blackout `[2026-12-24, 2026-12-26]` | blackout `[2026-12-25, 2026-12-27]` | Union of the two blackouts → final = blackout `[2026-12-24, 2026-12-27]` | Both are negative; union is the safe combination |
| 6 | whitelist `[2026-12-20, 2026-12-22]` | whitelist `[2026-12-21, 2026-12-23]` | Union of the two whitelists → final = whitelist `[2026-12-20, 2026-12-23]` | Both are positive; union allows the broader window |

Each row maps to one named test in `__tests__/schedule-merge.permutations.test.ts`.

---

## Tasks

### Task 15.1 — Remove `sr-only` diagnostic from `<ScheduledBanner>` + route to `console.groupCollapsed` (1–2 h)

**Depends on:** Nothing

The `<ScheduledBanner>` component is the user-facing surface that explains why a scheduled tour/announcement isn't visible right now. The current implementation includes an `sr-only` diagnostic span that screen readers announce as an extra live-region message — a WCAG 1.3.1 violation. Replace the span with a dev-only console group.

Current code shape (the implementer will locate the exact lines; the pattern to delete looks like):

```tsx
// packages/scheduling/src/components/scheduled-banner.tsx — BEFORE
{status.reason === 'not_showable' && (
  <span className="sr-only" role="status">
    [tour-kit] schedule: not showable — {status.message}
  </span>
)}
```

Target replacement:

```tsx
// packages/scheduling/src/components/scheduled-banner.tsx — AFTER
import * as React from 'react'

React.useEffect(() => {
  if (process.env.NODE_ENV !== 'production' && status.reason === 'not_showable') {
    console.groupCollapsed('[tour-kit] schedule: not showable')
    console.log('reason:', status.reason)
    console.log('message:', status.message)
    console.log('debug:', status.debug)
    console.groupEnd()
  }
}, [status.reason, status.message, status.debug])
// no sr-only render
```

Two notes for the implementer:

- If `<ScheduledBanner>` does not yet exist as a standalone component (the scheduling package currently exports `<ScheduleGate>`; see Readiness Check), this task creates it as part of the phase. The signature is `function ScheduledBanner({ schedule, options }: { schedule: Schedule; options?: ScheduleEvaluationOptions }): JSX.Element | null`. When `getScheduleStatus(schedule, options).isActive === true`, render `null`. Otherwise render a visible banner that prints `status.message`. The `console.groupCollapsed` is the only dev diagnostic — no `sr-only` text.
- The visible banner itself must be screen-reader-accessible (`role="status"` on the visible element is correct; the violation is the *redundant* `sr-only` span, not the visible banner). Axe-core scan should report zero violations.

**Sanity check:** `pnpm --filter @tour-kit/scheduling test -- --run scheduled-banner.a11y` exits 0 with axe-core reporting zero violations; running `pnpm --filter @tour-kit/scheduling dev` and triggering a not-showable state in Storybook produces a single console group, not a screen-reader announcement.

---

### Task 15.2 — `parseIcsFeed(input)` with dynamic `ical.js` import (4–5 h)

**Depends on:** Nothing

Create `packages/scheduling/src/adapters/ics.ts` exporting:

```ts
// packages/scheduling/src/adapters/ics.ts
export interface ScheduleWindow {
  /** Stable id from ICS UID, or generated for synthetic windows */
  id: string
  /** Positive window (whitelist) or negative (blackout) */
  kind: 'whitelist' | 'blackout'
  /** Start of the window (inclusive), JS Date in UTC */
  start: Date
  /** End of the window (exclusive), JS Date in UTC */
  end: Date
  /** Optional human label from ICS SUMMARY */
  label?: string
  /** Source — 'ics' for imported, 'explicit' for hand-authored */
  source: 'ics' | 'explicit'
}

export interface ParseIcsFeedOptions {
  /** Lower bound for recurring expansion (default: now) */
  rangeStart?: Date
  /** Upper bound for recurring expansion (default: now + 1 year) */
  rangeEnd?: Date
  /** Default kind for parsed events when ICS does not signal blackout vs whitelist (default: 'blackout') */
  defaultKind?: 'whitelist' | 'blackout'
}

export async function parseIcsFeed(
  input: string,
  options?: ParseIcsFeedOptions
): Promise<ScheduleWindow[]>
```

Implementation (Context7-confirmed `ical.js` API — see `Confirmed Library APIs` block below):

```ts
// Confirmed via Context7 (2026-05-15) — ical.js
// Library: ical.js (latest)
// Key API:
//   - ICAL.parse(text) → jCal array
//   - new ICAL.Component(jcal) → walkable component tree
//   - vcalendar.getAllSubcomponents('vevent') → VEVENT[]
//   - vevent.getFirstPropertyValue('dtstart' | 'dtend' | 'summary' | 'uid')
//   - vevent.getFirstPropertyValue('rrule') → ICAL.Recur (or null)
//   - new ICAL.RecurExpansion({ component, dtstart }).next() → ICAL.Time | null
//   - Timezone DB is a separate import — not loaded here; we treat all times as
//     their stored TZID/UTC and rely on the consumer's date math.

let icalModule: typeof import('ical.js') | null = null

async function loadIcal() {
  if (!icalModule) {
    icalModule = await import('ical.js')  // ← dynamic, lazy
  }
  return icalModule
}

export async function parseIcsFeed(
  input: string,
  options: ParseIcsFeedOptions = {}
): Promise<ScheduleWindow[]> {
  const text = input.startsWith('http')
    ? await fetch(input).then((r) => {
        if (!r.ok) throw new Error(`parseIcsFeed: HTTP ${r.status} from ${input}`)
        return r.text()
      })
    : input

  const ICAL = await loadIcal()
  const jcal = ICAL.parse(text)
  const vcalendar = new ICAL.Component(jcal)
  const vevents = vcalendar.getAllSubcomponents('vevent')

  const rangeStart = options.rangeStart ?? new Date()
  const rangeEnd =
    options.rangeEnd ?? new Date(rangeStart.getTime() + 365 * 24 * 60 * 60 * 1000)
  const defaultKind = options.defaultKind ?? 'blackout'

  const windows: ScheduleWindow[] = []
  for (const vevent of vevents) {
    const uid = vevent.getFirstPropertyValue('uid') as string | null
    const summary = vevent.getFirstPropertyValue('summary') as string | null
    const dtstart = vevent.getFirstPropertyValue('dtstart') as
      | (ICAL.Time & { toJSDate(): Date })
      | null
    const dtend = vevent.getFirstPropertyValue('dtend') as
      | (ICAL.Time & { toJSDate(): Date })
      | null
    if (!dtstart) continue

    const duration =
      dtend && dtstart
        ? dtend.toJSDate().getTime() - dtstart.toJSDate().getTime()
        : 24 * 60 * 60 * 1000 // default 1-day event if no DTEND

    const rrule = vevent.getFirstPropertyValue('rrule')
    if (rrule) {
      // Recurring: expand bounded by rangeEnd
      const expand = new ICAL.RecurExpansion({ component: vevent, dtstart })
      let next: ICAL.Time | null
      let count = 0
      while ((next = expand.next()) && next.toJSDate() < rangeEnd && count < 10_000) {
        const start = next.toJSDate()
        if (start < rangeStart) {
          count++
          continue
        }
        windows.push({
          id: `${uid ?? 'ics'}-${start.toISOString()}`,
          kind: defaultKind,
          start,
          end: new Date(start.getTime() + duration),
          label: summary ?? undefined,
          source: 'ics',
        })
        count++
      }
    } else {
      // Single occurrence
      const start = dtstart.toJSDate()
      windows.push({
        id: uid ?? `ics-${start.toISOString()}`,
        kind: defaultKind,
        start,
        end: dtend ? dtend.toJSDate() : new Date(start.getTime() + duration),
        label: summary ?? undefined,
        source: 'ics',
      })
    }
  }
  return windows
}
```

Notes:

- `ical.js` package id on npm is `ical.js`; types are bundled. If the implementer hits "cannot find module" on the dynamic import, install via `pnpm --filter @tour-kit/scheduling add ical.js` and mark it as a regular dep (not peer; peer would force consumers to install even if they never call `parseIcsFeed`, and the lazy boundary already protects bundle size).
- The 10,000-iteration cap on recurring expansion is a defensive ceiling — well above any real-world holiday calendar.
- Memory entry **#188** flags `ical.js` at ~30–40 KB gzipped without the timezone DB. We're not loading the TZ DB; consumers needing TZ-aware expansion should pass `rangeStart`/`rangeEnd` in their preferred local timezone and the parser returns UTC `Date`s.

**Sanity check:** `pnpm --filter @tour-kit/scheduling test -- --run parse-ics-feed` exits 0 with the US-holidays fixture producing exactly the expected count of blackout windows; a separate test asserts `windows.every(w => w.source === 'ics')`.

---

### Task 15.3 — `mergeSchedules` conflict resolver (2–3 h)

**Depends on:** 15.2

Create `packages/scheduling/src/lib/schedule-merge.ts`:

```ts
import type { ScheduleWindow } from '../adapters/ics'

export const MERGE_POLICY = {
  blackoutWinner: 'ics',      // ICS-sourced blackout overrides explicit whitelist on overlap
  whitelistWinner: 'explicit', // explicit-authored whitelist overrides ICS whitelist on overlap
} as const

export function mergeSchedules(
  ics: readonly ScheduleWindow[],
  explicit: readonly ScheduleWindow[]
): ScheduleWindow[]
```

Implementation walks both arrays, classifying every pairwise overlap into one of the 6 permutations above. The algorithm:

1. Concatenate ics + explicit into a single array of candidate windows.
2. For each pair `(a, b)` that temporally overlap (`a.start < b.end && b.start < a.end`):
   - Both blackout → emit the **union** (start = min, end = max). Permutation 5.
   - Both whitelist → emit the **union**. Permutation 6.
   - One blackout, one whitelist:
     - If the blackout is from ICS → ICS blackout passes through unchanged; the whitelist is **clipped** by the blackout interval. Permutation 3.
     - If the blackout is from explicit → the explicit blackout passes through unchanged; the ICS whitelist is **clipped**. Permutation 4.
3. Non-overlapping windows pass through unchanged. Permutations 1 and 2.

Clipping helper: `clip(window, interval): ScheduleWindow[]` returns 0, 1, or 2 windows (interval fully covers → 0; interval at the start/end → 1; interval in the middle → 2).

Output is deterministically ordered by `start` ascending, then by `id` ascending for stable test diffs.

**Sanity check:** `pnpm --filter @tour-kit/scheduling test -- --run schedule-merge.permutations` exits 0 with 6 named tests `permutation-1` through `permutation-6` each asserting the specific output windows for one row of the matrix above.

---

## Deliverables

```
packages/scheduling/
├── src/
│   ├── components/
│   │   └── scheduled-banner.tsx              # UPDATED — remove sr-only span; add console.groupCollapsed dev-only
│   ├── adapters/
│   │   └── ics.ts                            # NEW — parseIcsFeed + ScheduleWindow + dynamic ical.js import
│   ├── lib/
│   │   └── schedule-merge.ts                 # NEW — mergeSchedules + MERGE_POLICY + clip helper
│   ├── types/
│   │   └── (no change)                       # ScheduleWindow re-exported from adapters/ics.ts via index.ts
│   └── index.ts                              # UPDATED — re-export parseIcsFeed, mergeSchedules, ScheduleWindow
│
└── __tests__/
    ├── scheduled-banner.a11y.test.tsx        # NEW — axe-core scan asserts 0 violations
    ├── parse-ics-feed.test.ts                # NEW — fixture-based ICS parse + dynamic-import spy
    ├── schedule-merge.permutations.test.ts   # NEW — 6 named permutation tests + clip helper unit tests
    ├── bundle-no-ical-js.test.ts             # NEW — asserts ical.js absent from static-import graph of dist/index.js
    └── fixtures/
        └── us-holidays-2026.ics              # NEW — committed fixture sourced from Google holidays subset

apps/docs/
└── content/docs/scheduling/
    └── ics.mdx                               # NEW — documents parseIcsFeed, mergeSchedules, dynamic-import behaviour
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/scheduling typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/scheduling test -- --run scheduled-banner.a11y` exits 0 with axe-core reporting **0 violations** from tour-kit selectors on a `<ScheduledBanner>` page in the `not_showable` state
- [ ] Lighthouse accessibility on a docs/dashboard page that mounts `<ScheduledBanner>` returns **100** (no regression)
- [ ] `pnpm --filter @tour-kit/scheduling test -- --run parse-ics-feed` exits 0 with the `us-holidays-2026.ics` fixture producing the expected count and dates of blackout windows
- [ ] Dynamic-import spy test asserts `ical.js` is **not** loaded until `parseIcsFeed` is first called (verified via `vi.fn()` wrapping `import.meta`-style dynamic resolution OR by inspecting `globalThis.__icalLoaded__` set inside the lazy loader during tests)
- [ ] `pnpm --filter @tour-kit/scheduling test -- --run schedule-merge.permutations` exits 0 with **6/6** named permutation tests passing (`permutation-1`…`permutation-6`)
- [ ] `pnpm --filter @tour-kit/scheduling test -- --run bundle-no-ical-js` exits 0 — bundle-analyzer assertion: `ical.js` is **not** in the static-import graph of `dist/index.js`; initial chunk size is within ±200 bytes of the pre-Phase-15 baseline (recorded in the test as a constant)
- [ ] `pnpm --filter docs build` exits 0 and `apps/docs/content/docs/scheduling/ics.mdx` appears in the rendered sidebar under Scheduling
- [ ] All existing scheduling tests still pass: `pnpm --filter @tour-kit/scheduling test` exits 0 with **zero regressions** vs pre-phase baseline

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 15 of Tour Kit v2 Package Polish — Scheduling Polish (a11y fix + ICS).

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives plus Pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps from `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest, pnpm. The `@tour-kit/scheduling` package currently exposes time-based scheduling primitives — `Schedule`, `BlackoutPeriod`, `getScheduleStatus`, `isScheduleActive`, `useSchedule`, `useScheduleStatus`. Its evaluation order is: date-range → blackout → day-of-week → time-of-day → business-hours → recurring (see `packages/scheduling/CLAUDE.md`).

### Established in Prior Phases
- No prior phase blocks Phase 15.
- Phase 16 will consume `parseIcsFeed` from a new `<ScheduleBuilder>` UI; the `ScheduleWindow` shape exported here is the input contract.
- Big-plan risk register entry (line 576) requires **lazy-load via dynamic `import('ical.js')`** even though memory note #188 indicates `ical.js` is ~30–40 KB gzipped without the timezone DB (smaller than the original 80 KB estimate). Honor the plan; ship with `await import('ical.js')`.

### Your Goal for This Phase
Ship three things in one PR: (1) remove the `sr-only` diagnostic from `<ScheduledBanner>` and route the not-showable signal to `console.groupCollapsed` gated on dev; (2) add `parseIcsFeed(input)` with dynamic `ical.js` import in `packages/scheduling/src/adapters/ics.ts`; (3) add `mergeSchedules(ics, explicit)` conflict resolver in `packages/scheduling/src/lib/schedule-merge.ts` that handles the 6 overlap permutations spelled out below. Plus docs and tests.

### Important Context Note
When you inspect the package, `packages/scheduling/src/components/` currently contains only `schedule-gate.tsx` — not `scheduled-banner.tsx`. If `<ScheduledBanner>` does not exist as a file, **create it** as part of Task 15.1 with the signature `function ScheduledBanner({ schedule, options }: { schedule: Schedule; options?: ScheduleEvaluationOptions }): JSX.Element | null` — render `null` when active, render a visible banner with `status.message` when not, and route the dev diagnostic to `console.groupCollapsed` per the snippet below. If you grep and find the component already exists (e.g., in a sibling location), update it in place and delete the existing `sr-only` line. Either way the observable outcome is the same: zero a11y violations + dev-only console group.

The current diagnostic pattern to delete (or to ensure never gets written) is:

```tsx
// DELETE THIS — the sr-only span is what screen readers announce as the violation
{status.reason === 'not_showable' && (
  <span className="sr-only" role="status">
    [tour-kit] schedule: not showable — {status.message}
  </span>
)}
```

The replacement (write this instead):

```tsx
React.useEffect(() => {
  if (process.env.NODE_ENV !== 'production' && status.reason === 'not_showable') {
    console.groupCollapsed('[tour-kit] schedule: not showable')
    console.log('reason:', status.reason)
    console.log('message:', status.message)
    console.log('debug:', status.debug)
    console.groupEnd()
  }
}, [status.reason, status.message, status.debug])
```

### Data Model Rules (follow exactly)
- **`interface` (exported):** `ScheduleWindow` and `ParseIcsFeedOptions` live in `packages/scheduling/src/adapters/ics.ts`. Re-exported from `@tour-kit/scheduling` barrel.
- **`interface` (internal):** Any ICS-parser intermediate (e.g., raw vevent shape) is module-private to `adapters/ics.ts`.
- **`const` object literal `as const`:** `MERGE_POLICY = { blackoutWinner: 'ics', whitelistWinner: 'explicit' } as const` in `lib/schedule-merge.ts`.
- **No new Zod schemas this phase.** `parseIcsFeed` parses RFC 5545 ICS via `ical.js`; the only external-input validation is the dynamic import + try/catch around `ICAL.parse(text)`.
- **`ical.js` is dynamically imported** inside `parseIcsFeed` via `const ICAL = await import('ical.js')`. Cache the module in a `let icalModule` at module scope so subsequent calls reuse it. Do NOT import `ical.js` at module top level — that would force it into the static-import graph and inflate the initial chunk.
- **`ScheduleWindow` is additive** — does not break or replace existing `BlackoutPeriod` / `Schedule.blackouts`. A thin `windowToBlackout(w)` adapter in `lib/schedule-merge.ts` is acceptable if downstream code needs the older shape.

### Architecture

```
packages/scheduling/src/
├── components/scheduled-banner.tsx    ← remove sr-only diag; add console.groupCollapsed (dev-only)
├── adapters/ics.ts                    ← NEW: parseIcsFeed + ScheduleWindow; await import('ical.js')
├── lib/schedule-merge.ts              ← NEW: mergeSchedules + MERGE_POLICY + clip helper
└── index.ts                           ← re-export parseIcsFeed, mergeSchedules, ScheduleWindow
```

Memory note: ical.js #188 reports ~30–40 KB gzipped without timezone DB; we still ship dynamic-import per big-plan task 15.2.

### Confirmed Library APIs

```javascript
// Library: ical.js (latest) — Confirmed via Context7 on 2026-05-15
// Source: https://github.com/kewisch/ical.js/wiki/Parsing-iCalendar
//         https://github.com/kewisch/ical.js/wiki/Common-Use-Cases

// 1) Parse text into a walkable component tree
const ICAL = await import('ical.js')        // dynamic — required by big-plan §15.2
const jcal = ICAL.parse(icsText)            // → jCal array
const vcalendar = new ICAL.Component(jcal)  // wrap

// 2) Walk VEVENTs and read properties
const vevents = vcalendar.getAllSubcomponents('vevent')  // VEVENT[]
for (const vevent of vevents) {
  const uid     = vevent.getFirstPropertyValue('uid')      // string | null
  const summary = vevent.getFirstPropertyValue('summary')  // string | null
  const dtstart = vevent.getFirstPropertyValue('dtstart')  // ICAL.Time | null
  const dtend   = vevent.getFirstPropertyValue('dtend')    // ICAL.Time | null
  const rrule   = vevent.getFirstPropertyValue('rrule')    // ICAL.Recur | null
  // ICAL.Time → JS Date: dtstart.toJSDate()
}

// 3) Recurring expansion (bounded — refuse to iterate past rangeEnd)
const expand = new ICAL.RecurExpansion({
  component: vevent,
  dtstart: vevent.getFirstPropertyValue('dtstart')
})
let next               // ICAL.Time | null
while ((next = expand.next()) && next.toJSDate() < rangeEnd) {
  // ICAL.Time → JS Date: next.toJSDate()
}

// 4) Timezone DB is a SEPARATE optional import — not loaded here.
//    Times are returned as their stored TZID/UTC; downstream code handles TZ math.
```

The full `parseIcsFeed` reference implementation is pasted in `tasks/v2-package-polish/phase-15.md` §Tasks 15.2 — copy it verbatim.

### Files to Create / Update

#### `packages/scheduling/src/components/scheduled-banner.tsx` (UPDATE or CREATE)
If the file exists, delete the `<span className="sr-only" role="status">…</span>` diagnostic block. If it doesn't exist, create the file with the `ScheduledBanner({ schedule, options })` component described in the Important Context Note above. Either way, add the `React.useEffect` block that gates `console.groupCollapsed` on `process.env.NODE_ENV !== 'production'` AND `status.reason === 'not_showable'`. The visible banner can keep `role="status"` — only the redundant `sr-only` span is the a11y violation. Do NOT add any other dev diagnostics in this phase.

#### `packages/scheduling/src/adapters/ics.ts` (NEW)
Export `ScheduleWindow`, `ParseIcsFeedOptions`, `parseIcsFeed`. Implementation copied verbatim from §Tasks 15.2 in this phase doc. Key behaviors: (a) fetch when input starts with `http`, otherwise treat as raw text; (b) await dynamic `import('ical.js')` and cache; (c) iterate VEVENTs, expanding `RRULE` via `RecurExpansion` bounded by `options.rangeEnd ?? now + 1 year`; (d) cap recurring iteration at 10,000 occurrences as defensive ceiling; (e) emit `ScheduleWindow` objects with `source: 'ics'` and `kind: options.defaultKind ?? 'blackout'`. Catch `ICAL.parse` errors and rethrow with a wrapped message including the input source. Do NOT load the ical.js timezone DB.

#### `packages/scheduling/src/lib/schedule-merge.ts` (NEW)
Export `MERGE_POLICY` (const object `as const`), `mergeSchedules(ics, explicit): ScheduleWindow[]`, and a `clip(window, interval): ScheduleWindow[]` helper. Algorithm: classify every overlapping pair into one of the 6 permutations below; non-overlapping windows pass through unchanged; sort output by `start` ascending then `id` ascending for deterministic test diffs. `mergeSchedules` is pure (no mutation, no side effects, no analytics).

Conflict resolution matrix (1:1 with the test names `permutation-1`…`permutation-6`):

| # | ICS window | Explicit window | Output | Test name |
|---|------------|-----------------|--------|-----------|
| 1 | blackout `[Dec25, Dec26]` | (none) | ICS blackout pass-through | `permutation-1` |
| 2 | (none) | blackout `[Dec25, Dec26]` | Explicit blackout pass-through | `permutation-2` |
| 3 | blackout `[Dec24, Dec26]` | whitelist `[Dec25, Dec25]` | ICS blackout wins on overlap → blackout `[Dec24, Dec26]` | `permutation-3` |
| 4 | whitelist `[Dec24, Dec26]` | blackout `[Dec25, Dec25]` | Explicit blackout wins → whitelist `[Dec24, Dec25)` + whitelist `(Dec25, Dec26]` + blackout `[Dec25, Dec25]` | `permutation-4` |
| 5 | blackout `[Dec24, Dec26]` | blackout `[Dec25, Dec27]` | Union → blackout `[Dec24, Dec27]` | `permutation-5` |
| 6 | whitelist `[Dec20, Dec22]` | whitelist `[Dec21, Dec23]` | Union → whitelist `[Dec20, Dec23]` | `permutation-6` |

#### `packages/scheduling/src/index.ts` (UPDATE)
Re-export `parseIcsFeed`, `mergeSchedules`, `MERGE_POLICY`, `ScheduleWindow`, `ParseIcsFeedOptions` from the barrel. Do not break any existing exports.

#### `packages/scheduling/__tests__/scheduled-banner.a11y.test.tsx` (NEW)
Render `<ScheduledBanner schedule={…} options={{ now: <a date that makes the schedule not_showable> }} />` and run `axe(container)` from `vitest-axe` (or `@axe-core/playwright` if a Playwright suite is already set up in the package — use Vitest+jsdom+axe-core by default to match the rest of the package's tests). Assert `expect(results.violations).toHaveLength(0)`. Snapshot-pin the rendered DOM to prove the `sr-only` span is absent.

#### `packages/scheduling/__tests__/parse-ics-feed.test.ts` (NEW)
Load `__tests__/fixtures/us-holidays-2026.ics` (committed). Call `parseIcsFeed(text)`. Assert the returned array length matches the expected holiday count for the fixture's range. Assert every returned window has `source: 'ics'` and `kind: 'blackout'` (default). Add a second test that wraps the dynamic-import call site to verify `ical.js` is NOT in the static-import graph — easiest path is to set `globalThis.__icalLoaded__ = false` at the top of the test, mock `import()` to flip the flag on first call, and assert the flag is `false` before the first `parseIcsFeed(...)` call and `true` after. If wrapping dynamic `import()` is impractical in jsdom, fall back to inspecting `dist/index.js` text via `node:fs` for an `import('ical.js')` substring vs a top-level `require('ical.js')`/`from 'ical.js'`.

#### `packages/scheduling/__tests__/schedule-merge.permutations.test.ts` (NEW)
Six `it('permutation-N — <description>', () => { … })` tests, one per row of the matrix above. Each test constructs explicit `ScheduleWindow` inputs, calls `mergeSchedules(ics, explicit)`, and asserts deep-equality against the expected output array. Add a 7th unit test for the `clip(window, interval)` helper covering all three outcomes (0, 1, 2 output windows).

#### `packages/scheduling/__tests__/bundle-no-ical-js.test.ts` (NEW)
Read `dist/index.js` (or the bundled barrel output) and assert: (a) no `from 'ical.js'` or `require('ical.js')` static-import substring; (b) at least one `import('ical.js')` (or the bundler's equivalent — webpack chunks, esbuild dynamic, etc.) substring proves dynamic. Constants: `BASELINE_BYTES = <recorded pre-phase initial chunk size>` and assert `|currentBytes - BASELINE_BYTES| < 200`. The baseline value is computed in a pre-test `beforeAll` that builds the package once if missing.

#### `packages/scheduling/__tests__/fixtures/us-holidays-2026.ics` (NEW)
A committed `.ics` fixture covering ~10 US federal holidays for 2026. Easiest source: subset of Google's public US holidays ICS feed (do NOT hot-link in test; check the fixture into the repo). Format must be RFC 5545; verify it parses in a separate scratch script before committing.

#### `apps/docs/content/docs/scheduling/ics.mdx` (NEW)
Frontmatter: `title: ICS feed import`, `description: Import holidays and off-hours from any iCalendar feed (Google Calendar, Outlook, Calendly) and merge with explicit windows.`. Two H2 sections: (1) "Parsing an ICS feed" — show `parseIcsFeed('https://calendar.google.com/...ics')` and `parseIcsFeed(rawText)`, document the `options.rangeStart`/`rangeEnd`/`defaultKind`, note that `ical.js` is dynamically imported on first call. (2) "Merging schedules" — paste the 6-permutation table verbatim and show `mergeSchedules(ics, explicit)`. Slot the page after the existing `business-hours.mdx` in the sidebar.

### Success Criteria
- `<ScheduledBanner>` produces zero axe-core violations on a `not_showable` page (axe scan in jsdom)
- Lighthouse a11y on a docs page mounting `<ScheduledBanner>` returns 100 (no regression)
- `parseIcsFeed(<us-holidays-fixture>.ics)` returns the expected blackout windows
- `ical.js` is NOT in the static-import graph of `dist/index.js` (bundle-analyzer test)
- `mergeSchedules` passes all 6 named permutation tests
- `pnpm --filter @tour-kit/scheduling test` exits 0 (zero regressions)
- `pnpm --filter @tour-kit/scheduling typecheck` exits 0
- `pnpm --filter docs build` exits 0; `ics.mdx` renders in sidebar

### Expected File Structure at End

```
tasks/v2-package-polish/phase-15.md  ← this plan

packages/scheduling/
├── src/
│   ├── components/scheduled-banner.tsx       ← UPDATED or NEW (sr-only removed; console.groupCollapsed added)
│   ├── adapters/ics.ts                       ← NEW (parseIcsFeed + ScheduleWindow + dynamic ical.js)
│   ├── lib/schedule-merge.ts                 ← NEW (mergeSchedules + MERGE_POLICY + clip)
│   └── index.ts                              ← UPDATED (re-exports)
└── __tests__/
    ├── scheduled-banner.a11y.test.tsx        ← NEW
    ├── parse-ics-feed.test.ts                ← NEW
    ├── schedule-merge.permutations.test.ts   ← NEW
    ├── bundle-no-ical-js.test.ts             ← NEW
    └── fixtures/us-holidays-2026.ics         ← NEW

apps/docs/content/docs/scheduling/
└── ics.mdx                                   ← NEW
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 15 depends on nothing; the Phase 16 consumer-of-`parseIcsFeed` direction is documented in §Objective.
- [PASS] Every sub-task has a clear, testable completion condition — each task has a `Sanity check` one-liner mapping to a specific `pnpm --filter @tour-kit/scheduling test -- --run <name>` invocation, and each test name is listed in Exit Criteria.
- [PASS] Execution prompt is self-contained — current state of the scheduling package is described inline (only `schedule-gate.tsx` exists today), the sr-only deletion snippet and replacement snippet are both inline, the full `parseIcsFeed` reference implementation is pasted in §Tasks 15.2 and referenced by the prompt, the 6-permutation matrix appears verbatim in both the prompt and the tasks section, data model rules are spelled out (interface vs const tuple, no Zod, dynamic import requirement, additive ScheduleWindow shape), and memory note #188 is cited inline.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATE file appears in at least one checkbox: typecheck (all source files), `scheduled-banner.a11y` (component), `parse-ics-feed` + bundle-no-ical-js (adapter), `schedule-merge.permutations` (merge utility), `docs build` (mdx). The fixture file is covered indirectly by the parse-ics-feed test asserting its parsed shape.
- [PASS] Heavy external deps have a fake/stub strategy noted — `ical.js` is the only new dep; the bundle-no-ical-js test verifies it stays dynamic, and the dynamic-import spy test verifies it's not loaded until `parseIcsFeed` is called. No GPU or network mock needed; the fixture is a committed file so tests run offline.
- [FAIL — soft] New library has a confirmed snippet from Context7 in the execution prompt — `ical.js` Context7 query returned the `ICAL.parse(text)` → `new ICAL.Component(jcal)` → `getAllSubcomponents('vevent')` → `RecurExpansion` pattern (cited inline in §Confirmed Library APIs). The query did NOT explicitly confirm the timezone DB import path (memory #188 says "without timezone DB" so we omit it; the Context7 snippet implies timezone handling requires a separate import which we deliberately skip). **Soft fail** because timezone-DB handling under DST transitions for cross-timezone ICS feeds is untested in this phase — if the Phase 16 consumer hits a DST edge case, we'll revisit with a follow-up. The exit criteria do not depend on TZ-DB behaviour.

One additional honesty flag (not in the standard 6 items): the prompt presumes `<ScheduledBanner>` exists today, but my grep of `packages/scheduling/src/` found only `schedule-gate.tsx` — no `sr-only` and no `not_showable` string anywhere in the package. I've documented this in the Important Context Note inside the Execution Prompt so the implementer creates the component if missing rather than getting confused looking for code that isn't there.
