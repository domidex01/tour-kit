/**
 * Structural stand-in for a Vue Router 4 instance — exactly what
 * `createVueRouterAdapter` types, nothing more.
 *
 * `push` resolves to a `NavigationFailure`-shaped object when `failNext` is
 * set: vue-router RESOLVES on a blocked navigation, it does not reject, and the
 * engine reads a resolved `false` as `NAVIGATION_REJECTED`.
 */
import { vi } from 'vitest'

export function fakeVueRouter(path = '/') {
  const listeners = new Set<(to: { path: string }) => void>()
  const router = {
    currentRoute: { value: { path } },
    failNext: false,
    push: vi.fn(async (to: string): Promise<unknown> => {
      if (router.failNext) return { type: 8, from: {}, to: {} }
      router.currentRoute.value = { path: to }
      for (const cb of [...listeners]) cb({ path: to })
      return undefined
    }),
    afterEach: vi.fn((cb: (to: { path: string }) => void) => {
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    }),
  }
  return router
}
