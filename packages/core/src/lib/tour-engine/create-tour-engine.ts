/**
 * v2 §1.3f — `createTourEngine()`, the second adapter.
 *
 * Adapter A is `<TourProvider>`'s ref bag. This is adapter B: the same
 * `TourEngineContext` port backed by plain fields on a closure. Neither knows
 * the other exists, and both drive the identical reducer, boot resolver,
 * actions and transition effects.
 *
 * Mostly assembly — the reducer, boot resolver, actions and transition effects
 * each have their own suite. What it owns outright, and what therefore has to
 * be read here rather than assumed: the boot lifecycle (the `bootPhase` latch,
 * the empty-tours deferral and its `setTours` re-arm), the cross-tab route
 * re-hydration, and the `liveOptions` accessor layer `setOptions` writes
 * through.
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
import type { PersistenceConfig, Storage as StorageAdapter } from '../../types'
import { defaultPersistenceConfig } from '../../types/config'
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
  setDontShowAgainImpl,
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
   *
   * This is the package's own 3-method adapter contract (`types/config.ts`),
   * NOT the DOM `Storage` — a bare `Storage` here resolves to `lib.dom` and
   * silently demands `length` / `clear` / `key`, rejecting the very shape the
   * docs tell consumers to implement.
   */
  storage?: StorageAdapter
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
  /**
   * Run the restore chain. Idempotent, and a no-op after `destroy()`.
   *
   * A boot on an engine with no tours does NOT latch — it is deferred until
   * `setTours()` supplies some, because the declarative `<Tour>` path
   * registers children after the parent's first effect.
   */
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
  /**
   * Commit any pending throttled write immediately, leaving the engine live.
   *
   * `destroy()` has always done this on the way out. A binding needs it on its
   * own because the flow-session save is trailing-edge throttled at 200 ms: an
   * unmount immediately followed by a remount — a fast client-side route
   * change, or React tearing an effect down and re-running it — otherwise lets
   * the new engine boot and read a step the old one had already left.
   *
   * A no-op after `destroy()`.
   */
  flush: () => void
  /**
   * Still a no-op body (`setDontShowAgainImpl`), and present only so the
   * engine covers all thirteen `TourActions` keys — the React binding selects
   * its context value straight off this object. Wiring it is the first
   * post-1.4 item.
   */
  setDontShowAgain: (tourId: string, value: boolean) => void
  /**
   * Push the props that legitimately change identity after mount.
   *
   * A binding re-runs this every commit: every built-in router adapter is a
   * `useMemo` over the host router's hook results, so freezing `router` at
   * construction navigates through a dead adapter after the first route
   * change. Not live, deliberately: `tours` (that is `setTours`), `storage`,
   * `persistence` and `routePersistence` — their adapters are built once.
   *
   * A no-op after `destroy()`.
   */
  setOptions: (patch: Partial<TourEngineLiveOptions>) => void
}

/**
 * The options a binding may change after construction.
 *
 * Derived from `CreateTourEngineOptions` rather than declared, so it cannot
 * drift from the options it mirrors.
 */
export type TourEngineLiveOptions = Pick<
  CreateTourEngineOptions,
  'router' | 'autoNavigate' | 'analytics' | 'onNavigationRequired' | 'onStepError' | 'onTourPaused'
