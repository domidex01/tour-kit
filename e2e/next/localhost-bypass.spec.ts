import { test } from '@playwright/test'
import { LicenseTestPage } from '../fixtures/license-test-page'

test.describe('Next.js — Localhost dev bypass', () => {
  // Cases where the dev bypass should apply: all pro packages render and no
  // watermark appears.
  const bypassRoutes = [
    { name: 'valid license', path: '/license-valid' },
    { name: 'invalid key', path: '/license-invalid' },
    { name: 'no provider', path: '/license-none' },
  ]

  for (const { name, path } of bypassRoutes) {
    test(`all packages render with ${name} (no watermark)`, async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(1000)

      const ltp = new LicenseTestPage(page)
      await ltp.assertAllFreeRender()
      await ltp.assertAllProRender()
      await ltp.assertWatermarkHidden()
    })
  }

  test('empty key on localhost renders packages and shows watermark', async ({ page }) => {
    await page.goto('/license-empty')
    await page.waitForTimeout(1000)

    const ltp = new LicenseTestPage(page)
    await ltp.assertAllFreeRender()
    await ltp.assertAllProRender()
    await ltp.assertWatermarkVisible()
  })
})
