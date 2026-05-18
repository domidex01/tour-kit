# Phase 16 — ScheduleBuilder + Adoption Server Adapter

**Duration:** Days 83–88 (~10–14 hours)
**Depends on:** Phase 15 task 15.2 (`parseIcsFeed(url | string)` returning blackout windows + windows merged into the existing `Schedule` shape — `<ScheduleBuilder>` accepts the result of `parseIcsFeed` as a starting-point seed via an optional `defaultValue` prop, so the parser's return shape must equal `Schedule` exactly)
**Blocks:** Nothing directly. Feeds the M6 milestone gate (non-engineer authoring + server-side adoption ingestion).
**Risk Level:** MEDIUM — two additive features ship in one phase. ScheduleBuilder is a small form-driven editor with a strict round-trip contract; `serverEventAdapter` has a clear idempotency contract (dedupe by `eventId` before merging into the local store). The unconstrained dimension is **protocol design** — the package can't dictate a backend, only provide a payload contract and a Next.js route handler template. Neither change widens an existing public type incompatibly.
**Stack:** react

---

## Objective

Close two day-one authoring/ingestion gaps:

1. **`<ScheduleBuilder>` — a non-engineer-friendly visual editor for schedule windows** that outputs the same `Schedule` JSON shape the rest of `@tour-kit/scheduling` already consumes. Fields cover `startAt`/`endAt`, `daysOfWeek`, `timeOfDay`, and `timezone` (sourced from the browser's native `Intl.supportedValuesOf('timeZone')` — no third-party TZ list). The contract is **lossless round-trip**: any `Schedule` value that goes in serialises back to an equal-by-shape value. New consumers can author schedules in a form UI today and hand the result directly to `useSchedule(...)` / `<ScheduleGate>` without a translation layer. Existing consumers see byte-identical behaviour — `<ScheduleBuilder>` is a new file, not a change to existing utilities.

2. **`serverEventAdapter({ ingestUrl })` — a server-side adoption event ingestion path** for `@tour-kit/adoption`. Backends POST batches of `{ eventId, userId, featureId, timestamp }` to a consumer-owned route; the adapter dedupes by `eventId` against an in-store set and merges only the new events into the existing `FeatureUsage` state via the same `trackUsage(featureId)` path the client already uses. The package ships a **Next.js App Router `route.ts` template** that compiles and validates the payload — consumers paste it into `app/api/adoption/events/route.ts`, wire their own auth, and the adapter does the rest.

Both APIs land additively. The `Schedule` JSON shape is locked (see Phase 15) — `<ScheduleBuilder>` does not introduce new schedule fields. The adoption store's client-side `trackUsage` path is the only mutation seam — `serverEventAdapter` calls it after deduping, so it composes cleanly with `useAdoption()` consumers without double-counting.

## What Success Looks Like

1. **Round-trip property test green.** `pnpm --filter @tour-kit/scheduling test scheduling-builder.round-trip` runs 100 randomly-generated `Schedule` values through `serialize → ScheduleBuilder defaultValue → component state → onChange → equal-by-shape` and asserts deep-equality on the subset of fields `<ScheduleBuilder>` owns (`startAt`, `endAt`, `daysOfWeek`, `timeOfDay`, `timezone`, `enabled`). Test exits `0` with `expect(out).toEqual(in)` on every iteration.
2. **Server adapter idempotency.** Feed the adapter two batches with overlapping `eventId`s — `[{eventId:'a',...}, {eventId:'b',...}]` then `[{eventId:'b',...}, {eventId:'c',...}]` — and assert `useCount` for the relevant feature advances by exactly 3 (not 4). `pnpm --filter @tour-kit/adoption test server-events-adapter.idempotency` exits `0`.
3. **Server adapter merges without double-counting client events.** A test that emits a client-side `trackUsage('feature-x')` then ingests a server batch containing an event with the same `featureId` but distinct `eventId` shows `useCount` advance by 2 — verifying the dedupe set is keyed on `eventId`, not `featureId`. Same test file.
4. **Timezone picker uses `Intl.supportedValuesOf('timeZone')`.** Mount `<ScheduleBuilder>` and assert the timezone `<select>` contains `'America/New_York'`, `'Europe/London'`, `'UTC'`, and at least 300 options (the IANA TZ DB has ~419 entries). No `moment-timezone`, no `tzdata` import, no hardcoded list.
5. **Next.js route handler example compiles.** The docs page ships a `route.ts` snippet that imports the adapter from `@tour-kit/adoption/server`, validates the body with a tiny inline schema (no new dep — manual validation), and returns a JSON ack. A smoke test in `apps/smoke/` (or `apps/docs/__tests__/`) imports the snippet text, writes it to a temp file, and runs `tsc --noEmit` — exits `0`.
6. **`pnpm --filter @tour-kit/scheduling typecheck`** and **`pnpm --filter @tour-kit/adoption typecheck`** both exit `0`. Both packages' `pnpm --filter <pkg> test` exits `0` with the new test files green and all existing tests still green.
7. **Bundle delta per package is `< 4 KB` gzipped.** Verified by `pnpm --filter @tour-kit/scheduling build && gzip -c packages/scheduling/dist/index.mjs | wc -c` before vs after the PR (and same for adoption); recorded in PR description.
8. **Docs render in the sidebar.** `apps/docs/content/docs/scheduling/builder.mdx` and `apps/docs/content/docs/adoption/server-events.mdx` appear in their respective sidebars; `pnpm --filter docs build` exits `0`.

---

## Architecture / Key Design Decisions

```
                       ┌──────────────────────────────────────────────────┐
                       │              <ScheduleBuilder>                    │
                       │                                                   │
  defaultValue:        │   ┌─────────────────┐                             │
  Schedule (optional)──┼──►│ form state      │── deserializeSchedule ─┐    │
                       │   │ (useState)      │                        │    │
                       │   │  - startAt      │                        ▼    │
  parseIcsFeed result ─┼──►│  - endAt        │                  FormState  │
  (Phase 15.2)          │   │  - daysOfWeek   │                        │    │
                       │   │  - timeOfDay    │                        │    │
                       │   │  - timezone     │── serializeSchedule ──►│    │
                       │   │  - enabled      │                        │    │
                       │   └─────────────────┘                        ▼    │
                       │           │                              Schedule │
                       │           │  fields:                       (JSON) │
                       │           ▼                                  │    │
                       │   <DateRangeField>                            │    │
                       │   <DaysOfWeekField>                           │    │
                       │   <TimeOfDayField>                            │    │
                       │   <TimezoneField>  ◄── Intl.supportedValuesOf │    │
                       │                                               │    │
                       └───────────────────────────────────────────────┼────┘
                                                                       │
                                                                       ▼
                                                                  onChange(schedule)
                                                                       │
                                                                       ▼
                                                            useSchedule / <ScheduleGate>
                                                            (existing — no change)


                       ┌──────────────────────────────────────────────────┐
                       │                Backend                            │
                       │  (Postgres, Kafka, etc. — owned by consumer)     │
                       └─────────────────────┬────────────────────────────┘
                                             │
                                             │ POST batch:
                                             │ [{ eventId, userId, featureId, timestamp }]
                                             ▼
                       ┌──────────────────────────────────────────────────┐
                       │ Next.js route.ts template (consumer-pastes)      │
                       │  app/api/adoption/events/route.ts                │
                       │   - validate body shape (manual, no Zod)         │
                       │   - 401/403 auth check (consumer-owned)          │
                       │   - return 202 + count                            │
                       └─────────────────────┬────────────────────────────┘
                                             │
                                             ▼  fetch('/api/adoption/events') ← consumer wires this
                       ┌──────────────────────────────────────────────────┐
                       │ serverEventAdapter({ ingestUrl, batchSize?,      │
                       │                       flushIntervalMs? })        │
                       │                                                   │
                       │   POST batch ──► route handler ──► acks          │
                       │   ◄────────────────────────────────────────       │
                       │   on success: events flow into local store via   │
                       │     dedupeByEventId(batch, seenEventIds)         │
                       │     ↓                                              │
                       │     filtered.forEach(e => trackUsage(e.featureId))│
                       │     (uses existing AdoptionContext mutation seam) │
                       └──────────────────────────────────────────────────┘
```

### Schedule JSON shape (locked — Phase 15 verified)

`<ScheduleBuilder>` owns the following subset of the `Schedule` interface from `packages/scheduling/src/types/schedule.ts`:

```ts
// Owned by ScheduleBuilder (round-trip equality enforced):
{
  enabled?: boolean
  startAt?: DateString | Date   // serializer stores as DateString (YYYY-MM-DD) for stability
  endAt?: DateString | Date
  daysOfWeek?: DayOfWeek[]      // 0..6 Sunday-indexed; UI multi-select
  timeOfDay?: TimeRange         // { start: HH:MM, end: HH:MM }
  timezone?: string             // IANA name from Intl.supportedValuesOf('timeZone')
}

// NOT owned by ScheduleBuilder (passes through unchanged via `extraFields` ref):
{
  useUserTimezone?: boolean
  blackouts?: BlackoutPeriod[]   // from parseIcsFeed — preserved verbatim
  recurring?: RecurringPattern   // advanced authoring; out of scope this phase
  metadata?: Record<string, unknown>
}
```

**Round-trip rule.** `<ScheduleBuilder>` accepts a `defaultValue: Schedule` and emits `onChange(schedule: Schedule)`. Unmodified fields (blackouts, recurring, metadata, useUserTimezone) are preserved exactly. Owned fields are normalised: `startAt`/`endAt` are coerced to `DateString` (YYYY-MM-DD) on emit so the JSON output is stable across re-renders. This is the only normalisation the serializer performs. Any other normalisation (e.g. sorting `daysOfWeek`) breaks the property test.

### `<ScheduleBuilder>` public contract

```ts
// packages/scheduling/src/components/schedule-builder.tsx
export interface ScheduleBuilderProps {
  /** Initial schedule. If omitted, the form starts empty (all fields cleared). */
  defaultValue?: Schedule
  /**
   * Called whenever a field changes. Emits the complete Schedule with owned fields
   * normalised and unowned fields (blackouts, recurring, metadata, useUserTimezone)
   * preserved from defaultValue.
   */
  onChange?(schedule: Schedule): void
  /** Override className on the root form wrapper. */
  className?: string
  /** Hide individual fields when consumers want a stripped-down UI. */
  hideFields?: ReadonlyArray<'dateRange' | 'daysOfWeek' | 'timeOfDay' | 'timezone'>
  /** Localised UI labels — falls back to English. */
  labels?: Partial<ScheduleBuilderLabels>
}

export interface ScheduleBuilderLabels {
  startAt: string
  endAt: string
  daysOfWeek: string
  timeOfDay: string
  timeOfDayStart: string
  timeOfDayEnd: string
  timezone: string
  enabled: string
  dayNames: readonly [string, string, string, string, string, string, string] // Sun..Sat
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps>
```

### `serverEventAdapter` public contract

```ts
// packages/adoption/src/adapters/server-events.ts
export interface ServerAdoptionEvent {
  /** Stable per-event UUID — the dedupe key. Backend MUST generate this. */
  eventId: string
  /** Optional user identifier; passed through but not required by the dedupe. */
  userId?: string
  /** Feature ID matching a registered Feature.id. */
  featureId: string
  /** Unix ms (Date.now()) when the event occurred on the backend. */
  timestamp: number
}

export interface ServerEventAdapterOptions {
  /** Consumer route URL (e.g. '/api/adoption/events'). */
  ingestUrl: string
  /** Optional max batch size for outgoing POSTs (when used as a polling pull). Default: 50. */
  batchSize?: number
  /** Optional poll interval in ms (when used as a polling pull). Default: 30_000. */
  flushIntervalMs?: number
  /** Optional fetch override for tests. Default: globalThis.fetch. */
  fetcher?: typeof fetch
}

export interface ServerEventAdapter {
  /** Ingest a batch directly (used by webhook-style flows OR the polling loop). */
  ingest(events: readonly ServerAdoptionEvent[]): { merged: number; deduped: number }
  /** Start a polling loop against `ingestUrl`. Returns a cleanup fn. */
  startPolling(): () => void
  /** Stop the polling loop (idempotent). */
  stopPolling(): void
}

export function serverEventAdapter(
  options: ServerEventAdapterOptions,
  controls: { trackUsage: (featureId: string) => void }
): ServerAdoptionEventAdapter
```

The adapter is **headless** — it doesn't subscribe to the AdoptionContext itself. Consumers wire it inside a `useEffect` in a top-level layout, passing `useAdoptionContext().trackUsage` as `controls.trackUsage`. This keeps the adapter SSR-importable from `route.ts` (which doesn't have React context).

### `dedupeByEventId` — set-based filter

```ts
// packages/adoption/src/lib/event-dedupe.ts
export interface EventDedupeState {
  /** Bounded LRU; oldest evicted at maxSize. Default: 10_000. */
  seen: Set<string>
  maxSize: number
}

export function createEventDedupe(maxSize?: number): EventDedupeState

export function dedupeByEventId<T extends { eventId: string }>(
  events: readonly T[],
  state: EventDedupeState
): { fresh: T[]; deduped: number }
```

The dedupe state is **adapter-local** — one `EventDedupeState` per `serverEventAdapter` instance. Restarting the page (or browser tab) re-creates the state from scratch; if the consumer wants persistence-across-sessions, they wire a storage adapter (out of scope here — note in the docs). The bounded set caps memory at ~640 KB for `maxSize=10_000` UUIDs.

### Form-library decision

**No `react-hook-form`.** Verified by `grep "react-hook-form" packages/*/package.json apps/*/package.json` → returns nothing. Adding it is a peer-dep hit (~30 KB gzipped) for a 4-field form. We use plain `React.useState` per field + an `onChange` that recomputes the full `Schedule` and fires `props.onChange`. No `useReducer` — only 5 owned fields, the prop diffing is trivial.

### Next.js route handler — App Router pattern

The docs ship the verbatim template below. Existing routes in `apps/docs/app/api/` use the same `route.ts` + `async function POST(request: NextRequest)` shape (`apps/docs/app/api/webhooks/polar/route.ts` is the cited reference). No new dep.

```ts
// app/api/adoption/events/route.ts — CONSUMER PASTES THIS
import { type NextRequest, NextResponse } from 'next/server'
import type { ServerAdoptionEvent } from '@tour-kit/adoption/server'

// Inline validation — no Zod dep. Returns null if invalid.
function parseBatch(raw: unknown): ServerAdoptionEvent[] | null {
  if (!Array.isArray(raw)) return null
  const out: ServerAdoptionEvent[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null
    const e = item as Record<string, unknown>
    if (typeof e.eventId !== 'string' || e.eventId.length === 0) return null
    if (typeof e.featureId !== 'string' || e.featureId.length === 0) return null
    if (typeof e.timestamp !== 'number' || !Number.isFinite(e.timestamp)) return null
    if (e.userId !== undefined && typeof e.userId !== 'string') return null
    out.push({
      eventId: e.eventId,
      featureId: e.featureId,
      timestamp: e.timestamp,
      userId: e.userId as string | undefined,
    })
  }
  return out
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Consumer-owned auth — replace with your own session check.
  // const session = await getSession(request); if (!session) return NextResponse.json(null, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const events = parseBatch(body)
  if (events === null) {
    return NextResponse.json({ error: 'Invalid batch shape' }, { status: 400 })
  }

  // Hand off to your queue / DB / Kafka — this is where consumer-specific code goes.
  // For pull-style flows, return the events the client should ingest:
  return NextResponse.json({ accepted: events.length, events }, { status: 202 })
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  // Pull-style: return un-acked events for the caller. Consumer-owned.
  return NextResponse.json({ events: [] satisfies ServerAdoptionEvent[] }, { status: 200 })
}
```

### Reduced-motion three-tier defense (per repo-root CLAUDE.md)

| Tier | Mechanism | Where it applies in this phase |
|---|---|---|
| 1 | `motion-safe:` Tailwind prefix on `tailwindcss-animate` utilities | `<ScheduleBuilder>` field-error banners use `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150` on appear. Under reduce, the banner appears instantly. |
| 2 | `@media (prefers-reduced-motion: reduce)` keyframe wrappers | No new keyframes this phase. |
| 3 | JS gate via `useReducedMotion()` | Not needed — no render-time class branches in this phase. |

### Data Model Strategy

| Layer | Type | Why |
|---|---|---|
| `ScheduleBuilderProps`, `ScheduleBuilderLabels` | `interface` exported from `schedule-builder.tsx` | Consumers may wrap or extend |
| `ServerAdoptionEvent`, `ServerEventAdapterOptions`, `ServerEventAdapter` | `interface` exported from `adapters/server-events.ts` | Composition surface — the payload contract is the public API |
| `EventDedupeState` | `interface` exported from `lib/event-dedupe.ts` | Adapter wires it; tests construct it directly |
| Internal form state | `React.useState` per field (5 calls) | Trivial form; `useReducer` adds noise without payoff |
| `seen` event IDs | `Set<string>` inside `EventDedupeState` | O(1) `.has()` lookup; bounded eviction via insertion-order on overflow |

**Other critical rules for this phase:**
- **Round-trip is the only normalisation contract.** Do NOT sort `daysOfWeek` on serialize. Do NOT trim whitespace from `timezone`. The only normalisation: `startAt`/`endAt` coerce to `DateString` (YYYY-MM-DD) since the form's `<input type="date">` returns that shape natively.
- **Adapter is headless.** Do NOT import React from `adapters/server-events.ts`. The adapter is SSR-importable from a Next.js route handler.
- **Dedupe is by `eventId` only.** Do NOT use `featureId + timestamp` — backends often emit duplicate `(featureId, timestamp)` legitimately (a user double-clicks within the same ms).
- **`Intl.supportedValuesOf('timeZone')` is the ONLY timezone source.** No `moment-timezone`. No hardcoded fallback list (other than the empty array on environments that don't support the API — graceful degradation: render a free-text `<input>` with the placeholder `'America/New_York'`).
- **No new package dependencies.** ScheduleBuilder is `react` only. The adapter is `fetch` only.
- **`hideFields` is the only way to strip the UI.** No discriminated-union variants. Keeps the public type narrow.
- **A `parseIcsFeed`-produced Schedule MUST round-trip cleanly.** Phase 15's parser writes `blackouts[]`; `<ScheduleBuilder>` preserves them via the `extraFields` ref and emits them back unchanged.

---

## Tasks

### Task 16.1 — `<ScheduleBuilder>` component (5–7 h)

Goal: ship the visual editor for the owned `Schedule` subset with a strict round-trip contract.

Sub-steps:

1. **Create `packages/scheduling/src/lib/schedule-serialize.ts`** — two pure helpers that the component uses internally:

   ```ts
   import type { Schedule, DateString, DayOfWeek, TimeRange } from '../types/schedule'

   export interface ScheduleBuilderFormState {
     enabled: boolean
     startAt: DateString | ''
     endAt: DateString | ''
     daysOfWeek: DayOfWeek[]
     timeOfDayStart: string  // HH:MM or ''
     timeOfDayEnd: string    // HH:MM or ''
     timezone: string        // IANA name or ''
   }

   /** Project a Schedule into form-friendly primitives. Unowned fields are returned in `extras`. */
   export function deserializeSchedule(schedule: Schedule | undefined): {
     state: ScheduleBuilderFormState
     extras: Pick<Schedule, 'useUserTimezone' | 'blackouts' | 'recurring' | 'metadata'>
   }

   /** Reverse: take form state + extras and reconstitute a Schedule. */
   export function serializeSchedule(
     state: ScheduleBuilderFormState,
     extras: Pick<Schedule, 'useUserTimezone' | 'blackouts' | 'recurring' | 'metadata'>
   ): Schedule
   ```

   `deserializeSchedule` coerces `startAt`/`endAt` from `Date` or `DateString` into the form's `DateString | ''` (toISOString slice 0..10 if Date).
   `serializeSchedule` omits empty fields entirely — does NOT emit `startAt: ''` or `daysOfWeek: []`. This preserves the optional-field semantics of `Schedule`.

2. **Create field subcomponents** under `packages/scheduling/src/components/schedule-builder/fields/`:
   - `date-range-field.tsx` — two `<input type="date">`s for `startAt` / `endAt` with `aria-label` from `labels.startAt` / `labels.endAt`.
   - `days-of-week-field.tsx` — seven `<button type="button" role="checkbox" aria-checked>` toggles laid out as a row. `labels.dayNames` provides the visible labels.
   - `time-of-day-field.tsx` — two `<input type="time">`s.
   - `timezone-field.tsx` — `<select>` populated from `Intl.supportedValuesOf('timeZone')`. Fall back to a free-text `<input placeholder="America/New_York">` when `typeof Intl.supportedValuesOf !== 'function'` (older Safari).

   Each field accepts `{ value, onChange, label }` and is purely presentational. No internal state.

3. **Create `packages/scheduling/src/components/schedule-builder.tsx`** — the orchestrator:

   ```tsx
   'use client'

   import * as React from 'react'
   import { cn } from '@tour-kit/core'
   import type { Schedule } from '../types/schedule'
   import { deserializeSchedule, serializeSchedule, type ScheduleBuilderFormState } from '../lib/schedule-serialize'
   import { DateRangeField } from './schedule-builder/fields/date-range-field'
   import { DaysOfWeekField } from './schedule-builder/fields/days-of-week-field'
   import { TimeOfDayField } from './schedule-builder/fields/time-of-day-field'
   import { TimezoneField } from './schedule-builder/fields/timezone-field'

   export interface ScheduleBuilderLabels { /* ...as above */ }
   export interface ScheduleBuilderProps { /* ...as above */ }

   const DEFAULT_LABELS: ScheduleBuilderLabels = {
     startAt: 'Start date',
     endAt: 'End date',
     daysOfWeek: 'Days of week',
     timeOfDay: 'Time of day',
     timeOfDayStart: 'From',
     timeOfDayEnd: 'To',
     timezone: 'Timezone',
     enabled: 'Enabled',
     dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   }

   export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
     defaultValue, onChange, className, hideFields, labels,
   }) => {
     const resolvedLabels = { ...DEFAULT_LABELS, ...labels }
     const initial = React.useMemo(() => deserializeSchedule(defaultValue), [])
     const extrasRef = React.useRef(initial.extras)
     const [state, setState] = React.useState<ScheduleBuilderFormState>(initial.state)

     const emit = React.useCallback((next: ScheduleBuilderFormState) => {
       setState(next)
       onChange?.(serializeSchedule(next, extrasRef.current))
     }, [onChange])

     const hidden = new Set(hideFields ?? [])
     return (
       <div className={cn('flex flex-col gap-3', className)} role="group" aria-label="Schedule builder">
         {!hidden.has('dateRange') && (
           <DateRangeField
             startAt={state.startAt} endAt={state.endAt}
             onStartChange={(v) => emit({ ...state, startAt: v })}
             onEndChange={(v) => emit({ ...state, endAt: v })}
             labels={resolvedLabels}
           />
         )}
         {!hidden.has('daysOfWeek') && (
           <DaysOfWeekField
             value={state.daysOfWeek}
             onChange={(v) => emit({ ...state, daysOfWeek: v })}
             labels={resolvedLabels}
           />
         )}
         {!hidden.has('timeOfDay') && (
           <TimeOfDayField
             start={state.timeOfDayStart} end={state.timeOfDayEnd}
             onStartChange={(v) => emit({ ...state, timeOfDayStart: v })}
             onEndChange={(v) => emit({ ...state, timeOfDayEnd: v })}
             labels={resolvedLabels}
           />
         )}
         {!hidden.has('timezone') && (
           <TimezoneField
             value={state.timezone}
             onChange={(v) => emit({ ...state, timezone: v })}
             labels={resolvedLabels}
           />
         )}
       </div>
     )
   }
   ```

   Critical: `extrasRef` captures `useUserTimezone`, `blackouts`, `recurring`, `metadata` from `defaultValue` once on mount and replays them unchanged on every emit. This is the round-trip guarantee for unowned fields.

4. **Export from `packages/scheduling/src/index.ts`:**
   - `export { ScheduleBuilder } from './components/schedule-builder'`
   - `export type { ScheduleBuilderProps, ScheduleBuilderLabels } from './components/schedule-builder'`
   - `export { serializeSchedule, deserializeSchedule } from './lib/schedule-serialize'`
   - `export type { ScheduleBuilderFormState } from './lib/schedule-serialize'`

5. **Test (`packages/scheduling/__tests__/schedule-builder.round-trip.test.tsx`):**
   - **Property test (100 iterations):** generate a random `Schedule` with random `enabled`, random `startAt`/`endAt` (or undefined), random `daysOfWeek` subset, random `timeOfDay` (or undefined), random `timezone` from `Intl.supportedValuesOf('timeZone')`, random `blackouts: [{id, start, end}]` (to verify extras pass-through). Mount `<ScheduleBuilder defaultValue={input} onChange={onChange} />`; assert the first `onChange` call (forced by simulating a no-op field interaction such as re-selecting the current timezone) emits a `Schedule` deep-equal to `input` (ignoring no fields — the equality is total).
   - **Hidden-fields test:** mount with `hideFields={['timezone', 'timeOfDay']}` and assert the timezone `<select>` and time-of-day inputs are NOT in the document.
   - **Intl support test:** assert `screen.getByRole('combobox', { name: /timezone/i })` contains `'America/New_York'`, `'Europe/London'`, `'UTC'`, and has `>= 300` `<option>` children.
   - **Intl fallback test:** stub `Intl.supportedValuesOf` to `undefined`; remount; assert a free-text `<input>` is rendered instead of `<select>`.

**Sanity check:** `pnpm --filter @tour-kit/scheduling typecheck && pnpm --filter @tour-kit/scheduling test schedule-builder.round-trip` exits `0`.

---

### Task 16.2 — `serverEventAdapter` + dedupe (4–5 h)

**Depends on:** 16.1 only insofar as both ship in the same PR. Otherwise independent.

Sub-steps:

1. **Create `packages/adoption/src/lib/event-dedupe.ts`:**

   ```ts
   export interface EventDedupeState {
     seen: Set<string>
     maxSize: number
   }

   export function createEventDedupe(maxSize: number = 10_000): EventDedupeState {
     return { seen: new Set(), maxSize }
   }

   export function dedupeByEventId<T extends { eventId: string }>(
     events: readonly T[],
     state: EventDedupeState
   ): { fresh: T[]; deduped: number } {
     const fresh: T[] = []
     let deduped = 0
     for (const e of events) {
       if (state.seen.has(e.eventId)) {
         deduped++
         continue
       }
       fresh.push(e)
       state.seen.add(e.eventId)
       // Bounded eviction: Sets preserve insertion order — evict oldest.
       if (state.seen.size > state.maxSize) {
         const first = state.seen.values().next().value
         if (first !== undefined) state.seen.delete(first)
       }
     }
     return { fresh, deduped }
   }
   ```

2. **Create `packages/adoption/src/adapters/server-events.ts`:**

   ```ts
   import { createEventDedupe, dedupeByEventId, type EventDedupeState } from '../lib/event-dedupe'

   export interface ServerAdoptionEvent { /* ...as above */ }
   export interface ServerEventAdapterOptions { /* ...as above */ }
   export interface ServerEventAdapter { /* ...as above */ }

   export function serverEventAdapter(
     options: ServerEventAdapterOptions,
     controls: { trackUsage: (featureId: string) => void }
   ): ServerEventAdapter {
     const fetcher = options.fetcher ?? globalThis.fetch
     const batchSize = options.batchSize ?? 50
     const flushIntervalMs = options.flushIntervalMs ?? 30_000
     const dedupeState: EventDedupeState = createEventDedupe()
     let timer: ReturnType<typeof setInterval> | null = null

     function ingest(events: readonly ServerAdoptionEvent[]): { merged: number; deduped: number } {
       const { fresh, deduped } = dedupeByEventId(events, dedupeState)
       for (const e of fresh) controls.trackUsage(e.featureId)
       return { merged: fresh.length, deduped }
     }

     async function pollOnce(): Promise<void> {
       try {
         const res = await fetcher(options.ingestUrl, {
           method: 'GET',
           headers: { 'content-type': 'application/json' },
         })
         if (!res.ok) return
         const body = (await res.json()) as { events?: ServerAdoptionEvent[] }
         if (Array.isArray(body.events)) ingest(body.events.slice(0, batchSize))
       } catch {
         // network error — skip this tick; next interval will retry
       }
     }

     function startPolling(): () => void {
       if (timer !== null) return stopPolling
       timer = setInterval(() => { void pollOnce() }, flushIntervalMs)
       return stopPolling
     }

     function stopPolling(): void {
       if (timer !== null) {
         clearInterval(timer)
         timer = null
       }
     }

     return { ingest, startPolling, stopPolling }
   }
   ```

3. **Add a `package.json` `exports` entry for `@tour-kit/adoption/server`** so consumers can import the adapter's types from a Next.js `route.ts` (SSR-only path, no React). Add to `packages/adoption/package.json`:

   ```json
   "exports": {
     ".": { ... },
     "./server": { "types": "./dist/server.d.ts", "import": "./dist/server.mjs", "require": "./dist/server.cjs" }
   }
   ```

   Add a tsup config entry to bundle `src/server.ts`, where `src/server.ts` re-exports only the type + plain-function surface that's SSR-safe:

   ```ts
   // packages/adoption/src/server.ts
   export type { ServerAdoptionEvent, ServerEventAdapterOptions, ServerEventAdapter } from './adapters/server-events'
   export { createEventDedupe, dedupeByEventId } from './lib/event-dedupe'
   export type { EventDedupeState } from './lib/event-dedupe'
   ```

   The React-coupled `serverEventAdapter` factory is exported from the main entry only, since it'll typically be wired inside a React effect.

4. **Export from `packages/adoption/src/index.ts`:**
   - `export { serverEventAdapter } from './adapters/server-events'`
   - `export type { ServerAdoptionEvent, ServerEventAdapterOptions, ServerEventAdapter } from './adapters/server-events'`
   - `export { createEventDedupe, dedupeByEventId } from './lib/event-dedupe'`
   - `export type { EventDedupeState } from './lib/event-dedupe'`

5. **Test (`packages/adoption/__tests__/server-events-adapter.idempotency.test.ts`):**
   - **Test 1 — duplicate eventIds are deduped:** create a `trackUsage = vi.fn()`; create the adapter; call `ingest([{eventId:'a',featureId:'f',timestamp:1}, {eventId:'b',featureId:'f',timestamp:2}])`; assert `trackUsage` called twice with `'f'`. Then `ingest([{eventId:'b',featureId:'f',timestamp:3}, {eventId:'c',featureId:'f',timestamp:4}])`; assert `trackUsage` total calls = 3 (only `c` is fresh). Return value of second call: `{ merged: 1, deduped: 1 }`.
   - **Test 2 — different featureIds same eventId still dedupes (eventId is the key, not featureId):** ingest `[{eventId:'x',featureId:'f1',...}]` then `[{eventId:'x',featureId:'f2',...}]`. Assert `trackUsage` called once total — the second is deduped because `eventId` matches.
   - **Test 3 — bounded eviction:** create `createEventDedupe(3)`. `dedupe([a,b,c,d])` — assert all 4 fresh. Re-`dedupe([a])` — assert it's now fresh again (evicted on `d`'s insertion). Re-`dedupe([d])` — assert it's deduped.
   - **Test 4 — composes with client `trackUsage` without double-counting:** in a tiny stub of `useAdoptionContext().trackUsage` (use a counter map), call `trackUsage('f')` once (simulating a client click), then `adapter.ingest([{eventId:'srv-1',featureId:'f',timestamp:1}])`. Assert the feature's `useCount` advanced by 2 — not 1, not 3. (No client/server collision because dedupe is `eventId`-keyed; the client-side path doesn't emit an `eventId`.)
   - **Test 5 — `startPolling` calls fetcher at the configured interval:** create the adapter with `fetcher: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) })` and `flushIntervalMs: 100`. Use `vi.useFakeTimers()`. Call `startPolling()`; advance timers by 350 ms; assert fetcher called ≥3 times. Call cleanup; advance timers by another 500 ms; assert fetcher call count stayed put.

