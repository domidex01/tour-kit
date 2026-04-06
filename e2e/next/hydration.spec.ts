import { expect, test } from '../fixtures/console'

test.describe('Next.js — Hydration checks', () => {
  const routes = ['/license-valid', '/license-invalid', '/license-none', '/license-empty']

  for (const route of routes) {
    test(`no hydration mismatch errors on ${route}`, async ({ page, consoleErrors }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const hydrationErrors = consoleErrors.filter(
        (e) =>
          e.includes('Hydration') ||
          e.includes('hydration') ||
          e.includes('did not match') ||
          e.includes('Text content does not match')
      )
      expect(hydrationErrors).toHaveLength(0)
    })
  }
})
