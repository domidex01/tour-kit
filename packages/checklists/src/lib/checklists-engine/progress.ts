import type {
  ChecklistProgress,
  EngineChecklistConfig,
  EngineChecklistState,
  EngineTaskState,
} from './types'

/**
 * Calculate progress for a checklist.
 *
 * Invisible tasks are excluded from BOTH numerator and denominator — a task
 * whose `when` returns false is not work the user owes.
 */
export function calculateProgress(checklist: EngineChecklistState): ChecklistProgress {
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
export function getNextTask<TConfig extends EngineChecklistConfig>(
  checklist: EngineChecklistState<TConfig>
): EngineTaskState<TConfig['tasks'][number]> | undefined {
  return checklist.tasks.find((t) => t.visible && !t.completed && !t.locked)
}

/**
 * Get all locked tasks
 */
export function getLockedTasks<TConfig extends EngineChecklistConfig>(
  checklist: EngineChecklistState<TConfig>
): EngineTaskState<TConfig['tasks'][number]>[] {
  return checklist.tasks.filter((t) => t.visible && t.locked)
}
