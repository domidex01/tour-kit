import type { TourStep } from './step'
import type { Tour } from './tour'

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
  /** List of step IDs visited in the current tour session */
  visitedSteps: string[]
  /** Map of step ID to number of times it has been visited */
  stepVisitCount: Map<string, number>
  /** ID of the previous step (for branch context) */
  previousStepId: string | null
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
  /**
   * Navigate directly to a step by its ID
   */
  goToStep: (stepId: string) => Promise<void>
  /**
   * Start a different tour (for cross-tour branching)
   * @param tourId - The tour to start
   * @param stepId - Optional step ID or index to start at
   */
  startTour: (tourId: string, stepId?: string | number) => Promise<void>
  /**
   * Trigger a branch action defined in the current step's onAction
   * @param actionId - The action ID to trigger
   * @param payload - Optional data to pass to the branch resolver
   */
  triggerBranchAction: (actionId: string, payload?: unknown) => Promise<void>
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
  visitedSteps: [],
  stepVisitCount: new Map(),
  previousStepId: null,
}
