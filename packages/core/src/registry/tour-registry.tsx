/**
 * Module-level tour registry.
 *
 * `<TourProvider>` and standalone `<Tour id="...">` register themselves here on
 * mount so any sibling subtree can read tour state / call imperative actions
 * via `useTourActions(id)`. This eliminates window-event workarounds (e.g., the
 * old `tour-replay` CustomEvent dispatch dance) and the LS-clear + unregister +
 * register choreography users wrote to force a tour to restart.
 *
 * Design notes (do not change without re-reading Phase 1):
 *   - **Module-level singleton, not React Context.** A Context would re-create
 *     the workaround Phase 1 is killing: `useTourActions` must work from a
 *     sibling subtree, which a Context dependency can't reach without lifting
 *     the provider.
 *   - **`WeakRef` values, string keys.** Keys are tour ids (interned strings
 *     that never need to be GC-tracked). Values hold the controller surface;
 *     wrapping them in `WeakRef` plus an explicit `unregister()` on unmount
 *     survives StrictMode double-mount without leaks.
 *   - **Mutable `state` field, immutable replacement.** Each tour's state slice
 *     is replaced wholesale on every reducer transition (`entry.state = next`),
 *     producing a fresh reference that `useSyncExternalStore` will compare via
 *     `Object.is` and rerender consumers on changes only.
 *   - **Dev double-id is logged, not thrown.** HMR remounts and accidental
 *     double-mounts must not tank DX — log via `logger.error`, keep the latest
 *     registration, and document the behaviour in `imperative-control.mdx`.
 */

import { logger } from '../utils/logger'

/**
 * Live state mirror for a registered tour.
 *
 * Every field reflects whether THIS tour (matching the entry's id) is the
 * currently active tour. A provider managing multiple tours will register one
 * entry per tour and only the active tour's entry will report `isActive: true`.
 */
interface RegistryEntryState {
  isActive: boolean
  currentStepId: string | null
  progress: number
}

/**
 * Internal shape held by the registry. NOT exported — consumers always go
 * through the `tourRegistry` facade or `useTourActions` hook.
 */
interface RegistryEntry {
  id: string
  /**
   * Live state mirror. Replaced wholesale on every transition by the owning
   * provider so `useSyncExternalStore` sees a new reference and rerenders.
   */
  state: RegistryEntryState
  /**
   * Imperative controllers wired from the owning provider's reducer dispatch
   * path. Reference identity is stable for the lifetime of the entry; the
   * provider routes through internal refs so the closures stay live without
   * re-publishing the registry entry.
   */
  actions: {
    start: () => void
    stop: () => void
    restart: () => void
    next: () => void
    prev: () => void
    goToStep: (stepId: string) => void
  }
}

const entries = new Map<string, WeakRef<RegistryEntry>>()
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

/**
 * Single env predicate. Gates both:
 *   - `console.error` on duplicate-id registration (dev DX signal)
 *   - `__reset__` test-only helper (so production never carries it)
 *
 * Vitest leaves `NODE_ENV` as `development` by default — gating on
 * `!== 'production'` covers both `vitest run` and Storybook-style dev
 * harnesses without explicit env-var plumbing.
 */
function isNonProductionEnv(): boolean {
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
}

/**
 * Register a tour entry. Returns an unregister fn that the owning provider
 * MUST call in its effect cleanup to drop the entry deterministically.
 *
 * If a live entry already exists under the same id (HMR remount, accidental
 * duplicate `<Tour>`), the latest registration wins and a dev-only
 * `console.error` warns. The unregister fn returned by the FIRST registration
 * is intentionally a safe no-op once the entry has been replaced — it
 * compares the captured WeakRef against the current Map slot and only deletes
 * if they're still the same, so the dead first registration never tears down
 * the live second one.
 */
function register(entry: RegistryEntry): () => void {
  const ref = new WeakRef(entry)
  const existing = entries.get(entry.id)?.deref()
  if (existing && isNonProductionEnv()) {
    logger.error(
      `Tour "${entry.id}" registered twice. Keeping the latest registration.`
    )
  }
  entries.set(entry.id, ref)
  notify()

  return () => {
    const current = entries.get(entry.id)
    if (current === ref) {
      entries.delete(entry.id)
      notify()
    }
  }
}

/**
 * Read an entry by id. Prunes dead WeakRefs (entries whose owning provider
 * unmounted without calling unregister — rare, but possible if React crashes
 * mid-commit) and returns `null` on miss.
 *
 * When a dead WeakRef is pruned, listeners are notified so any
 * `useSyncExternalStore` consumer still subscribed to the GC'd entry
 * re-renders with the frozen no-op instead of holding stale state forever.
 */
function get(id: string): RegistryEntry | null {
  const ref = entries.get(id)
  if (!ref) return null
  const entry = ref.deref()
  if (!entry) {
    entries.delete(id)
    notify()
    return null
  }
  return entry
}

/**
 * Update an entry's state slice. Replaces the `state` field wholesale and
 * notifies subscribers ONLY when at least one field actually changed —
 * Object.is comparison on the existing slice avoids redundant rerenders.
 */
function update(id: string, next: RegistryEntryState): void {
  const entry = get(id)
  if (!entry) return
  const prev = entry.state
  if (
    prev.isActive === next.isActive &&
    prev.currentStepId === next.currentStepId &&
    prev.progress === next.progress
  ) {
    return
  }
  entry.state = next
  notify()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * Resolve every WeakRef and return a Map of live entries. Used by tests to
 * assert post-unmount cleanup (`snapshot().size === 0`). Reads, but does not
 * write, so calling this from a hot path won't trigger notifications.
 */
function snapshot(): ReadonlyMap<string, RegistryEntry> {
  const live = new Map<string, RegistryEntry>()
  for (const [id, ref] of entries) {
    const entry = ref.deref()
    if (entry) live.set(id, entry)
  }
  return live
}

/**
 * Drop any WeakRef slots whose target was GC'd without an explicit unregister.
 * Safe to call eagerly from `get()` on miss; also exposed for tests that want
 * to verify the StrictMode leak invariant after `globalThis.gc?.()`.
 */
function prune(): void {
  let pruned = false
  for (const [id, ref] of entries) {
    if (!ref.deref()) {
      entries.delete(id)
      pruned = true
    }
  }
  if (pruned) notify()
}

interface TourRegistry {
  register: typeof register
  get: typeof get
  update: typeof update
  subscribe: typeof subscribe
  snapshot: typeof snapshot
  prune: typeof prune
  /**
   * Test-only escape hatch — clears the singleton between tests. Exposed only
   * under `NODE_ENV === 'test'` so production never carries the helper.
   */
  __reset__?: () => void
}

export const tourRegistry: TourRegistry = {
  register,
  get,
  update,
  subscribe,
  snapshot,
  prune,
  __reset__: isNonProductionEnv()
    ? () => {
        entries.clear()
        listeners.clear()
      }
    : undefined,
}

export type { RegistryEntry, RegistryEntryState }
