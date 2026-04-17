'use client'

import { useElementPosition } from '@tour-kit/core'
import * as React from 'react'
import { useHint } from '../../hooks/use-hint'
import type { HintConfig } from '../../types'

export interface HintHeadlessRenderProps {
  isOpen: boolean
  isDismissed: boolean
  show: () => void
  hide: () => void
  dismiss: () => void
  targetElement: HTMLElement | null
  targetRect: DOMRect | null
  hotspotRef: React.RefObject<HTMLButtonElement | null>
  // Additional config for custom rendering
  position: HintConfig['position']
  tooltipPlacement: HintConfig['tooltipPlacement']
  pulse: boolean
  content: React.ReactNode
}

export interface HintHeadlessProps extends Omit<HintConfig, 'content'> {
  children?: React.ReactNode
  content?: React.ReactNode
  className?: string
  /** Render prop for custom rendering */
  render?: (props: HintHeadlessRenderProps) => React.ReactNode
}

export function HintHeadless({
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
  render,
}: HintHeadlessProps) {
  const { isOpen, isDismissed, show, hide, dismiss } = useHint(id)
  const hotspotRef = React.useRef<HTMLButtonElement>(null)

  const targetSelector = typeof target === 'string' ? target : null
  const targetRef = typeof target === 'object' ? target?.current : null

  const { element: targetElement, rect: targetRect } = useElementPosition(
    targetSelector ?? targetRef
  )

  React.useEffect(() => {
    if (autoShow && !isDismissed) {
      show()
      onShow?.()
    }
  }, [autoShow, isDismissed, show, onShow])

  const handleHotspotClick = () => {
    onClick?.()
    if (isOpen) {
      hide()
    } else {
      show()
      onShow?.()
    }
  }

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

  const renderProps: HintHeadlessRenderProps = {
    isOpen,
    isDismissed,
    show,
    hide,
    dismiss: handleDismiss,
    targetElement,
    targetRect,
    hotspotRef,
    // Provide additional config for custom rendering
    position,
    tooltipPlacement,
    pulse,
    content,
  }

  // If render prop is provided, use it
  if (render) {
    return <>{render(renderProps)}</>
  }

  // Default minimal rendering - just provides the logic
  return (
    <>
      <button
        ref={hotspotRef}
        type="button"
        onClick={handleHotspotClick}
        className={className}
        aria-label="Show hint"
        aria-expanded={isOpen}
      />
      {isOpen && children}
    </>
  )
}
