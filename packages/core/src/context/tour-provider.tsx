import * as React from 'react'
import { useAdvanceOn } from '../hooks/use-advance-on'
import { useBroadcast } from '../hooks/use-broadcast'
import { useFlowSession } from '../hooks/use-flow-session'
import { usePersistence } from '../hooks/use-persistence'
import { useRoutePersistence } from '../hooks/use-route-persistence'
import { explainTour } from '../lib/diagnostic'
import { resolveBootStart, runBootStart } from '../lib/tour-engine/boot'
import type { TourEngineAnalytics, TourEngineContext } from '../lib/tour-engine/context'
import { handleBranchTargetImpl } from '../lib/tour-engine/handle-branch-target'
import {
  buildCallbackContext,
  evaluateStepWhen,
  findNearestVisibleStepIndex,
  findNextVisibleStepIndex,
} from '../lib/tour-engine/helpers'
import { navigateToStepImpl } from '../lib/tour-engine/navigate-to-step'
import { MAX_HIDDEN_CHAIN, tourReducer } from '../lib/tour-engine/reducer'
import { validateTour } from '../lib/validate-tour'
import type { TourRouteError } from '../lib/wait-for-step-target'
import { tourRegistry } from '../registry/tour-registry'
import type {
  BranchContext,
  BranchTarget,
  Tour,
  TourCallbackContext,
  TourContextValue,
} from '../types'
import { defaultPersistenceConfig } from '../types/config'
import type { DiagnosticContext, DiagnosticGate, EligibilityReport } from '../types/diagnostic'
import type { MultiPagePersistenceConfig, RouterAdapter } from '../types/router'
import type { TestBridge } from '../types/test-bridge'
import type { TourReducerState } from '../types/tour-reducer'
import { resolveBranch } from '../utils/branch'
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

interface CrossTabActiveMessage {
  type: 'tour:active'
  tourId: string
  tabId: string
  ts: number
}

// Module-level guard so the dev `diagnose` tip prints once per page/session,
// regardless of how many TourProvider instances mount.
let diagnoseHintFired = false

