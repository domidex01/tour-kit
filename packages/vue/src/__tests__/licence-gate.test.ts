import type { Tour } from '@tour-kit/core/engine'
/**
 * `@tour-kit/vue` ships under BUSL-1.1, so an unlicensed production deploy has
 * to show the badge — and a development one has to not.
 *
 * The whole gate is `@tour-kit/license`'s; what this file proves is that the
 * binding actually starts it, on mount, and takes it down again on unmount.
 * Nothing here re-tests the branch logic — `license-gate.test.tsx` owns that.
 *
 * jsdom serves the page from `localhost`, which the licence reads as a
 * development host, so every production case below stubs `location` first. A
 * file that forgot to would pass its dev cases and silently skip its real one.
 */
import { __resetLicenseWarningForTests } from '@tour-kit/license/headless'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { TourProvider } from '../tour-provider'

const tours: Tour[] = [{ id: 'gate-tour', steps: [{ id: 's1', target: '#a', content: 'one' }] }]

const badges = () => document.body.querySelectorAll('[data-tourkit-watermark]')

const slot = { default: () => h('div', { 'data-testid': 'content' }, 'content') }

beforeEach(() => {
  // The unlicensed warning is once per page load by design, so without this
  // the first test to trip it silences every later one — and the dev-host case
  // below would pass or fail on file order alone.
  __resetLicenseWarningForTests()
  vi.unstubAllGlobals()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  for (const badge of badges()) badge.remove()
})

describe('@tour-kit/vue licence gate', () => {
  it('layers exactly one badge on a production host with no key', async () => {
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    const wrapper = mount(TourProvider, { props: { tours }, slots: slot })

    await vi.waitFor(() => expect(badges()).toHaveLength(1))
    // Soft gate: the app still renders. A hard gate would make the badge
    // pointless — nobody ships a blank page to production and then buys a key.
    expect(wrapper.get('[data-testid="content"]').text()).toBe('content')

    wrapper.unmount()
    expect(badges()).toHaveLength(0)
  })

  it('shows no badge on a development host, and says why once', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })

    const wrapper = mount(TourProvider, { props: { tours }, slots: slot })

    await vi.waitFor(() => expect(wrapper.get('[data-testid="content"]').text()).toBe('content'))
    expect(badges()).toHaveLength(0)
    // The warning is the half that survives on a dev host: a missing key has to
    // be visible before the deploy, not after it.
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('without a valid license'),
      expect.any(String),
      expect.any(String)
    )

    wrapper.unmount()
  })

  it('never calls the issuer from a development host when a key is set', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const wrapper = mount(TourProvider, {
      props: { tours, license: { licenseKey: 'tk_test_key' } },
      slots: slot,
    })

    await vi.waitFor(() => expect(wrapper.get('[data-testid="content"]').text()).toBe('content'))
    // Local work must never burn one of the key's finite activation slots.
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(badges()).toHaveLength(0)
    expect(console.warn).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
