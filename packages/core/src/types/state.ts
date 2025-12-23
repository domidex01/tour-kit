import type { Tour } from './tour'
import type { TourStep } from './step'

/**
 * Current tour state
 */
export interface TourState {
  tourId: string | null
  isActive: boolean
  currentStepIndex: number
  currentStep: TourStep | null
  totalSteps: number
  isLoading: boolean
  isTransitioning: boolean
  completedTours: string[]
  skippedTours: string[]
}

/**
 * Extended tour context data (passed to callbacks)
 */
export interface TourCallbackContext extends TourState {
  tour: Tour | null
  data: Record<string, unknown>
}

/**
 * Tour action methods
 */
export interface TourActions {
  start: (tourId?: string, stepIndex?: number) => void
  next: () => void
  prev: () => void
  goTo: (stepIndex: number) => void
  skip: () => void
  complete: () => void
  stop: () => void
  setDontShowAgain: (tourId: string, value: boolean) => void
  reset: (tourId?: string) => void
  setData: (key: string, value: unknown) => void
}

/**
 * Combined context value
 */
export interface TourContextValue extends TourState, TourActions {
  tour: Tour | null
  data: Record<string, unknown>
}

/**
 * Initial state
 */
export const initialTourState: TourState = {
  tourId: null,
  isActive: false,
  currentStepIndex: 0,
  currentStep: null,
  totalSteps: 0,
  isLoading: false,
  isTransitioning: false,
  completedTours: [],
  skippedTours: [],
}
