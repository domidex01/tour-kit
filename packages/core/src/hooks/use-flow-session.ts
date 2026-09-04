import * as React from 'react'
import type { FlowSessionV2 } from '../lib/flow-session'
import {
  type CreateFlowSessionConfig,
  createFlowSession,
} from '../lib/tour-engine/adapters/flow-session-store'

export interface UseFlowSessionReturn {
  session: FlowSessionV2 | null
  /**
   * Persist the active step. `currentRoute` is included so a hard-refresh
   * during a multi-page tour resumes on the right URL — pass
   * `router?.getCurrentRoute()` from the provider, or `undefined` for
   * single-route tours.
   */
  save: (stepIndex: number, currentRoute?: string) => void
  clear: () => void
  isStale: boolean
  /**
   * `true` once the post-mount storage read has run (immediately when the
   * hook is disabled). `session` is `null` until then — consumers that give
   * the flow session precedence over other restore paths must wait for
   * `ready` instead of treating the initial `null` as "no session".
   */
  ready: boolean
}

export type UseFlowSessionConfig = CreateFlowSessionConfig

const NOOP_RETURN: UseFlowSessionReturn = {
  session: null,
  save: () => {},
  clear: () => {},
  isStale: false,
  ready: true,
}

/**
 * React wrapper over `createFlowSession` (v2 §1.3b).
 *
 * The factory owns the storage shape, the 200 ms throttle and the TTL. What
 * stays here is React-shaped: `session` and `ready` as state, fed from the
 * factory's `load()` in a *mount effect* — never a render-time read. Seeding
 * `session` in the `useState` initializer made the first client render differ
 * from the server HTML, which shifts React's `useId` tree positions and
 * surfaces as hydration mismatches in unrelated downstream `useId` consumers
 * (e.g. the checklists launcher's `aria-controls`).
 *
 * The `tourId` argument identifies the tour for which `save()` writes new
 * snapshots; pass `''` to disable writes (loads still work).
 */
export function useFlowSession(
  tourId: string,
  config?: UseFlowSessionConfig
): UseFlowSessionReturn {
  const isSSR = typeof window === 'undefined'
  const enabled = !!config && !isSSR

  const [session, setSession] = React.useState<FlowSessionV2 | null>(null)
  const [ready, setReady] = React.useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by the fields that decide storage identity — rebuilding on config identity would drop a pending throttled save
  const store = React.useMemo(
    () => createFlowSession(enabled ? config : undefined, undefined, setSession),
    [enabled, config?.storage, config?.keyPrefix, config?.key, config?.ttlMs]
  )

  // Keep the tour id the factory stamps into new blobs current without
  // rebuilding the store (which would drop a pending throttled save).
  store.setTourId(enabled ? tourId : '')

  React.useEffect(() => {
    setSession(store.load())
    setReady(true)
  }, [store])

  // On unmount, flush any pending throttled save so the most recent stepIndex
  // is persisted before teardown (otherwise a fast unmount loses the
  // trailing-edge write).
  React.useEffect(() => () => store.flush(), [store])

  const clear = React.useCallback(() => {
    store.clear()
    setSession(null)
  }, [store])

  if (!enabled) return NOOP_RETURN

  return { session, save: store.save, clear, isStale: store.isStale(), ready }
}
