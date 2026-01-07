import { useMemo } from 'react'
import { useChecklistContext } from '../context/checklist-context'
import type { ChecklistProgress } from '../types'

/**
 * Hook for getting progress across all checklists
 *
 * @returns Aggregated progress information
 */
export function useChecklistsProgress(): {
  /** Progress per checklist */
  byChecklist: Record<string, ChecklistProgress>
  /** Total progress across all checklists */
  total: ChecklistProgress
  /** Number of completed checklists */
  completedChecklists: number
  /** Total number of checklists */
  totalChecklists: number
} {
  const context = useChecklistContext()

  return useMemo(() => {
    const byChecklist: Record<string, ChecklistProgress> = {}
    let totalCompleted = 0
    let totalTasks = 0
    let completedChecklists = 0

    for (const [id, checklist] of context.checklists) {
      const progress = context.getProgress(id)
      byChecklist[id] = progress
      totalCompleted += progress.completed
      totalTasks += progress.total
      if (checklist.isComplete) {
        completedChecklists++
      }
    }

    return {
      byChecklist,
      total: {
        completed: totalCompleted,
        total: totalTasks,
        percentage: totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0,
        remaining: totalTasks - totalCompleted,
      },
      completedChecklists,
      totalChecklists: context.checklists.size,
    }
  }, [context])
}
