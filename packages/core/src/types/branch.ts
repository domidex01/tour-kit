import type { TourCallbackContext } from './state'

/**
 * Target for a branch action
 *
 * Can be:
 * - string: Step ID to navigate to
 * - number: Step index to navigate to
 * - 'next': Continue to next step (default behavior)
 * - 'prev': Go to previous step
 * - 'complete': Complete the tour
 * - 'skip': Skip/abort the tour
 * - 'restart': Restart the tour from beginning
 * - BranchToTour: Navigate to a different tour
 * - BranchSkip: Skip a number of steps
 * - BranchWait: Wait before proceeding
 * - null: Stay on current step (no navigation)
 */
export type BranchTarget =
  | string // Step ID
  | number // Step index
  | 'next'
  | 'prev'
  | 'complete'
  | 'skip'
  | 'restart'
  | BranchToTour
  | BranchSkip
  | BranchWait
  | null // Stay on current step

/**
 * Branch to a different tour
 */
export interface BranchToTour {
  tour: string
  step?: string | number
}

/**
 * Skip a number of steps forward
 */
export interface BranchSkip {
  skip: number
}

/**
 * Wait before proceeding to next target
 */
export interface BranchWait {
  wait: number
  then?: BranchTarget
}

/**
 * Extended context available to branch resolvers
 *
 * Extends TourCallbackContext with additional branch-specific properties:
 * - action/actionPayload for onAction branches
 * - setData function for storing data during branch resolution
 *
 * Note: visitedSteps, stepVisitCount, and previousStepId are inherited from TourState
 */
export interface BranchContext extends TourCallbackContext {
  /** The action ID that triggered this branch (for onAction branches) */
  action?: string
  /** Payload passed with the action */
  actionPayload?: unknown
  /** Function to store data in the tour context */
  setData: (key: string, value: unknown) => void
}

/**
 * Function that resolves a branch target based on context
 *
 * Can return a BranchTarget synchronously or asynchronously.
 * Useful for:
 * - Conditional navigation based on user data
 * - API calls to determine next step
 * - Complex branching logic
 */
export type BranchResolver = (
  context: BranchContext
) => BranchTarget | Promise<BranchTarget>

/**
 * A branch definition: either a static target or a resolver function
 */
export type Branch = BranchTarget | BranchResolver

/**
 * Return type for the useBranch hook
 */
export interface UseBranchReturn {
  /**
   * Trigger a named action defined in the current step's onAction
   * @param actionId - The action ID to trigger
   * @param payload - Optional data to pass to the branch resolver
   */
  triggerAction: (actionId: string, payload?: unknown) => Promise<void>
  /**
   * List of available action IDs for the current step
   */
  availableActions: string[]
  /**
   * Check if an action is available for the current step
   * @param actionId - The action ID to check
   */
  hasAction: (actionId: string) => boolean
  /**
   * Preview where an action would navigate without actually navigating
   * @param actionId - The action ID to preview
   * @param payload - Optional data to pass to the branch resolver
   * @returns The resolved target without navigating
   */
  previewAction: (actionId: string, payload?: unknown) => Promise<BranchTarget>
}
