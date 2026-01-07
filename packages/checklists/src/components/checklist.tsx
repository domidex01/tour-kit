import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { useChecklist } from '../hooks/use-checklist'
import { ChecklistProgress } from './checklist-progress'
import { ChecklistTask } from './checklist-task'
import { cn } from './cn'
import {
  type ChecklistVariants,
  checklistCompleteVariants,
  checklistContentVariants,
  checklistHeaderVariants,
  checklistVariants,
} from './ui/checklist-variants'

export interface ChecklistProps extends React.ComponentPropsWithoutRef<'div'>, ChecklistVariants {
  /** Checklist ID */
  checklistId: string
  /** Show header */
  showHeader?: boolean
  /** Show progress bar */
  showProgress?: boolean
  /** Show dismiss button */
  showDismiss?: boolean
  /** Use as child element */
  asChild?: boolean
  /** Custom task renderer */
  renderTask?: (
    task: ReturnType<typeof useChecklist>['visibleTasks'][0],
    actions: { execute: () => void; toggle: () => void }
  ) => React.ReactNode
}

/**
 * Complete checklist component
 * Follows shadcn/ui patterns with CVA variants
 *
 * @example
 * ```tsx
 * <Checklist checklistId="onboarding" showProgress />
 * ```
 *
 * @example
 * ```tsx
 * <Checklist checklistId="onboarding" size="lg" asChild>
 *   <article>...</article>
 * </Checklist>
 * ```
 */
export const Checklist = React.forwardRef<HTMLDivElement, ChecklistProps>(
  (
    {
      checklistId,
      className,
      size,
      showHeader = true,
      showProgress = true,
      showDismiss = true,
      asChild = false,
      renderTask,
      ...props
    },
    ref
  ) => {
    const {
      checklist,
      visibleTasks,
      progress,
      isComplete,
      isDismissed,
      executeAction,
      completeTask,
      uncompleteTask,
      dismiss,
    } = useChecklist(checklistId)

    if (!checklist || isDismissed) return null
    if (isComplete && checklist.config.hideOnComplete) return null

    const Comp = asChild ? Slot : 'div'

    return (
      <Comp ref={ref} className={cn(checklistVariants({ size }), className)} {...props}>
        {/* Header */}
        {showHeader && (
          <div className={checklistHeaderVariants({})}>
            <div>
              <h3 className="font-semibold">{checklist.config.title}</h3>
              {checklist.config.description && (
                <p className="text-sm text-muted-foreground">{checklist.config.description}</p>
              )}
            </div>
            {showDismiss && checklist.config.dismissible !== false && (
              <button
                type="button"
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss checklist"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Progress */}
        {showProgress && (
          <div className="px-4 py-3 border-b">
            <ChecklistProgress value={progress.completed} max={progress.total} showCount />
          </div>
        )}

        {/* Tasks */}
        <div className={checklistContentVariants({})}>
          {visibleTasks.map((task) =>
            renderTask ? (
              <React.Fragment key={task.config.id}>
                {renderTask(task, {
                  execute: () => executeAction(task.config.id),
                  toggle: () =>
                    task.completed ? uncompleteTask(task.config.id) : completeTask(task.config.id),
                })}
              </React.Fragment>
            ) : (
              <ChecklistTask
                key={task.config.id}
                task={task}
                onClick={() => executeAction(task.config.id)}
                onToggle={() =>
                  task.completed ? uncompleteTask(task.config.id) : completeTask(task.config.id)
                }
              />
            )
          )}
        </div>

        {/* Complete state */}
        {isComplete && (
          <div className={checklistCompleteVariants({})}>
            <p className="text-sm font-medium text-primary">All tasks completed!</p>
          </div>
        )}
      </Comp>
    )
  }
)
Checklist.displayName = 'Checklist'
