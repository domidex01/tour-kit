import type { Schedule } from '@tour-kit/scheduling'
import { describe, expect, it } from 'vitest'
import { resolveScheduleActive } from '../resolve-schedule'

/**
 * Slice 5 (W2, US-4) — degrade-open contract.
 *
 * `@tour-kit/scheduling` is an OPTIONAL peer. When it is absent (or fails to
 * load) the resolver must DEGRADE OPEN — return `true` — so content is NOT
 * suppressed merely because the consumer skipped the optional dependency.
 *
 * The peer-absent state is simulated through the resolver's injectable loader
 * seam rather than `vi.mock`, because the production loader reaches scheduling
 * via a CJS `require` that the module mock does not intercept. The matrix in
 * `scheduler.test.ts` proves the real eval is wired; this proves the failure
 * mode degrades open.
 */

// A schedule that WOULD be inactive if scheduling were available.
const INACTIVE: Schedule = { enabled: false }
const NOW = new Date('2025-06-16T14:30:00Z')

describe('resolveScheduleActive — degrades open when the scheduling peer is absent (W2)', () => {
  it('returns true when the peer cannot be loaded (loader → null)', () => {
    expect(resolveScheduleActive(INACTIVE, NOW, () => null)).toBe(true)
  })

  it('returns true when loading the peer throws', () => {
    expect(
      resolveScheduleActive(INACTIVE, NOW, () => {
        throw new Error('peer not installed')
      })
    ).toBe(true)
  })

  it('returns true when the loaded peer eval itself throws (defensive)', () => {
    expect(
      resolveScheduleActive(INACTIVE, NOW, () => ({
        isScheduleActive: () => {
          throw new Error('boom')
        },
      }))
    ).toBe(true)
  })

  it('still gates for real when the peer IS present (default loader)', () => {
    // Sanity: with the real scheduling util, an inactive schedule suppresses.
    expect(resolveScheduleActive(INACTIVE, NOW)).toBe(false)
  })
})
