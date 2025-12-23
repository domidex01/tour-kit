import type { Tour, TourStep, TourOptions } from '../types'

let tourIdCounter = 0

/**
 * Create a tour with auto-generated ID
 */
export function createTour(steps: TourStep[], options?: TourOptions): Tour {
  return {
    id: `tour-${++tourIdCounter}`,
    steps,
    ...options,
  }
}

/**
 * Create a tour with explicit ID
 */
export function createNamedTour(
  id: string,
  steps: TourStep[],
  options?: TourOptions
): Tour {
  return {
    id,
    steps,
    ...options,
  }
}
