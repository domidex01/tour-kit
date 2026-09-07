import { useCallback, useEffect, useMemo, useRef } from 'react'
import { type FocusTrapOptions, createFocusTrap } from '../lib/focus-trap'

export type UseFocusTrapOptions = FocusTrapOptions

export interface UseFocusTrapReturn {
  containerRef: React.RefObject<HTMLElement | null>
  activate: () => void
  deactivate: () => void
}

/**
 * React wrapper over `createFocusTrap` (`lib/focus-trap.ts`). The signature is
 * unchanged; every behaviour lives in the factory, which a Vue/Svelte/vanilla
 * binding can drive directly from `@tour-kit/core/engine`.
 *
 * The `enabled` gate is the wrapper's, not the factory's: `activate()` on a
 * disabled hook must stay a no-op, and the factory has no notion of enabled.
 */
export function useFocusTrap(
  enabled = true,
  options: UseFocusTrapOptions = {}
): UseFocusTrapReturn {
  const { inertBackground = false } = options

  const containerRef = useRef<HTMLElement | null>(null)
  const trap = useMemo(
    () => createFocusTrap(() => containerRef.current, { inertBackground }),
    [inertBackground]
  )

  // Capture the element to restore focus to as soon as the trap becomes
  // enabled — before the portal mounts or `inert`/focus moves shift
  // `document.activeElement` to <body>. activate() can run several renders
  // later (once a lazy portal node exists), by which point the trigger is no
  // longer the active element.
  useEffect(() => {
    if (enabled) trap.capture()
    else trap.forget()
  }, [enabled, trap])

  useEffect(() => () => trap.release(), [trap])

  const activate = useCallback(() => {
    if (enabled) trap.activate()
  }, [enabled, trap])

  return { containerRef, activate, deactivate: trap.deactivate }
}
