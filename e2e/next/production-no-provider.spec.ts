import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Next.js — Production domain, no LicenseProvider', () => {
  test('free packages render, pro packages show placeholder', async ({ page }) => {
    await page.goto('/license-none')
    await page.waitForTimeout(1000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProGated()
  })
})
