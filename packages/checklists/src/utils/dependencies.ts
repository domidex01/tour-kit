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
 * Resolve task dependencies and return execution order.
 *
 * Throws on circular dependencies — a silent wrong-order result would be harder
 * to debug than a thrown error.
 */
export function resolveTaskDependencies(tasks: ChecklistTaskConfig[]): ChecklistTaskConfig[] {
  const resolved: ChecklistTaskConfig[] = []
  const seen = new Set<string>()
  const visiting = new Set<string>()
  const path: string[] = []

  function visit(task: ChecklistTaskConfig) {
    if (seen.has(task.id)) return
    if (visiting.has(task.id)) {
      const cycleStart = path.indexOf(task.id)
      const cycle = [...path.slice(cycleStart), task.id].join(' → ')
      throw new Error(`Circular dependency detected in tasks: ${cycle}`)
    }

    visiting.add(task.id)
    path.push(task.id)

    if (task.dependsOn) {
      for (const depId of task.dependsOn) {
        const depTask = tasks.find((t) => t.id === depId)
        if (depTask) {
          visit(depTask)
        }
      }
    }

    visiting.delete(task.id)
    path.pop()
    seen.add(task.id)
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
