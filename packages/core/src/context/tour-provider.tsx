import * as React from 'react'
import { useAdvanceOn } from '../hooks/use-advance-on'
import { explainTour } from '../lib/diagnostic'
import { attachTestBridge } from '../lib/test-bridge'
import {
  type BindingOptions,
  engineOptionsFrom,
  liveOptionsFrom,
} from '../lib/tour-engine/binding-options'
import type { TourEngineAnalytics } from '../lib/tour-engine/context'
import { createTourEngine } from '../lib/tour-engine/create-tour-engine'
import {
  type EngineHandle,
  createEngineHandle,
  pickActions,
} from '../lib/tour-engine/engine-handle'
import { validateTour } from '../lib/validate-tour'
import type { TourRouteError } from '../lib/wait-for-step-target'
import type { Tour, TourContextValue } from '../types'
import type { DiagnosticContext, DiagnosticGate, EligibilityReport } from '../types/diagnostic'
import type { MultiPagePersistenceConfig, RouterAdapter } from '../types/router'
import { logger } from '../utils/logger'
import { TourContext } from './tour-context'
import { TourKitContext } from './tourkit-context'

export interface TourProviderProps {
  children: React.ReactNode
  tours?: Tour[]
  /** Router adapter for multi-page tours */
  router?: RouterAdapter
  /** Persistence config for multi-page tours */
  routePersistence?: MultiPagePersistenceConfig
  /** Auto-navigate when step requires different route (default: true) */
  autoNavigate?: boolean
  /** Callback when navigation is needed but autoNavigate is false */
  onNavigationRequired?: (route: string, stepId: string) => void
  /**
   * Called when the active tour is paused by an external signal.
   * Currently the only `reason` is `'cross-tab'` (another tab posted
   * `tour:active` on the cross-tab `BroadcastChannel`).
   */
  onTourPaused?: (tourId: string, reason: 'cross-tab') => void
  /**
   * Called when a cross-page step fails — typically when the step's target
   * does not appear on the new route within `routeChangeStrategy: 'auto'`'s
   * 3000ms wait. The provider stops the tour after this fires.
   *
   * Aborts triggered by `STOP_TOUR` or unmount do NOT call this — those are
   * cooperative cancellation, not failures.
   */
  onStepError?: (err: TourRouteError) => void
  /**
   * Diagnostic mode — when `true`, the provider runs `explainTour` for every
   * registered tour and exposes the result via `useTourDiagnostic(tourId)`.
   * Defaults to `false`; the orchestrator tree-shakes out when unused.
   *
   * In `NODE_ENV !== 'production'` builds, leaving this off triggers a
   * one-time `console.warn` per provider mount nudging dev consumers toward
   * the better debug surface.
   */
  diagnose?: boolean
  /**
   * Extension gates (license, scheduling, custom) appended to the diagnostic
   * pipeline AFTER built-ins. Only consulted when `diagnose` is `true`.
   */
  diagnosticGates?: DiagnosticGate[]
  /**
   * Optional user context plumbed to diagnostic gates (audience filter, etc).
   * Only read when `diagnose` is `true`.
   */
  userContext?: Record<string, unknown>
  /**
   * Dev-only test bridge — when `true`, sets `window.__tourKit__` to a
   * `TestBridge` exposing the imperative controls (mirrors the existing
   * ref) so Playwright/E2E drivers can advance a tour from outside React.
   *
   * Defaults to `false`. Production builds MUST never expose this — wrap
   * in a `process.env.NODE_ENV !== 'production'` guard at the call site.
   * Tree-shakes when the prop is a literal `false`.
   */
  enableTestBridge?: boolean
}

// Module-level guard so the dev `diagnose` tip prints once per page/session,
// regardless of how many TourProvider instances mount.
let diagnoseHintFired = false

/** Test-only: reset the once-per-session `diagnose` hint guard. */
export function __resetDiagnoseHintForTests(): void {
  diagnoseHintFired = false
}

/**
 * The React binding over `createTourEngine()` (v2 §1.4).
 *
 * This component used to be a second engine implementation — a reducer, five
 * "live" refs refreshed every render, four persistence hooks, and ten effects
 * whose declaration order encoded the boot and transition rules. All of that
 * is `lib/tour-engine/` now, and what is left is the binding: one engine
 * behind a handle, one `useSyncExternalStore`, three effects.
 *
 * Two rules the shape depends on:
 *
 *  - **Nothing constructs an engine during render.** `handle.getState()` and
 *    `handle.subscribe()` are the only members render may touch, and neither
 *    constructs. StrictMode double-invokes initialisers and the engine
 *    registers with `tourRegistry` at construction, so building one in render
 *    logs `registered twice` and leaks.
 *  - **`release()` in the boot effect's cleanup, never `destroy()` on a
 *    memoised engine.** Under StrictMode that cleanup runs between two mounts,
 *    and a child's mount effect calling `start()` runs before the provider's
 *    own effect on both passes. The handle absorbs that; a bare engine does
 *    not.
 */
