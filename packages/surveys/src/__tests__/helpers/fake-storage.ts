/**
 * A real `Storage` for tests, seeded and inspectable (v3 Phase 3 §3).
 *
 * The surveys engine takes its adapter as an injected option (§0 C5), so this
 * is what the engine suite passes. Implements `key()` and `length` even though
 * nothing needs them yet — the announcements ambient mock omits both and is
 * therefore not assignable to `Storage`, which is a trap waiting for the first
 * widening.
 */
export interface FakeStorage extends Storage {
  /** test-only: what the engine actually wrote */
  snapshot(): Record<string, string>
}

export function createFakeStorage(seed: Record<string, string> = {}): FakeStorage {
  const store = new Map(Object.entries(seed))
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    snapshot: () => Object.fromEntries(store),
  }
}
