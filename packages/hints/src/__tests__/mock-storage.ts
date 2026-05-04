/**
 * In-memory `Storage` shim for hint frequency persistence tests. Drop-in
 * replacement for `window.localStorage` injected via the
 * `<HintsProvider storage={...}>` prop.
 *
 * Why a custom class instead of jsdom's `localStorage`: jsdom's storage is
 * a single global mutated across files. The mock keeps each test's writes
 * isolated and inspectable.
 */
export function createMockStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length(): number {
      return store.size
    },
    clear(): void {
      store.clear()
    },
    getItem(key: string): string | null {
      return store.get(key) ?? null
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string): void {
      store.delete(key)
    },
    setItem(key: string, value: string): void {
      store.set(key, value)
    },
  }
}

/**
 * Pre-seed `MockStorage` with a serialized hint-frequency blob. Mirrors
 * the production key shape `tourkit:hint:freq:<hintId>` so rehydration
 * tests can assert the provider reads what the serializer writes.
 */
export function seedHintFrequencyState(
  storage: Storage,
  hintId: string,
  state: { viewCount: number; isDismissed: boolean; lastViewedAt: Date | null }
): void {
  storage.setItem(
    `tourkit:hint:freq:${hintId}`,
    JSON.stringify({
      viewCount: state.viewCount,
      isDismissed: state.isDismissed,
      lastViewedAt: state.lastViewedAt?.toISOString() ?? null,
    })
  )
}
