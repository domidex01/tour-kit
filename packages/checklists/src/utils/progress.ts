import type { ChecklistProgress, ChecklistState, ChecklistTaskState } from '../types'

/**
 * Calculate progress for a checklist
 */
export function calculateProgress(checklist: ChecklistState): ChecklistProgress {
  const visibleTasks = checklist.tasks.filter((t) => t.visible)
  const completed = visibleTasks.filter((t) => t.completed).length
  const total = visibleTasks.length
  const percentage = total > 0 ? (completed / total) * 100 : 0
  const remaining = total - completed

  return {
    completed,
    total,
    percentage,
    remaining,
  }
}

/**
 * Get next incomplete task
 */
export function getNextTask(checklist: ChecklistState): ChecklistTaskState | undefined {
  return checklist.tasks.find((t) => t.visible && !t.completed && !t.locked)
}

/**
 * Get all locked tasks
 */
export function getLockedTasks(checklist: ChecklistState): ChecklistTaskState[] {
  return checklist.tasks.filter((t) => t.visible && t.locked)
}
