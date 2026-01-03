import { useTourContext } from '@tour-kit/core'
import * as React from 'react'
import { useTourRegistryContext } from '../components/provider/tourkit-provider'

export interface TourInfo {
  id: string
  stepCount: number
}

export interface UseToursReturn {
  /** All registered tours */
  tours: TourInfo[]
  /** Currently active tour ID */
  activeTourId: string | null
  /** Check if any tour is active */
  isAnyTourActive: boolean
  /** Completed tour IDs */
  completedTours: string[]
  /** Skipped tour IDs */
  skippedTours: string[]
  /** Check if a tour was completed */
  isTourCompleted: (tourId: string) => boolean
  /** Check if a tour was skipped */
  isTourSkipped: (tourId: string) => boolean
  /** Get tour info by ID */
  getTour: (tourId: string) => TourInfo | undefined
}

/**
 * Hook to access all registered tours and their state.
 * Must be used within MultiTourKitProvider.
 *
 * @example
 * ```tsx
 * function TourSelector() {
 *   const { tours, activeTourId, isTourCompleted } = useTours()
 *   const { start } = useTour()
 *
 *   return (
 *     <div>
 *       {tours.map(tour => (
 *         <button
 *           key={tour.id}
 *           onClick={() => start(tour.id)}
 *           disabled={isTourCompleted(tour.id)}
 *         >
 *           {tour.id} ({tour.stepCount} steps)
 *           {isTourCompleted(tour.id) && ' Completed'}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTours(): UseToursReturn {
  const { tours: tourConfigs } = useTourRegistryContext()
  const tourContext = useTourContext()

  const tours = React.useMemo<TourInfo[]>(
    () =>
      tourConfigs.map((t) => ({
        id: t.id,
        stepCount: t.steps.length,
      })),
    [tourConfigs]
  )

  const isTourCompleted = React.useCallback(
    (tourId: string) => tourContext.completedTours.includes(tourId),
    [tourContext.completedTours]
  )

  const isTourSkipped = React.useCallback(
    (tourId: string) => tourContext.skippedTours.includes(tourId),
    [tourContext.skippedTours]
  )

  const getTour = React.useCallback((tourId: string) => tours.find((t) => t.id === tourId), [tours])

  return {
    tours,
    activeTourId: tourContext.tourId,
    isAnyTourActive: tourContext.isActive,
    completedTours: tourContext.completedTours,
    skippedTours: tourContext.skippedTours,
    isTourCompleted,
    isTourSkipped,
    getTour,
  }
}
