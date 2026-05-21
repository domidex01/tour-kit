import { describe, expect, it } from 'vitest'
import { getDaysLeft } from '../lib/trial'

const DAY = 86_400_000
const ISSUED = 1_700_000_000_000

describe('getDaysLeft', () => {
  it.each<[number, number, number]>([
    [14, 0, 14],
    [14, 1, 13],
    [14, 7, 7],
    [14, 11, 3],
    [14, 13, 1],
    [14, 14, 0],
    [14, 15, 0],
    [14, 30, 0],
    [14, -5, 14],
  ])('trialDays=%i, daysElapsed=%i → %i', (trialDays, daysElapsed, expected) => {
    const validatedAt = ISSUED + daysElapsed * DAY
    const serverValidatedAt = ISSUED + daysElapsed * DAY
    expect(
      getDaysLeft({ issuedAt: ISSUED, trialDays, validatedAt, serverValidatedAt }, validatedAt)
    ).toBe(expected)
  })

  it('falls back to `now` when serverValidatedAt is null', () => {
    const now = ISSUED + 5 * DAY
    expect(
      getDaysLeft({ issuedAt: ISSUED, trialDays: 14, validatedAt: 0, serverValidatedAt: null }, now)
    ).toBe(9)
  })

  it('falls back to `now` when serverValidatedAt is undefined', () => {
    const now = ISSUED + 5 * DAY
    expect(getDaysLeft({ issuedAt: ISSUED, trialDays: 14, validatedAt: 0 }, now)).toBe(9)
  })

  it('absorbs forward clock skew via serverValidatedAt anchor', () => {
    // Local clock was already fast at validation time (says 20 days in)
    const localValidationTime = ISSUED + 20 * DAY
    // One real day later, still skewed
    const skewedNow = localValidationTime + 1 * DAY
    // Server says we were actually 5 days in
    const realLastValidated = ISSUED + 5 * DAY
    expect(
      getDaysLeft(
        {
          issuedAt: ISSUED,
          trialDays: 14,
          validatedAt: localValidationTime,
          serverValidatedAt: realLastValidated,
        },
        skewedNow
      )
    ).toBe(8)
  })

  it('clamps negative elapsed (server anchor in the future relative to now)', () => {
    // server says we are 0 days in, now is in the past relative to validatedAt
    const validatedAt = ISSUED + 5 * DAY
    const serverValidatedAt = ISSUED
    const now = validatedAt - 10 * DAY
    expect(
      getDaysLeft({ issuedAt: ISSUED, trialDays: 14, validatedAt, serverValidatedAt }, now)
    ).toBe(14)
  })
})
