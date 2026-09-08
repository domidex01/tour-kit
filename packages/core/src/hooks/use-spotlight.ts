import { useEffect, useMemo, useState } from 'react'
import { type SpotlightController, createSpotlight } from '../lib/spotlight'
import type { SpotlightConfig } from '../types'

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
 * React wrapper over `createSpotlight()` (`lib/spotlight.ts`).
 *
 * The state machine — four fields, the one-tracker-at-a-time retarget rule,
 * the `computeSpotlight` call — lives in the controller, so this is a
 * subscription and nothing else. It used to be four `useState`s, an effect
 * keyed on `[isVisible, target]` and a `useMemo`; v2 §1.5f moved all of it down
 * after `@tour-kit/vue` and `@tour-kit/svelte` proved the machine was
 * framework-agnostic by reimplementing it twice.
 *
 * `useSyncExternalStore` would be the idiomatic bridge, but it is React 18+ and
 * this package still supports React 17 consumers through its peer range. A
 * subscribe-and-bump effect is the same thing with a wider floor: the
 * controller's snapshot is reference-stable, so the render below is driven by
 * identity exactly as `useSyncExternalStore` would drive it.
 */
export function useSpotlight(): UseSpotlightReturn {
  const controller: SpotlightController = useMemo(() => createSpotlight(), [])
  const [snapshot, setSnapshot] = useState(controller.getState)

  useEffect(() => {
    // Sync once on mount: `show()` can be called from a layout effect below
    // this component, which runs before this effect subscribes.
    setSnapshot(controller.getState())
    const unsubscribe = controller.subscribe(() => setSnapshot(controller.getState()))
    return () => {
      unsubscribe()
      controller.destroy()
    }
  }, [controller])

  return useMemo(
    () => ({
      isVisible: snapshot.isVisible,
      targetRect: snapshot.targetRect,
      overlayStyle: snapshot.overlayStyle,
      cutoutStyle: snapshot.cutoutStyle,
      show: controller.show,
      hide: controller.hide,
      update: controller.update,
    }),
    [snapshot, controller]
  )
}
