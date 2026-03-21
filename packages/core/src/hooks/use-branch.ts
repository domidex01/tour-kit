import { useCallback, useMemo } from 'react'
import { useTourContext } from '../context/tour-context'
import type { BranchContext, BranchTarget, UseBranchReturn } from '../types/branch'
import { resolveBranch } from '../utils/branch'

/**
 * Hook for triggering branch actions from step content
 *
 * @example
 * ```tsx
 * function RoleSelectStep() {
 *   const { triggerAction, hasAction } = useBranch()
 *
 *   return (
 *     <div>
 *       <h2>What's your role?</h2>
 *       <button onClick={() => triggerAction('developer')}>
 *         I'm a Developer
 *       </button>
 *       <button onClick={() => triggerAction('designer')}>
 *         I'm a Designer
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @throws Error if used outside of TourProvider
 */
export function useBranch(): UseBranchReturn {
  const context = useTourContext()

  const currentStep = context.currentStep

  /**
   * List of available action IDs for the current step
   */
  const availableActions = useMemo(() => {
    if (!currentStep?.onAction) return []
    return Object.keys(currentStep.onAction)
  }, [currentStep])

  /**
   * Check if an action is available for the current step
   */
  const hasAction = useCallback(
    (actionId: string): boolean => {
      return !!currentStep?.onAction?.[actionId]
    },
    [currentStep]
  )

  /**
   * Trigger a named action defined in the current step's onAction
   */
  const triggerAction = useCallback(
    async (actionId: string, payload?: unknown): Promise<void> => {
      await context.triggerBranchAction(actionId, payload)
    },
    [context.triggerBranchAction]
  )

  /**
   * Preview where an action would navigate without actually navigating
   */
  const previewAction = useCallback(
    async (actionId: string, payload?: unknown): Promise<BranchTarget> => {
      if (!currentStep?.onAction?.[actionId]) {
        return 'next'
      }

      const branch = currentStep.onAction[actionId]

      const previewContext: BranchContext = {
        tourId: context.tourId,
        isActive: context.isActive,
        currentStepIndex: context.currentStepIndex,
        currentStep: context.currentStep,
        totalSteps: context.totalSteps,
        isLoading: context.isLoading,
        isTransitioning: context.isTransitioning,
        completedTours: context.completedTours,
        skippedTours: context.skippedTours,
        visitedSteps: context.visitedSteps,
        stepVisitCount: context.stepVisitCount,
        previousStepId: context.previousStepId,
        tour: context.tour,
        data: context.data,
        action: actionId,
        actionPayload: payload,
        setData: () => {},
      }

      try {
        return await resolveBranch(branch, previewContext)
      } catch {
        return 'next'
      }
    },
    [
      currentStep,
      context.tourId,
      context.isActive,
      context.currentStepIndex,
      context.currentStep,
      context.totalSteps,
      context.isLoading,
      context.isTransitioning,
      context.completedTours,
      context.skippedTours,
      context.visitedSteps,
      context.stepVisitCount,
      context.previousStepId,
      context.tour,
      context.data,
    ]
  )

  return {
    triggerAction,
    availableActions,
    hasAction,
    previewAction,
  }
}
