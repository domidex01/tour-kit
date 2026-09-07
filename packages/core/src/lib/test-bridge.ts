/**
 * v2 §1.3b — the provider's `window.__tourKit__` effect as a plain function.
 *
 * `TestBridge` (`types/test-bridge.ts`) is unchanged, so `@tour-kit/playwright`
 * and `@tour-kit/testing-library` — the two out-of-process consumers of the
 * global — are untouched by the move.
 *
 * The once-per-mount warning guard deliberately stays in the provider:
 * `context/__tests__/test-bridge.test.tsx` asserts exactly one warning across
 * an `enableTestBridge` toggle cycle, and a module-level flag here would leak
 * across tests in that file and make it order-dependent. Hence `{ warn }`.
 *
 * @module test-bridge
 */
import type { EligibilityReport } from '../types/diagnostic'
import type { TestBridge } from '../types/test-bridge'

/**
 * What the bridge needs from whoever owns the tour. Structural, so both the
 * provider's context value and a `TourEngine` satisfy it — note `prev`, which
 * the bridge exposes to the outside world as `previous`.
 */
export interface TestBridgeTarget {
  start(tourId: string): unknown
  next(): unknown
  prev(): unknown
  goToStep(stepId: string): unknown
  complete(): void
  skip(): void
  getDiagnostic?(tourId: string): EligibilityReport | null
}

export interface AttachTestBridgeOptions {
  /** `false` suppresses the non-production console warning. Default `true`. */
  warn?: boolean
}

/**
 * Publish `window.__tourKit__`.
 *
 * @returns Detach — an identity-checked `delete`. Idempotent, and a no-op
 *   without a `window`.
 */
export function attachTestBridge(
  target: TestBridgeTarget,
  options: AttachTestBridgeOptions = {}
): () => void {
  if (typeof window === 'undefined') return () => {}

  if (options.warn !== false) {
    // No `process` at all is a browser bundle, which is never production here.
    if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
      console.warn('[Tour Kit] Test bridge enabled. Disable for production.')
    }
  }

  const bridge: TestBridge = {
    start: (tourId) => {
      void target.start(tourId)
    },
    next: () => {
      void target.next()
    },
    previous: () => {
      void target.prev()
    },
    goToStep: (stepId) => {
      void target.goToStep(stepId)
    },
    complete: () => {
      target.complete()
    },
    skip: () => {
      target.skip()
    },
    getDiagnostic: (tourId) => target.getDiagnostic?.(tourId) ?? null,
  }
  window.__tourKit__ = bridge

  return () => {
    // Identity check defends against another library reassigning the global
    // between attach and detach — see the cleanup-safety unit test.
    if (window.__tourKit__ === bridge) {
      // biome-ignore lint/performance/noDelete: full removal mirrors the absent-by-default invariant — `= undefined` would leave an own property and break consumer `'__tourKit__' in window` checks
      delete window.__tourKit__
    }
  }
}
