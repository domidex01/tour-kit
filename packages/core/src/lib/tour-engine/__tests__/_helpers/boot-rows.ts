/**
 * v2 §1.3c — the boot-precedence truth table, defined once.
 *
 * Two files consume it: `boot.test.ts` runs the rows through the pure
 * `resolveBootStart`, and `boot.parity.test.tsx` runs the same rows through a
 * mounted `<TourProvider>`. If the two tables were typed separately they would
 * drift, and a drifted pair proves nothing.
 *
 * (The phase test plan puts the table in `boot.test.ts` and imports it from the
 * parity file. Importing a test module re-registers its `describe` blocks in
 * the importer, so the table lives here instead — same single source, no
 * duplicated suites.)
 */
import type { FlowSessionV2 } from '../../../flow-session'
import type { Tour } from '../../../../types/tour'
import type { PersistedRouteState } from '../../adapters/route-store'
import type { BootSource } from '../../boot'
import { makeTour, visibleStep } from './make-tour'

export type FlowKind = 'none' | 'fresh' | 'stale' | 'unknown'
export type AutoKind = 'none' | 'present' | 'completed'
export type BootExpectation = { tourId: string; source: BootSource } | null

export type BootRow = readonly [
  n: number,
  flow: FlowKind,
  route: boolean,
  auto: AutoKind,
  expected: BootExpectation,
  extra?: { tours: readonly [] },
]

/**
 * Rows 1–8 are the eight present/absent combinations of
 * `{ flowSession, routeState, autoStart }`. Rows 9–13 are the edges, each
 * pinning a rule that exists in the provider today.
 */
export const BOOT_ROWS: readonly BootRow[] = [
  [1, 'none', false, 'none', null],
  [2, 'none', false, 'present', { tourId: 'auto', source: 'auto' }],
  [3, 'none', true, 'none', { tourId: 'r', source: 'route' }],
  [4, 'none', true, 'present', { tourId: 'r', source: 'route' }],
  [5, 'fresh', false, 'none', { tourId: 'f', source: 'flow' }],
  [6, 'fresh', false, 'present', { tourId: 'f', source: 'flow' }],
  [7, 'fresh', true, 'none', { tourId: 'f', source: 'flow' }],
  [8, 'fresh', true, 'present', { tourId: 'f', source: 'flow' }],
  // A stale flow session does not win — it falls through to the next rule.
  [9, 'stale', true, 'none', { tourId: 'r', source: 'route' }],
  [10, 'stale', false, 'present', { tourId: 'auto', source: 'auto' }],
  // Autostart is skipped for a tour the user already completed.
  [11, 'none', false, 'completed', null],
  // A caller rule, not a resolver rule: with no tours registered yet the
  // provider returns *before* latching (`tour-provider.tsx:530`) so the next
  // `tours` change retries. The resolver itself just says null.
  [12, 'fresh', true, 'present', null, { tours: [] }],
  // Current behaviour, and arguably a bug: a fresh session naming a tour that
  // is not registered sets the latch (532–533), and the flow-wins guards at
  // 624 and 644 then suppress route restore AND autostart. Pinned as-is —
  // §1.3 is a refactor; recorded for the §1.4 author.
  [13, 'unknown', true, 'present', null],
]

export const FLOW_TOUR = makeTour('f', [visibleStep('f1'), visibleStep('f2')])
export const ROUTE_TOUR = makeTour('r', [visibleStep('r1')])
export const AUTO_TOUR = makeTour('auto', [visibleStep('a1')], { autoStart: true })

/** The `tours` array the provider would hold for a given row. */
export function toursForRow(auto: AutoKind, extra?: { tours: readonly [] }): Tour[] {
  if (extra) return []
  const base = [FLOW_TOUR, ROUTE_TOUR]
  return auto === 'none' ? base : [...base, AUTO_TOUR]
}

export function flowForRow(kind: FlowKind): FlowSessionV2 | null {
  if (kind === 'none') return null
  const now = Date.now()
  const startedAt = kind === 'stale' ? now - 2 * 60 * 60 * 1000 : now
  return {
    schemaVersion: 2,
    tourId: kind === 'unknown' ? 'ghost' : 'f',
    stepIndex: 1,
    startedAt,
    lastUpdatedAt: startedAt,
  }
}

export function routeForRow(present: boolean): PersistedRouteState | null {
  if (!present) return null
  return { tourId: 'r', stepIndex: 0, completedTours: [], skippedTours: [], timestamp: Date.now() }
}
