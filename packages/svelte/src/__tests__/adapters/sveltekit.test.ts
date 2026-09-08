/**
 * The adapter is a factory over three primitives, which is what makes
 * `@sveltejs/kit` a type-only optional peer: `$app/navigation` and `$app/state`
 * do not resolve outside a SvelteKit app at all, so this file passes three
 * `vi.fn()`s and is a complete stand-in, not an approximation.
 */
import { describe, expect, it } from 'vitest'
import { createSvelteKitRouterAdapter } from '../../adapters/sveltekit'
import { fakeSvelteKitNav } from '../_helpers/fake-nav'

describe('createSvelteKitRouterAdapter', () => {
  it('calls onNavigate SYNCHRONOUSLY inside the factory', () => {
    const nav = fakeSvelteKitNav('/')

    createSvelteKitRouterAdapter(nav)

    // `afterNavigate` must be called during component initialisation. The
    // factory is called from a `<script>`, so calling it here — not lazily in
    // `onRouteChange` — is what satisfies that rule by construction.
    expect(nav.onNavigate).toHaveBeenCalledTimes(1)
  })

  it('reads the current path through getPathname', () => {
    const adapter = createSvelteKitRouterAdapter(fakeSvelteKitNav('/settings'))
    expect(adapter.getCurrentRoute()).toBe('/settings')
  })

  it('onRouteChange fires immediately with the current route', () => {
    const adapter = createSvelteKitRouterAdapter(fakeSvelteKitNav('/'))
    const seen: string[] = []

    adapter.onRouteChange((r) => seen.push(r))

    expect(seen).toEqual(['/'])
  })

  it('forwards later navigations and its teardown unsubscribes', async () => {
    const nav = fakeSvelteKitNav('/')
    const adapter = createSvelteKitRouterAdapter(nav)
    const seen: string[] = []

    const off = adapter.onRouteChange((r) => seen.push(r))
    nav.navigateTo('/settings')
    expect(seen).toEqual(['/', '/settings'])

    off()
    nav.navigateTo('/profile')
    expect(seen).toEqual(['/', '/settings'])
  })

  it('navigate maps goto’s Promise<void> to undefined, which the engine reads as success', async () => {
    const nav = fakeSvelteKitNav('/')
    const adapter = createSvelteKitRouterAdapter(nav)

    // Only a RESOLVED `false` is NAVIGATION_REJECTED.
    await expect(adapter.navigate('/settings')).resolves.toBeUndefined()
    expect(nav.goto).toHaveBeenCalledWith('/settings')
    expect(adapter.getCurrentRoute()).toBe('/settings')
  })

  it('ignores a navigation with no destination', () => {
    // `afterNavigate` fires with `to: null` on a cancelled or external
    // navigation. Forwarding that would push `undefined` at the engine's
    // route-restore path.
    const nav = fakeSvelteKitNav('/')
    const adapter = createSvelteKitRouterAdapter(nav)
    const seen: string[] = []
    adapter.onRouteChange((r) => seen.push(r))
    seen.length = 0

    const emit = nav.onNavigate.mock.calls[0]?.[0]
    emit?.({ to: null })
    emit?.({})

    expect(seen).toEqual([])
  })

  it('matchRoute covers all three modes', () => {
    const adapter = createSvelteKitRouterAdapter(fakeSvelteKitNav('/settings/theme'))

    expect(adapter.matchRoute('/settings/theme')).toBe(true)
    expect(adapter.matchRoute('/settings')).toBe(false)
    expect(adapter.matchRoute('/settings', 'startsWith')).toBe(true)
    expect(adapter.matchRoute('theme', 'contains')).toBe(true)
    expect(adapter.matchRoute('nope', 'contains')).toBe(false)
  })
})
