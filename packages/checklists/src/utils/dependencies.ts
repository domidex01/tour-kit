import type { ChecklistTaskConfig } from '../types'

/**
 * Check if a task's dependencies are met
 */
export function canCompleteTask(
  task: ChecklistTaskConfig,
  completedTasks: Set<string>,
  _allTasks: ChecklistTaskConfig[]
): boolean {
  if (!task.dependsOn || task.dependsOn.length === 0) {
    return true
  }

  return task.dependsOn.every((depId) => completedTasks.has(depId))
}

/**
 * Resolve task dependencies and return execution order
 */
export function resolveTaskDependencies(tasks: ChecklistTaskConfig[]): ChecklistTaskConfig[] {
  const resolved: ChecklistTaskConfig[] = []
  const seen = new Set<string>()

  function visit(task: ChecklistTaskConfig) {
    if (seen.has(task.id)) return
    seen.add(task.id)

    if (task.dependsOn) {
      for (const depId of task.dependsOn) {
        const depTask = tasks.find((t) => t.id === depId)
        if (depTask) {
          visit(depTask)
        }
      }
    }

    resolved.push(task)
  }

  for (const task of tasks) {
    visit(task)
  }

  return resolved
}

/**
 * Check for circular dependencies
 */
export function hasCircularDependency(tasks: ChecklistTaskConfig[]): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(taskId: string): boolean {
    if (recursionStack.has(taskId)) return true
    if (visited.has(taskId)) return false

    visited.add(taskId)
    recursionStack.add(taskId)

    const task = tasks.find((t) => t.id === taskId)
    if (task?.dependsOn) {
      for (const depId of task.dependsOn) {
        if (hasCycle(depId)) return true
      }
    }

    recursionStack.delete(taskId)
    return false
  }

  for (const task of tasks) {
    if (hasCycle(task.id)) return true
  }

  return false
}
