import type { Schedule } from '@tour-kit/scheduling'
import { describe, expect, it } from 'vitest'
import type { SurveyConfig, SurveyState } from '../../types/survey'
import { SurveyScheduler } from '../scheduler'

/**
 * Slice 5 (W1) — `SurveyConfig.schedule` is wired, not deleted.
 *
 * The Studio emits a `schedule` $ref here, so the field must be typed
 * `Schedule` and actually CONSULTED in `canShow`. These are behavior tests
 * that fire the REAL `@tour-kit/scheduling` eval (no stub) — an absence test
 * would wrongly pass if the field were deleted, which is the Studio-breaking
 * outcome this slice exists to prevent.
 */

const NOW = new Date('2025-06-16T14:30:00Z')

const baseState = (): SurveyState => ({ isCompleted: false, isDismissed: false }) as SurveyState

const baseConfig = (schedule?: Schedule): SurveyConfig =>
  ({ id: 's1', frequency: 'always', ...(schedule ? { schedule } : {}) }) as SurveyConfig

function newScheduler() {
  return new SurveyScheduler({ maxConcurrent: 1, delayBetween: 0, autoShow: true } as never)
}

describe('SurveyScheduler.canShow — schedule wiring (W1)', () => {
  it('returns false when the schedule is inactive (enabled:false)', () => {
    const s = newScheduler()
    expect(s.canShow(baseConfig({ enabled: false }), baseState(), undefined, NOW)).toBe(false)
  })

  it('returns true when the schedule is active (no constraints)', () => {
    const s = newScheduler()
    expect(s.canShow(baseConfig({}), baseState(), undefined, NOW)).toBe(true)
  })

  it('returns true when schedule is omitted (additive, non-breaking)', () => {
    const s = newScheduler()
    expect(s.canShow(baseConfig(), baseState(), undefined, NOW)).toBe(true)
  })

  it('gates on a timeOfDay window relative to the injected now', () => {
    const s = newScheduler()
    // 14:30Z is outside a 00:00–01:00 UTC window → inactive → not shown.
    const schedule: Schedule = { timezone: 'UTC', timeOfDay: { start: '00:00', end: '01:00' } }
    expect(s.canShow(baseConfig(schedule), baseState(), undefined, NOW)).toBe(false)
  })

  it('becomes eligible once now passes a future startAt', () => {
    const s = newScheduler()
    const schedule: Schedule = { timezone: 'UTC', startAt: '2025-07-01' }
    // Before the window opens → suppressed; after → eligible.
    expect(s.canShow(baseConfig(schedule), baseState(), undefined, NOW)).toBe(false)
    const later = new Date('2025-07-02T00:00:00Z')
    expect(s.canShow(baseConfig(schedule), baseState(), undefined, later)).toBe(true)
  })
})
