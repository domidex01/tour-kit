import { expect, test } from '@playwright/test'

/**
 * Phase 1.3 — cross-page flow continuation, hard-refresh resume.
 *
 * Scenario:
 *   1. User starts the cross-page tour on `/dashboard` (step `dashboard`).
 *   2. Provider auto-advances to `/billing` (step `billing`) when they click Next.
 *   3. User hard-refreshes the page mid-flight.
 *   4. Provider's mount-only flow-session restore reads `currentRoute: '/billing'`
 *      from sessionStorage and dispatches START_TOUR after the target mounts.
 *
 * Assertions:
 *   - URL is still `/billing` after reload (no redirect to `/dashboard` or `/`).
 *   - The flow-session blob carries `schemaVersion: 2` and `currentRoute: '/billing'`.
 *   - The `console.time('flow-restore')` instrumentation reports a duration < 200ms.
 */

test.describe('Phase 1.3 — Cross-page tour hard-refresh resume', () => {
  test('resumes on /billing within 200ms after hard-refresh', async ({ page }) => {
    // Capture the `flow-restore` timing emitted by `console.timeEnd` in
    // the provider's restore-with-route effect. Different runtimes emit
    // the result with different `msg.type()` values, so match on the text
    // prefix — `console.timeEnd` always logs as "<label>: <ms> ms".
    let flowRestoreMs: number | null = null
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.startsWith('flow-restore:')) {
        const match = text.match(/([\d.]+)\s*ms/)
        if (match) flowRestoreMs = Number.parseFloat(match[1] ?? '0')
      }
    })

    await page.goto('/dashboard')
    await page.waitForSelector('#dashboard-stats')

    // Start the tour. The first step is on /dashboard, so the tour card
    // should mount without navigation.
    await page.click('#cross-page-tour-start')

    // Advance to step 2 — provider navigates to /billing and waits for the
    // target. `exact: true` disambiguates from the Next.js dev-tools button
    // that the dev server injects into the page.
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Confirm we're on /billing with the target mounted.
    await page.waitForURL('**/billing')
    await page.waitForSelector('#billing-summary')

    // The flow-session save is trailing-edge throttled at 200ms — poll until
    // the blob reflects the new stepIndex/currentRoute instead of racing it.
    await page.waitForFunction(
      () => {
        const raw = sessionStorage.getItem('tourkit:flow:active')
        if (!raw) return false
        try {
          const s = JSON.parse(raw) as { stepIndex?: number; currentRoute?: string }
          return s.stepIndex === 1 && s.currentRoute === '/billing'
        } catch {
          return false
        }
      },
      null,
      { timeout: 2000 }
    )

    const blob = await page.evaluate(() => sessionStorage.getItem('tourkit:flow:active'))
    expect(blob).not.toBeNull()
    const session = JSON.parse(blob ?? '{}')
    expect(session.schemaVersion).toBe(2)
    expect(session.tourId).toBe('cross-page-demo')
    expect(session.stepIndex).toBe(1)
    expect(session.currentRoute).toBe('/billing')

    // Hard-refresh. The provider's mount-only restore effect should read
    // the V2 blob, navigate to /billing if not already there (we already
    // are, so it's a no-op), and dispatch START_TOUR.
    await page.reload()

    // We should still be on /billing — no redirect to /dashboard or /.
    await page.waitForSelector('#billing-summary')
    expect(page.url()).toMatch(/\/billing$/)

    // Wait for the post-reload save to confirm the tour resumed (stepIndex=1
    // would already be in storage from before the reload; the new save after
    // START_TOUR keeps it at 1 with a fresh `lastUpdatedAt`).
    await page.waitForFunction(
      () => {
        const raw = sessionStorage.getItem('tourkit:flow:active')
        if (!raw) return false
        try {
          const s = JSON.parse(raw) as { stepIndex?: number; currentRoute?: string }
          return s.stepIndex === 1 && s.currentRoute === '/billing'
        } catch {
          return false
        }
      },
      null,
      { timeout: 2000 }
    )

    // Phase-1.3 budget: the `flow-restore` console.time event should have
    // fired with a duration under 200ms.
    await page.waitForTimeout(300)
    expect(flowRestoreMs).not.toBeNull()
    expect(flowRestoreMs).toBeLessThan(200)
  })
})