export function TourProvider({
  children,
  tours = [],
  router,
  routePersistence = { enabled: false },
  autoNavigate = true,
  onNavigationRequired,
  onTourPaused,
  onStepError,
  diagnose = false,
  diagnosticGates,
  userContext,
  enableTestBridge = false,
}: TourProviderProps) {
  // Validate synchronously at render time so misconfigured hidden steps throw
  // at the caller's render() instead of leaking into runtime. Cheap: just a
  // shallow loop over the steps. Must run before any hook so a thrown error
  // doesn't leave React with a partial hook order. (The engine validates
  // again at construction — a shallow loop, twice.)
  for (const tour of tours) validateTour(tour)

  const [diagnostics, setDiagnostics] = React.useState<Record<string, EligibilityReport>>({})

  // Dev-mode hint: fire once per page/session when `diagnose` is unset. Uses a
  // module-level guard (see `diagnoseHintFired`) so multiple TourProvider
  // instances — e.g. several tours under MultiTourKitProvider — don't each
  // print the tip. Gated on NODE_ENV !== 'production' so prod builds stay silent.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-once warning, not a reactive concern
  React.useEffect(() => {
    if (diagnose) return
    if (diagnoseHintFired) return
    if (typeof process === 'undefined' || process.env?.NODE_ENV === 'production') return
    diagnoseHintFired = true
    logger.warn(
      'Tip: pass <TourProvider diagnose> in dev to see why a tour did not fire. https://usertourkit.com/docs/core/diagnostic'
    )
  }, [])

  const tourKitContext = React.useContext(TourKitContext)

  // ─── The one render-time write ───────────────────────────────────────────
  // The "latest props" idiom, and all that survives of adapter A's five live
  // refs. The engine reads `router`, the callbacks and the analytics fan-out
  // through accessors, and the `setOptions` effect below pushes them; this ref
  // is what that effect and the lazy factory read from.
  const source: BindingOptions = {
    tours,
    router,
    routePersistence,
    persistence: tourKitContext?.config.persistence,
    autoNavigate,
    analytics: (tourKitContext satisfies TourEngineAnalytics | null) ?? undefined,
    onNavigationRequired,
    onStepError,
    onTourPaused,
  }
  const latest = React.useRef(source)
  latest.current = source

  // Never `useState(() => createTourEngine(...))`: that constructs in render.
  // The handle is inert — building one touches no storage and no registry —
  // so StrictMode discarding a duplicate costs an object.
  const [handle] = React.useState<EngineHandle>(() =>
    createEngineHandle(() => createTourEngine(engineOptionsFrom(latest.current)))
  )

  const snapshot = React.useSyncExternalStore(
    handle.subscribe,
    handle.getState,
    // No effect ever runs on the server, so nothing is constructed and this
    // returns the module constant — identical to the first client render.
    handle.getState
  )

  // Every commit, deliberately without a dependency array: six property writes
  // are cheaper than the deps that would guard them, and every built-in router
  // adapter changes identity on a route change.
  React.useEffect(() => {
    handle.setOptions(liveOptionsFrom(latest.current))
  })

  React.useEffect(() => {
    handle.setTours(tours)
  }, [handle, tours])

  // `boot()` is once-only inside the engine, and defers rather than latching
  // when `tours` is still empty — the declarative `<Tour>` path registers
  // children after this effect, and `setTours` re-arms it.
  React.useEffect(() => {
    void handle.boot()
    return () => handle.release()
  }, [handle])

  // ─── Diagnostic engine wiring (Phase 3) ──────────────────────────────────
  // Stays React: it drives React state, not tour state. Only fires when
  // `diagnose === true`, so opted-out consumers pay zero runtime cost (and the
  // orchestrator import tree-shakes out of their bundle).
  //
  // Stability keys: `userContext`, `diagnosticGates` and `router` are
  // reference types, so primitive keys derived from their content replace them
  // in the dep array and survive identity churn from inline-literal props.
  // `currentRouteKey` is the router's path, so a route change inside a stable
  // router still re-evaluates the route gate.
  const userContextKey = React.useMemo(() => {
    if (!userContext) return ''
    try {
      return JSON.stringify(userContext)
    } catch {
      // Circular or otherwise unserializable. Falling back to a constant
      // string means the effect won't re-run on content changes for this
      // shape — acceptable degradation; the alternative (throwing during
      // render) takes down the host tree even when `diagnose` is off.
      return '[unserializable]'
    }
  }, [userContext])
  const diagnosticGatesKey = (diagnosticGates ?? []).map((g) => g.id).join('\x00')
  const tourIdsKey = tours.map((t) => t.id).join('\x00')
  const currentRouteKey = router?.getCurrentRoute() ?? ''
  const { completedTours, skippedTours } = snapshot
  // biome-ignore lint/correctness/useExhaustiveDependencies: stability keys (userContextKey, diagnosticGatesKey, tourIdsKey, currentRouteKey) replace the reference deps
  React.useEffect(() => {
    if (!diagnose) return
    let cancelled = false
    const gates = diagnosticGates ?? []
    const currentRoute = router?.getCurrentRoute()
    void Promise.all(
      tours.map((t) => {
        const firstVisibleStep = t.steps.find((s) => s.kind !== 'hidden')
        const stepRoute = firstVisibleStep?.route
        const ctx: DiagnosticContext = {
          userContext,
          completedTours,
          skippedTours,
          route:
            stepRoute && currentRoute !== undefined
              ? {
                  current: currentRoute,
                  matcher: stepRoute,
                  mode: firstVisibleStep?.routeMatch ?? 'exact',
                }
              : undefined,
          targetResolver: (sel) =>
            typeof document !== 'undefined' ? document.querySelector<HTMLElement>(sel) : null,
        }
        return explainTour(t, ctx, gates).then((r) => [t.id, r] as const)
      })
    ).then((pairs) => {
      if (cancelled) return
      setDiagnostics(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
  }, [
    diagnose,
    tourIdsKey,
    userContextKey,
    diagnosticGatesKey,
    completedTours,
    skippedTours,
    currentRouteKey,
  ])

  // ─── Test bridge wiring (Phase 6, issue #86) ─────────────────────────────
  // `enableTestBridge` opts in to `window.__tourKit__` — used by Playwright
  // helpers to drive a tour from out-of-process. Default is `false` so
  // production never leaks the surface. The effect short-circuits at the top
  // when disabled, making the bridge body dead-code under a literal `false`.
  //
  // The handle's verbs have stable identity, so only `diagnostics` — which is
  // per-render React state — still needs a ref for the bridge installed on
  // `window` once to read the latest.
  const diagnosticsRef = React.useRef(diagnostics)
  diagnosticsRef.current = diagnostics

  const testBridgeWarnedRef = React.useRef(false)

  React.useEffect(() => {
    if (!enableTestBridge) return
    // The once-per-mount guard stays here, not in `attachTestBridge`: a
    // module-level flag in the plain function would leak across tests.
    const warn = !testBridgeWarnedRef.current
    testBridgeWarnedRef.current = true

    return attachTestBridge(
      {
        start: (tourId) => handle.start(tourId),
        next: () => handle.next(),
        prev: () => handle.prev(),
        goToStep: (stepId) => handle.goToStep(stepId),
        complete: () => handle.complete(),
        skip: () => handle.skip(),
        getDiagnostic: (tourId) => diagnosticsRef.current[tourId] ?? null,
      },
      { warn }
    )
  }, [enableTestBridge, handle])

  const contextValue = React.useMemo<TourContextValue>(
    () => ({
      ...snapshot,
      ...pickActions(handle),
      // Only attach the diagnostics field when `diagnose` is on — keeps
      // `ctx.diagnostics` strictly undefined for opted-out consumers so the
      // hook's `null` branch is observable.
      ...(diagnose ? { diagnostics } : {}),
    }),
    [snapshot, handle, diagnose, diagnostics]
  )

  return (
    <TourContext.Provider value={contextValue}>
      <AdvanceOnEffect />
      {children}
    </TourContext.Provider>
  )
}

/**
 * Internal component to handle advanceOn behavior
 * This needs to be a separate component because hooks can't be called
 * conditionally, and useAdvanceOn needs access to the TourContext
 *
 * Still a hook rather than `attachAdvanceOn(handle)` in the boot effect, but
 * no longer because it has to be. The hazard was that the hook rebinds after
 * React's commit while the engine-level watcher rebound synchronously inside
 * `notify()`: `GO_TO_STEP` lands in a microtask, a microtask checkpoint runs
 * between listeners of the same DOM event, and a step whose `advanceOn` falls
 * back to `document` could receive the very click that advanced onto it and
 * advance again. v2 §1.5 fixed that in `attachAdvanceOn` itself — it detaches
 * the outgoing step's listener synchronously and binds the incoming one one
 * macrotask later — so the two are now equivalent and a later slice can
 * collapse them.
 */
function AdvanceOnEffect() {
  useAdvanceOn()
  return null
}
