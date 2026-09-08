/**
 * The three primitives `createSvelteKitRouterAdapter` takes as arguments.
 *
 * The package never imports `$app/navigation` or `$app/state` — they do not
 * resolve outside a SvelteKit app — so this is a complete stand-in, not an
 * approximation.
 */
import { vi } from 'vitest'

export function fakeSvelteKitNav(pathname = '/') {
  let current = pathname
  const cbs: Array<(nav: { to?: { url: URL } | null }) => void> = []

  const emit = (url: string) => {
    current = url
    for (const cb of [...cbs]) cb({ to: { url: new URL(url, 'http://x') } })
  }

  return {
    goto: vi.fn(async (url: string) => {
      emit(url)
    }),
    getPathname: vi.fn(() => current),
    onNavigate: vi.fn((cb: (nav: { to?: { url: URL } | null }) => void) => {
      cbs.push(cb)
    }),
    /** Drive a navigation the tour did not ask for. */
    navigateTo: emit,
  }
}
