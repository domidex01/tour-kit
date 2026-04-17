'use client'

import { useElementPosition } from '@tour-kit/core'
import * as React from 'react'
import { useHint } from '../hooks/use-hint'
import type { HintConfig } from '../types'
import { HintHotspot } from './hint-hotspot'
import { HintTooltip } from './hint-tooltip'
import type { HintHotspotVariants } from './ui/hint-variants'

export interface HintProps extends HintConfig, Omit<Partial<HintHotspotVariants>, 'pulse'> {
  /** Custom content (overrides config.content) */
  children?: React.ReactNode
  /** Additional class name for the tooltip */
  className?: string
  /** Additional class name for the hotspot */
  hotspotClassName?: string
}

/**
 * Hint - A contextual help component with hotspot and tooltip
 *
 * Displays a pulsing indicator that reveals helpful content on click.
 * Follows shadcn/ui patterns and can be customized via variants and className.
 *
 * @example
 * // Basic usage
 * <HintsProvider>
 *   <Hint
 *     id="feature-hint"
 *     target="#new-feature"
 *     content="Click here to try our new feature!"
 *   />
 * </HintsProvider>
 *
 * @example
 * // With variants
 * <Hint
 *   id="important-hint"
 *   target="#important-element"
 *   size="lg"
 *   color="warning"
 *   content="This is important!"
 * />
 *
 * @see {@link HintProps} for available props
 * @see {@link hintHotspotVariants} for hotspot styling variants
 */
export const Hint = React.forwardRef<HTMLButtonElement, HintProps>(
  (
    {
      id,
      target,
      content,
      children,
      position = 'top-right',
      tooltipPlacement = 'bottom',
      pulse = true,
      autoShow = false,
      persist = false,
      onClick,
      onShow,
      onDismiss,
      className,
      hotspotClassName,
      // Hotspot variants
      size,
      color,
      zIndex,
    },
    ref
  ) => {
    const { isOpen, isDismissed, show, hide, dismiss } = useHint(id)
    const hotspotRef = React.useRef<HTMLButtonElement>(null)

    // Merge refs
    const mergedRef = React.useMemo(() => {
      return (node: HTMLButtonElement | null) => {
        hotspotRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }
    }, [ref])

    const targetSelector = typeof target === 'string' ? target : null
    const targetRefElement = typeof target === 'object' ? target?.current : null

    const { element: targetElement, rect: targetRect } = useElementPosition(
      targetSelector ?? targetRefElement
    )

    React.useEffect(() => {
      if (autoShow && !isDismissed) {
        show()
        onShow?.()
      }
    }, [autoShow, isDismissed, show, onShow])

    const handleHotspotClick = React.useCallback(() => {
      onClick?.()
      if (isOpen) {
        hide()
      } else {
        show()
        onShow?.()
      }
    }, [onClick, isOpen, hide, show, onShow])

    const handleDismiss = React.useCallback(() => {
      if (persist) {
        dismiss()
      } else {
        hide()
      }
      onDismiss?.()
    }, [persist, dismiss, hide, onDismiss])

    if (isDismissed || !targetElement || !targetRect) {
      return null
    }

    return (
      <>
        <HintHotspot
          ref={mergedRef}
          targetRect={targetRect}
          position={position}
          pulse={pulse}
          isOpen={isOpen}
          onClick={handleHotspotClick}
          size={size}
          color={color}
          zIndex={zIndex}
          className={hotspotClassName}
        />
        {isOpen && hotspotRef.current && (
          <HintTooltip
            target={hotspotRef.current}
            placement={tooltipPlacement}
            onClose={handleDismiss}
            className={className}
          >
            {children ?? content}
          </HintTooltip>
        )}
      </>
    )
  }
)
Hint.displayName = 'Hint'
