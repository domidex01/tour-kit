export interface SetupOptions {
  /**
   * Opt in to the `jsdom-testing-mocks` lazy shim. When `true`, the package is
   * dynamically imported on demand — consumers who don't opt in never load it.
   *
   * Per-element rect mocking stays the consumer's responsibility: call
   * `mockElementBoundingClientRect(element, rect)` from `jsdom-testing-mocks`
   * directly in your `beforeEach` for the elements you care about.
   */
  positionShim?: boolean
}

/**
 * One-shot setup orchestrator for Tour Kit RTL tests.
 *
 * Default (no args): touches NOTHING. `Element.prototype.getBoundingClientRect`
 * stays the JSDOM stock descriptor. Phase 5's whole contract is that you only
 * pay for what you opt into.
 *
 * With `positionShim: true`: lazy-imports `jsdom-testing-mocks` so its public
 * API (e.g. `mockElementBoundingClientRect`) is available in the same tick.
 * The shim is intentionally a thin hint — consumers still apply per-element
 * rects themselves; the lazy import just guarantees the dep is loaded.
 */
export async function setupTourKitTesting(opts: SetupOptions = {}): Promise<void> {
  if (!opts.positionShim) return
  // Lazy — the require/import chain is what gates the optional peer dep.
  await import('jsdom-testing-mocks')
}
