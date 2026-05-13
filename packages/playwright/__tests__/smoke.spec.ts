import { expect, test } from '../src'

test.describe('@tour-kit/playwright smoke', () => {
  test('start → waitForStep → next → waitForStep on real Chromium', async ({ page, tour }) => {
    await page.goto('/two-step.html')
    await tour.start('demo')
    await tour.waitForStep('welcome')
    await tour.next()
    await tour.waitForStep('pricing')
  })

  test('window.__tourKit__ is undefined when enableTestBridge prop is omitted', async ({
    page,
  }) => {
    await page.goto('/no-bridge.html')
    // Wait one tick so React mount completes — without this we'd be racing
    // the initial render and could read `undefined` for the wrong reason.
    await page.waitForLoadState('networkidle')
    const exists = await page.evaluate(() => typeof window.__tourKit__ !== 'undefined')
    expect(exists).toBe(false)
  })

  test('tour.next() rejects with a useful error when the bridge is missing', async ({
    page,
    tour,
  }) => {
    await page.goto('/no-bridge.html')
    await page.waitForLoadState('networkidle')
    await expect(tour.next()).rejects.toThrow(/enableTestBridge/i)
  })

  test('tour.getDiagnostic returns a populated EligibilityReport with diagnose+bridge', async ({
    page,
    tour,
  }) => {
    await page.goto('/two-step-with-diagnose.html')
    // The provider populates diagnostics one microtask after mount —
    // wait until the bridge can read a non-null report for the demo tour.
    await page.waitForFunction(
      () => Boolean(window.__tourKit__?.getDiagnostic('demo')),
      undefined,
      { timeout: 10_000 }
    )
    const report = await tour.getDiagnostic('demo')
    expect(report).not.toBeNull()
    expect(report?.tourId).toBe('demo')
    expect(report?.willFire).toBe(true)
  })
})
