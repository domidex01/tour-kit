'use client'

import * as React from 'react'
import { useAnnouncement } from '../../hooks/use-announcement'
import type { DismissalReason, ToastOptions } from '../../types/announcement'

export interface HeadlessToastRenderProps {
  /** Whether the toast is visible */
  open: boolean
  /** The announcement state */
  state: ReturnType<typeof useAnnouncement>['state']
  /** The announcement config */
  config: ReturnType<typeof useAnnouncement>['config']
  /** Dismiss the toast */
  dismiss: (reason?: DismissalReason) => void
  /** Props for the toast element */
  toastProps: {
    role: string
    'aria-live': 'polite' | 'assertive'
    'data-state': string
  }
  /** Auto-dismiss progress (0-100) */
  progress: number
  /** Toast options */
  options: ToastOptions
}

export interface HeadlessToastProps {
  /** Announcement ID */
  id: string
  /** Whether the toast is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Toast options */
  options?: ToastOptions
  /** Render function */
  children: (props: HeadlessToastRenderProps) => React.ReactNode
}

export function HeadlessToast({
  id,
  open: openProp,
  onOpenChange,
  options,
  children,
}: HeadlessToastProps) {
  const announcement = useAnnouncement(id)
  const config = announcement.config
  const [progress, setProgress] = React.useState(100)

  // Controlled or uncontrolled open state
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : announcement.isVisible

  const dismiss = React.useCallback(
    (reason: DismissalReason = 'close_button') => {
      announcement.dismiss(reason)
      onOpenChange?.(false)
    },
    [announcement, onOpenChange]
  )

  const toastOptions: ToastOptions = {
    position: 'bottom-right',
    autoDismiss: true,
    autoDismissDelay: 5000,
    showProgress: true,
    intent: 'info',
    ...options,
    ...config?.toastOptions,
  }

  // Auto-dismiss timer
  React.useEffect(() => {
    if (!open || !toastOptions.autoDismiss) return

    const startTime = Date.now()
    const duration = toastOptions.autoDismissDelay ?? 5000

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        clearInterval(timer)
        dismiss('auto_dismiss')
      }
    }, 50)

    return () => {
      clearInterval(timer)
      setProgress(100)
    }
  }, [open, toastOptions.autoDismiss, toastOptions.autoDismissDelay, dismiss])

  const toastProps = {
    role: 'alert' as const,
    'aria-live': 'polite' as const,
    'data-state': open ? 'open' : 'closed',
  }

  return children({
    open,
    state: announcement.state,
    config: announcement.config,
    dismiss,
    toastProps,
    progress,
    options: toastOptions,
  })
}
