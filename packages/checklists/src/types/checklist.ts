import type { ReactNode } from 'react'

/**
 * Task action types
 */
export type TaskAction =
  | { type: 'navigate'; url: string; external?: boolean }
  | { type: 'callback'; handler: () => void | Promise<void> }
  | { type: 'tour'; tourId: string }
  | { type: 'modal'; modalId: string }
  | { type: 'custom'; data: unknown }

/**
 * Condition for automatic task completion
 */
export type TaskCompletionCondition =
  | { tourCompleted: string }
  | { tourStarted: string }
  | { custom: (context: ChecklistContext) => boolean }

/**
 * Context available in task conditions
 */
export interface ChecklistContext {
  /** User data passed to provider */
  user: Record<string, unknown>
  /** Custom data passed to provider */
  data: Record<string, unknown>
  /** Completed task IDs in this checklist */
  completedTasks: string[]
  /** All completed tour IDs */
  completedTours: string[]
}

/**
 * Individual task definition
 */
export interface ChecklistTaskConfig {
  /** Unique task identifier */
  id: string
  /** Task title */
  title: string
  /** Task description */
  description?: string
  /** Icon name or component */
  icon?: string | ReactNode
  /** Action to perform when task is clicked */
  action?: TaskAction
  /** Task IDs that must be completed first */
  dependsOn?: string[]
  /** Condition for showing this task */
  when?: (context: ChecklistContext) => boolean
  /** Auto-complete condition */
  completedWhen?: TaskCompletionCondition
  /** Whether task can be manually completed */
  manualComplete?: boolean
  /** Custom metadata */
  meta?: Record<string, unknown>
}

/**
 * Runtime task state
 */
export interface ChecklistTaskState {
  /** Task configuration */
  config: ChecklistTaskConfig
  /** Whether task is completed */
  completed: boolean
  /** Whether task is locked (dependencies not met) */
  locked: boolean
  /** Whether task is visible (when condition met) */
  visible: boolean
  /** Whether task is currently active/in-progress */
  active: boolean
  /** Completion timestamp */
  completedAt?: number
}

/**
 * Checklist definition
 */
export interface ChecklistConfig {
  /** Unique checklist identifier */
  id: string
  /** Checklist title */
  title: string
  /** Checklist description */
  description?: string
  /** Icon name or component */
  icon?: string | ReactNode
  /** Tasks in this checklist */
  tasks: ChecklistTaskConfig[]
  /** Callback when all tasks completed */
  onComplete?: () => void
  /** Callback when checklist is dismissed */
  onDismiss?: () => void
  /** Whether checklist can be dismissed */
  dismissible?: boolean
  /** Whether to show checklist after completion */
  hideOnComplete?: boolean
  /** Custom metadata */
  meta?: Record<string, unknown>
}

/**
 * Runtime checklist state
 */
export interface ChecklistState {
  /** Checklist configuration */
  config: ChecklistConfig
  /** Task states */
  tasks: ChecklistTaskState[]
  /** Progress percentage (0-100) */
  progress: number
  /** Number of completed tasks */
  completedCount: number
  /** Total number of visible tasks */
  totalCount: number
  /** Whether all tasks are completed */
  isComplete: boolean
  /** Whether checklist is dismissed */
  isDismissed: boolean
  /** Whether checklist is expanded (for collapsible UI) */
  isExpanded: boolean
}

/**
 * Progress information
 */
export interface ChecklistProgress {
  /** Number of completed tasks */
  completed: number
  /** Total number of tasks */
  total: number
  /** Progress percentage (0-100) */
  percentage: number
  /** Remaining tasks */
  remaining: number
}
