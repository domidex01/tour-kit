import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Localhost dev bypass', () => {
  // Cases where the dev bypass should apply: all pro packages render and no
  // watermark appears.
  for (const scenario of ['licensed', 'invalid-key', 'no-provider'] as const) {
    test(`all packages render with ${scenario} (no watermark)`, async ({ page }) => {
      await page.goto('/license-test')
      await page.getByTestId(`scenario-selector-${scenario}`).click()
      // Wait for components to mount
      await page.waitForTimeout(1000)

      const ltp = new LicenseTestPage(page)
      await ltp.assertAllFreeRender()
      await ltp.assertAllProRender()
      await ltp.assertWatermarkHidden()
    })
  }

  test('empty key on localhost renders packages and shows watermark', async ({ page }) => {
    await page.goto('/license-test')
    await page.getByTestId('scenario-selector-empty-key').click()
    await page.waitForTimeout(1000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
    await ltp.assertWatermarkVisible()
  })
})