**Sanity check:** `pnpm --filter @tour-kit/adoption typecheck && pnpm --filter @tour-kit/adoption test server-events-adapter.idempotency` exits `0`. `pnpm --filter @tour-kit/adoption build` produces a `dist/server.mjs` + `dist/server.cjs` + `dist/server.d.ts` triplet.

---

### Task 16.3 — Docs + smoke check (1–2 h)

**Depends on:** 16.1, 16.2.

1. **`apps/docs/content/docs/scheduling/builder.mdx` (NEW)** — Fumadocs MDX page with three H2 sections:
   - **"Visual schedule authoring"** — `<ScheduleBuilder>` example with a default `Schedule` and a live preview. Describes the round-trip guarantee.
   - **"Hidden fields"** — show `hideFields={['timezone']}` for consumers who hardcode UTC.
   - **"Importing from an ICS feed"** — `parseIcsFeed('https://...')` → `<ScheduleBuilder defaultValue={...} />` chain (cites Phase 15.2 output shape).
   - Update `apps/docs/content/docs/scheduling/meta.json` to include `builder` between `components` and `presets`.

2. **`apps/docs/content/docs/adoption/server-events.mdx` (NEW)** — Fumadocs MDX page with four H2 sections:
   - **"The payload contract"** — `ServerAdoptionEvent` shape; explicit note that `eventId` is the dedupe key and MUST be backend-generated.
   - **"Wiring `serverEventAdapter` in a React app"** — example mounting the adapter inside a `useEffect` in `RootLayout` with `controls.trackUsage` from `useAdoptionContext`.
   - **"Next.js App Router route handler template"** — paste the verbatim `route.ts` snippet from the Architecture section.
   - **"Polling vs webhook flows"** — when to use `startPolling()` (pull) vs `ingest()` (push, e.g. on a WebSocket message).
   - Update `apps/docs/content/docs/adoption/meta.json` to add `server-events` after `analytics`.

