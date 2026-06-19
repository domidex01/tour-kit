import type { Schedule } from '@tour-kit/scheduling'
import { describe, expect, it } from 'vitest'
import type { AnnouncementConfig, AnnouncementState } from '../../types/announcement'
import { AnnouncementScheduler } from '../scheduler'

/**
 * Slice 5 (W2) — `AnnouncementConfig.schedule` is wired, not deleted.
 *
 * `scheduler.ts` used to carry the comment "Schedule check would be done
 * externally with @tour-kit/scheduling / The provider handles that
 * integration" — it never did. This wires the real eval into `canShow` (which
 * also gains a `now` param) and fires the REAL `@tour-kit/scheduling` util.
 * The degrade-open path (peer absent ⇒ not suppressed) lives in
 * `scheduler-degrade-open.test.ts`, which mocks scheduling to throw.
 */

const NOW = new Date('2025-06-16T14:30:00Z')

const baseState = (): AnnouncementState =>
  ({ id: 'a1', isDismissed: false, completedAt: null, viewCount: 0 }) as AnnouncementState

const baseConfig = (schedule?: Schedule): AnnouncementConfig =>
  ({
    id: 'a1',
    variant: 'banner',
    frequency: 'always',
    ...(schedule ? { schedule } : {}),
  }) as AnnouncementConfig

function newScheduler() {
  return new AnnouncementScheduler({
    maxConcurrent: 1,
    delayBetween: 0,
    autoShow: true,
  } as never)
}

describe('AnnouncementScheduler.canShow — schedule wiring (W2)', () => {
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
    const schedule: Schedule = { timezone: 'UTC', timeOfDay: { start: '00:00', end: '01:00' } }
    expect(s.canShow(baseConfig(schedule), baseState(), undefined, NOW)).toBe(false)
  })
})
