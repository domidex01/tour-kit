/**
 * `RouterAdapter` over Vue Router 4.
 *
 * A factory taking the router, not an import of `vue-router` — same shape as
 * the React adapters (`packages/react/src/adapters/react-router.ts`), and the
 * reason `vue-router` is an OPTIONAL peer: the type below is structural, so a
 * test passes a plain object and nobody has to install a router to run one.
 *
 * @module adapters/vue-router
 */
import type { RouterAdapter } from '@tour-kit/core/engine'

/**
 * What this adapter needs from a `Router`, and nothing more.
 *
 * `push` RESOLVES with a `NavigationFailure` on a blocked navigation — it does
 * not reject — which is why `navigate` below maps a truthy resolution to
 * `false` rather than catching.
 */
export interface VueRouterLike {
  currentRoute: { value: { path: string } }
  push(to: string): Promise<unknown>
  afterEach(cb: (to: { path: string }) => void): () => void
}

export function createVueRouterAdapter(router: VueRouterLike): RouterAdapter {
  return {
    getCurrentRoute: () => router.currentRoute.value.path,

    navigate: (route) => router.push(route).then((failure) => !failure),

    matchRoute: (pattern, mode = 'exact') => {
      const currentPath = router.currentRoute.value.path
      switch (mode) {
        case 'startsWith':
          return currentPath.startsWith(pattern)
        case 'contains':
          return currentPath.includes(pattern)
        default:
          return currentPath === pattern
      }
    },

    onRouteChange: (cb) => {
      // Fires immediately with the current route, matching every existing
      // adapter — the engine's route-restore path depends on it.
      cb(router.currentRoute.value.path)
      // `afterEach` returns its own unsubscribe.
      return router.afterEach((to) => cb(to.path))
    },
  }
}
