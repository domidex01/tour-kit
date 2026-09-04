/**
 * v2 §1.3b — `use-flow-session.ts` as a plain factory.
 *
 * The one adapter with real local state. Two contracts here look like dead
 * weight to a cold reader and are not:
 *
 * 1. **Construction reads nothing.** The hook's `ready` flag exists because a
 *    render-time storage read shifts React's `useId` tree positions and breaks
 *    hydration for unrelated downstream consumers (`use-flow-session.ts:105`).
 *    The factory keeps the property: `load()` is the only reader, and nobody
 *    calls it from the constructor.
 * 2. **`setItem` failures are swallowed.** A full quota must not end the tour.
 */
import type { FlowSessionConfig } from '../../../types/config'
import { logger } from '../../../utils/logger'
import { createPrefixedStorage, createStorageAdapter } from '../../../utils/storage'
import { throttleTime } from '../../../utils/throttle'
import { type FlowSessionV2, isExpired, parse, serialize } from '../../flow-session'

const DEFAULT_TTL_MS_SESSION = 60 * 60 * 1000 // 1 hour
const DEFAULT_TTL_MS_LOCAL = 24 * 60 * 60 * 1000 // 24 hours
const SAVE_THROTTLE_MS = 200
const ACTIVE_KEY_SUFFIX = 'flow:active'

export interface CreateFlowSessionConfig extends FlowSessionConfig {
  /** Storage key prefix (default: `tourkit`). Full key is `${keyPrefix}:flow:active`. */
  keyPrefix?: string
}

export interface FlowSessionStore {
  /** The only storage read. Never called during construction. */
  load: () => FlowSessionV2 | null
  /** Trailing-edge throttled at 200 ms. A burst coalesces into one write. */
  save: (stepIndex: number, currentRoute?: string) => void
  clear: () => void
  /** True when the last loaded/saved session is past its TTL. */
  isStale: () => boolean
  /** Write any pending throttled save immediately. Call on teardown. */
  flush: () => void
  /** The tour id `save()` stamps into new blobs. `''` disables writes. */
  setTourId: (tourId: string) => void
}

function getDefaultTtl(storage: FlowSessionConfig['storage']): number {
  return storage === 'localStorage' ? DEFAULT_TTL_MS_LOCAL : DEFAULT_TTL_MS_SESSION
}

const NOOP_STORE: FlowSessionStore = {
  load: () => null,
  save: () => {},
  clear: () => {},
  isStale: () => false,
  flush: () => {},
  setTourId: () => {},
}

/**
 * @param onWrite - Called with the blob after each successful write. The React
 *   wrapper uses it to mirror the session into state at the moment the
 *   throttled write actually lands, rather than guessing at call time.
 */
export function createFlowSession(
  config?: CreateFlowSessionConfig,
  storage?: Storage,
  onWrite?: (session: FlowSessionV2) => void
): FlowSessionStore {
  // No config means the feature is off; no `window` and no injected backend
  // means SSR. Either way the caller gets a working no-op shape.
  if (!config) return NOOP_STORE
  if (!storage && typeof window === 'undefined') return NOOP_STORE

  const ttlMs = config.ttlMs ?? getDefaultTtl(config.storage)
  const storageKey = config.key ?? ACTIVE_KEY_SUFFIX
  const store = createPrefixedStorage(
    storage ?? createStorageAdapter(config.storage),
    config.keyPrefix ?? 'tourkit'
  )

  let tourId = ''
  let session: FlowSessionV2 | null = null

  const throttledSave = throttleTime((...args: unknown[]) => {
    const stepIndex = args[0] as number
    const currentRoute = args[1] as string | undefined
    if (!tourId) return

    const now = Date.now()
    const next: FlowSessionV2 = {
      schemaVersion: 2,
      tourId,
      stepIndex,
      currentRoute,
      startedAt: session?.startedAt ?? now,
      lastUpdatedAt: now,
    }
    try {
      store.setItem(storageKey, serialize(next))
      session = next
      onWrite?.(next)
    } catch (err) {
      logger.warn('createFlowSession: setItem failed', err)
    }
  }, SAVE_THROTTLE_MS)

  return {
    load: () => {
      try {
        const raw = store.getItem(storageKey) as string | null
        const parsed = parse(raw)
        if (!parsed) {
          if (raw) store.removeItem(storageKey)
          session = null
          return null
        }
        if (isExpired(parsed, ttlMs)) {
          store.removeItem(storageKey)
          session = null
          return null
        }
        session = parsed
        return parsed
      } catch {
        return null
      }
    },

    save: (stepIndex, currentRoute) => {
      throttledSave(stepIndex, currentRoute)
    },

    clear: () => {
      try {
        throttledSave.cancel()
        store.removeItem(storageKey)
        session = null
      } catch (err) {
        logger.warn('createFlowSession: clear failed', err)
      }
    },

    isStale: () => (session ? isExpired(session, ttlMs) : false),

    flush: () => throttledSave.flush(),

    setTourId: (next) => {
      tourId = next
    },
  }
}
