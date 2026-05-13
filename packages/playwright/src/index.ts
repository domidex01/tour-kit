/**
 * @tour-kit/playwright — Playwright fixtures for Tour Kit (Phase 6, issue #86).
 *
 * Drives a tour from out-of-process via `window.__tourKit__`, the dev-only
 * bridge published by `<TourProvider enableTestBridge>`. The bridge is
 * default-OFF, so the consumer MUST opt in at the provider level — every
 * helper short-circuits with a clear error pointing at `enableTestBridge`
 * when the bridge is absent.
 *
 * Confirmed via memory #179 (Context7 2026-05-12, /microsoft/playwright/v1.58.2):
 *   import { test as base, expect } from '@playwright/test'
 *   export const test = base.extend<Fixtures>({ ... })
 */
import { type Page, test as base, expect } from '@playwright/test'
import type { EligibilityReport } from '@tour-kit/core'

/**
 * Async-wrapped helpers around `window.__tourKit__`. Each control verb is
 * Promise-returning because `page.evaluate` is async; `waitForStep` queries
 * the rendered `[data-tour-step]` attribute directly so positioning bugs
 * surface even when the bridge call succeeded.
 */
export interface TourHelpers {
  /** Start a tour by id. */
  start: (tourId: string) => Promise<void>
  /**
   * Wait until the tour card for `stepId` is visible in the DOM.
   *
   * Looks for an element with `data-tour-step="<stepId>"`. Emitted by
   * `<TourCard>` in `@tour-kit/react` since Phase 5.
   */
  waitForStep: (stepId: string, opts?: { timeout?: number }) => Promise<void>
  /** Advance to the next step in the active tour. */
  next: () => Promise<void>
  /** Go back one step in the active tour. */
  previous: () => Promise<void>
  /** Mark the active tour completed. */
  complete: () => Promise<void>
  /** Skip the active tour. */
  skip: () => Promise<void>
  /** Jump to a specific step by id in the active tour. */
  goToStep: (stepId: string) => Promise<void>
  /**
   * Read the diagnostic for a registered tour. Returns `null` if the
   * provider was mounted without `diagnose`, or the tour id is unknown.
   */
  getDiagnostic: (tourId: string) => Promise<EligibilityReport | null>
}

const BRIDGE_MISSING_ERROR =
  '[Tour Kit] window.__tourKit__ is undefined. Pass `enableTestBridge` to <TourProvider> to opt in (e.g. `enableTestBridge={process.env.NODE_ENV !== "production"}`).'

async function assertBridge(page: Page): Promise<void> {
  const ok = await page.evaluate(() => typeof window.__tourKit__ !== 'undefined')
  if (!ok) {
    throw new Error(BRIDGE_MISSING_ERROR)
  }
}

function makeHelpers(page: Page): TourHelpers {
  return {
    start: async (tourId) => {
      await assertBridge(page)
      await page.evaluate((id) => {
        window.__tourKit__?.start(id)
      }, tourId)
    },
    waitForStep: async (stepId, opts) => {
      await page.waitForSelector(`[data-tour-step="${stepId}"]`, {
        state: 'visible',
        timeout: opts?.timeout,
      })
    },
    next: async () => {
      await assertBridge(page)
      await page.evaluate(() => {
        window.__tourKit__?.next()
      })
    },
    previous: async () => {
      await assertBridge(page)
      await page.evaluate(() => {
        window.__tourKit__?.previous()
      })
    },
    complete: async () => {
      await assertBridge(page)
      await page.evaluate(() => {
        window.__tourKit__?.complete()
      })
    },
    skip: async () => {
      await assertBridge(page)
      await page.evaluate(() => {
        window.__tourKit__?.skip()
      })
    },
    goToStep: async (stepId) => {
      await assertBridge(page)
      await page.evaluate((id) => {
        window.__tourKit__?.goToStep(id)
      }, stepId)
    },
    getDiagnostic: async (tourId) => {
      await assertBridge(page)
      return page.evaluate((id) => window.__tourKit__?.getDiagnostic(id) ?? null, tourId)
    },
  }
}

/**
 * Drop-in replacement for Playwright's `test` that adds a `tour` fixture
 * scoped per-test:
 *
 * ```ts
 * import { test, expect } from '@tour-kit/playwright'
 *
 * test('happy path', async ({ page, tour }) => {
 *   await page.goto('/')
 *   await tour.start('onboarding')
 *   await tour.waitForStep('welcome')
 *   await tour.next()
 *   await tour.waitForStep('pricing')
 * })
 * ```
 */
export const test = base.extend<{ tour: TourHelpers }>({
  tour: async ({ page }, use) => {
    const helpers = makeHelpers(page)
    await use(helpers)
  },
})

export { expect }
export type { EligibilityReport } from '@tour-kit/core'
