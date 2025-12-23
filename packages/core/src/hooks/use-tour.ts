import { useCallback, useContext, useMemo } from 'react'
import { TourContext } from '../context/tour-context'
import type { TourStep } from '../types'

export interface UseTourReturn {
  // State
  isActive: boolean
  isLoading: boolean
  isTransitioning: boolean
  currentStep: TourStep | null
  currentStepIndex: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  progress: number

  // Actions
  start: (stepIndex?: number) => void
  next: () => void
  prev: () => void
  goTo: (stepIndex: number) => void
  skip: () => void
  complete: () => void
  stop: () => void

  // Utilities
  isStepActive: (stepId: string) => boolean
  getStep: (stepId: string) => TourStep | undefined
}

export function useTour(tourId?: string): UseTourReturn {
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
  } = context

  // If tourId provided, only active if it matches
  const isThisTourActive = tourId ? isActive && activeTourId === tourId : isActive

  const start = useCallback(
    (stepIndex?: number) => {
      contextStart(tourId, stepIndex)
    },
    [contextStart, tourId]
  )

  const isFirstStep = currentStepIndex === 0
  const isLastStep = totalSteps > 0 && currentStepIndex === totalSteps - 1
  const progress = totalSteps > 0 ? (currentStepIndex + 1) / totalSteps : 0

  const isStepActive = useCallback((stepId: string) => currentStep?.id === stepId, [currentStep])

  const getStep = useCallback((stepId: string) => tour?.steps.find((s) => s.id === stepId), [tour])

  return useMemo(
    () => ({
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
      isStepActive,
      getStep,
    }),
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
      isStepActive,
      getStep,
    ]
  )
}
