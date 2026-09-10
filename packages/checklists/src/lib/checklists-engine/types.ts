/**
 * v3 Phase 2 — the React-free type surface of `@tour-kit/checklists/engine`.
 *
 * Nothing here may import `react`, `@tour-kit/media`, or the package's own
 * `../../types` barrel: `src/types/checklist.ts` imports `ReactNode` and
 * `MediaSlotProps`, and one type import from it puts both in this entry's
 * declaration closure.
 */
import type { LocalizedText } from '@tour-kit/core/engine'

export interface ChecklistContextData {
  user: Record<string, unknown>
  data: Record<string, unknown>
  completedTasks: string[]
  completedTours: string[]
}

export type TaskAction =
  | { type: 'navigate'; url: string; external?: boolean }
  | { type: 'callback'; handler: () => void | Promise<void> }
  | { type: 'tour'; tourId: string }
  | { type: 'modal'; modalId: string }
  | { type: 'custom'; data: unknown }

/**
 * Built-in completion shape for tasks that auto-complete when the user
 * navigates to a matching URL. Browser-only; SSR-safe (the listener no-ops
 * outside `window`).
 *
 * - `urlPattern: string` → substring match against `location.pathname`
 *   (e.g. `'/dashboard'` matches `'/dashboard/main'`).
 * - `urlPattern: RegExp` → regex test against `location.pathname`
 *   (e.g. `/^\/billing/` matches `'/billing/plan'` only).
 *
 * Consumers needing non-standard routing (hash routing, in-app sub-paths)
 * should use `{ custom: (ctx) => ... }` instead.
 */
export type UrlVisitCompletion = {
  type: 'urlVisit'
  urlPattern: string | RegExp
}

export type TaskCompletionCondition =
  | { tourCompleted: string }
  | { tourStarted: string }
  | { custom: (context: ChecklistContextData) => boolean }
  | UrlVisitCompletion

/** The fields the engine reads. The React config narrows this with icon/media. */
export interface EngineTaskConfig {
  id: string
  title: LocalizedText
  description?: LocalizedText
  action?: TaskAction
  dependsOn?: string[]
  when?: (context: ChecklistContextData) => boolean
  completedWhen?: TaskCompletionCondition
  manualComplete?: boolean
  meta?: Record<string, unknown>
}

export interface EngineChecklistConfig {
  id: string
  title: LocalizedText
  description?: LocalizedText
  tasks: EngineTaskConfig[]
  onComplete?: () => void
  onDismiss?: () => void
  dismissible?: boolean
  hideOnComplete?: boolean
  meta?: Record<string, unknown>
}

export interface EngineTaskState<TTask extends EngineTaskConfig = EngineTaskConfig> {
  config: TTask
  completed: boolean
  locked: boolean
  visible: boolean
  completedAt?: number
}

export interface EngineChecklistState<
  TConfig extends EngineChecklistConfig = EngineChecklistConfig,
> {
  config: TConfig
  tasks: EngineTaskState<TConfig['tasks'][number]>[]
  progress: number
  completedCount: number
  totalCount: number
  isComplete: boolean
  isDismissed: boolean
  isExpanded: boolean
}

export interface ChecklistProgress {
  completed: number
  total: number
  percentage: number
  remaining: number
}

export interface PersistedChecklistState {
  completed: Record<string, string[]>
  dismissed: string[]
  timestamp: number
  completedAt?: Record<string, Record<string, number>>
  notifiedComplete?: string[]
}

export interface ChecklistPersistenceConfig {
  enabled: boolean
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  key?: string
  onSave?: (state: PersistedChecklistState) => void | Promise<void>
  onLoad?: () => PersistedChecklistState | null | Promise<PersistedChecklistState | null>
}

export interface ChecklistsEngineState<
  TConfig extends EngineChecklistConfig = EngineChecklistConfig,
> {
  checklists: Map<string, EngineChecklistState<TConfig>>
  completed: Record<string, Set<string>>
  dismissed: Set<string>
  completedAt: Record<string, Record<string, number>>
  notifiedComplete: Set<string>
}

export type ChecklistsAction =
  | { type: 'COMPLETE_TASK'; checklistId: string; taskId: string; at: number }
  | { type: 'UNCOMPLETE_TASK'; checklistId: string; taskId: string }
  | { type: 'DISMISS_CHECKLIST'; checklistId: string }
  | { type: 'RESTORE_CHECKLIST'; checklistId: string }
  | { type: 'SET_EXPANDED'; checklistId: string; expanded: boolean }
  | { type: 'RESET_CHECKLIST'; checklistId: string }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD_PERSISTED'; state: PersistedChecklistState }
  // No `MARK_NOTIFIED_COMPLETE`: completion is not a verb a caller dispatches.
  // The reducer records it as part of whichever transition caused it, and the
  // engine fires the callbacks for the difference. See `markNewlyComplete`.
  | { type: 'SET_CHECKLISTS' }

/**
 * `changed` says whether the verb actually moved the state — `false` for a
 * complete on an already-complete task, a dismiss of an already-dismissed
 * checklist, and so on. The React binding gates ANALYTICS on it (the provider
 * had that guard at `checklist-provider.tsx:443`) while still forwarding the
 * consumer's own callback unconditionally, which is what it does today.
 * No callback fires at all after `destroy()`.
 */
export interface ChecklistsEngineCallbacks {
  onTaskComplete?: (checklistId: string, taskId: string, changed: boolean) => void
  onTaskUncomplete?: (checklistId: string, taskId: string, changed: boolean) => void
  onChecklistComplete?: (checklistId: string) => void
  onChecklistDismiss?: (checklistId: string, changed: boolean) => void
  onTaskAction?: (checklistId: string, taskId: string, action: unknown) => void
}
