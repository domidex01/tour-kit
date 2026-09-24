import { describe, expect, it } from 'vitest'

import { withAttribution } from '../polar-config'

const CHECKOUT = 'https://buy.polar.sh/polar_cl_abc123'
const BADGE = '?utm_source=unlicensed_badge&utm_medium=in_app&utm_campaign=watermark'

describe('withAttribution', () => {
  it('carries the watermark badge UTM through to the Polar checkout', () => {
    const url = new URL(withAttribution(CHECKOUT, BADGE))

    expect(url.searchParams.get('utm_source')).toBe('unlicensed_badge')
    expect(url.searchParams.get('utm_medium')).toBe('in_app')
    expect(url.searchParams.get('utm_campaign')).toBe('watermark')
  })

  it('leaves the URL untouched when the visitor arrived with no attribution', () => {
    expect(withAttribution(CHECKOUT, '?ref=hn')).toBe(CHECKOUT)
    expect(withAttribution(CHECKOUT, '')).toBe(CHECKOUT)
  })

  it('never forwards checkout inputs, only attribution', () => {
    const url = new URL(
      withAttribution(CHECKOUT, `${BADGE}&discount_code=FREE&product_id=other&customer_email=a@b.c`)
    )

    expect(url.searchParams.has('discount_code')).toBe(false)
    expect(url.searchParams.has('product_id')).toBe(false)
    expect(url.searchParams.has('customer_email')).toBe(false)
    expect(url.searchParams.get('utm_source')).toBe('unlicensed_badge')
  })

  it('does not clobber a value the checkout link already carries', () => {
    const configured = `${CHECKOUT}?utm_source=configured`
    const url = new URL(withAttribution(configured, BADGE))

    expect(url.searchParams.get('utm_source')).toBe('configured')
    // The keys the link does not set are still filled in from the visit.
    expect(url.searchParams.get('utm_campaign')).toBe('watermark')
  })

  it('keeps the /pricing fallback relative', () => {
    // An unset env var resolves to `/pricing`; absolutising it here would send
    // the visitor cross-origin on a deploy preview.
    expect(withAttribution('/pricing', BADGE)).toBe(
      '/pricing?utm_source=unlicensed_badge&utm_medium=in_app&utm_campaign=watermark'
    )
  })
})
