/**
 * v2 §1.3c — boot precedence as one ordered resolver.
 *
 * Today the restore order (flow session > route state > autostart) is implicit
 * in React's effect order plus three ref latches plus a `flow.ready` gate,
 * spread across `tour-provider.tsx:524`, `:620` and `:642`. Each effect
 * re-derives whether the earlier one already fired.
 *
 * Here it is a list, in one place, testable as a truth table. `resolveBootStart`
 * is the whole precedence rule and is pure: no storage, no router, no clock
 * beyond what the caller already read. `runBootStart` is the async half — the
 * cross-page case that navigates, waits for the target and dispatches.
 */
import type { Tour } from '../../types/tour'
import type { PersistedRouteState } from './adapters/route-store'
import type { TourEngineContext } from './context'
import type { FlowSessionV2 } from '../flow-session'

export type BootSource = 'flow' | 'route' | 'auto'

export interface BootDecision {
  tourId: string
  stepIndex: number
  source: BootSource
}

export interface ResolveBootStartInput {
  flowSession: FlowSessionV2 | null
  flowIsStale: boolean
  routeState: PersistedRouteState | null
  tours: Tour[]
  completedTours: string[]
}

/**
 * The precedence rule, and nothing else.
 *
 * Returns `null` when no restore applies — including for an empty `tours`
 * list. Whether an empty list means "give up" or "wait and retry when the
 * declarative `<Tour>` children mount" is a *caller* decision (the provider
 * returns before latching at `tour-provider.tsx:530`), so it is not encoded
 * here.
 */
export function resolveBootStart(_input: ResolveBootStartInput): BootDecision | null {
  throw new Error('resolveBootStart: not implemented (v2 §1.3c)')
}

export interface RunBootStartOptions {
  /** The router's current route, read once by the caller. */
  currentRoute?: string
  signal?: AbortSignal
  /** Called when the restore fails irrecoverably, so a broken blob cannot loop. */
  onClear: () => void
}

/**
 * The async half of boot: cross-page restore.
 *
 * Same route (or no route recorded) → dispatch `START_TOUR` synchronously.
 * Different route → navigate, await the target, then dispatch. On any throw,
 * `onClear()` so the next mount does not loop on the same broken state.
 * Aborted mid-flight → neither dispatch nor clear.
 */
export async function runBootStart(
  _ctx: TourEngineContext,
  _decision: BootDecision,
  _opts: RunBootStartOptions
): Promise<void> {
  throw new Error('runBootStart: not implemented (v2 §1.3c)')
}
