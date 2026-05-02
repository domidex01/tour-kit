import * as React from 'react'
import { useAdvanceOn } from '../hooks/use-advance-on'
import { useBroadcast } from '../hooks/use-broadcast'
import { useFlowSession } from '../hooks/use-flow-session'
import { useRoutePersistence } from '../hooks/use-route-persistence'
import type {
  BranchContext,
  BranchTarget,
  Tour,
  TourCallbackContext,
  TourContextValue,
  TourState,
  TourStep,
} from '../types'
import type { MultiPagePersistenceConfig, RouterAdapter } from '../types/router'
import {
  isBranchToTour,
  isBranchWait,
  isLoopDetected,
  isSpecialTarget,
  resolveBranch,
  resolveTargetToIndex,
} from '../utils/branch'
import { waitForElement } from '../utils/dom'
import { logger } from '../utils/logger'
import { TourContext } from './tour-context'
import { TourKitContext } from './tourkit-context'

/**
 * Helper to perform route navigation and wait for target element
 */
async function performRouteNavigation(
  router: RouterAdapter,
  step: TourStep,
  route: string
): Promise<void> {
  await router.navigate(route)

  // Wait for navigation to complete
  const delay = step.routeDelay ?? 100
  await new Promise((resolve) => setTimeout(resolve, delay))

  // If waitForTarget, wait for element
  if (step.waitForTarget && typeof step.target === 'string') {
    try {
      await waitForElement(step.target, step.waitTimeout ?? 5000)
    } catch {
      // Element not found, but continue anyway
    }
  }
}

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
      return { ...state, completedTours: [...state.completedTours, action.tourId] }
    case 'ADD_SKIPPED':
      return { ...state, skippedTours: [...state.skippedTours, action.tourId] }
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
}: TourProviderProps) {
  const tourKitContext = React.useContext(TourKitContext)
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
    completedTours: [],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    tours: new Map(tours.map((t) => [t.id, t])),
  }

  const [state, dispatch] = React.useReducer(tourReducer, initialState)

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
  // Mount-only: read whatever flow:active blob exists and start that tour.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only flow restore
  React.useEffect(() => {
    if (!flow.session || flow.isStale) return
    if (!tours.some((t) => t.id === flow.session!.tourId)) return
    dispatch({
      type: 'START_TOUR',
      tourId: flow.session.tourId,
      stepIndex: flow.session.stepIndex,
    })
  }, [])

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

  // Throttled flowSession save on step change while active.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only save on tracked state transitions
  React.useEffect(() => {
    if (state.isActive && state.tourId && routePersistence.flowSession) {
      flow.save(state.currentStepIndex)
    }
  }, [
    state.currentStepIndex,
    state.isActive,
    state.tourId,
    flow.save,
    routePersistence.flowSession,
  ])

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

  // Route-aware step navigation helper
  const navigateToStep = React.useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const step = currentTour?.steps[stepIndex]
      const { needed } = isNavigationNeeded(step, router)

      // No navigation needed - just go to step
      if (!needed || !step?.route || !router) {
        dispatch({ type: 'GO_TO_STEP', stepIndex })
        return true
      }

      // Navigation needed but auto-navigate is off
      if (!autoNavigate) {
        onNavigationRequired?.(step.route, step.id)
        return false
      }

      // Perform navigation
      await performRouteNavigation(router, step, step.route)
      dispatch({ type: 'GO_TO_STEP', stepIndex })
      return true
    },
    [currentTour, router, autoNavigate, onNavigationRequired]
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
    [state, currentTour, data]
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
    dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
    dispatch({ type: 'COMPLETE_TOUR' })
    clear()
    tourKitContext?.onTourComplete?.(currentTour.id)
    currentTour.onComplete?.({ ...state, tour: currentTour, data })
  }, [currentTour, state, data, tourKitContext, clear])

  // Helper to skip the current tour. Mirrors completeTour for skip semantics.
  const skipTour = React.useCallback(() => {
    if (!state.isActive || !currentTour) return
    if (skippedTourIdRef.current === currentTour.id) return
    skippedTourIdRef.current = currentTour.id
    dispatch({ type: 'ADD_SKIPPED', tourId: currentTour.id })
    dispatch({ type: 'SKIP_TOUR' })
    clear()
    tourKitContext?.onTourSkip?.(currentTour.id, state.currentStepIndex)
    currentTour.onSkip?.({ ...state, tour: currentTour, data })
  }, [currentTour, state, data, tourKitContext, clear])

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
          if (navigated) {
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
          }
          return
        }
      }

      // Navigate to target step
      const navigated = await navigateToStep(targetIndex)
      if (navigated && targetStep) {
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
    if (!navigated) return

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

    if (navigated) {
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
      if (!navigated) return

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

  const reset = React.useCallback((tourId?: string) => {
    dispatch({ type: 'RESET', tourId })
  }, [])

  const setData = React.useCallback((key: string, value: unknown) => {
    setDataState((prev) => ({ ...prev, [key]: value }))
  }, [])

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
