/**
 * Cross-page navigation: post-navigate "wait for the target to mount on the
 * new route, or surface a typed failure". Thin wrapper over the existing
 * MutationObserver-based `waitForElement` — does NOT re-implement it.
 */

import type { TourStep } from '../types/step'
import { waitForElement } from '../utils/dom'

/**
 * Typed failure for cross-page tour navigation.
 *
 * Discriminated by `code`:
 * - `TARGET_NOT_FOUND`: target did not appear within the timeout on the new
 *   route. Most common on auto-strategy steps when the target component is
 *   gated by data fetching.
 * - `NAVIGATION_REJECTED`: router-level navigation refused (e.g. Pages Router
 *   `router.push()` resolved with `false`).
 * - `TIMEOUT`: reserved for non-target-related timeouts.
 */
export class TourRouteError extends Error {
  readonly code: 'TARGET_NOT_FOUND' | 'NAVIGATION_REJECTED' | 'TIMEOUT'
  readonly route: string
  readonly selector?: string

  constructor(args: {
    code: TourRouteError['code']
    route: string
    selector?: string
    message: string
  }) {
    super(args.message)
    this.name = 'TourRouteError'
    this.code = args.code
    this.route = args.route
    this.selector = args.selector
  }
}

export interface WaitForStepTargetOptions {
  /** Route the navigation just landed on — included in the error for diagnostics. */
  route: string
  /** Reject after this many ms (default: 3000). */
  timeoutMs?: number
  /**
   * Optional cancellation. When aborted, the wait rejects with
   * `Error('aborted')` — NOT a `TourRouteError`. Distinct semantics so
   * `onStepError` can stay scoped to "target missing" failures.
   */
  signal?: AbortSignal
}

/**
 * Resolve `step.target` after a route change.
 *
 * Behavior matrix:
 * - `target` is a string selector → defers to `waitForElement(selector, timeoutMs, signal)`.
 *   On timeout, the underlying `Error` is rethrown as
 *   `TourRouteError({ code: 'TARGET_NOT_FOUND' })`.
 *   On abort, the underlying `Error('aborted')` is rethrown unchanged so
 *   callers can distinguish user-initiated cancellation from missing targets.
 * - `target` is a `RefObject` already populated → resolves synchronously.
 * - `target` is a `RefObject` with `current === null` → throws
 *   `TourRouteError({ code: 'TARGET_NOT_FOUND' })` immediately. There's no
 *   selector to observe for.
 */
export async function waitForStepTarget(
  step: TourStep,
  opts: WaitForStepTargetOptions
): Promise<HTMLElement> {
  const timeout = opts.timeoutMs ?? 3000

  if (typeof step.target !== 'string') {
    const el = step.target?.current
    if (el) return el
    throw new TourRouteError({
      code: 'TARGET_NOT_FOUND',
      route: opts.route,
      message: `Step "${step.id}" target ref not populated on route "${opts.route}".`,
    })
  }

  try {
    return await waitForElement(step.target, timeout, opts.signal)
  } catch (err) {
    // User-initiated abort: pass through the plain Error('aborted') unchanged.
    if (opts.signal?.aborted) throw err
    throw new TourRouteError({
      code: 'TARGET_NOT_FOUND',
      route: opts.route,
      selector: step.target,
      message: `Target "${step.target}" not found on route "${opts.route}" within ${timeout}ms.`,
    })
  }
}
