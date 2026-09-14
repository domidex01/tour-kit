import { render } from '@testing-library/svelte'
/**
 * `@tour-kit/svelte` ships under BUSL-1.1, so an unlicensed production deploy
 * has to show the badge — and a development one has to not. The Vue binding has
 * the same file for the same reason; the gate itself belongs to
 * `@tour-kit/license`, and what is under test here is that the binding starts
 * it on mount and takes it down on unmount.
 *
 * jsdom serves the page from `localhost`, which the licence reads as a
 * development host, so every production case below stubs `location` first.
 */
import type { Tour } from '@tour-kit/core/engine'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Provider from './fixtures/Provider.svelte'

const tours: Tour[] = [{ id: 'gate-tour', steps: [{ id: 's1', target: '#a', content: 'one' }] }]

const badges = () => document.body.querySelectorAll('[data-tourkit-watermark]')

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  for (const badge of badges()) badge.remove()
})

describe('@tour-kit/svelte licence gate', () => {
  it('layers exactly one badge on a production host with no key', async () => {
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    const { getByTestId, unmount } = render(Provider, { props: { options: { tours } } })

    await vi.waitFor(() => expect(badges()).toHaveLength(1))
    // Soft gate: the app still renders.
    expect(getByTestId('provider')).toBeTruthy()

    unmount()
    expect(badges()).toHaveLength(0)
  })

  it('shows no badge on a development host', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })

    const { unmount } = render(Provider, { props: { options: { tours } } })
    await tick()

    expect(badges()).toHaveLength(0)

    unmount()
  })

  it('never calls the issuer from a development host when a key is set', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { unmount } = render(Provider, {
      props: { options: { tours, license: { licenseKey: 'tk_test_key' } } },
    })
    await tick()

    // Local work must never burn one of the key's finite activation slots.
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(badges()).toHaveLength(0)

    unmount()
  })
})
