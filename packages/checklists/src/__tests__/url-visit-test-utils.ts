/**
 * Vitest-only helper that resets the URL-visit listener's module-level
 * registry. The listener exposes `__resetForTests` as a non-public symbol;
 * this wrapper makes the intent explicit at call sites and tolerates the
 * symbol being absent (e.g., after `vi.stubGlobal('window', undefined)`).
 */
import * as listener from '../engine/url-visit-listener'

export function resetUrlVisitListener(): void {
  const reset = (listener as Record<string, unknown>).__resetForTests
  if (typeof reset === 'function') (reset as () => void)()
}
