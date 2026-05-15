import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Production domain, invalid key', () => {
  test('free + pro packages render with one watermark (soft gate)', async ({ page }) => {
    await page.goto('/license-test')
    await page.getByTestId('scenario-selector-invalid-key').click()
    await page.waitForTimeout(2000) // Allow Polar API to return invalid

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
    await ltp.assertWatermarkVisible()
  })
})
