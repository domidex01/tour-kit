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
import type { Placement } from '../../types'

function toFloatingPlacement(placement: Placement): FloatingPlacement {
  if (placement.endsWith('-center')) {
    return placement.replace('-center', '') as FloatingPlacement
  }
  return placement as FloatingPlacement
}

export interface HintTooltipHeadlessProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Target element to anchor the tooltip to */
  target: HTMLElement
  /** Placement relative to target */
  placement?: Placement
  /** Called when the tooltip should close */
  onClose: () => void
  /** Content to display */
  children: React.ReactNode
  /** Render prop for custom rendering */
  render?: (props: HintTooltipRenderProps) => React.ReactNode
}

export interface HintTooltipRenderProps {
  floatingStyles: React.CSSProperties
  getFloatingProps: () => Record<string, unknown>
  refs: {
    setFloating: (node: HTMLElement | null) => void
  }
}

export const HintTooltipHeadless = React.forwardRef<HTMLDivElement, HintTooltipHeadlessProps>(
  ({ target, placement = 'bottom', onClose, render, children, style, ...props }, ref) => {
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

    if (render) {
      return (
        <FloatingPortal>
          {render({
            floatingStyles,
            getFloatingProps: () => getFloatingProps(),
            refs: { setFloating: refs.setFloating },
          })}
        </FloatingPortal>
      )
    }

    return (
      <FloatingPortal>
        <div
          ref={(node) => {
            refs.setFloating(node)
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          style={{ ...floatingStyles, ...style }}
          {...getFloatingProps()}
          {...props}
        >
          {children}
        </div>
      </FloatingPortal>
    )
  }
)
HintTooltipHeadless.displayName = 'HintTooltipHeadless'
