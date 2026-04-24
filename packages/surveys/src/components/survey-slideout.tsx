'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import { cn } from '../lib/utils'
import type { DismissalReason, SlideoutOptions } from '../types/survey'
import { slideoutContentVariants, slideoutOverlayVariants } from './ui/slideout-variants'

export interface SurveySlideoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof slideoutContentVariants> {
  surveyId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  options?: SlideoutOptions
  children?: React.ReactNode
}

export const SurveySlideout = React.forwardRef<HTMLDivElement, SurveySlideoutProps>(
  (
    {
      surveyId,
      open: openProp,
      onOpenChange,
      position,
      size,
      options,
      className,
      children,
      ...props
    },
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

    const slideoutOptions: SlideoutOptions = {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      showCloseButton: true,
      ...options,
      ...config?.slideoutOptions,
    }

    const effectivePosition = position ?? config?.slideoutOptions?.position ?? 'right'
    const effectiveSize = size ?? config?.slideoutOptions?.size ?? 'md'

    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(slideoutOverlayVariants())}
            onClick={
              slideoutOptions.closeOnOverlayClick ? () => handleDismiss('overlay_click') : undefined
            }
          />
          <Dialog.Content
            ref={ref}
            className={cn(
              slideoutContentVariants({ position: effectivePosition, size: effectiveSize }),
              className
            )}
            onEscapeKeyDown={
              slideoutOptions.closeOnEscape
                ? () => handleDismiss('escape_key')
                : (e) => e.preventDefault()
            }
            data-survey-slideout={surveyId}
            {...props}
          >
            {config?.title && <Dialog.Title>{config.title}</Dialog.Title>}
            {config?.description && typeof config.description === 'string' ? (
              <Dialog.Description>{config.description}</Dialog.Description>
            ) : config?.description ? (
              <div>{config.description}</div>
            ) : null}
            {children}
            {slideoutOptions.showCloseButton && (
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
SurveySlideout.displayName = 'SurveySlideout'