>

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
  // The provider's expression, verbatim (was `tour-provider.tsx:164`).
  // `defaultPersistenceConfig.enabled` is `true`, so terminal-tour memory is
  // ON unless a consumer turns it off — a bare `?? false` here silently lost
  // every React user's completed-tour list on reload.
  const persistTerminalTours =
    (options.persistence?.enabled ?? defaultPersistenceConfig.enabled) &&
    (options.persistence?.trackCompleted ?? defaultPersistenceConfig.trackCompleted)

  // Adapters. Constructing these reads nothing — the flow session's
  // no-read-on-construct contract is what makes the whole factory SSR-safe.
  const terminalStore = createTerminalStore(options.persistence, options.storage)
  const routeStore = createRouteStore(routePersistence, options.storage)
  const flowSession = createFlowSession(
    // `keyPrefix` from the route key, exactly as the provider composed it
    // (was `tour-provider.tsx:288`). Without it a consumer who namespaced
    // their route state with `key` had the flow blob written to
    // `tourkit:flow:active` instead of `<key>:flow:active` — an in-flight
    // resume silently lost on upgrade.
    routePersistence.flowSession
      ? { ...routePersistence.flowSession, keyPrefix: routePersistence.key }
      : undefined,
    options.storage,
    // The engine has no render pass to mirror into; the factory's own copy is
    // the only one.
    undefined
  )
  const broadcast = createBroadcast<CrossTabActiveMessage>(
    routePersistence.crossTab?.channel ?? 'tourkit:active-flow',
    { enabled: !!routePersistence.crossTab?.enabled }
  )

  /**
   * The props a binding may replace after construction (`setOptions`). Read
   * through accessors on `ctx` below, so every impl's `ctx.router` stays the
   * plain field read it has always been.
   */
  const liveOptions: TourEngineLiveOptions = {
    router: options.router,
    autoNavigate: options.autoNavigate ?? true,
    analytics: options.analytics,
    onNavigationRequired: options.onNavigationRequired,
    onStepError: options.onStepError,
    onTourPaused: options.onTourPaused,
  }

  // ─── Engine state ────────────────────────────────────────────────────────
  let state = initialReducerState(options.tours)
  let data: Record<string, unknown> = {}
  let snapshot: TourCallbackContext = buildCallbackContext(state, null, data)
  let destroyed = false
  let bootPhase: BootPhase = 'idle'
  /** A `boot()` that found no tours and is waiting for `setTours` to supply some. */
  let bootRequested = false
  /** The cross-tab route listener is installed on the first real boot, once. */
  let storageSubscribed = false

  const listeners = new Set<() => void>()
  const abortControllerRef: { current: AbortController | null } = { current: null }
  const bootAbortRef: { current: AbortController | null } = { current: null }
  const completedTourIdRef: { current: string | null } = { current: null }
  const skippedTourIdRef: { current: string | null } = { current: null }
  const crossTab: { lastAnnounceTs: number | null } = { lastAnnounceTs: null }
  const teardown: Array<() => void> = []
  /** Registry id -> the unregister fn `tourRegistry.register` handed back. */
  const registered = new Map<string, () => void>()

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
    // Accessors, not fields: `TourEngineContext` is an interface of plain
    // properties and an object literal with getters satisfies it structurally,
    // so every `ctx.router` read stays what it was while `setOptions` can move
    // the value underneath it.
    get router() {
      return liveOptions.router
    },
    get autoNavigate() {
      return liveOptions.autoNavigate ?? true
    },
    maxHiddenChain: MAX_HIDDEN_CHAIN,
    get onNavigationRequired() {
      return liveOptions.onNavigationRequired
    },
    get onStepError() {
      return liveOptions.onStepError
    },
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
    get onTourPaused() {
      return liveOptions.onTourPaused
    },
    get tourKitContext() {
      return liveOptions.analytics ?? null
    },
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

  /**
   * The input `resolveBootStart` needs, in one place.
   *
   * Both callers below used to build this literal themselves, four of the five
   * fields byte-identical. A change to the precedence input that updated one
   * and not the other is exactly the adapter-drift class §1.4a exists to
   * close, so it does not get to live here.
   *
   * `boot()` passes its already-loaded blob because it needs
   * `flowBlob?.currentRoute` afterwards; nobody else does.
   */
  const bootInput = (flowBlob = flowSession.load()) => ({
    flowSession: flowBlob,
    flowIsStale: flowSession.isStale(),
    routeState: routeStore.load(),
    tours: [...state.tours.values()],
    completedTours: persistTerminalTours ? terminalStore.getCompletedTours() : state.completedTours,
  })

  /**
   * Re-run the precedence rule for a *route* restore only, after another tab
   * wrote our key.
   *
   * Route restore is the one boot source allowed to run more than once — the
   * provider re-ran its boot effect on `externalVersion` and that is the whole
   * point of `syncTabs`. Flow restore and autostart stay once per engine.
   */
  async function rehydrateFromRoute(): Promise<void> {
    if (destroyed) return

    const decision = resolveBootStart(bootInput())

    if (decision?.source !== 'route') return

    // Same-route only, as the provider's was: the blob a sibling tab wrote
    // carries no route of its own.
    await runBootStart(ctx, decision, {
      signal: new AbortController().signal,
      onClear: flowSession.clear,
    })
  }

  async function boot(): Promise<void> {
    if (destroyed || bootPhase !== 'idle') return

    // Not a latch: the declarative `<Tour>` path (via `MultiTourKitProvider`)
    // registers children AFTER the parent's first effect, so an empty engine
    // is "not yet", not "never". `setTours` re-arms it. The provider has
    // always returned here without latching (was `tour-provider.tsx:344`).
    if (state.tours.size === 0) {
      bootRequested = true
      return
    }

    bootPhase = 'booting'

    if (routePersistence.syncTabs && !storageSubscribed) {
      storageSubscribed = true
      teardown.push(routeStore.subscribeStorage(() => void rehydrateFromRoute()))
    }

    // Boot owns its own controller. `abortControllerRef` is written only by
    // `applyTransitionEffects` on a tour-identity change, so it is null here
    // and every `signal?.aborted` check inside `runBootStart` would be dead —
    // a `destroy()` mid-restore would still fall into the catch and clear a
    // flow session the user is in the middle of.
    const bootAbort = new AbortController()
    bootAbortRef.current = bootAbort

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
      const decision = resolveBootStart(bootInput(flowBlob))

      if (!decision) return

      await runBootStart(ctx, decision, {
        currentRoute: decision.source === 'flow' ? flowBlob?.currentRoute : undefined,
        signal: bootAbort.signal,
        onClear: flowSession.clear,
      })
    } finally {
      bootPhase = 'ready'
      if (bootAbortRef.current === bootAbort) bootAbortRef.current = null
    }
  }

  // Cross-tab pause and registry membership are lifecycle, not transition.
  teardown.push(subscribeCrossTabPause(ctx, broadcast.subscribe))
  syncRegistry(options.tours)
  teardown.push(() => {
    for (const unregister of registered.values()) unregister()
    registered.clear()
  })

  /**
   * Bring registry membership in line with `tours`, by id.
   *
   * An id-diff and NOT unregister-all-and-re-register, even though that is the
   * shorter patch: `transition-effects.ts` mirrors `isActive` /
   * `currentStepId` / `progress` into the registry on every transition and
   * `register()` seeds `isActive: false`, so re-registering the running tour
   * would zero its mirror until the next transition moved it.
   */
  function syncRegistry(tours: Tour[]): void {
    const nextIds = new Set(tours.map((tour) => tour.id))

    for (const [id, unregister] of registered) {
      if (nextIds.has(id)) continue
      unregister()
      registered.delete(id)
    }

    for (const tour of tours) {
      if (registered.has(tour.id)) continue
      registered.set(
        tour.id,
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

    flush: () => {
      if (!destroyed) flowSession.flush()
    },

    setDontShowAgain: (tourId: string, value: boolean) => {
      if (!destroyed) setDontShowAgainImpl(ctx, tourId, value)
    },

    setOptions: (patch: Partial<TourEngineLiveOptions>) => {
      if (!destroyed) Object.assign(liveOptions, patch)
    },

    setTours: (tours: Tour[]) => {
      if (destroyed) return
      for (const tour of tours) validateTour(tour)
      // Registry first: `dispatch` runs `applyTransitionEffects`, whose
      // registry mirror walks the NEW tour set, so a tour added here gets its
      // first mirror write in the same turn instead of the next transition.
      syncRegistry(tours)
      dispatch({ type: 'UPDATE_TOURS', tours })

      // The deferred boot, re-armed. Gated on `bootRequested` and NOT on
      // "tours arrived": auto-booting every `setTours` would start a tour on
      // an engine whose owner never asked to boot at all.
      if (bootRequested && bootPhase === 'idle' && tours.length > 0) {
        bootRequested = false
        void boot()
      }
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
      bootAbortRef.current?.abort()
      bootAbortRef.current = null
      flowSession.flush()
      broadcast.close()
      for (const off of teardown.splice(0)) off()
      listeners.clear()
    },
  }

  return engine
}
