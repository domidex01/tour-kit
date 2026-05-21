'use client'

import { cn } from '@tour-kit/core'
import { MediaSlot } from '@tour-kit/media'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useAnnouncementsContext } from '../context/announcements-context'
import { useAnnouncement } from '../hooks/use-announcement'
import { toMediaSlotProps } from '../lib/media-slot-adapter'
import { useResolvedText } from '../lib/use-resolved-text'
import type { DismissalReason, ToastOptions } from '../types/announcement'
import type { ToastAdapterHandle } from '../types/toast-adapter'
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
    const { toastAdapter } = useAnnouncementsContext()
    const [progress, setProgress] = React.useState(100)
    const [mounted, setMounted] = React.useState(false)
    // When `toastAdapter` is non-null, suppress the portal by default and
    // only fall back to it if the adapter explicitly returns `null` (e.g.,
    // sonner isn't installed). This avoids a one-frame flash of the portal
    // while the adapter's async render resolves.
    const [adapterFallback, setAdapterFallback] = React.useState(false)

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

    // Phase 7 — Toast adapter routing. When the provider is wired with a
    // `toastAdapter` (e.g., Sonner), dispatch the toast through the adapter
    // and suppress the built-in portal. If the adapter returns null
    // (e.g., sonner isn't installed), `adapterHandled` stays false and we
    // fall back to the portal render below.
    const renderedContent = React.useMemo(
      () =>
        useConfig && config ? (
          <>
            {config.media && (
              <div className="mb-2" data-slot="announcement-media">
                <MediaSlot {...toMediaSlotProps(config.media)} />
              </div>
            )}
            {resolvedTitle && <div className="font-medium">{resolvedTitle}</div>}
            {resolvedDescription && <div className="text-sm opacity-90">{resolvedDescription}</div>}
          </>
        ) : (
          children
        ),
      [useConfig, config, resolvedTitle, resolvedDescription, children]
    )

    React.useEffect(() => {
      if (!open || !toastAdapter) {
        setAdapterFallback(false)
        return
      }

      let cancelled = false
      let handle: ToastAdapterHandle | null = null
      ;(async () => {
        const result = await toastAdapter.render({
          id,
          content: renderedContent,
          options: {
            duration: toastOptions.autoDismissDelay ?? 5000,
            position: effectivePosition,
          },
          onDismiss: () => handleDismiss('auto_dismiss'),
        })

        if (cancelled) {
          result?.dismiss()
          return
        }

        if (result) {
          handle = result
          // adapter handled — keep portal suppressed (adapterFallback stays false)
        } else {
          // adapter returned null (sonner missing, etc.) → use the portal
          setAdapterFallback(true)
        }
      })()

      return () => {
        cancelled = true
        handle?.dismiss()
      }
    }, [
      open,
      toastAdapter,
      id,
      renderedContent,
      toastOptions.autoDismissDelay,
      effectivePosition,
      handleDismiss,
    ])

    // Whether the built-in portal is the active render path.
    const portalActive = !toastAdapter || adapterFallback

    // Auto-dismiss timer — only runs when the built-in portal is the render
    // path. Adapter-handled toasts manage their own lifecycle via the
    // adapter's `duration`/`onDismiss` plumbing.
    React.useEffect(() => {
      if (!open || !toastOptions.autoDismiss || !portalActive) return

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
    }, [open, toastOptions.autoDismiss, toastOptions.autoDismissDelay, handleDismiss, portalActive])

    // Suppress the portal whenever an adapter is wired (pessimistic) — only
    // render it when no adapter is set OR the adapter has explicitly fallen
    // back via null. Prevents a one-frame flash on toast open.
    if (!open || !mounted || !portalActive) return null

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
          <div className="flex-1 space-y-1">{renderedContent}</div>

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
