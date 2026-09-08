/**
 * v2 §1.5f — the one `matchRoute` comparison.
 *
 * Five adapters carried their own copy of this switch (three in
 * `@tour-kit/react`, one in each §1.5 binding). These cases are the contract
 * all five now delegate to; the adapters' own suites still assert they wire it
 * to the right path.
 */
import { describe, expect, it } from 'vitest'
import { matchRoutePattern } from '../../lib/match-route'

describe('matchRoutePattern', () => {
  it('defaults to exact', () => {
    expect(matchRoutePattern('/settings', '/settings')).toBe(true)
    expect(matchRoutePattern('/settings/theme', '/settings')).toBe(false)
  })

  it('matches exact, startsWith and contains', () => {
    expect(matchRoutePattern('/settings/theme', '/settings/theme', 'exact')).toBe(true)
    expect(matchRoutePattern('/settings/theme', '/settings', 'startsWith')).toBe(true)
    expect(matchRoutePattern('/settings/theme', 'theme', 'contains')).toBe(true)
  })

  it('rejects a non-match in every mode', () => {
    expect(matchRoutePattern('/dashboard', '/settings', 'exact')).toBe(false)
    expect(matchRoutePattern('/dashboard', '/settings', 'startsWith')).toBe(false)
    expect(matchRoutePattern('/dashboard', '/settings', 'contains')).toBe(false)
  })

  it('an unknown mode falls back to exact rather than throwing', () => {
    // The `default` arm. `mode` is typed, but an adapter fed by untyped host
    // state can still hand this a string.
    expect(matchRoutePattern('/a', '/a', 'nonsense' as 'exact')).toBe(true)
    expect(matchRoutePattern('/a', '/b', 'nonsense' as 'exact')).toBe(false)
  })
})
