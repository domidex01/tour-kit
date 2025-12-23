import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SpotlightConfig } from '../types'
import { defaultSpotlightConfig } from '../types/config'

export interface UseSpotlightReturn {
  isVisible: boolean
  targetRect: DOMRect | null
  overlayStyle: React.CSSProperties
  cutoutStyle: React.CSSProperties
  show: (target: HTMLElement, config?: SpotlightConfig) => void
  hide: () => void
  update: () => void
}

export function useSpotlight(): UseSpotlightReturn {
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [config, setConfig] = useState<SpotlightConfig>(defaultSpotlightConfig)
  const targetRef = useRef<HTMLElement | null>(null)

  const updateRect = useCallback(() => {
    if (targetRef.current) {
      setTargetRect(targetRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)

    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [isVisible, updateRect])

  const show = useCallback((target: HTMLElement, spotlightConfig?: SpotlightConfig) => {
    targetRef.current = target
    setConfig({ ...defaultSpotlightConfig, ...spotlightConfig })
    setTargetRect(target.getBoundingClientRect())
    setIsVisible(true)
  }, [])

  const hide = useCallback(() => {
    setIsVisible(false)
    targetRef.current = null
    setTargetRect(null)
  }, [])

  const overlayStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      inset: 0,
      backgroundColor: 'transparent',
      transition: config.animate ? `all ${config.animationDuration ?? 300}ms ease-out` : undefined,
      pointerEvents: 'auto',
    }),
    [config]
  )

  const cutoutStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect) return {}

    const padding = config.padding ?? 8
    const borderRadius = config.borderRadius ?? 4

    return {
      position: 'absolute',
      top: targetRect.top - padding,
      left: targetRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
      borderRadius,
      boxShadow: `0 0 0 9999px ${config.color ?? 'rgba(0, 0, 0, 0.5)'}`,
      transition: config.animate ? `all ${config.animationDuration ?? 300}ms ease-out` : undefined,
      pointerEvents: 'none',
    }
  }, [targetRect, config])

  return useMemo(
    () => ({
      isVisible,
      targetRect,
      overlayStyle,
      cutoutStyle,
      show,
      hide,
      update: updateRect,
    }),
    [isVisible, targetRect, overlayStyle, cutoutStyle, show, hide, updateRect]
  )
}
