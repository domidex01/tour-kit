import * as React from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  type Placement as FloatingPlacement,
} from '@floating-ui/react'
import type { Placement } from '../types'

// Convert core Placement to floating-ui Placement
// Core has 'top-center', floating-ui uses just 'top' for center alignment
function toFloatingPlacement(placement: Placement): FloatingPlacement {
  if (placement.endsWith('-center')) {
    return placement.replace('-center', '') as FloatingPlacement
  }
  return placement as FloatingPlacement
}

interface HintTooltipProps {
  target: HTMLElement
  placement?: Placement
  children: React.ReactNode
  onClose: () => void
  className?: string
}

export function HintTooltip({
  target,
  placement = 'bottom',
  children,
  onClose,
  className,
}: HintTooltipProps) {
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
          maxWidth: 280,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: 12,
          fontSize: 14,
          color: '#1f2937',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
        className={className}
        {...getFloatingProps()}
      >
        <button
          type='button'
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            opacity: 0.7,
            borderRadius: 4,
          }}
          aria-label='Dismiss hint'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M18 6 6 18' />
            <path d='m6 6 12 12' />
          </svg>
        </button>
        <div style={{ paddingRight: 16 }}>{children}</div>
      </div>
    </FloatingPortal>
  )
}