3. **Smoke test that the route handler compiles.** Add `apps/docs/__tests__/route-template-compiles.test.ts` (or `apps/smoke/` — wherever the smoke harness lives — verify which on first read):
   - Reads the MDX file, extracts the fenced ```tsx block tagged with `// route.ts`,
   - Writes the contents to a `os.tmpdir()` path with a `tsconfig.json` extending `apps/docs/tsconfig.json`,
   - Runs `tsc --noEmit` against the temp file,
   - Asserts exit code `0`.

**Sanity check:** `pnpm --filter docs build` exits `0`; both new MDX pages render in their sidebars; the smoke test exits `0`.

---

## Deliverables

```
packages/scheduling/
├── src/
│   ├── lib/
│   │   └── schedule-serialize.ts                          # NEW — deserializeSchedule, serializeSchedule, ScheduleBuilderFormState
│   ├── components/
│   │   ├── schedule-builder.tsx                           # NEW — public <ScheduleBuilder> component
│   │   └── schedule-builder/
│   │       └── fields/
│   │           ├── date-range-field.tsx                   # NEW — startAt/endAt inputs
│   │           ├── days-of-week-field.tsx                 # NEW — 7-button multi-select
│   │           ├── time-of-day-field.tsx                  # NEW — start/end time inputs
│   │           └── timezone-field.tsx                     # NEW — Intl.supportedValuesOf('timeZone') <select> + fallback <input>
│   └── index.ts                                           # UPDATED — re-export ScheduleBuilder + types + serialize helpers
└── __tests__/
    └── schedule-builder.round-trip.test.tsx               # NEW — 100-iter property test + hideFields + Intl support/fallback

packages/adoption/
├── src/
│   ├── adapters/
│   │   └── server-events.ts                               # NEW — serverEventAdapter factory + types
│   ├── lib/
│   │   └── event-dedupe.ts                                # NEW — createEventDedupe + dedupeByEventId (bounded Set)
│   ├── server.ts                                          # NEW — SSR-safe entry; re-exports types + dedupe utils only
│   └── index.ts                                           # UPDATED — re-export adapter + dedupe + types
├── package.json                                           # UPDATED — add ./server exports entry
├── tsup.config.ts                                         # UPDATED — add src/server.ts as a second entrypoint
└── __tests__/
    └── server-events-adapter.idempotency.test.ts          # NEW — 5 cases: dedupe by eventId; bounded eviction; client/server no double-count; polling interval

apps/docs/content/docs/scheduling/
├── builder.mdx                                            # NEW — 3 sections: visual authoring, hidden fields, ICS import chain
└── meta.json                                              # UPDATED — slot "builder" between components and presets

apps/docs/content/docs/adoption/
├── server-events.mdx                                      # NEW — 4 sections: payload contract, wiring, route.ts template, polling vs webhook
└── meta.json                                              # UPDATED — add "server-events" after analytics

apps/docs/__tests__/
└── route-template-compiles.test.ts                        # NEW — extracts route.ts snippet from MDX, runs tsc --noEmit
```

