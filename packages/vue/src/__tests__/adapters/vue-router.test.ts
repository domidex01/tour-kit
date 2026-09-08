/**
 * The adapter is a factory over a structural `Router`, which is what makes
 * `vue-router` a type-only optional peer: this file never installs one.
 */
import { describe, expect, it } from 'vitest'
import { createVueRouterAdapter } from '../../adapters/vue-router'
import { fakeVueRouter } from '../_helpers/fake-router'

describe('createVueRouterAdapter', () => {
  it('reads the current path off currentRoute.value', () => {
    const adapter = createVueRouterAdapter(fakeVueRouter('/settings'))
    expect(adapter.getCurrentRoute()).toBe('/settings')
  })

  it('onRouteChange fires immediately with the current route', () => {
    const router = fakeVueRouter('/')
    const adapter = createVueRouterAdapter(router)
    const seen: string[] = []

    adapter.onRouteChange((r) => seen.push(r))

    // Every existing adapter does this and the engine's route-restore path
    // depends on it.
    expect(seen).toEqual(['/'])
  })

  it('onRouteChange forwards later navigations and its teardown unsubscribes', async () => {
    const router = fakeVueRouter('/')
    const adapter = createVueRouterAdapter(router)
    const seen: string[] = []

    const off = adapter.onRouteChange((r) => seen.push(r))
    await router.push('/settings')
    expect(seen).toEqual(['/', '/settings'])

    off()
    await router.push('/profile')
    expect(seen).toEqual(['/', '/settings'])
  })

  it('a resolved NavigationFailure maps to false, not a rejection', async () => {
    const router = fakeVueRouter('/')
    const adapter = createVueRouterAdapter(router)

    await expect(adapter.navigate('/settings')).resolves.toBe(true)

    router.failNext = true
    // vue-router RESOLVES with a NavigationFailure on a blocked navigation.
    // The engine reads a resolved `false` as NAVIGATION_REJECTED.
    await expect(adapter.navigate('/blocked')).resolves.toBe(false)
  })

  it('matchRoute covers all three modes', () => {
    const adapter = createVueRouterAdapter(fakeVueRouter('/settings/theme'))

    expect(adapter.matchRoute('/settings/theme')).toBe(true)
    expect(adapter.matchRoute('/settings')).toBe(false)
    expect(adapter.matchRoute('/settings', 'startsWith')).toBe(true)
    expect(adapter.matchRoute('theme', 'contains')).toBe(true)
    expect(adapter.matchRoute('nope', 'contains')).toBe(false)
  })
})
