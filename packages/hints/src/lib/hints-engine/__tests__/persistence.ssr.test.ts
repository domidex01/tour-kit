// @vitest-environment node
/**
 * v3 Phase 1 — `resolveStorage()` with no `window`.
 *
 * A real `node` environment, not a `window` stub: the whole claim is that the
 * `typeof window === 'undefined'` guard fires, and a stub with `window` present
 * makes that a lie that passes. The docblock is FILE-scoped — one further down
 * does nothing and the file silently runs in jsdom.
 *
 * The contract changed in the Phase 1 review: this used to return `null`, and
 * the engine carried `storage: HintsStorage | null` plus two null-checks. It
 * now returns core's no-op adapter, so the engine's field is non-nullable and
 * those branches are gone. What must still not happen before `boot()` is
 * HYDRATION — a lifecycle rule, guarded by `booted`, not by a null.
 */
import { describe, expect, it } from 'vitest'
import { resolveStorage } from '../persistence'

describe('resolveStorage under SSR', () => {
  it('returns a usable no-op adapter instead of null, and never throws', () => {
    expect(typeof globalThis.window, 'this file is not running in node').toBe('undefined')

    const storage = resolveStorage(undefined)

    expect(storage).not.toBeNull()
    expect(() => storage.setItem('hint:freq:a', '{"viewCount":1}')).not.toThrow()
    expect(() => storage.removeItem('hint:freq:a')).not.toThrow()
    // A no-op swallows the write, so the read comes back empty — which is what
    // makes the engine's post-boot hydrate a no-op on the server rather than a
    // special case at every call site.
    expect(storage.getItem('hint:freq:a')).toBeNull()
  })
})
