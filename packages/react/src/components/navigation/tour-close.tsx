'use client'

import { useTour } from '@tour-kit/core'
import * as React from 'react'
import { type RenderProp, Slot, UnifiedSlot } from '../../lib/slot'
import { useUILibrary } from '../../lib/ui-library-context'
import { cn } from '../../lib/utils'
import { tourButtonVariants } from '../ui/button-variants'

export interface TourCloseProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  asChild?: boolean
  children?: React.ReactNode | RenderProp
}

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

export const TourClose = React.forwardRef<HTMLButtonElement, TourCloseProps>(
  ({ className, asChild = false, children, onClick, ...props }, ref) => {
    const { skip } = useTour()
    const library = useUILibrary()

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          skip()
        }
      },
      [onClick, skip]
    )

    const sharedProps = {
      ref,
      onClick: handleClick,
      className: cn(
        tourButtonVariants({ variant: 'ghost', size: 'icon' }),
        'h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      ),
      'aria-label': 'Close tour',
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
    return (
      <button type="button" {...sharedProps}>
        {(children as React.ReactNode) ?? defaultIcon}
      </button>
    )
  }
)
TourClose.displayName = 'TourClose'
