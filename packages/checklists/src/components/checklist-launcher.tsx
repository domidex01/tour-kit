'use client'

import {
  FloatingFocusManager,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import * as React from 'react'
import { useChecklist } from '../hooks/use-checklist'
import { Checklist } from './checklist'
import { cn } from './cn'
import {
  type ChecklistLauncherVariants,
  type LauncherBadgeVariants,
  type LauncherPositionVariants,
  checklistLauncherVariants,
  launcherBadgeVariants,
  launcherPositionVariants,
} from './ui/launcher-variants'

export interface ChecklistLauncherProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>,
    ChecklistLauncherVariants,
    LauncherPositionVariants {
  /** Checklist ID */
  checklistId: string
  /** Badge variant */
  badgeVariant?: LauncherBadgeVariants['variant']
  /** Custom className for panel */
  panelClassName?: string
  /** Custom button content */
  children?: React.ReactNode
}

/**
 * Floating launcher button with expandable checklist panel
 * Follows shadcn/ui patterns with CVA variants
 *
 * @example
 * ```tsx
 * <ChecklistLauncher checklistId="onboarding" position="bottom-right" />
 * ```
 *
 * @example
 * ```tsx
 * <ChecklistLauncher
 *   checklistId="onboarding"
 *   size="lg"
 *   variant="secondary"
 *   position="bottom-left"
 * />
 * ```
 */
export const ChecklistLauncher = React.forwardRef<HTMLButtonElement, ChecklistLauncherProps>(
  (
    {
      checklistId,
      position = 'bottom-right',
      size,
      variant,
      badgeVariant,
      className,
      panelClassName,
      children,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const panelId = React.useId()
    const { checklist, progress, isDismissed, isComplete } = useChecklist(checklistId)

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: position?.includes('right') ? 'top-end' : 'top-start',
      middleware: [offset(12), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    })

    const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true })
    const role = useRole(context, { role: 'dialog' })
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role])

    // Merge floating-ui ref with forwarded ref
    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        refs.setReference(node)
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [refs, ref]
    )

    if (!checklist || isDismissed) return null
    if (isComplete && checklist.config.hideOnComplete) return null

    return (
      <div className={launcherPositionVariants({ position })}>
        {/* Launcher Button */}
        <button
          ref={mergedRef}
          type="button"
          className={cn(checklistLauncherVariants({ size, variant }), className)}
          aria-label={isOpen ? 'Close checklist' : 'Open checklist'}
          {...getReferenceProps({
            onClick: () => setIsOpen(!isOpen),
          })}
          aria-controls={panelId}
          {...props}
        >
          {children ?? (
            <svg
              className={size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          )}

          {/* Progress Badge */}
          {progress.remaining > 0 && (
            <span className={launcherBadgeVariants({ size, variant: badgeVariant })}>
              {progress.remaining}
            </span>
          )}
        </button>

        {/* Panel */}
        {isOpen && (
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={cn('w-80 z-50', panelClassName)}
              {...getFloatingProps()}
              id={panelId}
            >
              <Checklist checklistId={checklistId} />
            </div>
          </FloatingFocusManager>
        )}
      </div>
    )
  }
)
ChecklistLauncher.displayName = 'ChecklistLauncher'
