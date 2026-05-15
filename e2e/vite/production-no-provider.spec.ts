import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Production domain, no LicenseProvider', () => {
  test('free + pro packages render with one watermark (no-provider soft gate)', async ({
    page,
  }) => {
    await page.goto('/license-test')
    await page.getByTestId('scenario-selector-no-provider').click()
    await page.waitForTimeout(1000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
    await ltp.assertWatermarkVisible()
  })
})