No new package dependencies. No changes to `Schedule` types. No changes to `AdoptionContextValue` types. No changes to existing components outside the explicit UPDATEs.

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/scheduling typecheck` exits `0`
- [ ] `pnpm --filter @tour-kit/adoption typecheck` exits `0`
- [ ] `pnpm --filter @tour-kit/scheduling test` exits `0` with `schedule-builder.round-trip.test.tsx` green and all existing tests still green
- [ ] `pnpm --filter @tour-kit/adoption test` exits `0` with `server-events-adapter.idempotency.test.ts` green and all existing tests still green
- [ ] **ScheduleBuilder — round-trip property test:** 100 randomly-generated `Schedule` values round-trip `defaultValue → ScheduleBuilder → onChange` to a deep-equal `Schedule` (owned fields normalised, unowned `blackouts`/`recurring`/`metadata`/`useUserTimezone` preserved verbatim)
- [ ] **ScheduleBuilder — Intl source:** the timezone `<select>` contains `'America/New_York'`, `'Europe/London'`, `'UTC'`, and `>= 300` `<option>` children — sourced from `Intl.supportedValuesOf('timeZone')` only
- [ ] **ScheduleBuilder — Intl fallback:** when `Intl.supportedValuesOf` is stubbed to `undefined`, a free-text `<input placeholder="America/New_York">` renders in place of the `<select>`
- [ ] **ScheduleBuilder — hideFields:** `<ScheduleBuilder hideFields={['timezone', 'timeOfDay']} />` does not render the timezone or time-of-day controls
- [ ] **Server adapter — idempotency:** ingesting `[a, b]` then `[b, c]` calls `trackUsage` exactly 3 times total; second `ingest` returns `{ merged: 1, deduped: 1 }`
- [ ] **Server adapter — dedupe is `eventId`-keyed:** ingesting two events with the same `eventId` but different `featureId` calls `trackUsage` exactly once
- [ ] **Server adapter — client/server no double-count:** a client `trackUsage('f')` followed by `adapter.ingest([{eventId:'srv-1',featureId:'f',...}])` advances `useCount` by exactly 2
- [ ] **Server adapter — bounded eviction:** `createEventDedupe(3)` evicts the oldest `eventId` once the 4th distinct id arrives; the evicted id is fresh on next ingest
- [ ] **Server adapter — `startPolling`:** with `flushIntervalMs: 100` and fake timers advanced by 350 ms, the fetcher is called `>= 3` times; cleanup stops further calls
- [ ] **`@tour-kit/adoption/server` subpath export:** `pnpm --filter @tour-kit/adoption build` produces `dist/server.mjs`, `dist/server.cjs`, and `dist/server.d.ts`; importing `import type { ServerAdoptionEvent } from '@tour-kit/adoption/server'` from a Next.js `route.ts` typechecks without bundling React
- [ ] **Next.js route handler template compiles:** `apps/docs/__tests__/route-template-compiles.test.ts` extracts the `route.ts` snippet from `apps/docs/content/docs/adoption/server-events.mdx`, writes it to a temp file, runs `tsc --noEmit`, and asserts exit `0`
- [ ] **Docs render:** `apps/docs/content/docs/scheduling/builder.mdx` appears in the scheduling sidebar; `apps/docs/content/docs/adoption/server-events.mdx` appears in the adoption sidebar; `pnpm --filter docs build` exits `0`
- [ ] **Bundle delta:** `@tour-kit/scheduling` and `@tour-kit/adoption` gzipped `dist/index.mjs` grow by `< 4096` bytes each, recorded in PR description (before/after gzipped byte counts)
- [ ] **Backwards compat:** existing consumers of `useSchedule`, `<ScheduleGate>`, and `useAdoptionContext` see byte-identical behaviour — no existing tests modified or regenerated

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 16 of Tour Kit v2 Package Polish — **ScheduleBuilder + Adoption Server Adapter**. All work is additive; existing consumers see byte-identical behaviour unless they opt in to the new APIs.

### What This Project Is
Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless onboarding/product-tour primitives. Strict TypeScript, ES2020 target, tsup for bundling, vitest for unit tests. This phase touches two packages: `@tour-kit/scheduling` (time-based scheduling for tours and announcements) and `@tour-kit/adoption` (feature adoption tracking + nudges). Both are styled-on-top-of-headless: thin components compose `@tour-kit/core` hooks.

### Established in Prior Phases (relevant to Phase 16)

- **Phase 15.2 (complete) shipped `parseIcsFeed(url | string)`** in `packages/scheduling/src/adapters/ics.ts`. The function returns a `Schedule` (the same interface defined at `packages/scheduling/src/types/schedule.ts:87–115`) populated with `blackouts[]` and optionally `daysOfWeek` / `timeOfDay`. `<ScheduleBuilder>` accepts this `Schedule` value verbatim as its `defaultValue` prop. **Crucial:** the parser-emitted `blackouts[]` must round-trip unchanged through the builder — they are an "unowned" field stored on `extrasRef`.

- **The `Schedule` type — pasted verbatim from `packages/scheduling/src/types/schedule.ts`:**

```ts
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type TimeString = `${string}:${string}`
export type DateString = `${string}-${string}-${string}`

