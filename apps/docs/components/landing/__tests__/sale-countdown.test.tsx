import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { SALE_END_ISO, isSaleActive } from '@/lib/pricing'

const SALE_END_MS = new Date(SALE_END_ISO).getTime()
const DAY_MS = 86_400_000

// Regression guard. `useSaleCountdown` used to return
// `expired: mounted && remaining === null`, so `expired` was false on the server
// and through the first hydration render. Every visitor to /pricing, the
// homepage hero and the site-wide banner got a "49% off" promo with `--`
// placeholder digits for a sale that ended 2026-06-18, until hydration removed
// it. Expiry must be derivable with no mount so an ended promo never reaches the
// HTML at all.
//
// This app has no component-test setup (vitest `environment: 'node'`, no
// @vitejs/plugin-react), so the invariant is checked at its two real seams: the
// date predicate the hook now delegates to, and the source shape of the hook.
describe('launch promo expiry', () => {
  it('isSaleActive is false once SALE_END_ISO has passed', () => {
    expect(isSaleActive(SALE_END_MS + DAY_MS)).toBe(false)
  })

  it('isSaleActive is true inside the promo window', () => {
    expect(isSaleActive(SALE_END_MS - DAY_MS)).toBe(true)
  })

  it('useSaleCountdown derives `expired` from the date, never from `mounted`', () => {
    const src = readFileSync(path.resolve(__dirname, '..', 'sale-countdown.tsx'), 'utf8')

    expect(src).toContain('expired: !isSaleActive()')
    expect(src).not.toMatch(/expired:\s*mounted/)
  })
})
