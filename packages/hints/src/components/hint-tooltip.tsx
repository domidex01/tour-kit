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
  unstyled?: boolean
}

export function HintTooltip({
  target,
  placement = 'bottom',
  children,
  onClose,
  className,
  unstyled = false,
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

  const cssVarStyles: React.CSSProperties = unstyled
    ? { zIndex: 9999 }
    : {
        zIndex: 'var(--tour-hint-z, 9999)',
        maxWidth: 'var(--tour-hint-max-width, 280px)',
        borderRadius: 'var(--tour-hint-radius, 8px)',
        border: '1px solid var(--tour-hint-border, #e5e7eb)',
        backgroundColor: 'var(--tour-hint-bg, #ffffff)',
        padding: 'var(--tour-hint-padding, 12px)',
        fontSize: 14,
        color: 'var(--tour-hint-fg, #1f2937)',
        boxShadow: 'var(--tour-hint-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
      }

  const closeButtonStyles: React.CSSProperties = unstyled
    ? {}
    : {
        position: 'absolute',
        right: 8,
        top: 8,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        opacity: 0.7,
        borderRadius: 4,
      }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          ...cssVarStyles,
        }}
        className={className}
        {...getFloatingProps()}
      >
        <button type="button" onClick={onClose} style={closeButtonStyles} aria-label="Dismiss hint">
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
        <div style={{ paddingRight: 16 }}>{children}</div>
      </div>
    </FloatingPortal>
  )
}
