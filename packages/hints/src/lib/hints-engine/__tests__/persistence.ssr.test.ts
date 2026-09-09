// @vitest-environment node
/**
 * v3 Phase 1 — `resolveStorage()` with no `window`.
 *
 * A real `node` environment, not a `window` stub: the whole claim is that the
 * `typeof window === 'undefined'` guard fires, and a stub with `window` present
 * makes that a lie that passes. The docblock is FILE-scoped — one further down
 * does nothing and the file silently runs in jsdom.
 */
import { describe, expect, it } from 'vitest'
import { resolveStorage } from '../persistence'

describe('resolveStorage under SSR', () => {
  it('returns null without throwing when there is no window', () => {
    expect(typeof globalThis.window, 'this file is not running in node').toBe('undefined')
    expect(resolveStorage(undefined)).toBeNull()
  })
})
