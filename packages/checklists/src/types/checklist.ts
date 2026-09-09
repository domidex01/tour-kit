import type { MediaSlotProps } from '@tour-kit/media'
import type { ReactNode } from 'react'
import type {
  ChecklistContextData,
  EngineChecklistConfig,
  EngineChecklistState,
  EngineTaskConfig,
  EngineTaskState,
} from '../lib/checklists-engine/types'

// The React-free half is declared once, in the engine, and re-exported here so
// the public names do not move. v3 Phase 2.
export type {
  ChecklistProgress,
  TaskAction,
  TaskCompletionCondition,
  UrlVisitCompletion,
} from '../lib/checklists-engine/types'
export type { ChecklistContextData as ChecklistContext } from '../lib/checklists-engine/types'

/**
 * Individual task definition — the engine's task config plus the two fields
 * only a React renderer can use.
 */
export interface ChecklistTaskConfig extends EngineTaskConfig {
  /**
   * Optional media (video / GIF / Lottie / image) rendered inside the task
   * row, below the description. Auto-detects the embed provider via URL
   * pattern matching.
   */
  media?: MediaSlotProps
  /** Icon name or component */
  icon?: string | ReactNode
}

/** Checklist definition */
export interface ChecklistConfig extends EngineChecklistConfig {
  /** Icon name or component */
  icon?: string | ReactNode
  /** Tasks in this checklist */
  tasks: ChecklistTaskConfig[]
}

/** Runtime task state */
export type ChecklistTaskState = EngineTaskState<ChecklistTaskConfig>

/** Runtime checklist state */
export type ChecklistState = EngineChecklistState<ChecklistConfig>

export type { ChecklistContextData }
