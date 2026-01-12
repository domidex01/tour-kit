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

type TaskSize = ChecklistTaskVariants['size']

function getIconSizeClasses(size: TaskSize): string {
  if (size === 'sm') return 'w-2.5 h-2.5'
  if (size === 'lg') return 'w-4 h-4'
  return 'w-3 h-3'
}

function getContainerIconSizeClasses(size: TaskSize): string {
  if (size === 'sm') return 'w-4 h-4'
  if (size === 'lg') return 'w-6 h-6'
  return 'w-5 h-5'
}

function getArrowSizeClasses(size: TaskSize): string {
  if (size === 'sm') return 'w-3 h-3'
  if (size === 'lg') return 'w-5 h-5'
  return 'w-4 h-4'
}

function getTaskState(locked: boolean, completed: boolean): 'locked' | 'completed' | 'default' {
  if (locked) return 'locked'
  if (completed) return 'completed'
  return 'default'
}

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

    const state = getTaskState(locked, completed)
    const showArrow = config.action && !locked && !completed
    const checkboxLabel = completed ? 'Mark as incomplete' : 'Mark as complete'

    const handleClick = () => {
      if (!locked) onClick?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!locked) onToggle?.()
    }

    return (
      <div
        ref={ref}
        className={cn(checklistTaskVariants({ size, state }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        // biome-ignore lint/a11y/useSemanticElements: Cannot use button element because it contains nested interactive checkbox button
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
          aria-label={checkboxLabel}
        >
          {completed && (
            <svg
              className={getIconSizeClasses(size)}
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
            className={cn('flex-shrink-0 text-muted-foreground', getContainerIconSizeClasses(size))}
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
        {showArrow && (
          <svg
            className={cn(
              'flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity',
              getArrowSizeClasses(size)
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
