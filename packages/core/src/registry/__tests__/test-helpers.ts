import { tourRegistry } from '../tour-registry'

/**
 * Clear the module-level tour registry between tests. Calls the test-only
 * `__reset__` escape hatch exposed under `NODE_ENV === 'test'`.
 *
 * Why a `__reset__` helper instead of `vi.resetModules()`:
 * - Resetting modules between every test would re-import every dependency,
 *   slowing the suite for no observable benefit.
 * - `useSyncExternalStore` subscriptions race with React's commit phase if
 *   the underlying module identity changes mid-flow.
 * - A direct `entries.clear() + listeners.clear()` is deterministic and
 *   single-purpose.
 */
export function resetTourRegistry(): void {
  if (!tourRegistry.__reset__) {
    throw new Error(
      'tourRegistry.__reset__ is unavailable. Tests must run under NODE_ENV=test.'
    )
  }
  tourRegistry.__reset__()
}
