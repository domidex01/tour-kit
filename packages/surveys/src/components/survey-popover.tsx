'use client'

import {
  type Placement as FloatingPlacement,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import { cn } from '../lib/utils'
import type { DismissalReason, PopoverOptions, PopoverPosition } from '../types/survey'

const POSITION_MAP: Record<PopoverPosition, FloatingPlacement> = {
  'bottom-right': 'bottom-end',
  'bottom-left': 'bottom-start',
  'top-right': 'top-end',
  'top-left': 'top-start',
}

export interface SurveyPopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  surveyId: string
  /** Element to anchor the popover to — required for positioning */
  anchor?: HTMLElement | null
  /** CSS selector to resolve the anchor if no element reference is passed */
  anchorSelector?: string
  options?: PopoverOptions
  children?: React.ReactNode
}

export const SurveyPopover = React.forwardRef<HTMLDivElement, SurveyPopoverProps>(
  ({ surveyId, anchor, anchorSelector, options, className, children, ...props }, ref) => {
    const survey = useSurvey(surveyId)
    const config = survey.config

    const resolvedAnchor = React.useMemo(() => {
      if (anchor) return anchor
      if (anchorSelector && typeof document !== 'undefined') {
        return document.querySelector<HTMLElement>(anchorSelector) ?? undefined
      }
      if (typeof document !== 'undefined') {
        return (
          document.querySelector<HTMLElement>(`[data-survey-popover-anchor="${surveyId}"]`) ??
          undefined
        )
      }
      return undefined
    }, [anchor, anchorSelector, surveyId])

    const popoverOptions: PopoverOptions = {
      position: 'bottom-right',
      offset: 8,
      showCloseButton: true,
      ...options,
      ...config?.popoverOptions,
    }

    const placement = POSITION_MAP[popoverOptions.position ?? 'bottom-right']

    const isVisible = survey.state?.isVisible ?? false
    const shouldRender = isVisible && !!resolvedAnchor

    const { refs, floatingStyles } = useFloating({
      elements: { reference: resolvedAnchor ?? null },
      open: shouldRender,
      placement,
      middleware: [offset(popoverOptions.offset ?? 8), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    })

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        survey.dismiss(reason)
      },
      [survey]
    )

    if (!shouldRender) return null

    return (
      <FloatingPortal>
        <div
          ref={(node: HTMLDivElement | null) => {
            refs.setFloating(node)
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          role="dialog"
          aria-label={config?.title ?? 'Survey'}
          style={floatingStyles}
          className={cn(
            'z-50 rounded-md border bg-background p-4 shadow-md min-w-[280px] max-w-sm',
            className
          )}
          data-survey-popover={surveyId}
          {...props}
        >
          {config?.title && <div className="font-medium mb-1">{config.title}</div>}
          {config?.description && typeof config.description === 'string' && (
            <div className="text-sm text-muted-foreground mb-2">{config.description}</div>
          )}
          {children}
          {popoverOptions.showCloseButton && (
            <button
              type="button"
              aria-label="Close survey"
              onClick={() => handleDismiss('close_button')}
              className="absolute right-2 top-2 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </FloatingPortal>
    )
  }
)
SurveyPopover.displayName = 'SurveyPopover'
