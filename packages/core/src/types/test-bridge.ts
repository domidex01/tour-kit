import type { EligibilityReport } from './diagnostic'

/**
 * Dev-mode test bridge — published on `window.__tourKit__` ONLY when a
 * `<TourProvider enableTestBridge>` is mounted. Mirrors the existing
 * imperative ref so Playwright (and other out-of-process drivers) can move
 * a tour forward without re-deriving controller boilerplate.
 *
 * The bridge is intentionally read-mostly: every control verb already exists
 * on the provider. Production builds tree-shake it away because
 * `enableTestBridge` defaults to `false` and the effect short-circuits at
 * the top.
 */
export interface TestBridge {
  /** Programmatically start a tour by id. */
  start: (tourId: string) => void
  /** Advance to the next step in the active tour. */
  next: () => void
  /** Go back one step in the active tour. */
  previous: () => void
  /** Jump to a specific step by id in the active tour. */
  goToStep: (stepId: string) => void
  /** Mark the active tour completed. */
  complete: () => void
  /** Skip the active tour. */
  skip: () => void
  /**
   * Read the diagnostic for a registered tour. Returns `null` when
   * `diagnose` is `false` (the default) or when no tour with the given id
   * is registered.
   */
  getDiagnostic: (tourId: string) => EligibilityReport | null
}
