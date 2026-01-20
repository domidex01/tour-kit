'use client'

import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import { useUILibrary } from '../lib/ui-library-context'
import type { RenderProp } from '../lib/unified-slot'
import { cn } from '../lib/utils'

const defaultIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export interface AnnouncementCloseProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  asChild?: boolean
  children?: React.ReactNode | RenderProp
  /** Callback when close button is clicked */
  onClose?: () => void
}

export const AnnouncementClose = React.forwardRef<HTMLButtonElement, AnnouncementCloseProps>(
  ({ className, asChild = false, children, onClick, onClose, ...props }, ref) => {
    const library = useUILibrary()

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          onClose?.()
        }
      },
      [onClick, onClose]
    )

    const sharedProps = {
      ref,
      onClick: handleClick,
      className: cn(
        'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
        className
      ),
      'aria-label': 'Close',
      type: 'button' as const,
      ...props,
    }

    // When asChild is true and using Base UI, use UnifiedSlot which accepts RenderProp
    if (asChild && library === 'base-ui') {
      return <UnifiedSlot {...sharedProps}>{children ?? defaultIcon}</UnifiedSlot>
    }

    // When asChild is true and using Radix UI, use Slot
    if (asChild) {
      return <Slot {...sharedProps}>{(children as React.ReactNode) ?? defaultIcon}</Slot>
    }

    // Default: render as button
    return <button {...sharedProps}>{(children as React.ReactNode) ?? defaultIcon}</button>
  }
)
AnnouncementClose.displayName = 'AnnouncementClose'
