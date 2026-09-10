import type { ChecklistContextData } from '../lib/checklists-engine/types'
import type { ChecklistConfig } from './checklist'

export type {
  ChecklistPersistenceConfig,
  PersistedChecklistState,
} from '../lib/checklists-engine/types'
import type { ChecklistPersistenceConfig } from '../lib/checklists-engine/types'

/** Provider configuration */
export interface ChecklistProviderConfig {
  /** Checklist definitions */
  checklists: ChecklistConfig[]
  /** Persistence configuration */
  persistence?: ChecklistPersistenceConfig
  /** Context data for conditions */
  context?: Partial<ChecklistContextData>
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
}
