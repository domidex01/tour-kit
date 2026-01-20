import { logger } from '@tour-kit/core'
import type { ChecklistConfig, ChecklistTaskConfig } from '../types'
import { hasCircularDependency } from './dependencies'

/**
 * Helper to create a type-safe checklist definition
 *
 * @example
 * ```tsx
 * const onboarding = createChecklist({
 *   id: 'onboarding',
 *   title: 'Get Started',
 *   tasks: [
 *     { id: 'profile', title: 'Complete profile', ... },
 *     { id: 'tour', title: 'Take the tour', dependsOn: ['profile'], ... },
 *   ],
 * })
 * ```
 */
export function createChecklist(config: ChecklistConfig): ChecklistConfig {
  // Validate no circular dependencies
  if (hasCircularDependency(config.tasks)) {
    logger.error(`Checklists: Circular dependency detected in checklist "${config.id}"`)
  }

  // Validate dependency references
  const taskIds = new Set(config.tasks.map((t) => t.id))
  for (const task of config.tasks) {
    if (task.dependsOn) {
      for (const depId of task.dependsOn) {
        if (!taskIds.has(depId)) {
          logger.error(`Checklists: Task "${task.id}" depends on unknown task "${depId}"`)
        }
      }
    }
  }

  return config
}

/**
 * Helper to create a task definition
 */
export function createTask(config: ChecklistTaskConfig): ChecklistTaskConfig {
  return config
}
