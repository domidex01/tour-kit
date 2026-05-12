import { useCallback, useContext, useMemo } from 'react'
import { TourContext } from '../context/tour-context'
import type { TourStep } from '../types'

/**
 * Return shape of `useTour()`.
 *
 * `goToStep` and `startTour` are surfaced at the top level (no `.actions.`
 * prefix) and accept step ids narrowed to `TStep['id']`. When `TStep` defaults
 * to `TourStep`, the id parameter widens to `string` — preserving every
 * existing call site that writes `useTour().start(...)` / `useTour().next(...)`.
 */
export interface UseTourReturn<TStep extends TourStep = TourStep> {
  // State
  isActive: boolean
  isLoading: boolean
  isTransitioning: boolean
  currentStep: TStep | null
  currentStepIndex: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  progress: number

  // Actions
  start: (tourIdOrStepIndex?: string | number, stepIndex?: number) => void
  next: () => void
  prev: () => void
  goTo: (stepIndex: number) => void
  skip: () => void
  complete: () => void
  stop: () => void
  /**
   * Navigate directly to a step by its ID. Narrowed to `TStep['id']` when a
   * concrete step type is supplied — misspellings fail at compile time.
   */
  goToStep: <TId extends TStep['id'] = TStep['id']>(stepId: TId) => Promise<void>
  /**
   * Start a different tour by ID. `stepId` is narrowed to that tour's step
   * ids when `TStep` is specified, or widens to `string | number` by default.
   */
  startTour: <TId extends TStep['id'] = TStep['id']>(
    tourId: string,
    stepId?: TId | number
  ) => Promise<void>

  // Utilities
  isStepActive: (stepId: TStep['id']) => boolean
  getStep: (stepId: TStep['id']) => TStep | undefined
}

export function useTour<TStep extends TourStep = TourStep>(
  tourId?: string
): UseTourReturn<TStep> {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }

  const {
    tourId: activeTourId,
    isActive,
    isLoading,
    isTransitioning,
    currentStep,
    currentStepIndex,
    totalSteps,
    tour,
    start: contextStart,
    next,
    prev,
    goTo,
    skip,
    complete,
    stop,
    goToStep: contextGoToStep,
    startTour: contextStartTour,
  } = context

  // If tourId provided, only active if it matches
  const isThisTourActive = tourId ? isActive && activeTourId === tourId : isActive

  const start = useCallback(
    (tourIdOrStepIndex?: string | number, stepIndex?: number) => {
      // If first arg is a string, it's a tourId
      if (typeof tourIdOrStepIndex === 'string') {
        contextStart(tourIdOrStepIndex, stepIndex)
      } else if (typeof tourIdOrStepIndex === 'number') {
        // First arg is a step index, use hook's tourId
        contextStart(tourId, tourIdOrStepIndex)
      } else {
        // No args, use hook's tourId
        contextStart(tourId)
      }
    },
    [contextStart, tourId]
  )

  const isFirstStep = currentStepIndex === 0
  const isLastStep = totalSteps > 0 && currentStepIndex === totalSteps - 1
  const progress = totalSteps > 0 ? (currentStepIndex + 1) / totalSteps : 0

  const isStepActive = useCallback(
    (stepId: string) => currentStep?.id === stepId,
    [currentStep]
  )

  const getStep = useCallback(
    (stepId: string) => tour?.steps.find((s) => s.id === stepId),
    [tour]
  )

  return useMemo(
    () =>
      ({
        isActive: isThisTourActive,
        isLoading,
        isTransitioning,
        currentStep: isThisTourActive ? currentStep : null,
        currentStepIndex: isThisTourActive ? currentStepIndex : 0,
        totalSteps: isThisTourActive ? totalSteps : 0,
        isFirstStep,
        isLastStep,
        progress,
        start,
        next,
        prev,
        goTo,
        skip,
        complete,
        stop,
        goToStep: contextGoToStep,
        startTour: contextStartTour,
        isStepActive,
        getStep,
      }) as unknown as UseTourReturn<TStep>,
    [
      isThisTourActive,
      isLoading,
      isTransitioning,
      currentStep,
      currentStepIndex,
      totalSteps,
      isFirstStep,
      isLastStep,
      progress,
      start,
      next,
      prev,
      goTo,
      skip,
      complete,
      stop,
      contextGoToStep,
      contextStartTour,
      isStepActive,
      getStep,
    ]
  )
}
