/**
 * `RouterAdapter` over SvelteKit 2.
 *
 * A factory over three primitives, not an import of `$app/*` — those modules do
 * not resolve outside a SvelteKit app at all, which is what makes
 * `@sveltejs/kit` a type-only OPTIONAL peer and lets the tests pass three
 * `vi.fn()`s.
 *
 * The consumer wires it in `+layout.svelte`:
 *
 * ```ts
 * import { afterNavigate, goto } from '$app/navigation'
 * import { page } from '$app/state'
 *
 * const router = createSvelteKitRouterAdapter({
 *   goto,
 *   getPathname: () => page.url.pathname,
 *   onNavigate: afterNavigate,
 * })
 * ```
 *
 * @module adapters/sveltekit
 */
import { type RouterAdapter, matchRoutePattern } from '@tour-kit/core/engine'

export interface SvelteKitRouterAdapterInput {
  goto: (url: string) => Promise<void>
  getPathname: () => string
  /**
   * `afterNavigate`. It MUST be called during component initialisation — the
   * factory calls it synchronously below, and the factory is called from a
   * `<script>`, so the rule is satisfied by construction.
   */
  onNavigate: (cb: (nav: { to?: { url: URL } | null }) => void) => void
}

export function createSvelteKitRouterAdapter(input: SvelteKitRouterAdapterInput): RouterAdapter {
  const listeners = new Set<(route: string) => void>()

  // Synchronous, inside the factory: `afterNavigate` throws if called later.
  input.onNavigate((nav) => {
    const path = nav.to?.url.pathname
    if (!path) return
    for (const cb of [...listeners]) cb(path)
  })

  return {
    getCurrentRoute: input.getPathname,

    // `goto` resolves with `void`; the adapter's return type is
    // `undefined | Promise<boolean | undefined>`, and `undefined` means
    // "navigated" (only a resolved `false` is NAVIGATION_REJECTED).
    navigate: (route) => input.goto(route).then(() => undefined),

    matchRoute: (pattern, mode) => matchRoutePattern(input.getPathname(), pattern, mode),

    onRouteChange: (cb) => {
      listeners.add(cb)
      // Fires immediately with the current route, matching every existing
      // adapter — the engine's route-restore path depends on it.
      cb(input.getPathname())
      return () => {
        listeners.delete(cb)
      }
    },
  }
}
