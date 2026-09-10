/**
 * A real `Storage` for tests, seeded and inspectable.
 *
 * v3 Phase 3 §3. The ambient mock in `setup.tsx:102` is module scope and
 * implements only four methods — no `key()`, no `length` — so it is not
 * assignable to `Storage` and it leaked across cases until §0 C8's
 * `localStorage.clear()` landed. Persistence cases pass this instead: it is
 * per-case by construction, and `snapshot()` says what the engine wrote.
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
