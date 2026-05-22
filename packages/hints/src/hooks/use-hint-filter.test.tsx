import { renderHook } from '@testing-library/react'
import { LocaleProvider, type SegmentSource, SegmentationProvider, logger } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HintConfig } from '../types'
import { useHintFilter } from './use-hint-filter'

function wrap(
  segments: Record<string, SegmentSource> = {},
  userContext: Record<string, unknown> = {}
): React.FC<{ children: ReactNode }> {
  return ({ children }) => (
    <LocaleProvider>
      <SegmentationProvider segments={segments} userContext={userContext}>
        {children}
      </SegmentationProvider>
    </LocaleProvider>
  )
}

const baseHint = (id: string, audience?: HintConfig['audience']): HintConfig => ({
  id,
  target: `#${id}`,
  content: id,
  audience,
})

describe('useHintFilter', () => {
  it('keeps hints without audience unconditionally', () => {
    const hints = [baseHint('a'), baseHint('b')]
    const { result } = renderHook(() => useHintFilter(hints), { wrapper: wrap() })
    expect(result.current.map((h) => h.id)).toEqual(['a', 'b'])
  })

  it('filters segment-audience hints via useSegments', () => {
    const hints = [baseHint('keep', { segment: 'beta' }), baseHint('drop', { segment: 'admin' })]
    const { result } = renderHook(() => useHintFilter(hints), {
      wrapper: wrap(
        {
          beta: [{ type: 'user_property', key: 'flag', operator: 'equals', value: true }],
          admin: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
        },
        { flag: true, role: 'guest' }
      ),
    })
    expect(result.current.map((h) => h.id)).toEqual(['keep'])
  })

  it('filters legacy AudienceCondition[] hints via matchesAudience', () => {
    const hints = [
      baseHint('keep', [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }]),
      baseHint('drop', [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'enterprise' },
      ]),
    ]
    const { result } = renderHook(() => useHintFilter(hints), {
      wrapper: wrap({}, { plan: 'pro' }),
    })
    expect(result.current.map((h) => h.id)).toEqual(['keep'])
  })

  it('drops hints referencing unregistered segments', () => {
    const hints = [baseHint('orphan', { segment: 'ghost' })]
    const { result } = renderHook(() => useHintFilter(hints), { wrapper: wrap({}, {}) })
    expect(result.current).toHaveLength(0)
  })

  describe('dev warning (Phase 1 hoist)', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('names useHintFilter in the unknown-segment warning', () => {
      // Unique segment name avoids cross-test coupling with the module-scope
      // dedupe set in `@tour-kit/core/lib/audience.ts`.
      const seg = `useHintFilter-only-${Math.random().toString(36).slice(2)}`
      const hints = [baseHint('orphan', { segment: seg })]
      renderHook(() => useHintFilter(hints), { wrapper: wrap({}, {}) })
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useHintFilter/)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(new RegExp(seg))
    })
  })
})
