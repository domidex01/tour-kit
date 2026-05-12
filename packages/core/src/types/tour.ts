import type { BranchTarget } from './branch'
import type {
  A11yConfig,
  KeyboardConfig,
  PersistenceConfig,
  ScrollConfig,
  SpotlightConfig,
} from './config'
import type { TourCallbackContext } from './state'
import type { AudienceProp, TourStep } from './step'

/**
 * Tour definition.
 *
 * `TStep` defaults to `TourStep` (which itself defaults `TId` to `string`), so
 * `Tour` with no generic args keeps accepting dynamic / server-fetched steps.
 * Pass `TourStep<'a' | 'b' | ...>` to narrow `steps[].id` and the `onStepChange`
 * step argument at compile time. `Tour<TourStep<string>>` is the explicit
 * widening escape hatch.
 */
export interface Tour<TStep extends TourStep = TourStep> {
  id: string
  steps: TStep[]
  /**
   * Filter the entire tour for users who don't match. Same shape as
   * `TourStep.audience`. When the filter rejects, the tour is not registered
   * and `useTour().isActive` stays false.
   */
  audience?: AudienceProp
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
  onStepChange?: (step: TStep, index: number, context: TourCallbackContext) => void
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

export type TourOptions<TStep extends TourStep = TourStep> = Omit<Tour<TStep>, 'id' | 'steps'>
