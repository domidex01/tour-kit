/**
 * v2 §1.3a — the tour reducer, moved out from under React.
 *
 * Pure code motion from `context/tour-provider.tsx` lines 40–217. Nothing here
 * imports React and nothing here reads a ref: `(state, action) => state` is the
 * whole contract. The provider keeps dispatching into it through
 * `React.useReducer`; `createTourEngine()` (§1.3f) will dispatch into the same
 * function from a plain store.
 */
import type { Tour } from '../../types/tour'
import type { TourAction, TourReducerState } from '../../types/tour-reducer'

/** Maximum hidden-step chain length before throwing HIDDEN_STEP_LOOP. */
export const MAX_HIDDEN_CHAIN = 50

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

/** First registered `autoStart` tour the user hasn't already completed. */
export function findAutoStartTour(tours: Tour[], completedTours: string[]): Tour | undefined {
  const auto = tours.find((t) => t.autoStart)
  if (!auto || completedTours.includes(auto.id)) return undefined
  return auto
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reducer handles many action variants in one switch
export function tourReducer(state: TourReducerState, action: TourAction): TourReducerState {
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
    case 'HYDRATE_TERMINAL_TOURS': {
      // Post-mount load of persisted terminal tours (see the hydrate effect in
      // TourProvider). Union-merge so an ADD_COMPLETED/ADD_SKIPPED dispatched
      // before hydration lands is never lost.
      const completedTours = [...new Set([...action.completedTours, ...state.completedTours])]
      const skippedTours = [...new Set([...action.skippedTours, ...state.skippedTours])]
      return { ...state, completedTours, skippedTours }
    }
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
