'use client'

import { useTour } from '@tour-kit/core'
import * as React from 'react'

type UseTourResult = ReturnType<typeof useTour>

/**
 * Module-level handle that captures the most recently-mounted `<HookProbe />`'s
 * `useTour()` return value. Helpers like `goToStep` consult this to drive the
 * tour imperatively from outside the React tree.
 *
 * Reset between tests — `cleanup()` unmounts the probe and `currentRef` flips
 * back to null via the unmount effect.
 */
const hookRef: { current: UseTourResult | null } = { current: null }

export function getActiveTourHandle(): UseTourResult | null {
  return hookRef.current
}

/**
 * Hidden bridge component — render it inside `<TourProvider>` to make
 * `goToStep` (and any future imperative helper) work.
 */
export function HookProbe(): null {
  const value = useTour()
  // Keep the latest value live; React re-renders the probe whenever the
  // provider state changes.
  hookRef.current = value
  React.useEffect(() => {
    return () => {
      // Only clear if we still own the slot — guards against StrictMode
      // double-mount sequences where a fresh instance has already taken over.
      if (hookRef.current === value) hookRef.current = null
    }
  }, [value])
  return null
}
