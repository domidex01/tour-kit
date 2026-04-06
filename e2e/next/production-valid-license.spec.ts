import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Next.js — Production domain, valid license', () => {
  test('all packages render with valid license key', async ({ page }) => {
    await page.goto('/license-valid')
    await page.waitForTimeout(2000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
  })
})
