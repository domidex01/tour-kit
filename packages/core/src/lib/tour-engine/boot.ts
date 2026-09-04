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
import { isVisibleStep } from '../../types/step'
import type { Tour } from '../../types/tour'
import type { FlowSessionV2 } from '../flow-session'
import { waitForStepTarget } from '../wait-for-step-target'
import type { PersistedRouteState } from './adapters/route-store'
import type { TourEngineContext } from './context'
import { findAutoStartTour } from './reducer'

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
export function resolveBootStart(input: ResolveBootStartInput): BootDecision | null {
  const { flowSession, flowIsStale, routeState, tours, completedTours } = input

  // No tours registered yet. The declarative `<Tour>` path mounts children
  // after the parent's first effect tick, so this is "not yet", not "never".
  if (tours.length === 0) return null

  // 1. Flow session — tour-scoped, so it beats the route state's multi-tour
  //    scope. A stale blob does not win; it falls through.
  if (flowSession && !flowIsStale) {
    const restoredTour = tours.find((t) => t.id === flowSession.tourId)
    if (restoredTour) {
      return { tourId: flowSession.tourId, stepIndex: flowSession.stepIndex, source: 'flow' }
    }
    // A fresh session naming a tour that is NOT registered blocks everything:
    // the provider sets its latch and bails (tour-provider.tsx:532-533), and
    // the flow-wins guards at :624 and :644 then suppress route restore and
    // autostart too. Pinned as current behaviour by row 13 of the truth table
    // and flagged as a §1.4 candidate — a refactor does not change it.
    return null
  }

  // 2. Route state — only when it names a tour we actually know about.
  if (routeState?.tourId && tours.some((t) => t.id === routeState.tourId)) {
    return { tourId: routeState.tourId, stepIndex: routeState.stepIndex, source: 'route' }
  }

  // 3. Autostart — the first `autoStart` tour the user has not completed.
  const auto = findAutoStartTour(tours, completedTours)
  if (auto) {
    return { tourId: auto.id, stepIndex: auto.startAt ?? 0, source: 'auto' }
  }

  return null
}

export interface RunBootStartOptions {
  /** The route recorded in the restored blob, if any. */
  currentRoute?: string
  signal?: AbortSignal
  /** Called when the restore fails irrecoverably, so a broken blob cannot loop. */
  onClear: () => void
}

/**
 * `flow-restore` timer — visible in DevTools and to Playwright's console
 * listener, which reads it for the <200 ms hard-refresh resume budget. It has
 * to fire on BOTH the sync same-route path and the async navigate-then-wait
 * one, or the metric misses the common case.
 */
function createRestoreTimer(source: BootSource) {
  // Only the flow-session path is a "resume": route restore and autostart are
  // cold starts and would pollute the metric (and warn on a duplicate label).
  if (source !== 'flow') return () => {}

  let ended = false
  if (typeof console !== 'undefined' && typeof console.time === 'function') {
    console.time('flow-restore')
  }
  return () => {
    if (ended) return
    ended = true
    if (typeof console !== 'undefined' && typeof console.timeEnd === 'function') {
      console.timeEnd('flow-restore')
    }
  }
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
  ctx: TourEngineContext,
  decision: BootDecision,
  opts: RunBootStartOptions
): Promise<void> {
  const { currentRoute, signal, onClear } = opts
  const { router } = ctx

  const endTimer = createRestoreTimer(decision.source)
  const dispatchStart = () => {
    ctx.dispatch({ type: 'START_TOUR', tourId: decision.tourId, stepIndex: decision.stepIndex })
  }

  const needsRouteRestore = !!currentRoute && !!router && currentRoute !== router.getCurrentRoute()

  if (!needsRouteRestore) {
    dispatchStart()
    endTimer()
    return
  }

  // Narrowing: `needsRouteRestore` proved both of these.
  const route = currentRoute as string
  const nav = router as NonNullable<typeof router>

  const targetStep = ctx.getState().tours.get(decision.tourId)?.steps[decision.stepIndex]

  try {
    await nav.navigate(route)
    if (signal?.aborted) return endTimer()

    // Hidden steps have no selector to observe; waiting would just burn the
    // timeout.
    if (targetStep && isVisibleStep(targetStep)) {
      await waitForStepTarget(targetStep, { route, timeoutMs: targetStep.waitTimeout ?? 3000 })
      if (signal?.aborted) return endTimer()
    }

    dispatchStart()
    endTimer()
  } catch {
    endTimer()
    if (signal?.aborted) return
    // Stale session (route 404, target missing). Clear so the next mount does
    // not loop on the same broken state.
    onClear()
  }
}
