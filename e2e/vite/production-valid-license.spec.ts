import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Vite — Production domain, valid license', () => {
  test('all packages render with valid license key', async ({ page }) => {
    await page.goto('/license-test')
    // Default scenario is 'licensed'
    await page.waitForTimeout(2000) // Allow Polar API validation

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
  })
})
