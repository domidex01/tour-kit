import { expect, test } from '@playwright/test'

// Manual-QA bundle for Phase 8 license soft gate. Runs against the
// dashboard-next demo.
//
// Localhost flow:   http://localhost:3000 → isDevEnvironment() = true → dev bypass → no watermark.
// Production flow:  http://10.255.255.254:3000 (WSL LAN IP) → isDevEnvironment() = false
//                   → LicenseProvider validates an empty key against Polar, which fails
//                   (no cache → isGated: true) → soft-gate badge appears.
//
// The 'preview' base URL is set per test via test.use; both hosts are served by
// the same Next.js dev server.

const WATERMARK = '[data-tourkit-watermark]'
const LOCALHOST_URL = 'http://localhost:3000'
const PRODUCTION_URL = 'http://10.255.255.254:3000'

test.describe('Phase 8 manual QA — Localhost (dev bypass)', () => {
  test('Pro UI renders without a badge on localhost', async ({ page }) => {
    await page.goto(`${LOCALHOST_URL}/`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const watermarks = page.locator(WATERMARK)
    await expect(watermarks).toHaveCount(0)
  })
})

test.describe('Phase 8 manual QA — Production host (non-localhost)', () => {
  test('hostname is non-dev and watermark renders exactly once', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/`)
    const seenHost = await page.evaluate(() => window.location.hostname)
    expect(seenHost).toBe('10.255.255.254')

    await page.waitForSelector(WATERMARK, { timeout: 30_000 })
    const watermarks = page.locator(WATERMARK)
    await expect(watermarks).toHaveCount(1)
  })

  test('badge link has UTM-bearing href and opens in new tab', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/`)
    await page.waitForSelector(WATERMARK, { timeout: 30_000 })

    const link = page.locator(`${WATERMARK} a`).first()
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    const href = await link.getAttribute('href')
    expect(href).toContain('https://usertourkit.com/pricing')
    expect(href).toContain('utm_source=unlicensed_badge')
    expect(href).toContain('utm_medium=in_app')
    expect(href).toContain('utm_campaign=watermark')
  })

  test('wrapper has pointer-events: none, link has pointer-events: auto', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/`)
    await page.waitForSelector(WATERMARK, { timeout: 30_000 })

    const wrapper = page.locator(WATERMARK).first()
    const wrapperPointerEvents = await wrapper.evaluate((el) => getComputedStyle(el).pointerEvents)
    expect(wrapperPointerEvents).toBe('none')

    const link = wrapper.locator('a').first()
    const linkPointerEvents = await link.evaluate((el) => getComputedStyle(el).pointerEvents)
    expect(linkPointerEvents).toBe('auto')
  })

  test('click dispatches unlicensed_badge_clicked via gtag', async ({ page }) => {
    await page.addInitScript(() => {
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      ;(window as any).__gtagCalls = []
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      ;(window as any).gtag = (...args: unknown[]) => (window as any).__gtagCalls.push(args)
    })
    await page.goto(`${PRODUCTION_URL}/`)
    await page.waitForSelector(WATERMARK, { timeout: 30_000 })

    const link = page.locator(`${WATERMARK} a`).first()
    await link.evaluate((a: HTMLAnchorElement) => {
      a.addEventListener('click', (e) => e.preventDefault(), { capture: true })
    })
    await link.click()

    const calls = await page.evaluate(() => {
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      return (window as any).__gtagCalls
    })
    expect(calls.length).toBe(1)
    expect(calls[0][0]).toBe('event')
    expect(calls[0][1]).toBe('unlicensed_badge_clicked')
    expect(calls[0][2]).toMatchObject({ placement: 'watermark' })
  })

  test('click falls back to dataLayer.push when gtag is absent', async ({ page }) => {
    await page.addInitScript(() => {
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      ;(window as any).dataLayer = []
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      ;(window as any).gtag = undefined
    })
    await page.goto(`${PRODUCTION_URL}/`)
    await page.waitForSelector(WATERMARK, { timeout: 30_000 })

    const link = page.locator(`${WATERMARK} a`).first()
    await link.evaluate((a: HTMLAnchorElement) => {
      a.addEventListener('click', (e) => e.preventDefault(), { capture: true })
    })
    await link.click()

    const events = await page.evaluate(() => {
      // biome-ignore lint/suspicious/noExplicitAny: test stub
      return (window as any).dataLayer
    })
    expect(events.length).toBe(1)
    expect(events[0]).toMatchObject({
      event: 'unlicensed_badge_clicked',
      placement: 'watermark',
    })
  })

  test('no hydration error or React DOM mismatch logged', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
    })

    await page.goto(`${PRODUCTION_URL}/`)
    await page.waitForSelector(WATERMARK, { timeout: 30_000 })
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter((e) =>
      /hydration|hydrat|did not match|content does not match server-rendered/i.test(e)
    )
    expect(hydrationErrors).toEqual([])
  })

  test('app receives clicks outside the badge link', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/`)
    await page.waitForSelector(WATERMARK, { timeout: 30_000 })

    await page.mouse.click(100, 100)
    const isWatermark = await page.evaluate(() => {
      const el = document.elementFromPoint(100, 100)
      return el?.matches('[data-tourkit-watermark], [data-tourkit-watermark] *') ?? false
    })
    expect(isWatermark).toBe(false)
  })
})
