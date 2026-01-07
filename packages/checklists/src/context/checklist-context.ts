import { createContext, useContext } from 'react'
import type {
  ChecklistContext as ChecklistContextType,
  ChecklistProgress,
  ChecklistState,
} from '../types'

export interface ChecklistContextValue {
  /** All checklist states */
  checklists: Map<string, ChecklistState>
  /** Context data for conditions */
  context: ChecklistContextType
  /** Get a specific checklist */
  getChecklist: (id: string) => ChecklistState | undefined
  /** Complete a task */
  completeTask: (checklistId: string, taskId: string) => void
  /** Uncomplete a task */
  uncompleteTask: (checklistId: string, taskId: string) => void
  /** Execute task action */
  executeAction: (checklistId: string, taskId: string) => void
  /** Dismiss a checklist */
  dismissChecklist: (checklistId: string) => void
  /** Restore a dismissed checklist */
  restoreChecklist: (checklistId: string) => void
  /** Toggle checklist expanded state */
  toggleExpanded: (checklistId: string) => void
  /** Set expanded state */
  setExpanded: (checklistId: string, expanded: boolean) => void
  /** Reset a checklist */
  resetChecklist: (checklistId: string) => void
  /** Reset all checklists */
  resetAll: () => void
  /** Get progress for a checklist */
  getProgress: (checklistId: string) => ChecklistProgress
}

export const ChecklistContext = createContext<ChecklistContextValue | null>(null)

export function useChecklistContext(): ChecklistContextValue {
  const context = useContext(ChecklistContext)
  if (!context) {
    throw new Error('useChecklistContext must be used within a ChecklistProvider')
  }
  return context
}