/** Test-only: reset the once-per-session `diagnose` hint guard. */
export function __resetDiagnoseHintForTests(): void {
  diagnoseHintFired = false
}

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
  // doesn't leave React with a partial hook order.
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
  const persistenceConfig = tourKitContext?.config.persistence
  const {
    getCompletedTours,
    getSkippedTours,
    markCompleted,
    markSkipped,
    reset: resetPersistence,
  } = usePersistence(persistenceConfig)
  const persistTerminalTours =
    (persistenceConfig?.enabled ?? defaultPersistenceConfig.enabled) &&
    (persistenceConfig?.trackCompleted ?? defaultPersistenceConfig.trackCompleted)
  const [data, setDataState] = React.useState<Record<string, unknown>>({})
  const { save, load, clear, externalVersion } = useRoutePersistence(routePersistence)

  const initialState: TourReducerState = {
    tourId: null,
    isActive: false,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 0,
    isLoading: false,
    isTransitioning: false,
    // Hydration safety: do NOT seed these from storage here. A render-time
    // getCompletedTours() read makes the first client render differ from SSR
    // (server has no storage), which shifts useId tree positions and breaks
    // hydration for downstream useId consumers. Loaded post-mount via
    // HYDRATE_TERMINAL_TOURS below.
    completedTours: [],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    tours: new Map(tours.map((t) => [t.id, t])),
  }

  const [state, dispatch] = React.useReducer(tourReducer, initialState)

  // Load persisted terminal tours after mount so the first client render
  // matches the server-rendered HTML exactly (standard SSR reconcile pattern).
  React.useEffect(() => {
    if (!persistTerminalTours) return
    const completedTours = getCompletedTours()
    const skippedTours = getSkippedTours()
    if (completedTours.length === 0 && skippedTours.length === 0) return
    dispatch({ type: 'HYDRATE_TERMINAL_TOURS', completedTours, skippedTours })
  }, [persistTerminalTours, getCompletedTours, getSkippedTours])

  // ─── Diagnostic engine wiring (Phase 3) ──────────────────────────────────
  // Runs after the reducer is declared so the persistence gate can read live
  // `state.completedTours` / `state.skippedTours`. Only fires when
  // `diagnose === true`, so opted-out consumers pay zero runtime cost (and
  // the orchestrator import tree-shakes out of their bundle).
  //
  // Stability keys: `userContext`, `diagnosticGates`, and `router` are
  // reference types, so we derive primitive keys that survive identity
  // churn from inline-literal props.
  //
  // - `userContextKey`: JSON-stringified content (try/catch around it — a
  //   circular reference in a user-supplied object must NEVER crash the host
  //   render path; we degrade to a stable sentinel instead).
  // - `diagnosticGatesKey`: gate ids joined with NUL so kebab-case ids
  //   cannot collide regardless of payload.
  // - `tourIdsKey`: same NUL-joined shape as the gates key.
  // - `currentRouteKey`: the router's current path as a string, so route
  //   changes inside a stable router re-evaluate the route gate, and inline
  //   router instances don't reference-thrash the effect.
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: stability keys (userContextKey, diagnosticGatesKey, tourIdsKey, currentRouteKey) replace the reference deps; state.completedTours/skippedTours are tracked as live refs
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
          completedTours: state.completedTours,
          skippedTours: state.skippedTours,
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
    state.completedTours,
    state.skippedTours,
    currentRouteKey,
  ])

  // flowSession-restore: tour-scoped resume after reload. The hook uses a
  // single fixed key (`flow:active`) so we discover the persisted tourId on
  // mount without needing to know it up front; subsequent saves write the
  // current state.tourId.
  const flow = useFlowSession(
    state.tourId ?? '',
    routePersistence.flowSession
      ? { ...routePersistence.flowSession, keyPrefix: routePersistence.key }
      : undefined
  )

  const tabId = React.useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Random-enough fallback for runtimes without crypto.randomUUID.
    // A literal sentinel like 'ssr' would collide between tabs and silently
    // disable the cross-tab self-message filter.
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }, [])
  const broadcast = useBroadcast<CrossTabActiveMessage>(
    routePersistence.crossTab?.channel ?? 'tourkit:active-flow',
    { enabled: !!routePersistence.crossTab?.enabled }
  )

  // Stable callback ref for cross-tab pause notification
  const onTourPausedRef = React.useRef(onTourPaused)
  React.useEffect(() => {
    onTourPausedRef.current = onTourPaused
  })

  // Latest-state ref consumed by the cross-tab subscribe handler so it can
  // read isActive/tourId at fire time without re-subscribing on every state
  // change (which would risk dropping in-flight messages).
  const currentActiveRef = React.useRef<{ isActive: boolean; tourId: string | null }>({
    isActive: false,
    tourId: null,
  })

  // Idempotency guards: track the last tour for which the terminal callback
  // (onComplete / onSkip) has already fired. Prevents double-firing inside the
  // same React commit phase, where reducer state is still closure-stale.
  // Reset inside start() / handleStartTour-equivalent paths (see below).
  const completedTourIdRef = React.useRef<string | null>(null)
  const skippedTourIdRef = React.useRef<string | null>(null)

  // Sync tours prop with reducer state when tours are registered/unregistered
  React.useEffect(() => {
    dispatch({ type: 'UPDATE_TOURS', tours })
  }, [tours])

  // Get current tour
  const currentTour = state.tourId ? (state.tours.get(state.tourId) ?? null) : null

  // ─── Boot precedence (v2 §1.3c) ──────────────────────────────────────────
  // Three effects used to live here — flow-session restore, route-state
  // restore and autostart — each re-deriving whether the earlier one had
  // already fired, via two ref latches and a `flow.ready` gate. The order was
  // implicit in React's effect scheduling.
  //
  // It is now one ordered rule in `lib/tour-engine/boot.ts`:
  // `resolveBootStart()` says WHICH tour wins (pure, a truth table), and
  // `runBootStart()` executes it — including the cross-page case where the
  // restored blob names a different route, so we navigate, await the target
  // and only then dispatch. `boot.parity.test.tsx` runs the same 13 rows
  // through this mounted provider to prove the pure rule and the React one
  // agree.
  const bootPhaseRef = React.useRef<'idle' | 'booting' | 'ready'>('idle')
  // biome-ignore lint/correctness/useExhaustiveDependencies: latched via bootPhaseRef; re-runs when `tours` populates, when the deferred session load completes (flow.ready), or when another tab writes (externalVersion)
  React.useEffect(() => {
    // The session blob loads post-mount (hydration safety) — the pre-load
    // `null` must never be read as "no session".
    if (!flow.ready) return
    // No tours registered yet. The declarative `<Tour>` path (via
    // `MultiTourKitProvider`) mounts children AFTER the parent's first effect
    // tick, so this is "not yet", not "never" — return WITHOUT latching so the
    // next `tours` change retries.
    if (tours.length === 0) return

    const decision = resolveBootStart({
      flowSession: flow.session,
      flowIsStale: flow.isStale,
      routeState: load(),
      tours,
      completedTours: persistTerminalTours ? getCompletedTours() : state.completedTours,
    })

    // Route restore is the one source allowed to run more than once:
    // `externalVersion` bumps when another tab writes the key, and
    // re-hydrating from it is the whole point of `syncTabs`. Flow restore and
    // autostart are once per mount.
    const repeatable = decision?.source === 'route'
    if (!repeatable) {
      if (bootPhaseRef.current !== 'idle') return
      bootPhaseRef.current = 'booting'
    }

    if (!decision) {
      bootPhaseRef.current = 'ready'
      return
    }

    // Cancellation: the restore may await a navigate plus a MutationObserver.
    // If the provider unmounts mid-await, dispatching or clearing would mutate
    // a dead instance and write storage for a tour the user has left.
    const abort = new AbortController()
    void runBootStart(engineContextRef.current as TourEngineContext, decision, {
      // Only the flow blob records a route; route restore and autostart are
      // always same-page.
      currentRoute: decision.source === 'flow' ? flow.session?.currentRoute : undefined,
      signal: abort.signal,
      onClear: flow.clear,
    }).finally(() => {
      bootPhaseRef.current = 'ready'
    })

    return () => abort.abort()
  }, [tours, flow.ready, externalVersion])

  // Save state on changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only save on specific state changes
  React.useEffect(() => {
    if (state.isActive && routePersistence.enabled) {
      save(state)
    }
  }, [state.tourId, state.currentStepIndex, state.isActive, save, routePersistence.enabled])

  // Throttled flowSession save on step change while active. Deps are
  // exhaustive — the throttle inside `flow.save` handles coalescing.
  // `currentRoute` is included so a hard-refresh during a multi-page tour
  // resumes on the right URL (Phase 1.3 — FlowSessionV2).
  React.useEffect(() => {
    if (state.isActive && state.tourId && routePersistence.flowSession) {
      flow.save(state.currentStepIndex, router?.getCurrentRoute())
    }
  }, [
    state.currentStepIndex,
    state.isActive,
    state.tourId,
    flow.save,
    routePersistence.flowSession,
    router,
  ])

  // AbortController scoped to the active tour. Lets `waitForStepTarget`
  // cancel cleanly on STOP_TOUR and on unmount instead of resolving a stale
  // navigation onto a torn-down tree. Reset on every tour-id change.
  const abortControllerRef = React.useRef<AbortController | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: tour-scoped — only swap on tour identity / activeness
  React.useEffect(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = state.isActive ? new AbortController() : null
  }, [state.tourId, state.isActive])
  // Final teardown on unmount — independent of the activeness swap above so
  // the abort always fires once even when the component unmounts mid-tour.
  React.useEffect(() => () => abortControllerRef.current?.abort(), [])

  // Clear flowSession blob ONLY on a true → false transition (tour ended).
  // The initial mount has `state.isActive === false`; without this guard
  // we would wipe a freshly restored blob right after the restore effect
  // dispatched START_TOUR (saved by the leading-edge throttle re-write,
  // but fragile and an unnecessary storage churn).
  const wasActiveRef = React.useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to isActive flip
  React.useEffect(() => {
    if (wasActiveRef.current && !state.isActive && routePersistence.flowSession) {
      flow.clear()
    }
    wasActiveRef.current = state.isActive
  }, [state.isActive])

  // Keep the latest-state ref in sync (read by the cross-tab subscriber).
  React.useEffect(() => {
    currentActiveRef.current = { isActive: state.isActive, tourId: state.tourId }
  })

  // Last-announce timestamp — also used as tie-breaker when two tabs
  // simultaneously announce (e.g., both restoring from the same persisted
  // session at cold start). The later announce wins; the earlier one yields.
  const announceTsRef = React.useRef<number | null>(null)

  // Cross-tab announce: whenever this tab activates a tour, post to the channel.
  React.useEffect(() => {
    if (state.isActive && state.tourId) {
      announceTsRef.current = Date.now()
      broadcast.post({
        type: 'tour:active',
        tourId: state.tourId,
        tabId,
        ts: announceTsRef.current,
      })
    }
  }, [state.isActive, state.tourId, tabId, broadcast])

  // Cross-tab subscribe: pause our active tour when another tab announces.
  React.useEffect(() => {
    return broadcast.subscribe((msg) => {
      if (msg.type !== 'tour:active') return
      if (msg.tabId === tabId) return
      const pausedTourId = currentActiveRef.current.tourId
      if (!currentActiveRef.current.isActive || !pausedTourId) return
      // Tie-break: if we announced AFTER the incoming message, we are the
      // newer owner and should keep running. Otherwise yield. Without this,
      // two tabs cold-restoring the same flow.session at the same instant
      // pause each other and the user sees no tour anywhere.
      const myTs = announceTsRef.current
      if (myTs !== null && myTs > msg.ts) return
      dispatch({ type: 'STOP_TOUR' })
      onTourPausedRef.current?.(pausedTourId, 'cross-tab')
    })
  }, [broadcast, tabId])

  // setData is hoisted above navigateToStep so the hidden-step branch
  // resolver can access it without depending on a later closure.
  const setData = React.useCallback((key: string, value: unknown) => {
    setDataState((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ─── Engine context wiring ───────────────────────────────────────────────
  // `navigateToStep` and `handleBranchTarget` live in `../lib/tour-engine/`.
  //
  // Engine impls are awaited across microtask boundaries. To avoid the stale-
  // closure trap, the engine context's accessors route through a set of
  // "live" refs that mirror the latest committed state. Even if an impl
  // captures `ctx` from render N, calling `ctx.getState()` from render N+1
  // reads through `stateRef.current` which has already been refreshed.
  //
  // `engineContextRef` itself is rebuilt each render so non-getter fields
  // (router, callbacks) stay current; the getters all read through the same
  // long-lived refs.
  const stateRef = React.useRef<TourReducerState>(state)
  const currentTourLiveRef = React.useRef<Tour | null>(null)
  const dataRef = React.useRef<Record<string, unknown>>(data)
  const stepIdMapRef = React.useRef<Map<string, number>>(new Map())
  const engineContextRef = React.useRef<TourEngineContext | null>(null)

  const navigateToStep = React.useCallback((stepIndex: number): Promise<boolean> => {
    const ctx = engineContextRef.current
    if (!ctx) return Promise.resolve(false)
    return navigateToStepImpl(ctx, stepIndex)
  }, [])

  // Step ID to index map for branch resolution
  const stepIdMap = React.useMemo(() => {
    const map = new Map<string, number>()
    currentTour?.steps.forEach((step, index) => {
      map.set(step.id, index)
    })
    return map
  }, [currentTour])

  // Build branch context for branch resolvers
  const buildBranchContext = React.useCallback(
    (action?: string, actionPayload?: unknown): BranchContext => {
      const callbackContext = buildCallbackContext(state, currentTour, data)
      return {
        ...callbackContext,
        action,
        actionPayload,
        setData,
      }
    },
    [state, currentTour, data, setData]
  )

  // Helper to complete the current tour. Idempotent across both stale-closure
  // synchronous double-calls (via ref) and post-COMPLETE_TOUR re-firing (via
  // isActive). Single source of truth for ALL completion paths — public
  // complete(), next() at last step, branch 'complete', and the no-visible-step
  // auto-finish path.
  const completeTour = React.useCallback(() => {
    if (!state.isActive || !currentTour) return
    if (completedTourIdRef.current === currentTour.id) return
    completedTourIdRef.current = currentTour.id
    if (persistTerminalTours) markCompleted(currentTour.id)
    dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
    dispatch({ type: 'COMPLETE_TOUR' })
    clear()
    tourKitContext?.onTourComplete?.(currentTour.id)
    currentTour.onComplete?.({ ...state, tour: currentTour, data })
  }, [currentTour, state, data, tourKitContext, clear, persistTerminalTours, markCompleted])

  // Helper to skip the current tour. Mirrors completeTour for skip semantics.
  const skipTour = React.useCallback(() => {
    if (!state.isActive || !currentTour) return
    if (skippedTourIdRef.current === currentTour.id) return
    skippedTourIdRef.current = currentTour.id
    if (persistTerminalTours) markSkipped(currentTour.id)
    dispatch({ type: 'ADD_SKIPPED', tourId: currentTour.id })
    dispatch({ type: 'SKIP_TOUR' })
    clear()
    tourKitContext?.onTourSkip?.(currentTour.id, state.currentStepIndex)
    currentTour.onSkip?.({ ...state, tour: currentTour, data })
  }, [currentTour, state, data, tourKitContext, clear, persistTerminalTours, markSkipped])

  // Branch-target orchestration extracted to ../lib/tour-engine/handle-branch-target.
  // Wrapper delegates through the engine context ref so async branches read
  // fresh state across awaits.
  const handleBranchTarget = React.useCallback(
    (target: BranchTarget, branchContext: BranchContext, actionId?: string): Promise<void> => {
      const ctx = engineContextRef.current
      if (!ctx) return Promise.resolve()
      return handleBranchTargetImpl(ctx, target, branchContext, actionId)
    },
    []
  )

  // Refresh the live refs synchronously each render so engine getters always
  // resolve to the latest committed state, even when called through a `ctx`
  // captured during an earlier render (e.g. a BranchWait recursion that
  // resumes after a state-changing dispatch).
  stateRef.current = state
  currentTourLiveRef.current = currentTour
  dataRef.current = data
  stepIdMapRef.current = stepIdMap

  engineContextRef.current = {
    getState: () => stateRef.current,
    getCurrentTour: () => currentTourLiveRef.current,
    getData: () => dataRef.current,
    getStepIdMap: () => stepIdMapRef.current,
    dispatch,
    abortControllerRef,
    completedTourIdRef,
    skippedTourIdRef,
    router,
    autoNavigate,
    maxHiddenChain: MAX_HIDDEN_CHAIN,
    onNavigationRequired,
    onStepError,
    completeTour,
    skipTour,
    setData,
    navigateToStep,
    persistTerminalTours,
    markCompleted,
    markSkipped,
    resetPersistence,
    clearRouteState: clear,
    tourKitContext: tourKitContext satisfies TourEngineAnalytics | null,
  }

  // Actions
  const start = React.useCallback(
    async (tourId?: string, stepIndex?: number) => {
      const id = tourId ?? tours[0]?.id
      if (!id) return

      const tour = state.tours.get(id)
      if (!tour) return

      const initialIndex = stepIndex ?? tour.startAt ?? 0

      // Build context for when evaluation
      const context = buildCallbackContext(
        {
          ...state,
          tourId: id,
          isActive: true,
          totalSteps: tour.steps.length,
          currentStepIndex: initialIndex,
          currentStep: tour.steps[initialIndex] ?? null,
        },
        tour,
        data
      )

      // Find first visible step from the initial index
      const visibleIndex = await findNextVisibleStepIndex(initialIndex, 1, tour.steps, context)

      if (visibleIndex === -1) {
        logger.warn(`Tour "${id}" has no visible steps`)
        return
      }

      // Re-arm terminal-callback guards for the (re)started tour
      completedTourIdRef.current = null
      skippedTourIdRef.current = null

      dispatch({ type: 'START_TOUR', tourId: id, stepIndex: visibleIndex })
      tourKitContext?.onTourStart?.(id)
      tour.onStart?.({ ...state, tour, data })
    },
    [tours, state, data, tourKitContext]
  )

  const next = React.useCallback(async () => {
    if (!state.isActive || !currentTour) return

    const currentStep = state.currentStep

    // Check for onNext branch override
    if (currentStep?.onNext !== undefined) {
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
      const branchContext = buildBranchContext()
      const target = await resolveBranch(currentStep.onNext, branchContext)
      await handleBranchTarget(target, branchContext)
      return
    }

    const isLastStep = state.currentStepIndex >= currentTour.steps.length - 1
    if (isLastStep) {
      completeTour()
      return
    }

    dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

    // Build context and find next visible step (skipping steps where when returns false)
    const context = buildCallbackContext(state, currentTour, data)
    const nextStepIndex = await findNextVisibleStepIndex(
      state.currentStepIndex + 1,
      1, // forward direction
      currentTour.steps,
      context
    )

    // No more visible steps - complete the tour
    if (nextStepIndex === -1) {
      completeTour()
      return
    }

    // Navigate to the next visible step
    const navigated = await navigateToStep(nextStepIndex)
    if (!navigated) {
      // Reset the transitioning flag we set above. The auto-strategy failure
      // path (TARGET_NOT_FOUND / NAVIGATION_REJECTED) already dispatches
      // STOP_TOUR which clears the flag — this redundant dispatch only
      // matters for the prompt / manual / hidden-terminate paths where the
      // tour is still active but the navigation was deferred.
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
      return
    }

    const nextStep = currentTour.steps[nextStepIndex]
    if (nextStep) {
      dispatch({
        type: 'TRACK_STEP_VISIT',
        stepId: nextStep.id,
        previousStepId: currentStep?.id ?? null,
      })
      tourKitContext?.onStepView?.(currentTour.id, nextStep.id, nextStepIndex)
      currentTour.onStepChange?.(nextStep, nextStepIndex, {
        ...state,
        tour: currentTour,
        data,
      })
    }
  }, [
    state,
    currentTour,
    data,
    tourKitContext,
    navigateToStep,
    completeTour,
    buildBranchContext,
    handleBranchTarget,
  ])

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: step navigation with branch/loop handling
  const prev = React.useCallback(async () => {
    if (!state.isActive || !currentTour) return

    const currentStep = state.currentStep

    // Check for onPrev branch override
    if (currentStep?.onPrev !== undefined) {
      // null means disable going back
      if (currentStep.onPrev === null) {
        return
      }
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
      const branchContext = buildBranchContext()
      const target = await resolveBranch(currentStep.onPrev, branchContext)
      await handleBranchTarget(target, branchContext)
      return
    }

    // Default: don't go back if at first step
    if (state.currentStepIndex <= 0) return

    dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

    // Build context and find previous visible step (skipping steps where when returns false)
    const context = buildCallbackContext(state, currentTour, data)
    const prevStepIndex = await findNextVisibleStepIndex(
      state.currentStepIndex - 1,
      -1, // backward direction
      currentTour.steps,
      context
    )

    // No previous visible step - stay on current step
    if (prevStepIndex === -1) {
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
      return
    }

    // Navigate to the previous visible step
    const navigated = await navigateToStep(prevStepIndex)

    if (!navigated) {
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
      return
    }

    const prevStep = currentTour.steps[prevStepIndex]
    if (prevStep) {
      dispatch({
        type: 'TRACK_STEP_VISIT',
        stepId: prevStep.id,
        previousStepId: currentStep?.id ?? null,
      })
      tourKitContext?.onStepView?.(currentTour.id, prevStep.id, prevStepIndex)
      currentTour.onStepChange?.(prevStep, prevStepIndex, {
        ...state,
        tour: currentTour,
        data,
      })
    }
  }, [
    state,
    currentTour,
    data,
    tourKitContext,
    navigateToStep,
    buildBranchContext,
    handleBranchTarget,
  ])

  const goTo = React.useCallback(
    async (stepIndex: number) => {
      if (!state.isActive || !currentTour) return

      const targetStep = currentTour.steps[stepIndex]
      if (!targetStep) return

      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

      // Build context and evaluate when condition for target step
      const context = buildCallbackContext(state, currentTour, data)
      const stepContext: TourCallbackContext = {
        ...context,
        currentStepIndex: stepIndex,
        currentStep: targetStep,
      }
      const shouldShow = await evaluateStepWhen(targetStep, stepContext)

      // If target step can be shown, use it; otherwise find nearest visible step
      const targetIndex = shouldShow
        ? stepIndex
        : await findNearestVisibleStepIndex(stepIndex + 1, currentTour.steps, context)

      if (targetIndex === -1) {
        dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }

      // Navigate to the target visible step
      const navigated = await navigateToStep(targetIndex)
      if (!navigated) {
        dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }

      const step = currentTour.steps[targetIndex]
      if (step) {
        tourKitContext?.onStepView?.(currentTour.id, step.id, targetIndex)
        currentTour.onStepChange?.(step, targetIndex, {
          ...state,
          tour: currentTour,
          data,
        })
      }
    },
    [state, currentTour, data, tourKitContext, navigateToStep]
  )

  const skip = skipTour
  const complete = completeTour

  const stop = React.useCallback(() => {
    dispatch({ type: 'STOP_TOUR' })
  }, [])

  const setDontShowAgain = React.useCallback((_tourId: string, _value: boolean) => {
    // Implemented in usePersistence hook
  }, [])

  const reset = React.useCallback(
    (tourId?: string) => {
      if (persistTerminalTours) resetPersistence(tourId)
      dispatch({ type: 'RESET', tourId })
    },
    [persistTerminalTours, resetPersistence]
  )

  // Navigate to a step by its ID
  const goToStep = React.useCallback(
    async (stepId: string) => {
      if (!state.isActive || !currentTour) return

      const stepIndex = stepIdMap.get(stepId)
      if (stepIndex === undefined) {
        logger.warn(`Step "${stepId}" not found in tour`)
        return
      }

      await goTo(stepIndex)
    },
    [state.isActive, currentTour, stepIdMap, goTo]
  )

  // Start a different tour (for cross-tour branching)
  const startTour = React.useCallback(
    async (tourId: string, stepId?: string | number) => {
      const tour = state.tours.get(tourId)
      if (!tour) {
        logger.warn(`Tour "${tourId}" not found`)
        return
      }

      let stepIndex: number | undefined
      if (stepId !== undefined) {
        if (typeof stepId === 'number') {
          stepIndex = stepId
        } else {
          const tourStepMap = new Map<string, number>()
          tour.steps.forEach((s, i) => tourStepMap.set(s.id, i))
          stepIndex = tourStepMap.get(stepId)
          if (stepIndex === undefined) {
            logger.warn(`Step "${stepId}" not found in tour "${tourId}"`)
          }
        }
      }

      await start(tourId, stepIndex)
    },
    [state.tours, start]
  )

  // Trigger a branch action defined in the current step's onAction
  const triggerBranchAction = React.useCallback(
    async (actionId: string, payload?: unknown) => {
      if (!state.isActive || !currentTour || !state.currentStep) return

      const currentStep = state.currentStep
      const branch = currentStep.onAction?.[actionId]

      if (!branch) {
        logger.warn(`Action "${actionId}" not found on step "${currentStep.id}"`)
        return
      }

      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })

      const branchContext = buildBranchContext(actionId, payload)
      const target = await resolveBranch(branch, branchContext)

      // Fire analytics callbacks
      tourKitContext?.onBranchAction?.(currentTour.id, currentStep.id, actionId, target)
      currentTour.onBranchAction?.(currentStep.id, actionId, target)

      await handleBranchTarget(target, branchContext, actionId)
    },
    [
      state.isActive,
      currentTour,
      state.currentStep,
      buildBranchContext,
      tourKitContext,
      handleBranchTarget,
    ]
  )

  // ─── Tour registry wiring (Phase 1, useTourActions) ──────────────────────
  // Every tour in `tours` self-registers in the module-level `tourRegistry` so
  // a sibling subtree can call `useTourActions(id).start()` without prop
  // drilling or window-event workarounds. The registry is decoupled from the
  // React tree (module-level Map<string, WeakRef<RegistryEntry>>), so the
  // sibling consumer does NOT need to be inside this provider.
  //
  // Two effects below:
  //   1. Lifecycle effect — registers one entry per tour on mount, unregisters
  //      on unmount. Stable key is the NUL-joined ids so inline `tours={[...]}`
  //      props don't re-register every render.
  //   2. State-mirror effect — replaces each entry's `state` slice when the
  //      reducer fires. The registry only notifies subscribers when the slice
  //      actually changed, so spurious renders are clamped to one per real
  //      transition.
  //
  // Action methods are wired through latest-state refs (`controllerRef`) so
  // entries can be created once and the closures stay valid as the controller
  // identity churns on every state change. This mirrors the `bridgeMethodsRef`
  // pattern below and keeps the registry entry stable for the lifetime of the
  // tour.
  const controllerRef = React.useRef({ start, stop, next, prev, goToStep })
  React.useEffect(() => {
    controllerRef.current = { start, stop, next, prev, goToStep }
  })

  // `tourIdsKey` is declared earlier (diagnostic engine block) — reuse it here.
  React.useEffect(() => {
    if (tourIdsKey.length === 0) return
    const ids = tourIdsKey.split('\x00').filter(Boolean)
    const unregisters: Array<() => void> = []
    for (const id of ids) {
      const unregister = tourRegistry.register({
        id,
        state: { isActive: false, currentStepId: null, progress: 0 },
        actions: {
          start: () => {
            void controllerRef.current.start(id)
          },
          stop: () => {
            controllerRef.current.stop()
          },
          restart: () => {
            void controllerRef.current.start(id, 0)
          },
          next: () => {
            void controllerRef.current.next()
          },
          prev: () => {
            void controllerRef.current.prev()
          },
          goToStep: (stepId) => {
            void controllerRef.current.goToStep(stepId)
          },
        },
      })
      unregisters.push(unregister)
    }
    return () => {
      for (const u of unregisters) u()
    }
  }, [tourIdsKey])

  React.useEffect(() => {
    if (tourIdsKey.length === 0) return
    const ids = tourIdsKey.split('\x00').filter(Boolean)
    for (const id of ids) {
      const isThisTourActive = state.isActive && state.tourId === id
      const progress =
        isThisTourActive && state.totalSteps > 0
          ? (state.currentStepIndex + 1) / state.totalSteps
          : 0
      tourRegistry.update(id, {
        isActive: isThisTourActive,
        currentStepId: isThisTourActive ? (state.currentStep?.id ?? null) : null,
        progress,
      })
    }
  }, [
    tourIdsKey,
    state.isActive,
    state.tourId,
    state.currentStep,
    state.currentStepIndex,
    state.totalSteps,
  ])

  // ─── Test bridge wiring (Phase 6, issue #86) ─────────────────────────────
  // `enableTestBridge` opts in to `window.__tourKit__` — used by Playwright
  // helpers to drive a tour from out-of-process. Default is `false` so
  // production never leaks the surface. The effect short-circuits at the top
  // when disabled, making the bridge body dead-code under a literal `false`.
  //
  // Why a methods ref:
  // - The bridge identity is stable per mount, but each call must dispatch
  //   through the LATEST `start`/`next`/etc. closures. A ref avoids
  //   re-creating (and re-publishing) the bridge on every controller-method
  //   identity change, which would invalidate any cached helper closures in
  //   long-running Playwright contexts.
  // Build the latest-methods snapshot once per render, then publish to the ref.
  // The ref initial value uses the same object so the first effect run sees a
  // populated `current` even before this render's assignment commits.
  const bridgeMethods = {
    start,
    next,
    previous: prev,
    goToStep,
    complete,
    skip,
    diagnostics,
  }
  const bridgeMethodsRef = React.useRef(bridgeMethods)
  bridgeMethodsRef.current = bridgeMethods

  const testBridgeWarnedRef = React.useRef(false)

  React.useEffect(() => {
    if (!enableTestBridge) return
    if (typeof window === 'undefined') return

    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
      if (!testBridgeWarnedRef.current) {
        testBridgeWarnedRef.current = true
        console.warn('[Tour Kit] Test bridge enabled. Disable for production.')
      }
    }

    const bridge: TestBridge = {
      start: (tourId) => {
        void bridgeMethodsRef.current.start(tourId)
      },
      next: () => {
        void bridgeMethodsRef.current.next()
      },
      previous: () => {
        void bridgeMethodsRef.current.previous()
      },
      goToStep: (stepId) => {
        void bridgeMethodsRef.current.goToStep(stepId)
      },
      complete: () => {
        bridgeMethodsRef.current.complete()
      },
      skip: () => {
        bridgeMethodsRef.current.skip()
      },
      getDiagnostic: (tourId) => bridgeMethodsRef.current.diagnostics[tourId] ?? null,
    }
    window.__tourKit__ = bridge

    return () => {
      // Identity check defends against another library reassigning the global
      // between our mount and unmount — see the cleanup-safety unit test.
      if (window.__tourKit__ === bridge) {
        // biome-ignore lint/performance/noDelete: full removal mirrors the absent-by-default invariant — `= undefined` would leave an own property and break consumer `'__tourKit__' in window` checks
        delete window.__tourKit__
      }
    }
  }, [enableTestBridge])

  const contextValue = React.useMemo<TourContextValue>(
    () => ({
      ...state,
      tour: currentTour,
      data,
      start,
      next,
      prev,
      goTo,
      skip,
      complete,
      stop,
      setDontShowAgain,
      reset,
      setData,
      goToStep,
      startTour,
      triggerBranchAction,
      // Only attach the diagnostics field when `diagnose` is on — keeps
      // `ctx.diagnostics` strictly undefined for opted-out consumers so the
      // hook's `null` branch is observable.
      ...(diagnose ? { diagnostics } : {}),
    }),
    [
      state,
      currentTour,
      data,
      start,
      next,
      prev,
      goTo,
      skip,
      complete,
      stop,
      setDontShowAgain,
      reset,
      setData,
      goToStep,
      startTour,
      triggerBranchAction,
      diagnose,
      diagnostics,
    ]
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
 */
function AdvanceOnEffect() {
  useAdvanceOn()
  return null
}
