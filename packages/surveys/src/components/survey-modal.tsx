'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@tour-kit/core'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import type { DismissalReason, ModalOptions } from '../types/survey'
import { modalContentVariants, modalOverlayVariants } from './ui/modal-variants'

export interface SurveyModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof modalContentVariants> {
  surveyId: string
  /** Controlled open state; when undefined, follows the survey's isVisible state */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  options?: ModalOptions
  children?: React.ReactNode
}

export const SurveyModal = React.forwardRef<HTMLDivElement, SurveyModalProps>(
  (
    { surveyId, open: openProp, onOpenChange, size, options, className, children, ...props },
    ref
  ) => {
    const survey = useSurvey(surveyId)
    const config = survey.config

    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : (survey.state?.isVisible ?? false)

    const handleOpenChange = React.useCallback(
      (next: boolean) => {
        onOpenChange?.(next)
        if (!isControlled && !next) {
          survey.hide()
        }
      },
      [onOpenChange, isControlled, survey]
    )

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        survey.dismiss(reason)
        onOpenChange?.(false)
      },
      [survey, onOpenChange]
    )

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
            data-survey-modal={surveyId}
            {...props}
          >
            {config?.title && <Dialog.Title>{config.title}</Dialog.Title>}
            {config?.description && typeof config.description === 'string' ? (
              <Dialog.Description>{config.description}</Dialog.Description>
            ) : config?.description ? (
              <div>{config.description}</div>
            ) : null}
            {children}
            {modalOptions.showCloseButton && (
              <Dialog.Close
                type="button"
                aria-label="Close survey"
                onClick={() => handleDismiss('close_button')}
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden="true">×</span>
              </Dialog.Close>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)
SurveyModal.displayName = 'SurveyModal'
