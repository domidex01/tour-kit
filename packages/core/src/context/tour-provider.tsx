import * as React from 'react'
import { useAdvanceOn } from '../hooks/use-advance-on'
import { useBroadcast } from '../hooks/use-broadcast'
import { useFlowSession } from '../hooks/use-flow-session'
import { usePersistence } from '../hooks/use-persistence'
import { useRoutePersistence } from '../hooks/use-route-persistence'
import { explainTour } from '../lib/diagnostic'
import { TourValidationError, validateTour } from '../lib/validate-tour'
import { TourRouteError, waitForStepTarget } from '../lib/wait-for-step-target'
import { tourRegistry } from '../registry/tour-registry'
import type {
  BranchContext,
  BranchTarget,
  Tour,
  TourCallbackContext,
  TourContextValue,
  TourState,
  TourStep,
} from '../types'
import { defaultPersistenceConfig } from '../types/config'
import type { DiagnosticContext, DiagnosticGate, EligibilityReport } from '../types/diagnostic'
import type { MultiPagePersistenceConfig, RouterAdapter } from '../types/router'
import type { TestBridge } from '../types/test-bridge'
import {
  isBranchToTour,
  isBranchWait,
  isLoopDetected,
  isSpecialTarget,
  resolveBranch,
  resolveTargetToIndex,
} from '../utils/branch'
import { logger } from '../utils/logger'
import { TourContext } from './tour-context'
import { TourKitContext } from './tourkit-context'

/** Maximum hidden-step chain length before throwing HIDDEN_STEP_LOOP. */
const MAX_HIDDEN_CHAIN = 50

/**
 * Check if navigation is needed for a step
 */
function isNavigationNeeded(
  step: TourStep | undefined,
  router: RouterAdapter | undefined
): { needed: boolean; isOnRoute: boolean } {
  if (!step?.route || !router) {
    return { needed: false, isOnRoute: true }
  }

  const matchMode = step.routeMatch ?? 'exact'
  const isOnRoute = router.matchRoute(step.route, matchMode)
  return { needed: !isOnRoute, isOnRoute }
}

/**
 * Build TourCallbackContext for when/lifecycle callbacks
 */
function buildCallbackContext(
  state: TourState,
  tour: Tour | null,
  data: Record<string, unknown>
): TourCallbackContext {
  return {
    tourId: state.tourId,
    isActive: state.isActive,
    currentStepIndex: state.currentStepIndex,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    isLoading: state.isLoading,
    isTransitioning: state.isTransitioning,
    completedTours: state.completedTours,
    skippedTours: state.skippedTours,
    visitedSteps: state.visitedSteps,
    stepVisitCount: state.stepVisitCount,
    previousStepId: state.previousStepId,
    tour,
    data,
  }
}

/**
 * Evaluate step's when condition
 * @returns true if step should be shown, false if it should be skipped
 */
async function evaluateStepWhen(step: TourStep, context: TourCallbackContext): Promise<boolean> {
  if (!step.when) return true

  try {
    return await step.when(context)
  } catch (error) {
    logger.warn(`Error evaluating when condition for step "${step.id}":`, error)
    return false // Skip step on error
  }
}

/**
 * Find the next visible step index starting from a given index
 * @param startIndex - Index to start searching from (inclusive)
 * @param direction - 1 for forward, -1 for backward
 * @param steps - Array of tour steps
 * @param context - Callback context for when evaluation
 * @returns Index of next visible step, or -1 if none found
 */
async function findNextVisibleStepIndex(
  startIndex: number,
  direction: 1 | -1,
  steps: TourStep[],
  context: TourCallbackContext
): Promise<number> {
  let index = startIndex

  while (index >= 0 && index < steps.length) {
    const step = steps[index]
    if (!step) break

    // Update context with the potential new index for accurate evaluation
    const stepContext: TourCallbackContext = {
      ...context,
      currentStepIndex: index,
      currentStep: step,
    }
    const shouldShow = await evaluateStepWhen(step, stepContext)

    if (shouldShow) {
      return index
    }

    index += direction
  }

  return -1 // No visible step found
}

