/**
 * v3 Phase 1 — hint frequency persistence, moved verbatim out of
 * `context/hints-provider.tsx` (lines 17-44 and 286-332 of the 2.1.0 file).
 *
 * Four functions and one key shape. `PersistAdapter` is `HintsStorage` from
 * `./types` now, and `getDefaultStorage` + the provider's storage `useMemo`
 * became one `resolveStorage()` — the engine calls it at `boot()` rather than
 * during render.
 *
 * The `'tourkit'` prefix and the `hint:freq:<id>` key shape do NOT move, so
 * blobs written by 2.1.0 read back unchanged.
 */
import { createNoopStorage, createPrefixedStorage, safeJSONParse } from '@tour-kit/core/engine'
import type { FrequencyState } from '@tour-kit/core/engine'
import type { HintsStorage } from './types'

const FREQ_KEY_PREFIX = 'hint:freq:'

interface PersistedFrequencyState {
  viewCount: number
  isDismissed: boolean
  /** ISO string — `null` for never-viewed. */
  lastViewedAt: string | null
}

function freqKey(id: string): string {
  return `${FREQ_KEY_PREFIX}${id}`
}

function freezeState(state: FrequencyState): PersistedFrequencyState {
  return {
    viewCount: state.viewCount,
    isDismissed: state.isDismissed,
    lastViewedAt: state.lastViewedAt ? state.lastViewedAt.toISOString() : null,
  }
}

function thawState(persisted: PersistedFrequencyState): FrequencyState {
  return {
    viewCount: persisted.viewCount ?? 0,
    isDismissed: persisted.isDismissed ?? false,
    lastViewedAt: persisted.lastViewedAt ? new Date(persisted.lastViewedAt) : null,
  }
}

/**
 * Read persisted frequency state for any hint id not already hydrated.
 * Returns the entries to dispatch via `HYDRATE_FREQUENCY` and mutates
 * `hydratedIds` to record which ids were touched.
 */
export function readPersistedEntries(
  storage: HintsStorage,
  ids: ReadonlyArray<string>,
  hydratedIds: Set<string>
): Array<[string, FrequencyState]> {
  const entries: Array<[string, FrequencyState]> = []
  for (const id of ids) {
    if (hydratedIds.has(id)) continue
    hydratedIds.add(id)
    const raw = storage.getItem(freqKey(id))
    if (!raw) continue
    const persisted = safeJSONParse<PersistedFrequencyState | null>(raw, null)
    if (!persisted) continue
    entries.push([id, thawState(persisted)])
  }
  return entries
}

/**
 * Diff two frequency-state Maps against storage. Removes keys present in
 * `prev` but not in `next`; writes every entry in `next`. Failures (quota,
 * serialization) are swallowed — frequency rules degrade gracefully when
 * storage is unavailable.
 */
export function syncStorage(
  storage: HintsStorage,
  prev: ReadonlyMap<string, FrequencyState>,
  next: ReadonlyMap<string, FrequencyState>,
  hydratedIds: Set<string>
): void {
  for (const id of prev.keys()) {
    if (next.has(id)) continue
    try {
      storage.removeItem(freqKey(id))
    } catch {
      // ignore
    }
    hydratedIds.delete(id)
  }
  for (const [id, value] of next) {
    try {
      storage.setItem(freqKey(id), JSON.stringify(freezeState(value)))
    } catch {
      // ignore
    }
  }
}

function defaultStorage(): HintsStorage {
  if (typeof window === 'undefined') return createNoopStorage()
  try {
    return window.localStorage
  } catch {
    // Private browsing throws on access, not on use.
    return createNoopStorage()
  }
}

/**
 * `undefined` selects `window.localStorage`; no window (SSR) selects a no-op.
 *
 * No cast: `createPrefixedStorage` is overloaded to hand a synchronous adapter
 * back when given one, so the sync shape survives the wrap. It used to return
 * core's wide `Storage` and every synchronous consumer re-narrowed with `as`.
 *
 * Never null. `createNoopStorage()` is core's answer to "there is no storage
 * here" and it keeps the engine's `storage` field non-nullable, which deletes
 * two branches at its call sites. The engine still must not HYDRATE before
 * `boot()` — but that is a lifecycle rule, guarded by `booted`, not something
 * to encode as a null.
 */
export function resolveStorage(storage: HintsStorage | undefined): HintsStorage {
  return createPrefixedStorage(storage ?? defaultStorage(), 'tourkit')
}
