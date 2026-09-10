/**
 * v3 Phase 3 — segment eligibility is engine-owned (plan Decision 7a, US-3).
 *
 * `useSegments()` is a React hook from core's main barrel, so it cannot enter
 * a React-free engine. But the binding cannot own the filtering either: the
 * provider's `REGISTER` used the UNFILTERED list, so a segment-excluded
 * announcement is registered, has state, and answers `getConfig`/`getState` —
 * it just cannot be shown. Filtering in the binding would make excluded ids
 * unknown to the engine and change those two answers.
 *
 * So the engine owns eligibility and the binding forwards `setSegments()`.
 */
import { describe, expect, it, vi } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { createAnnouncementsEngine } from '../create-announcements-engine'
import { computeEligibleIds, evaluateAnnouncementAudience } from '../eligibility'
import type { EngineAnnouncementConfig } from '../types'

describe('evaluateAnnouncementAudience', () => {
  it('lets an absent audience through', () => {
    expect(evaluateAnnouncementAudience(undefined, {})).toBe(true)
  })

  it('lets an ARRAY audience through — the scheduler owns userContext matching', () => {
    // The legacy contract: array shapes are re-checked downstream against the
    // provider's `userContext` prop, which this seam has no access to.
    expect(evaluateAnnouncementAudience([{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }], {})).toBe(
      true
    )
  })

  it('fails a segment audience CLOSED until the segment map admits it', () => {
    expect(evaluateAnnouncementAudience({ segment: 'admins' }, {})).toBe(false)
    expect(evaluateAnnouncementAudience({ segment: 'admins' }, { admins: false })).toBe(false)
    expect(evaluateAnnouncementAudience({ segment: 'admins' }, { admins: true })).toBe(true)
  })
})

describe('computeEligibleIds', () => {
  const configs: EngineAnnouncementConfig[] = [
    { id: 'open' },
    { id: 'gated', audience: { segment: 'admins' } },
    { id: 'legacy', audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }] },
  ]

  it('admits the ungated and the array-shaped, and refuses the segment-shaped', () => {
    expect([...computeEligibleIds(configs, {})]).toEqual(['open', 'legacy'])
  })

  it('admits the segment-shaped once the map says so', () => {
    expect([...computeEligibleIds(configs, { admins: true })]).toEqual(['open', 'gated', 'legacy'])
  })
})

describe('the engine refuses a segment-gated show until setSegments admits it', () => {
  const mk = () =>
    createAnnouncementsEngine({
      announcements: [
        { id: 'a', variant: 'modal', audience: { segment: 'admins' }, autoShow: false },
      ] as EngineAnnouncementConfig[],
      storage: createFakeStorage(),
    })

  it('show(id) is a no-op before setSegments, and works after — through the engine ALONE', () => {
    const e = mk()
    e.boot()

    e.show('a')
    expect(e.getState().activeAnnouncement).toBeNull()
    expect(e.canShow('a')).toBe(false)

    e.setSegments({ admins: true })
    expect(e.canShow('a')).toBe(true)
    e.show('a')
    expect(e.getState().activeAnnouncement).toBe('a')
    e.destroy()
  })

  it('still REGISTERS the excluded announcement — getConfig and getState answer', () => {
    // The asymmetry that rules out filtering in the binding.
    const e = mk()
    e.boot()
    expect(e.getConfig('a')?.id).toBe('a')
    expect(e.getAnnouncementState('a')?.viewCount).toBe(0)
    expect(e.getEligibleIds().has('a')).toBe(false)
    e.destroy()
  })

  it('auto-show re-runs on setSegments, not only on register', () => {
    // The provider's `:432` effect read three inputs; the engine must keep all
    // three, or admitting a segment shows nothing until something else moves.
    const onShow = vi.fn()
    const e = createAnnouncementsEngine({
      announcements: [
        { id: 'a', variant: 'modal', audience: { segment: 'admins' } },
      ] as EngineAnnouncementConfig[],
      storage: createFakeStorage(),
      onShow,
    })
    e.boot()
    expect(onShow).not.toHaveBeenCalled()

    e.setSegments({ admins: true })
    expect(onShow).toHaveBeenCalledWith('a')
    expect(e.getState().activeAnnouncement).toBe('a')
    e.destroy()
  })

  it('auto-show re-runs on setUserContext and setAnnouncements too', () => {
    const onShow = vi.fn()
    const e = createAnnouncementsEngine({
      announcements: [] as EngineAnnouncementConfig[],
      storage: createFakeStorage(),
      onShow,
    })
    e.boot()
    e.setAnnouncements([{ id: 'b', variant: 'modal' }] as EngineAnnouncementConfig[])
    expect(onShow).toHaveBeenCalledWith('b')

    e.setUserContext({ plan: 'pro' }) // no throw, no double-show
    expect(onShow).toHaveBeenCalledTimes(1)
    e.destroy()
  })
})
