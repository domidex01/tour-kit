/**
 * A deterministic stand-in for `Math.random()` (v3 Phase 3 §3).
 *
 * The sampling gate reads a per-mount roll — `useState(() => Math.random())` in
 * the provider — so a fatigue test cannot be deterministic against it. The
 * engine takes `random` as an option and draws ONCE at construction, exactly
 * as the provider drew once per mount: a testability seam, not a behaviour
 * change. The last value repeats, so a short list cannot run out.
 */
export const seededRandom = (...values: number[]) => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)] ?? 0
}
