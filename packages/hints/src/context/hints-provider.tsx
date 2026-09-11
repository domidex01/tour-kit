'use client'

import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'
import { useHintFilter } from '../hooks/use-hint-filter'
import { createHintsEngine } from '../lib/hints-engine/create-hints-engine'
import { createHintsHandle } from '../lib/hints-engine/handle'
import type { HintConfig, HintsContextValue } from '../types'
import { HintsContext } from './hints-context'

export interface HintsProviderProps {
  children: React.ReactNode
  /**
   * Optional config-driven mode. When provided, the provider auto-registers
   * each hint, applies `useHintFilter` for audience gating, and consults
   * `frequency` rules before allowing `showHint`. Omit to keep the legacy
   * imperative `registerHint(id)` API.
   */
  hints?: HintConfig[]
  /**
   * Backing storage for hint frequency persistence. Defaults to
   * `localStorage`, resolved by the engine at boot. Keys are namespaced as
   * `tourkit:hint:freq:<hintId>`. Must be SYNCHRONOUS. Read once.
   */
  storage?: Storage
}

/**
 * A binding over `createHintsEngine()` (v3 Phase 1): one handle, one
 * `useSyncExternalStore`, two effects. The HANDLE is held in `useState` — it
 * constructs nothing, so StrictMode's discarded initialiser is an inert
 * object; the engine itself is built on the first verb or in the boot effect,
 * never in render. `release()`, never `destroy()`, in the cleanup: the destroy
 * is deferred a microtask so an effect teardown-and-rerun takes it back.
 *
 * The factory SEEDS the engine — configs, storage, boot — before the first
 * verb. A child's `useHint` / `autoShow` effect runs before this provider's
 * own effects (engine-handle.ts, rule 1), so anything a child verb can read
 * must exist at `ensure()`. The two effects below are idempotent no-ops on
 * mount and only matter on later prop changes; their order is still
 * load-bearing for those: `setHints` before `boot`.
 */
export function HintsProvider({ children, hints, storage }: HintsProviderProps) {
  const filteredHints = useHintFilter(hints ?? [])
  const latest = React.useRef({ storage, hints: hints ? filteredHints : undefined })
  latest.current = { storage, hints: hints ? filteredHints : undefined }

  const [handle] = React.useState(() =>
    createHintsHandle(() => {
      const engine = createHintsEngine({ storage: latest.current.storage })
      if (latest.current.hints) engine.setHints(latest.current.hints)
      engine.boot()
      return engine
    })
  )
  const snapshot = React.useSyncExternalStore(handle.subscribe, handle.getState, handle.getState)

  React.useEffect(() => {
    if (hints) handle.setHints(filteredHints)
  }, [handle, hints, filteredHints])

  React.useEffect(() => {
    handle.boot()
    return () => handle.release()
  }, [handle])

  const contextValue = React.useMemo<HintsContextValue>(
    () => ({
      hints: snapshot.hints,
      activeHint: snapshot.activeHint,
      registerHint: handle.registerHint,
      unregisterHint: handle.unregisterHint,
      showHint: handle.showHint,
      hideHint: handle.hideHint,
      dismissHint: handle.dismissHint,
      resetHint: handle.resetHint,
      resetAllHints: handle.resetAllHints,
    }),
    [handle, snapshot.hints, snapshot.activeHint]
  )

  // `LicenseGate` renders children unconditionally and layers a badge on a
  // non-development host with no valid key, so nothing here can fail to render
  // because a key is missing. `LicenseWatermark` elects a single owner across
  // packages, so hints + react + a Pro package still shows exactly one badge.
  return (
    <LicenseGate require="pro">
      <HintsContext.Provider value={contextValue}>{children}</HintsContext.Provider>
    </LicenseGate>
  )
}
