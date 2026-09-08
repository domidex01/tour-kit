import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * v2 §1.6 — the CDN door through a real classic `<script src>`.
 *
 * The vitest suite (`packages/core/src/__tests__/engine-iife-dist.test.ts`)
 * covers the bytes and two evaluation realms; jsdom only *approximates*
 * script-tag semantics, and Chromium is them. What this case adds: the global
 * actually landing on `window` from a network-delivered classic script, the
 * IIFE wrapper's `'use strict'` staying inside itself, and the file loading
 * with no CSP or MIME complaint.
 *
 * It lives in the vue lane because Playwright matches projects by directory
 * (`testMatch: /vue\/.*localhost/`) and `webServer` is global — a dedicated
 * project would boot the same four dev servers for no benefit.
 *
 * SETUP: this reads `packages/core/dist/` directly, so run
 * `pnpm build --filter=@tour-kit/core` before `pnpm e2e:vue`.
 *
 * No server of its own: `page.route` fulfils the script from disk. `cdn.invalid`
 * is a reserved TLD, so a routing mistake fails loudly instead of quietly
 * reaching the network.
 */
// `__dirname`, not `import.meta.url`: the repo root has no `"type": "module"`,
// so Playwright transpiles specs to CJS and an `import.meta` reference makes
// the loader treat the file as ESM while the emitted body still uses `require`
// — "ReferenceError: require is not defined in ES module scope", at line 1.
const IIFE_PATH = join(__dirname, '../../packages/core/dist/engine/index.global.js')

declare global {
  interface Window {
    TourKit: {
      createTourEngine(options: unknown): {
        start(id: string): Promise<void>
        next(): Promise<void>
        getState(): { currentStep?: { id: string } | null }
      }
      createMemoryStorage(): unknown
    }
  }
}

test('the IIFE loads from a <script src> and runs a tour', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text())
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))

  await page.route('https://cdn.invalid/**', (route) =>
    route.fulfill({ path: IIFE_PATH, contentType: 'text/javascript' })
  )
  await page.setContent(
    '<button id="a">A</button><button id="b">B</button>' +
      '<script src="https://cdn.invalid/engine.global.js"></script>'
  )

  await page.waitForFunction(() => typeof window.TourKit?.createTourEngine === 'function')

  const landed = await page.evaluate(async () => {
    const TourKit = window.TourKit
    const engine = TourKit.createTourEngine({
      tours: [
        {
          id: 't',
          steps: [
            { id: 's1', target: '#a', content: 'first' },
            { id: 's2', target: '#b', content: 'second' },
          ],
        },
      ],
      storage: TourKit.createMemoryStorage(),
    })
    await engine.start('t')
    await engine.next()
    return engine.getState().currentStep?.id
  })

  expect(landed).toBe('s2')
  // A `ReferenceError: process is not defined` from a `platform`-less build
  // would land here, not in the assertion above.
  expect(problems).toEqual([])
})
