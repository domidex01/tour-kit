'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { useAnnouncement } from '../hooks/use-announcement'
import { cn } from '../lib/utils'
import type { DismissalReason, ModalOptions } from '../types/announcement'
import { AnnouncementActions } from './announcement-actions'
import { AnnouncementClose } from './announcement-close'
import { AnnouncementContent } from './announcement-content'
import { modalContentVariants, modalOverlayVariants } from './ui/modal-variants'

export interface AnnouncementModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof modalContentVariants> {
  /** Announcement ID */
  id: string
  /** Whether the modal is open (controlled) */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Modal options */
  options?: ModalOptions
  /** Content to render inside modal */
  children?: React.ReactNode
  /** Use config from provider */
  useConfig?: boolean
}

export const AnnouncementModal = React.forwardRef<HTMLDivElement, AnnouncementModalProps>(
  (
    {
      id,
      open: openProp,
      onOpenChange,
      size,
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

    // Controlled or uncontrolled open state
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : announcement.isVisible

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        onOpenChange?.(newOpen)
        if (!isControlled) {
          if (newOpen) {
            announcement.show()
          } else {
            announcement.hide()
          }
        }
      },
      [onOpenChange, isControlled, announcement]
    )

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        announcement.dismiss(reason)
        onOpenChange?.(false)
      },
      [announcement, onOpenChange]
    )

    const handleComplete = React.useCallback(() => {
      announcement.complete()
      onOpenChange?.(false)
    }, [announcement, onOpenChange])

    const modalOptions: ModalOptions = {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      showCloseButton: true,
      ...options,
      ...config?.modalOptions,
    }

    const effectiveSize = size ?? config?.modalOptions?.size ?? 'md'

    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(modalOverlayVariants())}
            onClick={
              modalOptions.closeOnOverlayClick ? () => handleDismiss('overlay_click') : undefined
            }
          />
          <Dialog.Content
            ref={ref}
            className={cn(modalContentVariants({ size: effectiveSize }), className)}
            onEscapeKeyDown={
              modalOptions.closeOnEscape
                ? () => handleDismiss('escape_key')
                : (e) => e.preventDefault()
            }
            {...props}
          >
            {modalOptions.showCloseButton && (
              <AnnouncementClose onClose={() => handleDismiss('close_button')} />
            )}

            {useConfig && config ? (
              <>
                <AnnouncementContent
                  title={config.title}
                  description={config.description}
                  media={config.media}
                />
                <AnnouncementActions
                  primaryAction={config.primaryAction}
                  secondaryAction={config.secondaryAction}
                  onAction={(type) => {
                    if (type === 'primary') {
                      handleComplete()
                    }
                  }}
                  onDismiss={() => handleDismiss('primary_action')}
                />
              </>
            ) : (
              children
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)
AnnouncementModal.displayName = 'AnnouncementModal'
