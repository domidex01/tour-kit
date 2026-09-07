import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { computeSpotlight } from '../lib/spotlight'
import { trackRect } from '../lib/track-rect'
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

/**
 * React wrapper over `trackRect` + `computeSpotlight` (`lib/`). The state, the
 * target ref and the returned `update` stay here: `update` must work while the
 * spotlight is hidden (no tracker exists then), which a tracker handle created
 * inside an effect cannot provide.
 */
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
    const el = targetRef.current
    // The null check is for the type (`trackRect` takes a non-null element) and
    // for `hide()`, which nulls the ref. No attach-time read: `show()` has
    // already seeded the rect, and reading again would cost a render.
    if (!isVisible || !el) return
    return trackRect(el, setTargetRect).stop
  }, [isVisible])

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

  const { overlayStyle, cutoutStyle } = useMemo(
    () => computeSpotlight(targetRect, config),
    [targetRect, config]
  )

  return useMemo(
    () => ({
      isVisible,
      targetRect,
      overlayStyle,
      cutoutStyle: cutoutStyle ?? {},
      show,
      hide,
      update: updateRect,
    }),
    [isVisible, targetRect, overlayStyle, cutoutStyle, show, hide, updateRect]
  )
}
