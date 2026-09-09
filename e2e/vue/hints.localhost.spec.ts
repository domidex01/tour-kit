import { expect, test } from '@playwright/test'

/**
 * v3 Phase 1 — a hint rendered from `@tour-kit/hints/engine` alone.
 *
 * The Vue app imports no `@tour-kit/hints` component and no React. The dot, the
 * tooltip and the Dismiss button are hand-written Vue over the engine's state,
 * positioned by the engine's own `getHotspotPosition`. If any of these three
 * pass, a non-React consumer can genuinely run hints.
 */
test.describe('Vue — a hint from @tour-kit/hints/engine', () => {
  test('the dot renders at the target', async ({ page }) => {
    await page.goto('/')
    const dot = page.getByTestId('hint-dot-export')
    await expect(dot).toBeVisible()

    const t = await page.locator('#hint-target').boundingBox()
    const d = await dot.boundingBox()
    // getHotspotPosition('top-right') = { top: rect.top - 4, left: rect.right - 4 }
    expect(Math.abs((d?.y ?? 0) - ((t?.y ?? 0) - 4))).toBeLessThan(2)
    expect(Math.abs((d?.x ?? 0) - ((t?.x ?? 0) + (t?.width ?? 0) - 4))).toBeLessThan(2)
  })

  test('click opens, Dismiss closes', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('hint-dot-export').click()
    await expect(page.getByTestId('hint-tooltip-export')).toBeVisible()

    await page.getByTestId('hint-dismiss-export').click()
    await expect(page.getByTestId('hint-tooltip-export')).toHaveCount(0)
    await expect(page.getByTestId('hint-dot-export')).toHaveCount(0)
  })

  test("a 'once' dismissal survives a reload", async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('hint-dot-export').click()
    await page.getByTestId('hint-dismiss-export').click()

    // Read the blob BEFORE reloading: a reload assertion alone would also pass
    // if the dot had never rendered at all.
    const blob = await page.evaluate(() => localStorage.getItem('tourkit:hint:freq:export'))
    expect(blob).toContain('"isDismissed":true')

    await page.reload()
    await page.waitForSelector('#hint-target')
    await expect(page.getByTestId('hint-dot-export')).toHaveCount(0)
  })
})
