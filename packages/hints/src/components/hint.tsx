import { useElementPosition } from '@tour-kit/core'
import * as React from 'react'
import { useHint } from '../hooks/use-hint'
import type { HintConfig } from '../types'
import { HintHotspot } from './hint-hotspot'
import { HintTooltip } from './hint-tooltip'

type HintProps = HintConfig & {
  children?: React.ReactNode
  className?: string
}

export function Hint({
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
}: HintProps) {
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

  const handleDismiss = () => {
    if (persist) {
      dismiss()
    } else {
      hide()
    }
    onDismiss?.()
  }

  if (isDismissed || !targetElement || !targetRect) {
    return null
  }

  return (
    <>
      <HintHotspot
        ref={hotspotRef}
        targetRect={targetRect}
        position={position}
        pulse={pulse}
        isOpen={isOpen}
        onClick={handleHotspotClick}
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
