/**
 * v2 §1.4a — simulate another tab writing our route key.
 *
 * BOTH halves are load-bearing:
 *
 *  - the *value* must land in the adapter the engine actually reads through
 *    (`getStorage()` prefers the injected one), and
 *  - the *event* must be a real `StorageEvent` on `window`, because that is
 *    the only thing `routeStore.subscribeStorage` listens for.
 *
 * Writing only the value changes nothing; firing only the event re-reads the
 * old value. And `config.storage` must literally be `'localStorage'` with
 * `syncTabs: true`, or `subscribeStorage` handed back a no-op at boot
 * (`adapters/route-store.ts:124`).
 */
import type { Storage as StorageAdapter } from '../../../../types/config'

export function fireCrossTabWrite(
  storage: StorageAdapter,
  key: string,
  blob: { tourId: string; stepIndex: number }
): void {
  const payload = JSON.stringify({
    completedTours: [],
    skippedTours: [],
    timestamp: Date.now(),
    ...blob,
  })
  storage.setItem(key, payload)
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: payload }))
}