/**
 * Find the nearest visible step from a starting index
 * Tries forward first, then backward
 * @returns Index of nearest visible step, or -1 if none found
 */
async function findNearestVisibleStepIndex(
  startIndex: number,
  steps: TourStep[],
  context: TourCallbackContext
): Promise<number> {
  // Try forward first
  const forwardIndex = await findNextVisibleStepIndex(startIndex, 1, steps, context)
  if (forwardIndex !== -1) return forwardIndex

  // Try backward
  return findNextVisibleStepIndex(startIndex - 1, -1, steps, context)
}

// Action types for reducer
type TourAction =
  | { type: 'START_TOUR'; tourId: string; stepIndex?: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; stepIndex: number }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'STOP_TOUR' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'ADD_COMPLETED'; tourId: string }
  | { type: 'ADD_SKIPPED'; tourId: string }
  | { type: 'RESET'; tourId?: string }
  | { type: 'UPDATE_TOURS'; tours: Tour[] }
  | { type: 'TRACK_STEP_VISIT'; stepId: string; previousStepId: string | null }
  | { type: 'CLEAR_VISIT_TRACKING' }

interface TourReducerState extends TourState {
  tours: Map<string, Tour>
}

function createStoppedState(state: TourReducerState): TourReducerState {
  return {
    ...state,
    tourId: null,
    isActive: false,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 0,
    isLoading: false,
    isTransitioning: false,
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
  }
}

function handleStartTour(
  state: TourReducerState,
  tourId: string,
  stepIndex?: number
): TourReducerState {
  const tour = state.tours.get(tourId)
  if (!tour) return state

  const index = stepIndex ?? tour.startAt ?? 0
  const step = tour.steps[index]
  const stepId = step?.id

  // Initialize visit tracking
  const visitedSteps = stepId ? [stepId] : []
  const stepVisitCount = new Map<string, number>()
  if (stepId) {
    stepVisitCount.set(stepId, 1)
  }

  return {
    ...state,
    tourId,
    isActive: true,
    currentStepIndex: index,
    currentStep: step ?? null,
    totalSteps: tour.steps.length,
    isLoading: false,
    isTransitioning: false,
    visitedSteps,
    stepVisitCount,
    previousStepId: null,
  }
}

function handleStepNavigation(state: TourReducerState, newIndex: number): TourReducerState {
  const tour = state.tours.get(state.tourId ?? '')
  if (!tour || newIndex < 0 || newIndex >= tour.steps.length) {
    return state
  }

  return {
    ...state,
    currentStepIndex: newIndex,
    currentStep: tour.steps[newIndex] ?? null,
    isTransitioning: false,
  }
}

