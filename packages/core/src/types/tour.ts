import type { BranchTarget } from './branch'
import type {
  A11yConfig,
  KeyboardConfig,
  PersistenceConfig,
  ScrollConfig,
  SpotlightConfig,
} from './config'
import type { TourCallbackContext } from './state'
import type { TourStep } from './step'

/**
 * Tour definition
 */
export interface Tour {
  id: string
  steps: TourStep[]
  autoStart?: boolean
  startAt?: number
  keyboard?: KeyboardConfig | boolean
  spotlight?: SpotlightConfig | boolean
  persistence?: PersistenceConfig | boolean
  a11y?: A11yConfig
  scroll?: ScrollConfig
  onStart?: (context: TourCallbackContext) => void
  onComplete?: (context: TourCallbackContext) => void
  onSkip?: (context: TourCallbackContext) => void
  onStepChange?: (step: TourStep, index: number, context: TourCallbackContext) => void
  /**
   * Called when a branch action is triggered from a step
   * @param stepId - The step where the action was triggered
   * @param actionId - The action ID that was triggered
   * @param target - The resolved branch target
   */
  onBranchAction?: (stepId: string, actionId: string, target: BranchTarget) => void
  /**
   * Called when branching to a different tour
   * @param toTourId - The tour being navigated to
   * @param fromStepId - The step where the branch occurred
   */
  onTourBranch?: (toTourId: string, fromStepId: string) => void
}

export type TourOptions = Omit<Tour, 'id' | 'steps'>
