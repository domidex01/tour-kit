'use client'

import { cn } from '@tour-kit/core'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useAnnouncement } from '../hooks/use-announcement'
import { useResolvedText } from '../lib/use-resolved-text'
import type { DismissalReason, ToastOptions } from '../types/announcement'
import { AnnouncementClose } from './announcement-close'
import { toastContainerVariants, toastProgressVariants, toastVariants } from './ui/toast-variants'

export interface AnnouncementToastProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof toastVariants> {
  /** Announcement ID */
  id: string
  /** Whether the toast is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Toast options */
  options?: ToastOptions
  /** Content to render inside toast */
  children?: React.ReactNode
  /** Use config from provider */
  useConfig?: boolean
}

export const AnnouncementToast = React.forwardRef<HTMLDivElement, AnnouncementToastProps>(
  (
    {
      id,
      open: openProp,
      onOpenChange,
      position,
      intent,
      options,
      className,
      children,
      useConfig = true,
      ...props
    },
    ref
  ) => {
    const announcement = useAnnouncement(id)
    const config = announcement.config
    const [progress, setProgress] = React.useState(100)
    const [mounted, setMounted] = React.useState(false)

    const resolvedTitle = useResolvedText(config?.title)
    const resolvedDescription = useResolvedText(config?.description)

    // Controlled or uncontrolled open state
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : announcement.isVisible

    React.useEffect(() => {
      setMounted(true)
    }, [])

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        announcement.dismiss(reason)
        onOpenChange?.(false)
      },
      [announcement, onOpenChange]
    )

    const toastOptions: ToastOptions = {
      autoDismiss: true,
      autoDismissDelay: 5000,
      showProgress: true,
      ...options,
      ...config?.toastOptions,
    }

    const effectivePosition = position ?? config?.toastOptions?.position ?? 'bottom-right'
    const effectiveIntent = intent ?? config?.toastOptions?.intent ?? 'info'

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
          handleDismiss('auto_dismiss')
        }
      }, 50)

      return () => {
        clearInterval(timer)
        setProgress(100)
      }
    }, [open, toastOptions.autoDismiss, toastOptions.autoDismissDelay, handleDismiss])

    if (!open || !mounted) return null

    const toastContent = (
      <div className={cn(toastContainerVariants({ position: effectivePosition }))}>
        <div
          ref={ref}
          role="alert"
          aria-live="polite"
          data-state={open ? 'open' : 'closed'}
          className={cn(
            toastVariants({ intent: effectiveIntent, position: effectivePosition }),
            className
          )}
          {...props}
        >
          <div className="flex-1 space-y-1">
            {useConfig && config ? (
              <>
                {resolvedTitle && <div className="font-medium">{resolvedTitle}</div>}
                {resolvedDescription && (
                  <div className="text-sm opacity-90">{resolvedDescription}</div>
                )}
              </>
            ) : (
              children
            )}
          </div>

          <AnnouncementClose
            onClose={() => handleDismiss('close_button')}
            className="relative right-0 top-0 shrink-0"
          />

          {toastOptions.showProgress && toastOptions.autoDismiss && (
            <div
              className={cn(toastProgressVariants({ intent: effectiveIntent }))}
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
      </div>
    )

    return createPortal(toastContent, document.body)
  }
)
AnnouncementToast.displayName = 'AnnouncementToast'