function handleReset(state: TourReducerState, tourId?: string): TourReducerState {
  if (tourId) {
    return {
      ...state,
      completedTours: state.completedTours.filter((id) => id !== tourId),
      skippedTours: state.skippedTours.filter((id) => id !== tourId),
    }
  }
  return {
    ...state,
    completedTours: [],
    skippedTours: [],
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reducer handles many action variants in one switch
function tourReducer(state: TourReducerState, action: TourAction): TourReducerState {
  switch (action.type) {
    case 'START_TOUR':
      return handleStartTour(state, action.tourId, action.stepIndex)
    case 'NEXT_STEP':
      return handleStepNavigation(state, state.currentStepIndex + 1)
    case 'PREV_STEP':
      return handleStepNavigation(state, state.currentStepIndex - 1)
    case 'GO_TO_STEP':
      return handleStepNavigation(state, action.stepIndex)
    case 'SKIP_TOUR':
    case 'COMPLETE_TOUR':
    case 'STOP_TOUR':
      return createStoppedState(state)
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }
    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.isTransitioning }
    case 'ADD_COMPLETED':
      return state.completedTours.includes(action.tourId)
        ? state
        : { ...state, completedTours: [...state.completedTours, action.tourId] }
    case 'ADD_SKIPPED':
      return state.skippedTours.includes(action.tourId)
        ? state
        : { ...state, skippedTours: [...state.skippedTours, action.tourId] }
    case 'RESET':
      return handleReset(state, action.tourId)
    case 'UPDATE_TOURS': {
      // Fast-path: if the incoming array is shallow-equal to what we already
      // have (same size, same per-id reference), skip the re-keyed Map and
      // the downstream currentTour/stepIdMap invalidation. Consumers often
      // pass inline arrays like `tours={[a, b]}` where the array identity
      // changes every render but the tour objects themselves don't.
      const sameIdentity =
        state.tours.size === action.tours.length &&
        action.tours.every((t) => state.tours.get(t.id) === t)
      if (sameIdentity) return state

      const newTours = new Map(action.tours.map((t) => [t.id, t]))

      // If there's an active tour, refresh currentStep from the updated tour
      // This ensures step properties like onAction are synchronized
      if (state.isActive && state.tourId) {
        const updatedTour = newTours.get(state.tourId)
        if (updatedTour?.steps[state.currentStepIndex]) {
          return {
            ...state,
            tours: newTours,
            currentStep: updatedTour.steps[state.currentStepIndex],
            totalSteps: updatedTour.steps.length,
          }
        }
      }

      return { ...state, tours: newTours }
    }
    case 'TRACK_STEP_VISIT': {
      const newVisitedSteps = state.visitedSteps.includes(action.stepId)
        ? state.visitedSteps
        : [...state.visitedSteps, action.stepId]
      const newStepVisitCount = new Map(state.stepVisitCount)
      newStepVisitCount.set(action.stepId, (newStepVisitCount.get(action.stepId) ?? 0) + 1)
      return {
        ...state,
        visitedSteps: newVisitedSteps,
        stepVisitCount: newStepVisitCount,
        previousStepId: action.previousStepId,
      }
    }
    case 'CLEAR_VISIT_TRACKING':
      return {
        ...state,
        visitedSteps: [],
        stepVisitCount: new Map(),
        previousStepId: null,
      }
    default:
      return state
  }
}

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

  // Dev-mode hint: fire once per provider mount when `diagnose` is unset.
  // Gated on NODE_ENV !== 'production' so prod builds stay silent.
  const diagnoseHintFiredRef = React.useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-once warning, not a reactive concern
  React.useEffect(() => {
    if (diagnose) return
    if (diagnoseHintFiredRef.current) return
    if (typeof process === 'undefined' || process.env?.NODE_ENV === 'production') return
    diagnoseHintFiredRef.current = true
    console.warn(
      '[Tour Kit] Tip: pass <TourProvider diagnose> in dev to see why a tour did not fire. https://tourkit.dev/docs/core/diagnostic'
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
    completedTours: persistTerminalTours ? getCompletedTours() : [],
    skippedTours: persistTerminalTours ? getSkippedTours() : [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    tours: new Map(tours.map((t) => [t.id, t])),
  }

  const [state, dispatch] = React.useReducer(tourReducer, initialState)

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

  // flowSession-restore: takes precedence over useRoutePersistence — it's
  // tour-scoped (single active tour) vs the route-state's multi-tour scope.
  // Runs once per mount, but waits for the tour list to be populated. The
  // declarative `<Tour>` registration path (via `MultiTourKitProvider`)
  // mounts children AFTER the parent's first effect tick, so a strict
  // mount-only effect with `[]` deps would bail with `tours = []`. The ref
  // guard makes it idempotent across the inevitable tours-change re-runs.
  //
  // Phase 1.3 — cross-page resume: if the restored blob has a `currentRoute`
  // that differs from the current router pathname, navigate first and await
  // the target before dispatching START_TOUR. On any failure, clear the
  // session — a stale/wrong route will never recover on its own.
  const flowRestoreAttemptedRef = React.useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: idempotent via flowRestoreAttemptedRef; we only re-run when `tours` populates
  React.useEffect(() => {
    if (flowRestoreAttemptedRef.current) return
    const restored = flow.session
    if (!restored || flow.isStale) return
    if (tours.length === 0) return // wait for declarative <Tour> children
    const restoredTour = tours.find((t) => t.id === restored.tourId)
    flowRestoreAttemptedRef.current = true
    if (!restoredTour) return

    // `flow-restore` timer — visible in DevTools / Playwright's console
    // listener, lets consumers verify the hard-refresh resume budget. The
    // phase-1.3 target is < 200ms wall time from mount to `START_TOUR`.
    // Instrumented on BOTH paths (sync same-route restore and async
    // navigate-then-wait) so the metric fires for the common case too.
    const startTimer = () => {
      if (typeof console !== 'undefined' && typeof console.time === 'function') {
        console.time('flow-restore')
      }
    }
    let timerEnded = false
    const endTimer = () => {
      if (timerEnded) return
      timerEnded = true
      if (typeof console !== 'undefined' && typeof console.timeEnd === 'function') {
        console.timeEnd('flow-restore')
      }
    }

    const dispatchStart = () => {
      dispatch({
        type: 'START_TOUR',
        tourId: restored.tourId,
        stepIndex: restored.stepIndex,
      })
    }

    const needsRouteRestore =
      restored.currentRoute && router && restored.currentRoute !== router.getCurrentRoute()

    if (!needsRouteRestore) {
      startTimer()
      dispatchStart()
      endTimer()
      return
    }

    const targetStep = restoredTour.steps[restored.stepIndex]
    // Narrowing: `needsRouteRestore` proved `currentRoute` is a string.
    const route = restored.currentRoute as string
    // Cancellation: the restore IIFE awaits async work (navigate +
    // MutationObserver). If the provider unmounts mid-await, dispatch /
    // flow.clear would mutate a dead instance and write to storage on
    // behalf of a tour the user has already left.
    let cancelled = false
    startTimer()
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: restore orchestrator (navigate + wait + cancellation guards)
    void (async () => {
      try {
        await router.navigate(route)
        if (cancelled) {
          endTimer()
          return
        }
        if (targetStep) {
          await waitForStepTarget(targetStep, {
            route,
            timeoutMs: targetStep.waitTimeout ?? 3000,
          })
          if (cancelled) {
            endTimer()
            return
          }
        }
        dispatchStart()
        endTimer()
      } catch {
        endTimer()
        if (cancelled) return
        // Stale session (route 404, target missing). Clear so the next mount
        // doesn't loop on the same broken state.
        flow.clear()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tours])

  // Restore persisted state on mount — and re-run when another tab writes
  // (externalVersion bumps whenever `syncTabs` is on and the storage key changes).
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount / external sync
  React.useEffect(() => {
    // flowSession restore (above) wins — skip route restore if it already
    // dispatched START_TOUR.
    if (flow.session && !flow.isStale) return
    const persisted = load()
    if (persisted?.tourId && tours.some((t) => t.id === persisted.tourId)) {
      dispatch({
        type: 'START_TOUR',
        tourId: persisted.tourId,
        stepIndex: persisted.stepIndex,
      })
    }
  }, [externalVersion])

  // Auto-start tours declaring autoStart on mount
  // Persistence restore takes precedence — read persisted state synchronously
  // so we don't double-dispatch in the same mount batch.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only autoStart trigger
  React.useEffect(() => {
    if (flow.session && !flow.isStale) return
    const persisted = load()
    if (persisted?.tourId && tours.some((t) => t.id === persisted.tourId)) return
    const auto = tours.find((t) => t.autoStart)
    if (!auto) return
    const completedTours = persistTerminalTours ? getCompletedTours() : state.completedTours
    if (completedTours.includes(auto.id)) return
    dispatch({
      type: 'START_TOUR',
      tourId: auto.id,
      stepIndex: auto.startAt ?? 0,
    })
  }, [])

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

  // Run a hidden step's lifecycle and compute the next cursor. Returns
  // either the next step index, or 'terminate' (caller should stop the
  // chain by walking past end of steps array).
  const advancePastHiddenStep = React.useCallback(
    async (
      step: TourStep,
      cursor: number,
      tour: Tour,
      stepIdLookup: Map<string, number>
    ): Promise<number | 'terminate'> => {
      const baseCtx = buildCallbackContext(state, tour, data)
      const stepCtx: TourCallbackContext = {
        ...baseCtx,
        currentStepIndex: cursor,
        currentStep: step,
      }
      // Hidden-step lifecycle: onEnter pre-mount, then legacy onShow.
      await step.onEnter?.(stepCtx)
      await step.onShow?.(stepCtx)

      if (step.onNext === undefined || step.onNext === null) {
        return cursor + 1
      }

      const branchCtx: BranchContext = { ...stepCtx, setData }
      const target = await resolveBranch(step.onNext, branchCtx)

      if (target === 'complete' || target === 'skip') {
        return 'terminate'
      }

      const idx = resolveTargetToIndex(target, cursor, stepIdLookup, tour.steps.length)
      // Unmappable target (BranchToTour, BranchWait, etc.) — fall back to +1.
      return idx ?? cursor + 1
    },
    [state, data, setData]
  )

  // Route-aware step navigation. Walks past hidden steps (firing their
  // `onEnter`/`onShow` lifecycle) until a mountable step is reached, then
  // dispatches GO_TO_STEP. Throws TourValidationError on hidden-step loops.
  //
  // Per-step `routeChangeStrategy` (Phase 1.3):
  // - 'auto'   (default): navigate, await target via `waitForStepTarget`,
  //   dispatch. On `TourRouteError`: fire `onStepError`, STOP_TOUR.
  // - 'prompt': fire `onNavigationRequired(route, stepId)`, do NOT dispatch.
  // - 'manual': do nothing — consumer drives navigation explicitly.
  const navigateToStep = React.useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: hidden-traversal + route navigation in one orchestrator
    async (stepIndex: number): Promise<boolean> => {
      if (!currentTour) {
        dispatch({ type: 'GO_TO_STEP', stepIndex })
        return true
      }

      const localStepIdMap = new Map<string, number>()
      currentTour.steps.forEach((s, i) => localStepIdMap.set(s.id, i))

      let cursor = stepIndex
      for (let chain = 0; chain <= MAX_HIDDEN_CHAIN; chain++) {
        const step = currentTour.steps[cursor]
        if (!step) {
          dispatch({ type: 'GO_TO_STEP', stepIndex: cursor })
          return false
        }

        if (step.kind !== 'hidden') {
          const { needed } = isNavigationNeeded(step, router)
          if (!needed || !step.route || !router) {
            dispatch({ type: 'GO_TO_STEP', stepIndex: cursor })
            return true
          }

          // `autoNavigate: false` (legacy) is equivalent to per-step 'prompt'
          // and still surfaces via `onNavigationRequired`.
          if (!autoNavigate) {
            onNavigationRequired?.(step.route, step.id)
            return false
          }

          const strategy = step.routeChangeStrategy ?? 'auto'

          if (strategy === 'manual') {
            // Consumer drives navigation. Do not dispatch — `useTourRoute()`
            // handles `goToStepRoute()` and the next provider tick will
            // re-enter once the route matches.
            return false
          }

          if (strategy === 'prompt') {
            onNavigationRequired?.(step.route, step.id)
            return false
          }

          // strategy === 'auto'
          try {
            // RouterAdapter.navigate returns:
            //   App Router / React Router → undefined (sync)
            //   Pages Router               → Promise<boolean>
            //
            // A literal `false` from Pages Router means the navigation was
            // cancelled (e.g. another `push()` raced ahead, beforeunload, a
            // route guard rejected). Surface as a typed reject instead of
            // silently waiting 3 seconds for a target that will never mount.
            const navResult = await router.navigate(step.route)
            if (navResult === false) {
              throw new TourRouteError({
                code: 'NAVIGATION_REJECTED',
                route: step.route,
                message: `Router rejected navigation to "${step.route}".`,
              })
            }

            // Honor the legacy `routeDelay` knob before observing — gives
            // route-bound suspense / data-fetch a beat to flush so the
            // MutationObserver doesn't burn its 3s budget on hydration.
            if (step.routeDelay && step.routeDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, step.routeDelay))
            }

            await waitForStepTarget(step, {
              route: step.route,
              timeoutMs: step.waitTimeout ?? 3000,
              signal: abortControllerRef.current?.signal,
            })
          } catch (err) {
            // Cooperative cancellation (STOP_TOUR / unmount) — silent.
            if (abortControllerRef.current?.signal.aborted) return false
            if (err instanceof TourRouteError) {
              onStepError?.(err)
              dispatch({ type: 'STOP_TOUR' })
              return false
            }
            throw err
          }

          dispatch({ type: 'GO_TO_STEP', stepIndex: cursor })
          return true
        }

        const next = await advancePastHiddenStep(step, cursor, currentTour, localStepIdMap)
        if (next === 'terminate') {
          // Walk past end so caller's outer flow can handle complete/skip.
          dispatch({ type: 'GO_TO_STEP', stepIndex: currentTour.steps.length })
          return false
        }
        cursor = next
      }

      // Loop guard: hidden chain exceeded the maximum.
      const stuckStep = currentTour.steps[cursor]
      throw new TourValidationError({
        code: 'HIDDEN_STEP_LOOP',
        stepId: stuckStep?.id ?? '?',
        message: `Hidden-step chain exceeded ${MAX_HIDDEN_CHAIN} iterations${stuckStep ? ` at step "${stuckStep.id}"` : ''}. Likely an infinite loop.`,
      })
    },
    [currentTour, router, autoNavigate, onNavigationRequired, onStepError, advancePastHiddenStep]
  )

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

  // Handle branch target resolution and navigation
  const handleBranchTarget = React.useCallback(
    async (
      target: BranchTarget,
      branchContext: BranchContext,
      actionId?: string
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: branch navigation with multiple target types
    ): Promise<void> => {
      if (!currentTour || !state.currentStep) return

      const currentStepId = state.currentStep.id

      // null - stay on current step
      if (target === null) {
        dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }

      // Special targets
      if (isSpecialTarget(target)) {
        switch (target) {
          case 'complete':
            completeTour()
            return

          case 'skip':
            skipTour()
            return

          case 'restart': {
            dispatch({ type: 'CLEAR_VISIT_TRACKING' })
            dispatch({ type: 'GO_TO_STEP', stepIndex: 0 })
            const firstStep = currentTour.steps[0]
            if (firstStep) {
              dispatch({
                type: 'TRACK_STEP_VISIT',
                stepId: firstStep.id,
                previousStepId: currentStepId,
              })
              tourKitContext?.onStepView?.(currentTour.id, firstStep.id, 0)
            }
            return
          }

          case 'next':
          case 'prev':
            // Resolve to index and continue
            break
        }
      }

      // BranchToTour - cross-tour navigation
      if (isBranchToTour(target)) {
        const toTour = state.tours.get(target.tour)
        if (!toTour) {
          logger.warn(`Branch target tour "${target.tour}" not found`)
          dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
          return
        }

        // Fire analytics callbacks
        tourKitContext?.onTourBranch?.(currentTour.id, target.tour, currentStepId)
        currentTour.onTourBranch?.(target.tour, currentStepId)

        // Stop current tour and start new one
        dispatch({ type: 'STOP_TOUR' })

        // Resolve step in new tour
        let newStepIndex = 0
        if (target.step !== undefined) {
          if (typeof target.step === 'number') {
            newStepIndex = target.step
          } else {
            const newTourStepMap = new Map<string, number>()
            toTour.steps.forEach((s, i) => newTourStepMap.set(s.id, i))
            newStepIndex = newTourStepMap.get(target.step) ?? 0
          }
        }

        // Re-arm terminal-callback guards for the new tour
        completedTourIdRef.current = null
        skippedTourIdRef.current = null

        dispatch({ type: 'START_TOUR', tourId: target.tour, stepIndex: newStepIndex })
        tourKitContext?.onTourStart?.(target.tour)
        toTour.onStart?.({ ...state, tour: toTour, data })
        return
      }

      // BranchWait - delay before proceeding
      if (isBranchWait(target)) {
        await new Promise((resolve) => setTimeout(resolve, target.wait))
        if (target.then) {
          await handleBranchTarget(target.then, branchContext, actionId)
        }
        return
      }

      // Resolve target to index
      const targetIndex = resolveTargetToIndex(
        target,
        state.currentStepIndex,
        stepIdMap,
        currentTour.steps.length
      )

      if (targetIndex === null || targetIndex === state.currentStepIndex) {
        dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }

      // Check for loop detection
      const targetStep = currentTour.steps[targetIndex]
      if (targetStep && isLoopDetected(targetStep.id, state.stepVisitCount)) {
        logger.warn(
          `Loop detected: step "${targetStep.id}" visited too many times. Stopping navigation.`
        )
        dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }

      // Apply when filter to the target step
      const context = buildCallbackContext(state, currentTour, data)
      const stepContext: TourCallbackContext = {
        ...context,
        currentStepIndex: targetIndex,
        currentStep: targetStep ?? null,
      }

      if (targetStep) {
        const shouldShow = await evaluateStepWhen(targetStep, stepContext)
        if (!shouldShow) {
          // Find next visible step in the appropriate direction
          const direction = targetIndex > state.currentStepIndex ? 1 : -1
          const visibleIndex = await findNextVisibleStepIndex(
            targetIndex + direction,
            direction as 1 | -1,
            currentTour.steps,
            context
          )

          if (visibleIndex === -1) {
            // No visible steps, complete the tour
            completeTour()
            return
          }

          // Navigate to the visible step instead
          const navigated = await navigateToStep(visibleIndex)
          if (!navigated) {
            dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
            return
          }
          const step = currentTour.steps[visibleIndex]
          if (step) {
            dispatch({
              type: 'TRACK_STEP_VISIT',
              stepId: step.id,
              previousStepId: currentStepId,
            })
            tourKitContext?.onStepView?.(currentTour.id, step.id, visibleIndex)
            currentTour.onStepChange?.(step, visibleIndex, {
              ...state,
              tour: currentTour,
              data,
            })
          }
          return
        }
      }

      // Navigate to target step
      const navigated = await navigateToStep(targetIndex)
      if (!navigated) {
        dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false })
        return
      }
      if (targetStep) {
        dispatch({
          type: 'TRACK_STEP_VISIT',
          stepId: targetStep.id,
          previousStepId: currentStepId,
        })
        tourKitContext?.onStepView?.(currentTour.id, targetStep.id, targetIndex)
        currentTour.onStepChange?.(targetStep, targetIndex, {
          ...state,
          tour: currentTour,
          data,
        })
      }
    },
    [currentTour, state, data, stepIdMap, tourKitContext, navigateToStep, completeTour, skipTour]
  )

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
