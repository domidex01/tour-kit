import * as React from 'react'
import type { Tour, TourContextValue, TourState } from '../types'
import { TourContext } from './tour-context'
import { TourKitContext } from './tourkit-context'

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
    default:
      return state
  }
}

export interface TourProviderProps {
  children: React.ReactNode
  tours?: Tour[]
}

export function TourProvider({ children, tours = [] }: TourProviderProps) {
  const tourKitContext = React.useContext(TourKitContext)
  const [data, setDataState] = React.useState<Record<string, unknown>>({})

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

  // Get current tour
  const currentTour = state.tourId ? (state.tours.get(state.tourId) ?? null) : null

  // Actions
  const start = React.useCallback(
    (tourId?: string, stepIndex?: number) => {
      const id = tourId ?? tours[0]?.id
      if (!id) return

      dispatch({ type: 'START_TOUR', tourId: id, stepIndex })
      tourKitContext?.onTourStart?.(id)

      const tour = state.tours.get(id)
      tour?.onStart?.({ ...state, tour, data })
    },
    [tours, state, data, tourKitContext]
  )

  const next = React.useCallback(() => {
    if (!state.isActive || !currentTour) return

    const isLastStep = state.currentStepIndex >= currentTour.steps.length - 1

    if (isLastStep) {
      dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
      dispatch({ type: 'COMPLETE_TOUR' })
      tourKitContext?.onTourComplete?.(currentTour.id)
      currentTour.onComplete?.({ ...state, tour: currentTour, data })
    } else {
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
      dispatch({ type: 'NEXT_STEP' })

      const nextStep = currentTour.steps[state.currentStepIndex + 1]
      if (nextStep) {
        tourKitContext?.onStepView?.(currentTour.id, nextStep.id, state.currentStepIndex + 1)
        currentTour.onStepChange?.(nextStep, state.currentStepIndex + 1, {
          ...state,
          tour: currentTour,
          data,
        })
      }
    }
  }, [state, currentTour, data, tourKitContext])

  const prev = React.useCallback(() => {
    if (!state.isActive || state.currentStepIndex <= 0 || !currentTour) return

    dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
    dispatch({ type: 'PREV_STEP' })

    const prevStep = currentTour.steps[state.currentStepIndex - 1]
    if (prevStep) {
      tourKitContext?.onStepView?.(currentTour.id, prevStep.id, state.currentStepIndex - 1)
      currentTour.onStepChange?.(prevStep, state.currentStepIndex - 1, {
        ...state,
        tour: currentTour,
        data,
      })
    }
  }, [state, currentTour, data, tourKitContext])

  const goTo = React.useCallback(
    (stepIndex: number) => {
      if (!state.isActive || !currentTour) return

      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true })
      dispatch({ type: 'GO_TO_STEP', stepIndex })

      const step = currentTour.steps[stepIndex]
      if (step) {
        tourKitContext?.onStepView?.(currentTour.id, step.id, stepIndex)
        currentTour.onStepChange?.(step, stepIndex, {
          ...state,
          tour: currentTour,
          data,
        })
      }
    },
    [state, currentTour, data, tourKitContext]
  )

  const skip = React.useCallback(() => {
    if (!state.isActive || !currentTour) return

    dispatch({ type: 'ADD_SKIPPED', tourId: currentTour.id })
    dispatch({ type: 'SKIP_TOUR' })
    tourKitContext?.onTourSkip?.(currentTour.id, state.currentStepIndex)
    currentTour.onSkip?.({ ...state, tour: currentTour, data })
  }, [state, currentTour, data, tourKitContext])

  const complete = React.useCallback(() => {
    if (!state.isActive || !currentTour) return

    dispatch({ type: 'ADD_COMPLETED', tourId: currentTour.id })
    dispatch({ type: 'COMPLETE_TOUR' })
    tourKitContext?.onTourComplete?.(currentTour.id)
    currentTour.onComplete?.({ ...state, tour: currentTour, data })
  }, [state, currentTour, data, tourKitContext])

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

  return <TourContext.Provider value={contextValue}>{children}</TourContext.Provider>
}
