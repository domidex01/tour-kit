import * as React from 'react'
import { type FlowSessionV2, isExpired, parse, serialize } from '../lib/flow-session'
import type { FlowSessionConfig } from '../types/config'
import { logger } from '../utils/logger'
import { createPrefixedStorage, createStorageAdapter } from '../utils/storage'
import { throttleTime } from '../utils/throttle'

const DEFAULT_TTL_MS_SESSION = 60 * 60 * 1000 // 1 hour
const DEFAULT_TTL_MS_LOCAL = 24 * 60 * 60 * 1000 // 24 hours
const SAVE_THROTTLE_MS = 200
const ACTIVE_KEY_SUFFIX = 'flow:active'

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
}

export interface UseFlowSessionConfig extends FlowSessionConfig {
  /** Storage key prefix (default: `tourkit`). Full key is `${keyPrefix}:flow:active`. */
  keyPrefix?: string
}

const NOOP_RETURN: UseFlowSessionReturn = {
  session: null,
  save: () => {},
  clear: () => {},
  isStale: false,
}

function getDefaultTtl(storage: FlowSessionConfig['storage']): number {
  return storage === 'localStorage' ? DEFAULT_TTL_MS_LOCAL : DEFAULT_TTL_MS_SESSION
}

/**
 * Persist the active tour's session so a hard reload resumes it in place.
 *
 * Uses a single fixed storage key (`${keyPrefix}:flow:active` by default) — the
 * blob itself carries the `tourId`, so on a fresh mount the hook can discover
 * which tour was active without the caller needing to know it up front.
 *
 * The `tourId` argument identifies the tour for which `save()` writes new
 * snapshots; pass `''` to disable writes (loads still work).
 *
 * Throttle: `save()` is trailing-edge throttled at 200ms via the existing
 * `throttleTime` util — a burst of step changes coalesces into 1 storage write
 * per window.
 *
 * SSR-safe: returns no-op shape when `window` is undefined.
 * Quota-safe: `setItem` failures (`QuotaExceededError`) are logged and swallowed.
 */
export function useFlowSession(
  tourId: string,
  config?: UseFlowSessionConfig
): UseFlowSessionReturn {
  const isSSR = typeof window === 'undefined'
  const enabled = !!config && !isSSR

  const ttlMs = config?.ttlMs ?? (config ? getDefaultTtl(config.storage) : 0)
  const keyPrefix = config?.keyPrefix ?? 'tourkit'
  const storageType = config?.storage

  const storage = React.useMemo(() => {
    if (!enabled || !storageType) return null
    return createPrefixedStorage(createStorageAdapter(storageType), keyPrefix)
  }, [enabled, storageType, keyPrefix])

  const storageKey = config?.key ?? ACTIVE_KEY_SUFFIX

  const readSession = React.useCallback((): FlowSessionV2 | null => {
    if (!storage) return null
    try {
      const raw = storage.getItem(storageKey)
      if (typeof raw !== 'string' && raw !== null) return null
      const parsed = parse(raw as string | null)
      if (!parsed) {
        if (raw) storage.removeItem(storageKey)
        return null
      }
      if (isExpired(parsed, ttlMs)) {
        storage.removeItem(storageKey)
        return null
      }
      return parsed
    } catch {
      return null
    }
  }, [storage, storageKey, ttlMs])

  const [session, setSession] = React.useState<FlowSessionV2 | null>(() => readSession())

  // Re-read when storage identity changes (e.g. config.storage swap)
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-load on storage identity change
  React.useEffect(() => {
    setSession(readSession())
  }, [storage])

  // Latest values ref — keeps the throttled callback identity stable while
  // still writing the most recent tourId / startedAt.
  const latestRef = React.useRef({
    tourId,
    storage,
    storageKey,
    enabled,
    startedAt: session?.startedAt ?? null,
  })
  React.useEffect(() => {
    latestRef.current = {
      tourId,
      storage,
      storageKey,
      enabled,
      startedAt: session?.startedAt ?? null,
    }
  })

  const throttledSave = React.useMemo(
    () =>
      throttleTime((...args: unknown[]) => {
        const stepIndex = args[0] as number
        const currentRoute = args[1] as string | undefined
        const ctx = latestRef.current
        if (!ctx.enabled || !ctx.storage || !ctx.tourId) return
        const now = Date.now()
        const next: FlowSessionV2 = {
          schemaVersion: 2,
          tourId: ctx.tourId,
          stepIndex,
          currentRoute,
          startedAt: ctx.startedAt ?? now,
          lastUpdatedAt: now,
        }
        try {
          ctx.storage.setItem(ctx.storageKey, serialize(next))
          setSession(next)
        } catch (err) {
          logger.warn('useFlowSession: setItem failed', err)
        }
      }, SAVE_THROTTLE_MS),
    []
  )

  // On unmount, flush any pending throttled save so the most recent
  // stepIndex is persisted before teardown (otherwise a fast unmount loses
  // the trailing-edge write).
  React.useEffect(() => () => throttledSave.flush(), [throttledSave])

  const save = React.useCallback(
    (stepIndex: number, currentRoute?: string) => {
      throttledSave(stepIndex, currentRoute)
    },
    [throttledSave]
  )

  const clear = React.useCallback(() => {
    if (!storage) return
    try {
      throttledSave.cancel()
      storage.removeItem(storageKey)
      setSession(null)
    } catch (err) {
      logger.warn('useFlowSession: clear failed', err)
    }
  }, [storage, storageKey, throttledSave])

  if (!enabled) return NOOP_RETURN

  return {
    session,
    save,
    clear,
    isStale: session ? isExpired(session, ttlMs) : false,
  }
}
