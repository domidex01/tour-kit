import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Next.js — Production domain, empty key', () => {
  test('free + pro packages render with one watermark (soft gate)', async ({ page }) => {
    await page.goto('/license-empty')
    await page.waitForTimeout(2000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
    await ltp.assertWatermarkVisible()
  })
})
