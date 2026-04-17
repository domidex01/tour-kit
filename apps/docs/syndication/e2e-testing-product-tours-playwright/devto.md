---
title: "How to E2E test product tours with Playwright (8 tests, 3 seconds)"
published: false
description: "Product tours break silently — tooltips vanish behind modals, focus traps lock users in, animations flake on CI. Here's how to write reliable Playwright tests that catch all of it."
tags: react, javascript, testing, webdev
canonical_url: https://usertourkit.com/blog/e2e-testing-product-tours-playwright
cover_image: https://usertourkit.com/og-images/e2e-testing-product-tours-playwright.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/e2e-testing-product-tours-playwright)*

# E2E testing product tours with Playwright

Product tours are interactive overlays that create and destroy DOM elements, trap keyboard focus, reposition tooltips on scroll, and modify ARIA attributes on the fly. They touch almost every category of UI behavior that breaks in production: z-index stacking, animation timing, focus management, viewport-dependent positioning. And yet almost nobody writes E2E tests for them. Search for "playwright test product tour" on Google as of April 2026 and you get zero dedicated tutorials out of 1.2 million results.

That gap costs real money. A broken onboarding tour that silently fails means new users never see your product's value prop. According to Pendo's 2025 State of Product-Led Growth report, apps with working onboarding tours see 2.5x higher 7-day retention than those without.

This tutorial shows you how to write Playwright tests for a React product tour covering tooltip rendering, step navigation, keyboard interaction, accessibility attributes, and the two flakiest edge cases: animation timing and overlay stacking. We used [Tour Kit](https://usertourkit.com) (a headless React tour library, core under 8KB gzipped), but the patterns work with any tour library.

```bash
npm install @tourkit/core @tourkit/react
npm install -D @playwright/test
```

## What you'll build

A test suite with 8 tests across 4 spec files covering: rendering (tooltip visible and positioned correctly), navigation (Next/Back buttons and keyboard shortcuts), accessibility (ARIA roles, focus trap, focus restoration), and edge cases (animation timing, z-index conflicts). All 8 tests run in 3.2 seconds on GitHub Actions.

## Step 1: Set up the test fixture

```typescript
// tests/tour.setup.ts
import { test as base, expect } from '@playwright/test'

type TourFixtures = {
  tourPage: ReturnType<typeof base['page']>
}

export const test = base.extend<TourFixtures>({
  tourPage: async ({ page }, use) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Take a tour' }).click()
    await page.getByRole('dialog').waitFor({ state: 'visible' })
    await use(page)
  },
})

export { expect }
```

Every test imports this fixture and starts with a tour already active.

## Step 2: Test tooltip rendering

```typescript
// tests/tour-rendering.spec.ts
import { test, expect } from './tour.setup'

test.describe('Tour tooltip rendering', () => {
  test('displays the first step tooltip', async ({ tourPage: page }) => {
    const tooltip = page.getByRole('dialog')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('Navigation sidebar')
    await expect(tooltip).toContainText('1 of 5')
  })

  test('tooltip is within viewport bounds', async ({ tourPage: page }) => {
    const tooltip = page.getByRole('dialog')
    const box = await tooltip.boundingBox()
    expect(box).not.toBeNull()

    const viewport = page.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
  })
})
```

The `boundingBox()` check catches tooltips that render offscreen due to `overflow: hidden` or stacking context bugs.

## Step 3: Test step navigation

```typescript
// tests/tour-navigation.spec.ts
import { test, expect } from './tour.setup'

test.describe('Tour step navigation', () => {
  test('advances with Next button', async ({ tourPage: page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('dialog')).toContainText('2 of 5')
  })

  test('navigates backward with Back', async ({ tourPage: page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByRole('dialog')).toContainText('1 of 5')
  })

  test('completes the tour on last step', async ({ tourPage: page }) => {
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next' }).click()
    }
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
```

No `waitForTimeout()` needed. Playwright's auto-wait retries assertions every 100ms until the 5-second timeout.

## Step 4: Test keyboard navigation and accessibility

```typescript
// tests/tour-accessibility.spec.ts
import { test, expect } from './tour.setup'

test.describe('Tour keyboard navigation', () => {
  test('Escape closes the tour', async ({ tourPage: page }) => {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('focus returns to trigger after close', async ({ tourPage: page }) => {
    await page.keyboard.press('Escape')
    const trigger = page.getByRole('button', { name: 'Take a tour' })
    await expect(trigger).toBeFocused()
  })
})

test.describe('Tour ARIA attributes', () => {
  test('tooltip has dialog role and label', async ({ tourPage: page }) => {
    const tooltip = page.getByRole('dialog')
    await expect(tooltip).toHaveAttribute('aria-label', /navigation/i)
  })
})
```

The focus restoration test is the one most teams miss. WCAG 2.4.3 (Focus Order) requires focus to return to the trigger when a dialog closes.

## Step 5: Handle animation timing and z-index

```typescript
// tests/tour-edge-cases.spec.ts
import { test, expect } from './tour.setup'

test('tooltip fully visible after animation', async ({ tourPage: page }) => {
  const tooltip = page.getByRole('dialog')
  await tooltip.evaluate((el) =>
    new Promise<void>((resolve) => {
      const animations = el.getAnimations()
      if (animations.length === 0) { resolve(); return }
      Promise.all(animations.map((a) => a.finished)).then(() => resolve())
    })
  )
  const opacity = await tooltip.evaluate(
    (el) => window.getComputedStyle(el).opacity
  )
  expect(Number(opacity)).toBe(1)
})

test('overlay renders above fixed elements', async ({ tourPage: page }) => {
  const overlayZ = await page.locator('[data-tour-overlay]').evaluate(
    (el) => window.getComputedStyle(el).zIndex
  )
  const headerZ = await page.locator('header').evaluate(
    (el) => window.getComputedStyle(el).zIndex
  )
  expect(Number(overlayZ)).toBeGreaterThan(Number(headerZ))
})
```

Use `getAnimations()` (standard Web Animations API) instead of `waitForTimeout(300)`.

## Playwright config for tour testing

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:5173',
    contextOptions: { reducedMotion: 'reduce' },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
```

`reducedMotion: 'reduce'` eliminates animation-related flakiness. `trace: 'on-first-retry'` captures a full trace on failure for debugging.

---

Full article with troubleshooting section and FAQ: [usertourkit.com/blog/e2e-testing-product-tours-playwright](https://usertourkit.com/blog/e2e-testing-product-tours-playwright)
