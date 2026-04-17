'use client'

import { useMemo } from 'react'
import { useChecklistContext } from '../context/checklist-context'
import type { ChecklistTaskState } from '../types'

export interface UseTaskReturn {
  /** Task state */
  task: ChecklistTaskState | undefined
  /** Whether task exists */
  exists: boolean
  /** Whether task is completed */
  isCompleted: boolean
  /** Whether task is locked */
  isLocked: boolean
  /** Whether task is visible */
  isVisible: boolean
  /** Complete the task */
  complete: () => void
  /** Uncomplete the task */
  uncomplete: () => void
  /** Execute task action */
  execute: () => void
  /** Toggle completion */
  toggle: () => void
}

/**
 * Hook for working with a specific task
 *
 * @param checklistId - ID of the checklist
 * @param taskId - ID of the task
 * @returns Task state and actions
 *
 * @example
 * ```tsx
 * function TaskItem({ checklistId, taskId }) {
 *   const { task, isCompleted, isLocked, execute, toggle } = useTask(checklistId, taskId)
 *
 *   if (!task) return null
 *
 *   return (
 *     <button onClick={execute} disabled={isLocked}>
 *       <input
 *         type="checkbox"
 *         checked={isCompleted}
 *         onChange={toggle}
 *         disabled={isLocked}
 *       />
 *       {task.config.title}
 *     </button>
 *   )
 * }
 * ```
 */
export function useTask(checklistId: string, taskId: string): UseTaskReturn {
  const context = useChecklistContext()

  const checklist = context.getChecklist(checklistId)
  const task = useMemo(
    () => checklist?.tasks.find((t) => t.config.id === taskId),
    [checklist, taskId]
  )

  return {
    task,
    exists: !!task,
    isCompleted: task?.completed ?? false,
    isLocked: task?.locked ?? true,
    isVisible: task?.visible ?? false,
    complete: () => context.completeTask(checklistId, taskId),
    uncomplete: () => context.uncompleteTask(checklistId, taskId),
    execute: () => context.executeAction(checklistId, taskId),
    toggle: () => {
      if (task?.completed) {
        context.uncompleteTask(checklistId, taskId)
      } else {
        context.completeTask(checklistId, taskId)
      }
    },
  }
}
