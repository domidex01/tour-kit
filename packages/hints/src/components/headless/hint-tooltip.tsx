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
import type * as React from 'react'
import type { Placement } from '../../types'

// Convert core Placement to floating-ui Placement
function toFloatingPlacement(placement: Placement): FloatingPlacement {
  if (placement.endsWith('-center')) {
    return placement.replace('-center', '') as FloatingPlacement
  }
  return placement as FloatingPlacement
}

export interface HintTooltipHeadlessProps {
  target: HTMLElement
  placement?: Placement
  children: React.ReactNode
  onClose: () => void
  className?: string
  style?: React.CSSProperties
}

export interface HintTooltipRenderProps {
  floatingStyles: React.CSSProperties
  refs: {
    setFloating: (node: HTMLElement | null) => void
  }
  getFloatingProps: () => Record<string, unknown>
  onClose: () => void
}

export function HintTooltipHeadless({
  target,
  placement = 'bottom',
  children,
  onClose,
  className,
  style,
}: HintTooltipHeadlessProps) {
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

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          zIndex: 9999,
          ...style,
        }}
        className={className}
        {...getFloatingProps()}
      >
        {children}
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss hint"
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
          }}
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
            <title>Close</title>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </FloatingPortal>
  )
}
