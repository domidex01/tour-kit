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
  // The same node twice, on purpose. The ref is what `updateRect` reads, so
  // that callback can stay identity-stable across renders; the state slot is
  // what keys the tracking effect, so a retarget re-runs it.
  const targetRef = useRef<HTMLElement | null>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)

  const updateRect = useCallback(() => {
    if (targetRef.current) {
      setTargetRect(targetRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    // Keyed on `target`, not just `isVisible`: `TourOverlay` advances a step by
    // calling `show(newTarget)` with no `hide()` in between, so `isVisible`
    // never flips and an effect keyed on it alone would keep tracking the
    // previous step's element. (Before §1.3b the handler re-read the ref on
    // every scroll and followed the swap for free; `trackRect` takes a concrete
    // element, so the re-run has to be explicit.)
    //
    // No attach-time read: `show()` has already seeded the rect, and reading
    // again would cost a render.
    if (!isVisible || !target) return
    return trackRect(target, setTargetRect).stop
  }, [isVisible, target])

  const show = useCallback((next: HTMLElement, spotlightConfig?: SpotlightConfig) => {
    targetRef.current = next
    setTarget(next)
    setConfig({ ...defaultSpotlightConfig, ...spotlightConfig })
    setTargetRect(next.getBoundingClientRect())
    setIsVisible(true)
  }, [])

  const hide = useCallback(() => {
    setIsVisible(false)
    targetRef.current = null
    setTarget(null)
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
