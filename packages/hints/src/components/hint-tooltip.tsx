'use client'

import {
  type Placement as FloatingPlacement,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import * as React from 'react'
import { Slot, UnifiedSlot } from '../lib/slot'
import { useUILibrary } from '../lib/ui-library-context'
import { cn } from '../lib/utils'
import type { Placement } from '../types'
import {
  type HintTooltipVariants,
  hintCloseVariants,
  hintTooltipVariants,
} from './ui/hint-variants'

// Convert core Placement to floating-ui Placement
function toFloatingPlacement(placement: Placement): FloatingPlacement {
  if (placement.endsWith('-center')) {
    return placement.replace('-center', '') as FloatingPlacement
  }
  return placement as FloatingPlacement
}

export interface HintTooltipProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    HintTooltipVariants {
  /** Target element to anchor the tooltip to */
  target: HTMLElement
  /** Placement relative to target */
  placement?: Placement
  /** Called when the tooltip should close */
  onClose: () => void
  /** Content to display */
  children: React.ReactNode
  /** Use custom close button */
  closeButton?: React.ReactNode
  /** Use custom element via Slot */
  asChild?: boolean
}

export const HintTooltip = React.forwardRef<HTMLDivElement, HintTooltipProps>(
  (
    {
      target,
      placement = 'bottom',
      onClose,
      size,
      zIndex,
      asChild = false,
      className,
      children,
      closeButton,
      ...props
    },
    ref
  ) => {
    const library = useUILibrary()
    const floatingPlacement = toFloatingPlacement(placement)

    const { refs, floatingStyles, context } = useFloating({
      elements: {
        reference: target,
      },
      open: true,
      placement: floatingPlacement,
      middleware: [offset(8), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    })

    const dismiss = useDismiss(context)
    const role = useRole(context, { role: 'tooltip' })
    const { getFloatingProps } = useInteractions([dismiss, role])

    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'div'

    return (
      <FloatingPortal>
        <Comp
          ref={(node: HTMLDivElement | null) => {
            refs.setFloating(node)
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          style={floatingStyles}
          className={cn(hintTooltipVariants({ size, zIndex }), className)}
          {...getFloatingProps()}
          {...props}
        >
          {closeButton ?? (
            <button
              type="button"
              onClick={onClose}
              className={cn(hintCloseVariants())}
              aria-label="Dismiss hint"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
          <div className="pr-4">{children}</div>
        </Comp>
      </FloatingPortal>
    )
  }
)
HintTooltip.displayName = 'HintTooltip'