export interface TimeRange { start: TimeString; end: TimeString }
export interface DateRange { start?: DateString; end?: DateString }

export interface BlackoutPeriod {
  id: string
  start: DateString | Date
  end: DateString | Date
  reason?: string
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number
  daysOfWeek?: DayOfWeek[]
  dayOfMonth?: number
  month?: number
  maxOccurrences?: number
  endDate?: DateString
}

export interface Schedule {
  enabled?: boolean
  startAt?: DateString | Date
  endAt?: DateString | Date
  daysOfWeek?: DayOfWeek[]
  timeOfDay?: TimeRange
  useUserTimezone?: boolean
  timezone?: string
  blackouts?: BlackoutPeriod[]
  recurring?: RecurringPattern
  metadata?: Record<string, unknown>
}
```

`<ScheduleBuilder>` owns `{enabled, startAt, endAt, daysOfWeek, timeOfDay, timezone}`. Everything else (`useUserTimezone`, `blackouts`, `recurring`, `metadata`) is preserved verbatim via the `extrasRef` mechanism described below.

- **`@tour-kit/adoption` `trackUsage` seam.** `packages/adoption/src/context/adoption-context.ts` exports `AdoptionContextValue.trackUsage: (featureId: string) => void`. This is the **only** mutation API the server adapter calls into — keeping it the same path the client uses ensures the existing nudge scheduler, analytics emission, and storage persistence flows all fire as expected. The provider implements `trackUsage` at `packages/adoption/src/context/adoption-provider.tsx:128–162`.

- **The `Feature` and `FeatureUsage` types — pasted from `packages/adoption/src/types/feature.ts`:**

```ts
export interface Feature {
  id: string
  name: string
  trigger: FeatureTrigger
  adoptionCriteria?: AdoptionCriteria
  resources?: FeatureResources
  priority?: number
  category?: string
  description?: string
  premium?: boolean
}

