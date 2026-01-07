import type * as React from 'react'
import { useTask } from '../../hooks/use-task'
import type { ChecklistTaskState } from '../../types'

export interface TaskRenderProps {
  /** Task state */
  task: ChecklistTaskState
  /** Whether task is completed */
  isCompleted: boolean
  /** Whether task is locked */
  isLocked: boolean
  /** Whether task is visible */
  isVisible: boolean
  /** Complete the task */
  complete: () => void
  /** Uncomplete the task */
  uncomplete: () => void
  /** Execute task action */
  execute: () => void
  /** Toggle completion */
  toggle: () => void
}

export interface TaskHeadlessProps {
  /** Checklist ID */
  checklistId: string
  /** Task ID */
  taskId: string
  /** Render function for custom UI */
  render: (props: TaskRenderProps) => React.ReactNode
  /** Children to wrap (alternative to render) */
  children?: (props: TaskRenderProps) => React.ReactNode
}

/**
 * Headless task component - provides all logic without UI
 *
 * Use this when you need complete control over individual task UI
 * while leveraging the task state management.
 *
 * @example
 * ```tsx
 * <TaskHeadless
 *   checklistId="onboarding"
 *   taskId="profile"
 *   render={({ task, isCompleted, isLocked, toggle, execute }) => (
 *     <div className={`my-task ${isCompleted ? 'done' : ''}`}>
 *       <input
 *         type="checkbox"
 *         checked={isCompleted}
 *         onChange={toggle}
 *         disabled={isLocked}
 *       />
 *       <span onClick={execute}>{task.config.title}</span>
 *     </div>
 *   )}
 * />
 * ```
 */
export function TaskHeadless({
  checklistId,
  taskId,
  render,
  children,
}: TaskHeadlessProps): React.ReactNode {
  const { task, isCompleted, isLocked, isVisible, complete, uncomplete, execute, toggle } = useTask(
    checklistId,
    taskId
  )

  if (!task || !isVisible) return null

  const renderProps: TaskRenderProps = {
    task,
    isCompleted,
    isLocked,
    isVisible,
    complete,
    uncomplete,
    execute,
    toggle,
  }

  const renderFn = render || children
  if (!renderFn) {
    console.warn('[TourKit Checklists] TaskHeadless requires render prop or children')
    return null
  }

  return <>{renderFn(renderProps)}</>
}
