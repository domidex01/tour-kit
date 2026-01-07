import * as React from 'react'
import type { ChecklistTaskState } from '../types'
import { cn } from './cn'
import {
  type ChecklistTaskVariants,
  checklistTaskVariants,
  taskCheckboxVariants,
  taskDescriptionVariants,
  taskTitleVariants,
} from './ui/task-variants'

export interface ChecklistTaskProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onClick'>,
    Omit<ChecklistTaskVariants, 'state'> {
  /** Task state */
  task: ChecklistTaskState
  /** Called when task is clicked */
  onClick?: () => void
  /** Called when checkbox is toggled */
  onToggle?: () => void
  /** Custom icon renderer */
  renderIcon?: (task: ChecklistTaskState) => React.ReactNode
}

/**
 * Individual task item component
 * Follows shadcn/ui patterns with CVA variants
 *
 * @example
 * ```tsx
 * <ChecklistTask
 *   task={task}
 *   onClick={() => executeAction(task.config.id)}
 *   onToggle={() => toggleTask(task.config.id)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ChecklistTask task={task} size="lg" />
 * ```
 */
export const ChecklistTask = React.forwardRef<HTMLDivElement, ChecklistTaskProps>(
  ({ task, onClick, onToggle, size, className, renderIcon, ...props }, ref) => {
    const { config, completed, locked, visible } = task

    if (!visible) return null

    const state = locked ? 'locked' : completed ? 'completed' : 'default'

    const handleClick = () => {
      if (locked) return
      onClick?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (locked) return
      onToggle?.()
    }

    return (
      <div
        ref={ref}
        className={cn(checklistTaskVariants({ size, state }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={locked ? -1 : 0}
        aria-disabled={locked}
        {...props}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={taskCheckboxVariants({ size, state })}
          disabled={locked}
          aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {completed && (
            <svg
              className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Icon */}
        {(config.icon || renderIcon) && (
          <div
            className={cn(
              'flex-shrink-0 text-muted-foreground',
              size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
            )}
          >
            {renderIcon ? renderIcon(task) : config.icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={taskTitleVariants({ size, state })}>{config.title}</p>
          {config.description && (
            <p className={taskDescriptionVariants({ size })}>{config.description}</p>
          )}
        </div>

        {/* Arrow */}
        {config.action && !locked && !completed && (
          <svg
            className={cn(
              'flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity',
              size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    )
  }
)
ChecklistTask.displayName = 'ChecklistTask'
