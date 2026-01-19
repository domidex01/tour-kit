'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import { cva } from 'class-variance-authority'
import type { AnnouncementAction } from '../types/announcement'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface AnnouncementActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary action configuration */
  primaryAction?: AnnouncementAction
  /** Secondary action configuration */
  secondaryAction?: AnnouncementAction
  /** Callback when any action is clicked */
  onAction?: (type: 'primary' | 'secondary') => void
  /** Callback when dismiss should happen (if action.dismissOnClick is true) */
  onDismiss?: () => void
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
}

export const AnnouncementActions = React.forwardRef<HTMLDivElement, AnnouncementActionsProps>(
  (
    {
      className,
      primaryAction,
      secondaryAction,
      onAction,
      onDismiss,
      direction = 'horizontal',
      children,
      ...props
    },
    ref
  ) => {
    const handlePrimaryClick = React.useCallback(() => {
      primaryAction?.onClick?.()
      onAction?.('primary')
      if (primaryAction?.dismissOnClick) {
        onDismiss?.()
      }
    }, [primaryAction, onAction, onDismiss])

    const handleSecondaryClick = React.useCallback(() => {
      secondaryAction?.onClick?.()
      onAction?.('secondary')
      if (secondaryAction?.dismissOnClick) {
        onDismiss?.()
      }
    }, [secondaryAction, onAction, onDismiss])

    const hasActions = primaryAction || secondaryAction || children

    if (!hasActions) return null

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-2',
          direction === 'vertical' ? 'flex-col' : 'flex-row justify-end',
          className
        )}
        {...props}
      >
        {children}

        {secondaryAction && (
          <ActionButton
            action={secondaryAction}
            defaultVariant="secondary"
            onClick={handleSecondaryClick}
          />
        )}

        {primaryAction && (
          <ActionButton
            action={primaryAction}
            defaultVariant="primary"
            onClick={handlePrimaryClick}
          />
        )}
      </div>
    )
  }
)
AnnouncementActions.displayName = 'AnnouncementActions'

interface ActionButtonProps {
  action: AnnouncementAction
  defaultVariant: 'primary' | 'secondary'
  onClick: () => void
}

function ActionButton({ action, defaultVariant, onClick }: ActionButtonProps) {
  const variant = action.variant ?? defaultVariant

  if (action.href) {
    return (
      <a
        href={action.href}
        className={cn(buttonVariants({ variant, size: 'md' }))}
        onClick={onClick}
      >
        {action.label}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size: 'md' }))}
      onClick={onClick}
    >
      {action.label}
    </button>
  )
}
