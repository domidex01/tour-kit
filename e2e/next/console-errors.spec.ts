import { expect, test } from '../fixtures/console'
import { PRO_CONSOLE_PACKAGES } from '../fixtures/license-test-page'

test.describe('Next.js — Production domain, console error messages', () => {
  test('each pro package logs console.error with package name and pricing URL', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/license-invalid')
    await page.waitForTimeout(3000)

    for (const pkg of PRO_CONSOLE_PACKAGES) {
      const hasError = consoleErrors.some((e) => e.includes(pkg))
      expect(hasError, `Expected console.error containing "${pkg}"`).toBe(true)
    }

    const hasPricingUrl = consoleErrors.some((e) => e.includes('tourkit.dev/pricing'))
    expect(hasPricingUrl, 'Expected console.error containing pricing URL').toBe(true)
  })
})
