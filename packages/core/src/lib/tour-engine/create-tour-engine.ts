/**
 * v2 §1.3f — `createTourEngine()`, the second adapter.
 *
 * Adapter A is `<TourProvider>`'s ref bag. This is adapter B: the same
 * `TourEngineContext` port backed by plain fields on a closure. Neither knows
 * the other exists, and both drive the identical reducer, boot resolver,
 * actions and transition effects.
 *
 * It is assembly, not new logic. Every part it composes already has its own
 * suite.
 *
 * Three contracts the bindings depend on:
 *
 *  1. `getState()` is reference-stable between transitions. React 18's
 *     `useSyncExternalStore` compares with `Object.is`, so a fresh object per
 *     call is an infinite render loop.
 *  2. The constructor is inert — no storage, no `window`, no
 *     `BroadcastChannel`. It is constructible during SSR; `boot()` is where
 *     the world gets touched.
 *  3. `destroy()` is terminal, not a pause. It aborts in-flight work, closes
 *     the channel, flushes the throttled save, unregisters from the registry
 *     and turns every method into a no-op.
 */
import { tourRegistry } from '../../registry/tour-registry'
import type { PersistenceConfig } from '../../types'
import type { MultiPagePersistenceConfig, RouterAdapter } from '../../types/router'
import type { TourCallbackContext } from '../../types/state'
import type { Tour } from '../../types/tour'
import type { TourAction, TourReducerState } from '../../types/tour-reducer'
import { logger } from '../../utils/logger'
import { validateTour } from '../validate-tour'
import type { TourRouteError } from '../wait-for-step-target'
import {
  completeTourImpl,
  goToImpl,
  goToStepImpl,
  nextImpl,
  prevImpl,
  resetImpl,
  skipTourImpl,
  startImpl,
  startTourImpl,
  stopImpl,
  triggerBranchActionImpl,
} from './actions'
import { createBroadcast } from './adapters/broadcast'
import { createFlowSession } from './adapters/flow-session-store'
import { createRouteStore } from './adapters/route-store'
import { createTerminalStore } from './adapters/terminal-store'
import { resolveBootStart, runBootStart } from './boot'
import type { CrossTabActiveMessage, TourEngineAnalytics, TourEngineContext } from './context'
import { buildCallbackContext } from './helpers'
import { navigateToStepImpl } from './navigate-to-step'
import { MAX_HIDDEN_CHAIN, tourReducer } from './reducer'
import { applyTransitionEffects, subscribeCrossTabPause } from './transition-effects'

export interface CreateTourEngineOptions {
  tours: Tour[]
  router?: RouterAdapter
  routePersistence?: MultiPagePersistenceConfig
  persistence?: PersistenceConfig
  autoNavigate?: boolean
  /**
   * Explicit storage backend for every adapter. Tests pass
   * `createMemoryStorage()`; leaving it unset selects from the configs.
   */
  storage?: Storage
  analytics?: TourEngineAnalytics
  onTourPaused?: (tourId: string, reason: 'cross-tab') => void
  onNavigationRequired?: (route: string, stepId: string) => void
  onStepError?: (err: TourRouteError) => void
}

export interface TourEngine {
  // ─── The headline seven ─────────────────────────────────────────────────
  start: (tourId?: string, stepIndex?: number) => Promise<void>
  next: () => Promise<void>
  prev: () => Promise<void>
  goTo: (stepIndex: number) => Promise<void>
  /** Listeners take no arguments and read `getState()` themselves. */
  subscribe: (listener: () => void) => () => void
  getState: () => TourCallbackContext
  destroy: () => void

  // ─── Parity with TourActions, required by §1.4 ──────────────────────────
  /** Run the restore chain. Idempotent, and a no-op after `destroy()`. */
  boot: () => Promise<void>
  goToStep: (stepId: string) => Promise<void>
  startTour: (tourId: string, stepId?: string | number) => Promise<void>
  triggerBranchAction: (actionId: string, payload?: unknown) => Promise<void>
  skip: () => void
  complete: () => void
  stop: () => void
  reset: (tourId?: string) => void
  setData: (key: string, value: unknown) => void
  setTours: (tours: Tour[]) => void
}

type BootPhase = 'idle' | 'booting' | 'ready'

