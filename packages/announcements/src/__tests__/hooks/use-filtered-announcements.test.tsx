import { renderHook } from '@testing-library/react'
import {
  LocaleProvider,
  logger,
  type SegmentSource,
  SegmentationProvider,
} from '@tour-kit/core'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  evaluateAnnouncementAudience,
  useFilteredAnnouncements,
} from '../../hooks/use-filtered-announcements'
import type { AnnouncementConfig, AudienceCondition } from '../../types/announcement'

function wrap(
  segments: Record<string, SegmentSource> = {}
): React.FC<{ children: ReactNode }> {
  return ({ children }) => (
    <LocaleProvider>
      <SegmentationProvider segments={segments}>{children}</SegmentationProvider>
    </LocaleProvider>
  )
}

function makeAnnouncement(
  overrides: Partial<AnnouncementConfig> & Pick<AnnouncementConfig, 'id'>
): AnnouncementConfig {
  return {
    variant: 'banner',
    title: overrides.id,
    ...overrides,
  } as AnnouncementConfig
}

describe('evaluateAnnouncementAudience', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  describe('short-circuits', () => {
    it('returns true for undefined audience', () => {
      expect(evaluateAnnouncementAudience(undefined, {})).toBe(true)
    })

    // ★★ REGRESSION GUARD (memory #204 / phase-1 Open Question 1) ★★
    // The hoisted core helper evaluates arrays via `matchesAudience`, but
    // announcements has no `userContext` at this seam — the scheduler owns
    // that path. This test pins the array pass-through so a future inline
    // "fix" can't silently re-introduce userContext evaluation here.
    it('returns true for ARRAY-shape audience (scheduler owns the eval)', () => {
      const arrAudience: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
      ]
      expect(evaluateAnnouncementAudience(arrAudience, {})).toBe(true)
    })

    it('returns true for empty-array audience', () => {
      expect(evaluateAnnouncementAudience([], { beta: true })).toBe(true)
    })
  })

  describe('segment branch', () => {
    it('passes when registered segment is true', () => {
      expect(evaluateAnnouncementAudience({ segment: 'beta' }, { beta: true })).toBe(true)
    })

    it('filters when registered segment is false', () => {
      expect(evaluateAnnouncementAudience({ segment: 'beta' }, { beta: false })).toBe(false)
    })

    it('warns once per unknown segment naming useFilteredAnnouncements', () => {
      // Unique segment name to avoid cross-test coupling with core's
      // module-scope dedupe set.
      const seg = `useFilteredAnnouncements-only-${Math.random().toString(36).slice(2)}`
      evaluateAnnouncementAudience({ segment: seg }, {})
      evaluateAnnouncementAudience({ segment: seg }, {})
      evaluateAnnouncementAudience({ segment: seg }, {})
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useFilteredAnnouncements/)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(new RegExp(seg))
    })
  })
})

describe('useFilteredAnnouncements', () => {
  it('keeps array-shape audience announcements regardless of userContext', () => {
    const arr: AnnouncementConfig[] = [
      makeAnnouncement({
        id: 'a',
        audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
      }),
    ]
    const { result } = renderHook(() => useFilteredAnnouncements(arr), {
      wrapper: wrap({}),
    })
    expect(result.current.map((a) => a.id)).toEqual(['a'])
  })

  it('drops segment-shape announcements when the segment is false', () => {
    const arr: AnnouncementConfig[] = [
      makeAnnouncement({ id: 'beta-only', audience: { segment: 'beta' } }),
      makeAnnouncement({ id: 'everyone' }),
    ]
    const { result } = renderHook(() => useFilteredAnnouncements(arr), {
      wrapper: wrap({
        beta: [{ type: 'user_property', key: 'never', operator: 'equals', value: true }],
      }),
    })
    // 'beta' segment evaluates to false (no `never` user prop), so beta-only
    // drops; the announcement without `audience` always passes.
    expect(result.current.map((a) => a.id)).toEqual(['everyone'])
  })

  it('keeps announcements without an audience field', () => {
    const arr: AnnouncementConfig[] = [
      makeAnnouncement({ id: 'a' }),
      makeAnnouncement({ id: 'b' }),
    ]
    const { result } = renderHook(() => useFilteredAnnouncements(arr), { wrapper: wrap() })
    expect(result.current.map((a) => a.id)).toEqual(['a', 'b'])
  })
})