export interface FeatureUsage {
  featureId: string
  firstUsed: string | null
  lastUsed: string | null
  useCount: number
  status: AdoptionStatus
}
```

`ServerAdoptionEvent.featureId` MUST match a registered `Feature.id`; if it doesn't, `trackUsage` no-ops (verified in the adoption provider). Do not validate this in the adapter — the provider already handles unknown feature IDs.

- **Existing AdoptionProvider mutation path:** when the adapter calls `controls.trackUsage(featureId)`, the provider's internal callback runs the existing emit→reduce→persist pipeline (analytics emission, storage save, nudge scheduling). The adapter must NOT bypass this — call `controls.trackUsage` for every fresh event, even if it means N function calls.

### Your Goal for This Phase

1. **Ship `<ScheduleBuilder>`** — a form-driven editor that round-trips `Schedule` values losslessly. Fields: `startAt`/`endAt` (date), `daysOfWeek` (7-button multi-select), `timeOfDay` (time start/end), `timezone` (`<select>` sourced from `Intl.supportedValuesOf('timeZone')`). Unowned `Schedule` fields (`blackouts`, `recurring`, `metadata`, `useUserTimezone`) are stashed in a ref and replayed verbatim on every emit.

2. **Ship `serverEventAdapter`** — a headless adapter that accepts `ServerAdoptionEvent[]` batches (either via direct `ingest()` or a `startPolling()` loop against a consumer-owned URL), dedupes by `eventId` against a bounded local `Set`, and calls `controls.trackUsage(featureId)` for every fresh event.

3. **Ship a Next.js App Router `route.ts` template** in the docs that compiles via a smoke test.

### Data Model Rules (follow exactly)

- **`interface` (exported, public):** `ScheduleBuilderProps`, `ScheduleBuilderLabels` (in `schedule-builder.tsx`); `ScheduleBuilderFormState` (in `lib/schedule-serialize.ts`); `ServerAdoptionEvent`, `ServerEventAdapterOptions`, `ServerEventAdapter` (in `adapters/server-events.ts`); `EventDedupeState` (in `lib/event-dedupe.ts`).
- **No new `type` aliases.** `Schedule`, `DateString`, `DayOfWeek`, `TimeRange`, `Feature`, `FeatureUsage` are unchanged.
- **`extrasRef` (internal to `<ScheduleBuilder>`):** `React.useRef<Pick<Schedule, 'useUserTimezone' | 'blackouts' | 'recurring' | 'metadata'>>` — captured once from `defaultValue` on mount; replayed verbatim on every `onChange` via `serializeSchedule(state, extrasRef.current)`.
- **Adapter dedupe state:** a per-`serverEventAdapter`-instance `EventDedupeState = { seen: Set<string>, maxSize: number }`. Bounded eviction on insertion-order overflow.
- **No `useReducer` in the form.** Five owned fields × `React.useState` is the right granularity.
- **No `react-hook-form`.** It is not a dep; do not add it.
- **No new package dependencies anywhere.** Scheduling is `react` + `@tour-kit/core`. Adoption is `react` + `@tour-kit/core` + `fetch`.
- **`Intl.supportedValuesOf('timeZone')` is the ONLY timezone source.** Fall back to a free-text `<input>` on environments where the API is missing (older Safari). NO hardcoded TZ list.
- **Dedupe is by `eventId`, period.** Not by `(featureId, timestamp)`. Backends often emit duplicate `(featureId, timestamp)` legitimately within the same millisecond.

### Public APIs (the contracts that lock this phase)

```ts
// packages/scheduling/src/components/schedule-builder.tsx
export interface ScheduleBuilderLabels {
  startAt: string
  endAt: string
  daysOfWeek: string
  timeOfDay: string
  timeOfDayStart: string
  timeOfDayEnd: string
  timezone: string
  enabled: string
  dayNames: readonly [string, string, string, string, string, string, string]
}

