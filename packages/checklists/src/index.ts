// Context
export { ChecklistContext, useChecklistContext } from './context/checklist-context'
export type { ChecklistContextValue } from './context/checklist-context'
export { ChecklistProvider } from './context/checklist-provider'

// Components
export {
  Checklist,
  ChecklistTask,
  ChecklistProgress,
  ChecklistLauncher,
  ChecklistPanel,
} from './components'
export type {
  ChecklistProps,
  ChecklistTaskProps,
  ChecklistProgressProps,
  ChecklistLauncherProps,
  ChecklistPanelProps,
} from './components'

// Headless Components
export { ChecklistHeadless, TaskHeadless } from './components/headless'
export type {
  ChecklistHeadlessProps,
  ChecklistRenderProps,
  TaskHeadlessProps,
  TaskRenderProps,
} from './components/headless'

// UI Variants
export * from './components/ui'

// Hooks
export { useChecklist, useTask, useChecklistPersistence, useChecklistsProgress } from './hooks'
export type { UseChecklistReturn, UseTaskReturn, UseChecklistPersistenceReturn } from './hooks'

// Utilities
export { createChecklist, createTask } from './utils/create-checklist'
export { calculateProgress, getNextTask, getLockedTasks } from './utils/progress'
export {
  canCompleteTask,
  resolveTaskDependencies,
  hasCircularDependency,
} from './utils/dependencies'

// Slot & UI Library (Base UI support)
export { Slot, Slottable, UnifiedSlot, type UnifiedSlotProps } from './lib/slot'
export {
  UILibraryProvider,
  useUILibrary,
  type UILibrary,
  type UILibraryProviderProps,
} from '@tour-kit/core'

// Types
export type {
  // Checklist types
  ChecklistConfig,
  ChecklistState,
  ChecklistTaskConfig,
  ChecklistTaskState,
  ChecklistProgress as ChecklistProgressType,
  ChecklistContext as ChecklistContextData,
  TaskAction,
  TaskCompletionCondition,
  // Config types
  ChecklistProviderConfig,
  ChecklistPersistenceConfig,
  PersistedChecklistState,
} from './types'
