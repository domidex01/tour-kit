import type { ChecklistConfig, ChecklistContext } from './checklist'

/**
 * Persistence configuration
 */
export interface ChecklistPersistenceConfig {
  /** Enable persistence */
  enabled: boolean
  /** Storage type */
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  /** Storage key prefix */
  key?: string
  /** Custom save handler (for API persistence) */
  onSave?: (state: PersistedChecklistState) => void | Promise<void>
  /** Custom load handler (for API persistence) */
  onLoad?: () => PersistedChecklistState | null | Promise<PersistedChecklistState | null>
}

/**
 * State that gets persisted
 */
export interface PersistedChecklistState {
  /** Completed task IDs per checklist */
  completed: Record<string, string[]>
  /** Dismissed checklist IDs */
  dismissed: string[]
  /** Last updated timestamp */
  timestamp: number
}

/**
 * Provider configuration
 */
export interface ChecklistProviderConfig {
  /** Checklist definitions */
  checklists: ChecklistConfig[]
  /** Persistence configuration */
  persistence?: ChecklistPersistenceConfig
  /** Context data for conditions */
  context?: Partial<ChecklistContext>
  /** Callback when task is completed */
  onTaskComplete?: (checklistId: string, taskId: string) => void
  /** Callback when task is uncompleted */
  onTaskUncomplete?: (checklistId: string, taskId: string) => void
  /** Callback when checklist is completed */
  onChecklistComplete?: (checklistId: string) => void
  /** Callback when checklist is dismissed */
  onChecklistDismiss?: (checklistId: string) => void
  /** Callback when task action is triggered */
  onTaskAction?: (checklistId: string, taskId: string, action: unknown) => void
  /** Integration with TourKit */
  tourKitIntegration?: boolean
}