export interface ScheduleBuilderProps {
  defaultValue?: Schedule
  onChange?(schedule: Schedule): void
  className?: string
  hideFields?: ReadonlyArray<'dateRange' | 'daysOfWeek' | 'timeOfDay' | 'timezone'>
  labels?: Partial<ScheduleBuilderLabels>
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps>
```

```ts
// packages/scheduling/src/lib/schedule-serialize.ts
export interface ScheduleBuilderFormState {
  enabled: boolean
  startAt: DateString | ''
  endAt: DateString | ''
  daysOfWeek: DayOfWeek[]
  timeOfDayStart: string  // HH:MM or ''
  timeOfDayEnd: string    // HH:MM or ''
  timezone: string        // IANA name or ''
}

export function deserializeSchedule(schedule: Schedule | undefined): {
  state: ScheduleBuilderFormState
  extras: Pick<Schedule, 'useUserTimezone' | 'blackouts' | 'recurring' | 'metadata'>
}

export function serializeSchedule(
  state: ScheduleBuilderFormState,
  extras: Pick<Schedule, 'useUserTimezone' | 'blackouts' | 'recurring' | 'metadata'>
): Schedule
```

```ts
// packages/adoption/src/adapters/server-events.ts
export interface ServerAdoptionEvent {
  eventId: string
  userId?: string
  featureId: string
  timestamp: number
}

export interface ServerEventAdapterOptions {
  ingestUrl: string
  batchSize?: number       // default 50
  flushIntervalMs?: number // default 30_000
  fetcher?: typeof fetch   // default globalThis.fetch
}

export interface ServerEventAdapter {
  ingest(events: readonly ServerAdoptionEvent[]): { merged: number; deduped: number }
  startPolling(): () => void
  stopPolling(): void
}

export function serverEventAdapter(
  options: ServerEventAdapterOptions,
  controls: { trackUsage: (featureId: string) => void }
): ServerEventAdapter
```

```ts
// packages/adoption/src/lib/event-dedupe.ts
export interface EventDedupeState {
  seen: Set<string>
  maxSize: number
}

export function createEventDedupe(maxSize?: number): EventDedupeState  // default 10_000

export function dedupeByEventId<T extends { eventId: string }>(
  events: readonly T[],
  state: EventDedupeState
): { fresh: T[]; deduped: number }
```

### Round-trip serializer rules (paste-ready)

- `deserializeSchedule`:
  - `startAt`/`endAt`: if `Date`, slice `toISOString()` to `0..10`; if string, pass through; if undefined, `''`.
  - `daysOfWeek`: pass through (`[]` if undefined).
  - `timeOfDay`: split into `timeOfDayStart` and `timeOfDayEnd`; `''` for missing.
  - `timezone`: pass through (`''` if undefined).
  - `enabled`: default `true` if undefined (matches `useSchedule` semantics).
  - `extras`: object literal `{useUserTimezone, blackouts, recurring, metadata}` from the input.
- `serializeSchedule`:
  - Omits any owned field that's `''`, `[]` (for `daysOfWeek`), or both `timeOfDayStart`/`timeOfDayEnd` empty (entire `timeOfDay` omitted).
  - Spreads `extras` first, then owned fields — so unowned fields are present unchanged and owned fields take precedence on collision.
  - `enabled`: included as-is (always defined in form state).
  - DOES NOT sort, DOES NOT trim, DOES NOT cast `Date` — only the inverse-of-deserialize transform.

### Next.js App Router route handler template (verbatim — paste into docs)

```ts
// app/api/adoption/events/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import type { ServerAdoptionEvent } from '@tour-kit/adoption/server'

function parseBatch(raw: unknown): ServerAdoptionEvent[] | null {
  if (!Array.isArray(raw)) return null
  const out: ServerAdoptionEvent[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null
    const e = item as Record<string, unknown>
    if (typeof e.eventId !== 'string' || e.eventId.length === 0) return null
    if (typeof e.featureId !== 'string' || e.featureId.length === 0) return null
    if (typeof e.timestamp !== 'number' || !Number.isFinite(e.timestamp)) return null
    if (e.userId !== undefined && typeof e.userId !== 'string') return null
    out.push({
      eventId: e.eventId,
      featureId: e.featureId,
      timestamp: e.timestamp,
      userId: e.userId as string | undefined,
    })
  }
  return out
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const events = parseBatch(body)
  if (events === null) return NextResponse.json({ error: 'Invalid batch shape' }, { status: 400 })
  return NextResponse.json({ accepted: events.length, events }, { status: 202 })
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ events: [] satisfies ServerAdoptionEvent[] }, { status: 200 })
}
```

Cite `apps/docs/app/api/webhooks/polar/route.ts` as the in-repo precedent for App Router `route.ts` shape.

### Files to Create / Update

#### `packages/scheduling/src/lib/schedule-serialize.ts` (NEW)
Pure module, no React. Export `deserializeSchedule`, `serializeSchedule`, `ScheduleBuilderFormState` per the contract above. Implement the round-trip rules exactly.

#### `packages/scheduling/src/components/schedule-builder.tsx` (NEW)
Orchestrator FC. Use `'use client'`. Capture `extras` in a ref on mount. Five field components composed in declarative order. Five `React.useState` calls — one per owned field — backed by `setState` then `onChange?.(serializeSchedule(...))` on every change.

#### `packages/scheduling/src/components/schedule-builder/fields/*.tsx` (NEW × 4)
Each field is `'use client'`, purely presentational, accepts `{value, onChange, labels}`. The `timezone-field.tsx` MUST guard `typeof Intl.supportedValuesOf === 'function'` and fall back to a free-text `<input placeholder="America/New_York">`.

Days-of-week field: seven `<button type="button" role="checkbox" aria-checked={value.includes(day)}>` toggles. Label them via `labels.dayNames[i]`. Single-click toggles inclusion of `i as DayOfWeek` in the array. Preserve insertion order — do NOT sort.

#### `packages/scheduling/src/index.ts` (UPDATED)
Add the four exports listed in Task 16.1 step 4.

#### `packages/adoption/src/lib/event-dedupe.ts` (NEW)
Pure module, no React. Export `createEventDedupe`, `dedupeByEventId`, `EventDedupeState`. Implement bounded eviction by deleting the first inserted id when `seen.size > maxSize`. Sets in JS preserve insertion order — `seen.values().next().value` is the oldest.

#### `packages/adoption/src/adapters/server-events.ts` (NEW)
Pure module, no React. Export the factory + types per the contract. `pollOnce` is a `GET` against `options.ingestUrl` expecting `{ events: ServerAdoptionEvent[] }`. Network errors are swallowed silently (next interval retries). `startPolling` is idempotent — re-calling without `stopPolling` returns the same cleanup fn.

#### `packages/adoption/src/server.ts` (NEW)
Re-export only SSR-safe surface for `@tour-kit/adoption/server`: the four types from `adapters/server-events.ts` plus `createEventDedupe`/`dedupeByEventId`/`EventDedupeState` from `lib/event-dedupe.ts`. NO React imports. NO factory functions that touch React.

#### `packages/adoption/package.json` (UPDATED)
Add the `./server` exports entry. Mirror the existing main entry's `types`/`import`/`require` triplet structure.

#### `packages/adoption/tsup.config.ts` (UPDATED)
Add `src/server.ts` as a second entrypoint so `dist/server.{mjs,cjs,d.ts}` are produced.

#### `packages/adoption/src/index.ts` (UPDATED)
Add the four exports listed in Task 16.2 step 4.

#### `packages/scheduling/__tests__/schedule-builder.round-trip.test.tsx` (NEW)
Vitest + RTL + `@testing-library/user-event`. Four cases:
1. **100-iter round-trip property test.** Use a simple deterministic seeded RNG (or `vi.spyOn(Math, 'random')`) — no `fast-check` dep. Generate `Schedule` values with random presence of each owned field plus random `blackouts: [{id, start: DateString, end: DateString}]` and random `metadata: { foo: number }`. Mount `<ScheduleBuilder defaultValue={input} onChange={onChange} />`. Force a no-op interaction (e.g. click then click the same already-selected day button to toggle off and back on, or fire the timezone select's onChange with its current value). Read the LAST `onChange` arg, assert deep-equal to `input` (`expect(out).toEqual(input)`).
2. **`hideFields` removes UI.** Assert the timezone combobox and time-of-day inputs are absent.
3. **`Intl.supportedValuesOf` is the timezone source.** Assert the `<select>` contains `'America/New_York'`, `'Europe/London'`, `'UTC'` options AND has `>= 300` `<option>` children.
4. **Intl fallback.** Stub `Intl.supportedValuesOf` to `undefined` via `vi.spyOn`; remount; assert a free-text `<input placeholder="America/New_York">` is rendered (no `<select>`).

#### `packages/adoption/__tests__/server-events-adapter.idempotency.test.ts` (NEW)
Vitest only (no RTL). Five cases:
1. **Duplicate eventIds deduped across batches.** See exit criteria.
2. **eventId is the dedupe key.** Two events with same `eventId`, different `featureId` → one `trackUsage` call.
3. **Bounded eviction.** `createEventDedupe(3)` evicts oldest on overflow.
4. **Client/server no double-count.** Counter stub for `trackUsage`; client call + server ingest of distinct `eventId` → `useCount` advances by 2.
5. **`startPolling` interval.** `vi.useFakeTimers()`; advance 350 ms with `flushIntervalMs: 100`; assert fetcher called `>= 3` times; cleanup; advance 500 ms; assert no further calls.

#### `apps/docs/content/docs/scheduling/builder.mdx` (NEW)
Frontmatter `title: ScheduleBuilder` + `description: Visual editor for schedule windows — outputs the same JSON shape the rest of the package consumes.`. Three H2 sections per Task 16.3.

#### `apps/docs/content/docs/scheduling/meta.json` (UPDATED)
Slot `"builder"` between `"components"` and `"presets"`.

#### `apps/docs/content/docs/adoption/server-events.mdx` (NEW)
Frontmatter `title: Server event adapter` + `description: Ingest adoption events from a backend without double-counting client events.`. Four H2 sections per Task 16.3. The `route.ts` snippet MUST be the verbatim template above, fenced as ```tsx with a leading `// app/api/adoption/events/route.ts` comment.

#### `apps/docs/content/docs/adoption/meta.json` (UPDATED)
Add `"server-events"` after `"analytics"`.

#### `apps/docs/__tests__/route-template-compiles.test.ts` (NEW)
Reads the MDX, extracts the `tsx` fence whose first line is `// app/api/adoption/events/route.ts`, writes it to `os.tmpdir()/route.ts`, writes a minimal `tsconfig.json` extending `apps/docs/tsconfig.json` and including only that one file, runs `npx --no-install tsc --noEmit -p <tmp>/tsconfig.json` via `node:child_process.execSync`, asserts exit `0`. Test is skipped on Windows CI (path quirks) — `it.skipIf(process.platform === 'win32')`.

### Success Criteria
- `pnpm --filter @tour-kit/scheduling typecheck` exits 0
- `pnpm --filter @tour-kit/adoption typecheck` exits 0
- `pnpm --filter @tour-kit/scheduling test` exits 0 with `schedule-builder.round-trip.test.tsx` green
- `pnpm --filter @tour-kit/adoption test` exits 0 with `server-events-adapter.idempotency.test.ts` green
- 100-iter round-trip property test passes
- Server adapter dedupes by `eventId` and does not double-count client events
- `Intl.supportedValuesOf('timeZone')` populates the timezone `<select>` with `>= 300` options
- `@tour-kit/adoption/server` subpath export ships `dist/server.{mjs,cjs,d.ts}`
- Route handler smoke test passes (`tsc --noEmit` on the extracted snippet exits 0)
- Both new MDX pages render in their sidebars; `pnpm --filter docs build` exits 0
- Bundle delta `< 4 KB` gzipped per package, recorded in PR description
- Standalone `<ScheduleGate>`, `useSchedule`, `useAdoptionContext` consumers see byte-identical output — existing tests stay green without snapshot regeneration

### Expected File Structure at End

```
packages/scheduling/
├── src/
│   ├── lib/schedule-serialize.ts                          # NEW
│   ├── components/
│   │   ├── schedule-builder.tsx                           # NEW
│   │   └── schedule-builder/fields/
│   │       ├── date-range-field.tsx                       # NEW
│   │       ├── days-of-week-field.tsx                     # NEW
│   │       ├── time-of-day-field.tsx                      # NEW
│   │       └── timezone-field.tsx                         # NEW
│   └── index.ts                                           # UPDATED
└── __tests__/schedule-builder.round-trip.test.tsx         # NEW

packages/adoption/
├── src/
│   ├── adapters/server-events.ts                          # NEW
│   ├── lib/event-dedupe.ts                                # NEW
│   ├── server.ts                                          # NEW
│   └── index.ts                                           # UPDATED
├── package.json                                           # UPDATED
├── tsup.config.ts                                         # UPDATED
└── __tests__/server-events-adapter.idempotency.test.ts    # NEW

apps/docs/content/docs/scheduling/
├── builder.mdx                                            # NEW
└── meta.json                                              # UPDATED

apps/docs/content/docs/adoption/
├── server-events.mdx                                      # NEW
└── meta.json                                              # UPDATED

apps/docs/__tests__/route-template-compiles.test.ts        # NEW
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 15.2's `parseIcsFeed` return shape is the existing `Schedule` interface, which is pasted verbatim in the Execution Prompt from `packages/scheduling/src/types/schedule.ts`. The adoption `trackUsage` seam is cited with file path + line range (`packages/adoption/src/context/adoption-context.ts` for the interface, `adoption-provider.tsx:128–162` for the implementation), and `AdoptionContextValue` is the read seam for wiring the adapter into a React effect.
- [FAIL] Phase 15 plan file (`tasks/v2-package-polish/phase-15.md`) does NOT exist in the repo at the time of this writing — only `phase-0.md` through `phase-12.md` are committed. The `Schedule` JSON shape and `parseIcsFeed` return contract are read directly from `packages/scheduling/src/types/schedule.ts` and the Phase 15 big-plan entry (`big-plan.md` lines 392–408). The Execution Prompt is therefore complete without depending on a Phase 15 plan file existing on disk; however, the **Depends on:** line names Phase 15.2 as an upstream task that must ship first. If Phase 15 is delivered in a different order or its 15.2 output shape diverges from the bare `Schedule` interface, the round-trip test will need to be updated. Calling this out explicitly so the implementer doesn't get blocked waiting for a non-existent file.
- [PASS] Every sub-task has a clear, testable completion condition — each of 16.1–16.3 ends with a "Sanity check" specifying the exact shell command or RTL/Vitest assertion that proves it.
- [PASS] Execution prompt is self-contained — the `Schedule` interface is pasted verbatim, the `Feature`/`FeatureUsage` interfaces are pasted, the full `route.ts` template is pasted, all four public APIs are pasted with their signatures, and per-file implementation guidance covers exports, props, and the no-new-dep constraint. No "see Phase X" references inside the prompt other than the historical context note.
- [PASS] Exit criteria map 1:1 to deliverables — eighteen exit checkboxes covering typecheck (×2 packages), tests (×2 new files), ScheduleBuilder round-trip + Intl source + Intl fallback + hideFields, adapter idempotency + eventId-keying + client/server no-double-count + bounded eviction + polling interval, subpath export proof, route-handler compile smoke, docs render, bundle delta, and a byte-identity backwards-compat check. Each new/updated file is covered by at least one exit check.
- [PASS] Heavy external deps have a fake/stub strategy noted — no new deps. `fetch` is mocked via `options.fetcher` injection on the adapter (the test passes `vi.fn().mockResolvedValue(...)`). `Intl.supportedValuesOf` is stubbed via `vi.spyOn(Intl, 'supportedValuesOf')`. `Element.prototype.scrollIntoView` is not relevant this phase. The route-template smoke test uses `child_process.execSync` to run the locally-installed `tsc`; no network call.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. `Intl.supportedValuesOf('timeZone')` is native ES2022 (standard, no doc fetch needed). Next.js App Router `route.ts` shape is verified against the in-repo precedent `apps/docs/app/api/webhooks/polar/route.ts` and pasted verbatim in the prompt. React hooks (`useState`, `useRef`, `useMemo`, `useCallback`) are standard React 18+.