/** `crypto.randomUUID` where available; random-enough elsewhere. */
function makeTabId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // A literal sentinel would collide between tabs and silently disable the
  // cross-tab self-message filter.
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function initialReducerState(tours: Tour[]): TourReducerState {
  return {
    tourId: null,
    isActive: false,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 0,
    isLoading: false,
    isTransitioning: false,
    completedTours: [],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    tours: new Map(tours.map((t) => [t.id, t])),
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: assembly — one wiring branch per composed part, no logic of its own
export function createTourEngine(options: CreateTourEngineOptions): TourEngine {
  // Validate before touching anything, so a misconfigured hidden step throws
  // synchronously from the factory — the same moment the provider throws it
  // from render.
  for (const tour of options.tours) validateTour(tour)

  const routePersistence: MultiPagePersistenceConfig = options.routePersistence ?? {
    enabled: false,
    storage: 'localStorage',
  }
  const persistTerminalTours = options.persistence?.enabled ?? false

  // Adapters. Constructing these reads nothing — the flow session's
  // no-read-on-construct contract is what makes the whole factory SSR-safe.
  const terminalStore = createTerminalStore(options.persistence, options.storage)
  const routeStore = createRouteStore(routePersistence, options.storage)
  const flowSession = createFlowSession(
    routePersistence.flowSession,
    options.storage,
    // The engine has no render pass to mirror into; the factory's own copy is
    // the only one.
    undefined
  )
  const broadcast = createBroadcast<CrossTabActiveMessage>(
    routePersistence.crossTab?.channel ?? 'tourkit:active-flow',
    { enabled: !!routePersistence.crossTab?.enabled }
  )

  // ─── Engine state ────────────────────────────────────────────────────────
  let state = initialReducerState(options.tours)
  let data: Record<string, unknown> = {}
  let snapshot: TourCallbackContext = buildCallbackContext(state, null, data)
  let destroyed = false
  let bootPhase: BootPhase = 'idle'

  const listeners = new Set<() => void>()
  const abortControllerRef: { current: AbortController | null } = { current: null }
  const completedTourIdRef: { current: string | null } = { current: null }
  const skippedTourIdRef: { current: string | null } = { current: null }
  const crossTab: { lastAnnounceTs: number | null } = { lastAnnounceTs: null }
  const teardown: Array<() => void> = []

  const currentTour = () => (state.tourId ? (state.tours.get(state.tourId) ?? null) : null)

  const stepIdMap = () => {
    const map = new Map<string, number>()
    currentTour()?.steps.forEach((step, index) => map.set(step.id, index))
    return map
  }

  function rebuildSnapshot(): void {
    snapshot = buildCallbackContext(state, currentTour(), data)
  }

  function notify(): void {
    // Synchronous, and deliberately: §1.4's useSyncExternalStore collapses the
    // renders, and a microtask-coalesced notify would make getState() stale
    // immediately after a synchronous dispatch — which is exactly what the
    // direct-drive tests rely on.
    for (const listener of listeners) {
      try {
        listener()
      } catch (err) {
        // A broken subscriber must not take the tour down with it.
        logger.warn('createTourEngine: listener threw', err)
      }
    }
  }

  function dispatch(action: TourAction): void {
    if (destroyed) return

    const nextState = tourReducer(state, action)
    // A no-op reduce produces no snapshot and no notify. UPDATE_TOURS hitting
    // its identity fast path and ADD_COMPLETED for an id already present both
    // land here.
    if (nextState === state) return

    const prev = snapshot
    state = nextState
    rebuildSnapshot()
    applyTransitionEffects(ctx, prev, snapshot)
    notify()
  }

  const ctx: TourEngineContext = {
    getState: () => state,
    getCurrentTour: currentTour,
    getData: () => data,
    getStepIdMap: stepIdMap,
    dispatch,
    abortControllerRef,
    completedTourIdRef,
    skippedTourIdRef,
    router: options.router,
    autoNavigate: options.autoNavigate ?? true,
    maxHiddenChain: MAX_HIDDEN_CHAIN,
    onNavigationRequired: options.onNavigationRequired,
    onStepError: options.onStepError,
    completeTour: () => completeTourImpl(ctx),
    skipTour: () => skipTourImpl(ctx),
    setData: (key, value) => engineSetData(key, value),
    navigateToStep: (stepIndex) => navigateToStepImpl(ctx, stepIndex),
    persistTerminalTours,
    markCompleted: terminalStore.markCompleted,
    markSkipped: terminalStore.markSkipped,
    resetPersistence: terminalStore.reset,
    clearRouteState: routeStore.clear,
    saveRouteState: routeStore.save,
    saveFlowSession: flowSession.save,
    clearFlowSession: flowSession.clear,
    routePersistenceEnabled: !!routePersistence.enabled,
    flowSessionEnabled: !!routePersistence.flowSession,
    tabId: makeTabId(),
    announce: broadcast.post,
    crossTab,
    onTourPaused: options.onTourPaused,
    tourKitContext: options.analytics ?? null,
  }

  /**
   * `data` is not a reducer action — it was a separate `useState` in the
   * provider — but it IS part of the snapshot, so it has to rebuild and
   * notify like any dispatch or a Vue binding never re-renders on setData.
   */
  function engineSetData(key: string, value: unknown): void {
    if (destroyed) return
    data = { ...data, [key]: value }
    rebuildSnapshot()
    notify()
  }

  async function boot(): Promise<void> {
    if (destroyed || bootPhase !== 'idle') return
    bootPhase = 'booting'

    try {
      // Terminal tours first: the autostart rule reads completedTours.
      if (persistTerminalTours) {
        const completedTours = terminalStore.getCompletedTours()
        const skippedTours = terminalStore.getSkippedTours()
        if (completedTours.length > 0 || skippedTours.length > 0) {
          dispatch({ type: 'HYDRATE_TERMINAL_TOURS', completedTours, skippedTours })
        }
      }

      const flowBlob = flowSession.load()
      const decision = resolveBootStart({
        flowSession: flowBlob,
        flowIsStale: flowSession.isStale(),
        routeState: routeStore.load(),
        tours: [...state.tours.values()],
        completedTours: persistTerminalTours
          ? terminalStore.getCompletedTours()
          : state.completedTours,
      })

      if (!decision) return

      flowSession.setTourId(decision.tourId)
      await runBootStart(ctx, decision, {
        currentRoute: decision.source === 'flow' ? flowBlob?.currentRoute : undefined,
        signal: abortControllerRef.current?.signal,
        onClear: flowSession.clear,
      })
    } finally {
      bootPhase = 'ready'
    }
  }

  // Cross-tab pause and registry membership are lifecycle, not transition.
  teardown.push(subscribeCrossTabPause(ctx, broadcast.subscribe))
  teardown.push(registerTours(options.tours))

  function registerTours(tours: Tour[]): () => void {
    const unregisters = tours.map((tour) =>
      tourRegistry.register({
        id: tour.id,
        state: { isActive: false, currentStepId: null, progress: 0 },
        actions: {
          start: () => void engine.start(tour.id),
          stop: () => engine.stop(),
          restart: () => void engine.start(tour.id, 0),
          next: () => void engine.next(),
          prev: () => void engine.prev(),
          goToStep: (stepId) => void engine.goToStep(stepId),
        },
      })
    )
    return () => {
      for (const unregister of unregisters) unregister()
    }
  }

  /** Guards every async verb so a post-destroy call is a silent no-op. */
  const live =
    <A extends unknown[]>(fn: (...args: A) => Promise<void>) =>
    (...args: A): Promise<void> =>
      destroyed ? Promise.resolve() : fn(...args)

  const engine: TourEngine = {
    boot: live(boot),
    start: live((tourId?: string, stepIndex?: number) => startImpl(ctx, tourId, stepIndex)),
    next: live(() => nextImpl(ctx)),
    prev: live(() => prevImpl(ctx)),
    goTo: live((stepIndex: number) => goToImpl(ctx, stepIndex)),
    goToStep: live((stepId: string) => goToStepImpl(ctx, stepId)),
    startTour: live((tourId: string, stepId?: string | number) =>
      startTourImpl(ctx, tourId, stepId)
    ),
    triggerBranchAction: live((actionId: string, payload?: unknown) =>
      triggerBranchActionImpl(ctx, actionId, payload)
    ),

    skip: () => {
      if (!destroyed) skipTourImpl(ctx)
    },
    complete: () => {
      if (!destroyed) completeTourImpl(ctx)
    },
    stop: () => {
      if (!destroyed) stopImpl(ctx)
    },
    reset: (tourId?: string) => {
      if (!destroyed) resetImpl(ctx, tourId)
    },
    setData: engineSetData,

    setTours: (tours: Tour[]) => {
      if (destroyed) return
      for (const tour of tours) validateTour(tour)
      dispatch({ type: 'UPDATE_TOURS', tours })
    },

    getState: () => snapshot,

    subscribe: (listener: () => void) => {
      if (destroyed) return () => {}
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    // Terminal, idempotent, and NOT a pause. React 18 StrictMode runs
    // mount -> unmount -> mount on every effect, so §1.4 must create and
    // destroy the engine inside the same effect rather than memoizing the
    // engine and destroying it in a cleanup — that would boot a dead engine on
    // the second pass.
    destroy: () => {
      if (destroyed) return
      destroyed = true
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      flowSession.flush()
      broadcast.close()
      for (const off of teardown.splice(0)) off()
      listeners.clear()
    },
  }

  return engine
}
