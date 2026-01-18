import * as React from 'react'
import { useAdvanceOn } from '../hooks/use-advance-on'
import { useRoutePersistence } from '../hooks/use-route-persistence'
import type { Tour, TourCallbackContext, TourContextValue, TourState, TourStep } from '../types'
import type { MultiPagePersistenceConfig, RouterAdapter } from '../types/router'
import { waitForElement } from '../utils/dom'
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
    console.warn(`[tour-kit] Error evaluating when condition for step "${step.id}":`, error)
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

  return {
    ...state,
    tourId,
    isActive: true,
    currentStepIndex: index,
    currentStep: step ?? null,
    totalSteps: tour.steps.length,
    isLoading: false,
    isTransitioning: false,
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
    case 'UPDATE_TOURS':
      return { ...state, tours: new Map(action.tours.map((t) => [t.id, t])) }
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
}

export function TourProvider({
  children,
  tours = [],
  router,
  routePersistence = { enabled: false },
  autoNavigate = true,
  onNavigationRequired,
}: TourProviderProps) {
  const tourKitContext = React.useContext(TourKitContext)
  const [data, setDataState] = React.useState<Record<string, unknown>>({})
  const { save, load, clear } = useRoutePersistence(routePersistence)

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
    tours: new Map(tours.map((t) => [t.id, t])),
  }

  const [state, dispatch] = React.useReducer(tourReducer, initialState)

  // Sync tours prop with reducer state when tours are registered/unregistered
  React.useEffect(() => {
    dispatch({ type: 'UPDATE_TOURS', tours })
  }, [tours])

  // Get current tour
  const currentTour = state.tourId ? (state.tours.get(state.tourId) ?? null) : null

  // Restore persisted state on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount, load is stable
  React.useEffect(() => {
    const persisted = load()
    if (persisted?.tourId && tours.some((t) => t.id === persisted.tourId)) {
      dispatch({
        type: 'START_TOUR',
        tourId: persisted.tourId,
        stepIndex: persisted.stepIndex,
      })
    }
  }, [])

  // Save state on changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only save on specific state changes
  React.useEffect(() => {
    if (state.isActive && routePersistence.enabled) {
      save(state)
    }
  }, [state.tourId, state.currentStepIndex, state.isActive, save, routePersistence.enabled])

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
        console.warn(`[tour-kit] Tour "${id}" has no visible steps`)
        return
      }

      dispatch({ type: 'START_TOUR', tourId: id, stepIndex: visibleIndex })
      tourKitContext?.onTourStart?.(id)
      tour.onStart?.({ ...state, tour, data })
    },
    [tours, state, data, tourKitContext]
  )

  // Helper to complete the current tour
  const completeTour = React.useCallback(() => {
    if (!currentTour) return
    dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
    dispatch({ type: 'COMPLETE_TOUR' })
    clear()
    tourKitContext?.onTourComplete?.(currentTour.id)
    currentTour.onComplete?.({ ...state, tour: currentTour, data })
  }, [currentTour, state, data, tourKitContext, clear])

  const next = React.useCallback(async () => {
    if (!state.isActive || !currentTour) return

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
      tourKitContext?.onStepView?.(currentTour.id, nextStep.id, nextStepIndex)
      currentTour.onStepChange?.(nextStep, nextStepIndex, {
        ...state,
        tour: currentTour,
        data,
      })
    }
  }, [state, currentTour, data, tourKitContext, navigateToStep, completeTour])

  const prev = React.useCallback(async () => {
    if (!state.isActive || state.currentStepIndex <= 0 || !currentTour) return

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
        tourKitContext?.onStepView?.(currentTour.id, prevStep.id, prevStepIndex)
        currentTour.onStepChange?.(prevStep, prevStepIndex, {
          ...state,
          tour: currentTour,
          data,
        })
      }
    }
  }, [state, currentTour, data, tourKitContext, navigateToStep])

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

  const skip = React.useCallback(() => {
    if (!state.isActive || !currentTour) return

    dispatch({ type: 'ADD_SKIPPED', tourId: currentTour.id })
    dispatch({ type: 'SKIP_TOUR' })
    clear() // Clear persisted state on skip
    tourKitContext?.onTourSkip?.(currentTour.id, state.currentStepIndex)
    currentTour.onSkip?.({ ...state, tour: currentTour, data })
  }, [state, currentTour, data, tourKitContext, clear])

  const complete = React.useCallback(() => {
    if (!state.isActive || !currentTour) return

    dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
    dispatch({ type: 'COMPLETE_TOUR' })
    clear() // Clear persisted state on complete
    tourKitContext?.onTourComplete?.(currentTour.id)
    currentTour.onComplete?.({ ...state, tour: currentTour, data })
  }, [state, currentTour, data, tourKitContext, clear])

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
