'use client'

import { useMemo } from 'react'
import { useChecklistContext } from '../context/checklist-context'
import type { ChecklistProgress, ChecklistState, ChecklistTaskState } from '../types'

export interface UseChecklistReturn {
  /** Checklist state */
  checklist: ChecklistState | undefined
  /** Task states */
  tasks: ChecklistTaskState[]
  /** Visible tasks only */
  visibleTasks: ChecklistTaskState[]
  /** Progress info */
  progress: ChecklistProgress
  /** Whether checklist exists */
  exists: boolean
  /** Whether checklist is complete */
  isComplete: boolean
  /** Whether checklist is dismissed */
  isDismissed: boolean
  /** Whether checklist is expanded */
  isExpanded: boolean
  /** Complete a task */
  completeTask: (taskId: string) => void
  /** Uncomplete a task */
  uncompleteTask: (taskId: string) => void
  /** Execute task action */
  executeAction: (taskId: string) => void
  /** Dismiss checklist */
  dismiss: () => void
  /** Restore checklist */
  restore: () => void
  /** Toggle expanded */
  toggleExpanded: () => void
  /** Set expanded */
  setExpanded: (expanded: boolean) => void
  /** Reset checklist */
  reset: () => void
}

/**
 * Hook for working with a specific checklist
 *
 * @param checklistId - ID of the checklist
 * @returns Checklist state and actions
 *
 * @example
 * ```tsx
 * function OnboardingChecklist() {
 *   const {
 *     checklist,
 *     visibleTasks,
 *     progress,
 *     completeTask,
 *     executeAction,
 *   } = useChecklist('onboarding')
 *
 *   if (!checklist) return null
 *
 *   return (
 *     <div>
 *       <h2>{checklist.config.title}</h2>
 *       <progress value={progress.completed} max={progress.total} />
 *       {visibleTasks.map((task) => (
 *         <button
 *           key={task.config.id}
 *           onClick={() => executeAction(task.config.id)}
 *           disabled={task.locked}
 *         >
 *           {task.completed ? 'X' : 'O'} {task.config.title}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useChecklist(checklistId: string): UseChecklistReturn {
  const context = useChecklistContext()

  const checklist = context.getChecklist(checklistId)

  const tasks = checklist?.tasks ?? []
  const visibleTasks = useMemo(() => tasks.filter((t) => t.visible), [tasks])

  const progress = context.getProgress(checklistId)

  return {
    checklist,
    tasks,
    visibleTasks,
    progress,
    exists: !!checklist,
    isComplete: checklist?.isComplete ?? false,
    isDismissed: checklist?.isDismissed ?? false,
    isExpanded: checklist?.isExpanded ?? true,
    completeTask: (taskId) => context.completeTask(checklistId, taskId),
    uncompleteTask: (taskId) => context.uncompleteTask(checklistId, taskId),
    executeAction: (taskId) => context.executeAction(checklistId, taskId),
    dismiss: () => context.dismissChecklist(checklistId),
    restore: () => context.restoreChecklist(checklistId),
    toggleExpanded: () => context.toggleExpanded(checklistId),
    setExpanded: (expanded) => context.setExpanded(checklistId, expanded),
    reset: () => context.resetChecklist(checklistId),
  }
}
