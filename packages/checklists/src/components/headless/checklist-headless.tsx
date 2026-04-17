'use client'

import { logger } from '@tour-kit/core'
import type * as React from 'react'
import { useChecklist } from '../../hooks/use-checklist'
import type { ChecklistProgress, ChecklistState, ChecklistTaskState } from '../../types'

export interface ChecklistRenderProps {
  /** Checklist state */
  checklist: ChecklistState
  /** Visible tasks */
  visibleTasks: ChecklistTaskState[]
  /** Progress info */
  progress: ChecklistProgress
  /** Whether checklist is complete */
  isComplete: boolean
  /** Whether checklist is dismissed */
  isDismissed: boolean
  /** Whether checklist is expanded */
  isExpanded: boolean
  /** Complete a task */
  completeTask: (taskId: string) => void
  /** Uncomplete a task */
  uncompleteTask: (taskId: string) => void
  /** Execute task action */
  executeAction: (taskId: string) => void
  /** Dismiss checklist */
  dismiss: () => void
  /** Restore checklist */
  restore: () => void
  /** Toggle expanded */
  toggleExpanded: () => void
  /** Set expanded */
  setExpanded: (expanded: boolean) => void
  /** Reset checklist */
  reset: () => void
}

export interface ChecklistHeadlessProps {
  /** Checklist ID */
  checklistId: string
  /** Render function for custom UI */
  render: (props: ChecklistRenderProps) => React.ReactNode
  /** Children to wrap (alternative to render) */
  children?: (props: ChecklistRenderProps) => React.ReactNode
}

/**
 * Headless checklist component - provides all logic without UI
 *
 * Use this when you need complete control over the UI while
 * leveraging the checklist state management.
 *
 * @example
 * ```tsx
 * <ChecklistHeadless
 *   checklistId="onboarding"
 *   render={({ checklist, visibleTasks, progress, completeTask }) => (
 *     <div className="my-custom-checklist">
 *       <h2>{checklist.config.title}</h2>
 *       <progress value={progress.completed} max={progress.total} />
 *       {visibleTasks.map((task) => (
 *         <button key={task.config.id} onClick={() => completeTask(task.config.id)}>
 *           {task.config.title}
 *         </button>
 *       ))}
 *     </div>
 *   )}
 * />
 * ```
 */
export function ChecklistHeadless({
  checklistId,
  render,
  children,
}: ChecklistHeadlessProps): React.ReactNode {
  const {
    checklist,
    visibleTasks,
    progress,
    isComplete,
    isDismissed,
    isExpanded,
    completeTask,
    uncompleteTask,
    executeAction,
    dismiss,
    restore,
    toggleExpanded,
    setExpanded,
    reset,
  } = useChecklist(checklistId)

  if (!checklist) return null

  const renderProps: ChecklistRenderProps = {
    checklist,
    visibleTasks,
    progress,
    isComplete,
    isDismissed,
    isExpanded,
    completeTask,
    uncompleteTask,
    executeAction,
    dismiss,
    restore,
    toggleExpanded,
    setExpanded,
    reset,
  }

  const renderFn = render || children
  if (!renderFn) {
    logger.warn('Checklists: ChecklistHeadless requires render prop or children')
    return null
  }

  return <>{renderFn(renderProps)}</>
}
