import { renderHook } from '@testing-library/react'
import {
  LocaleProvider,
  type SegmentSource,
  SegmentationProvider,
  type TourStep,
  logger,
} from '@tour-kit/core'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStepFilter } from '../../hooks/use-step-filter'

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

const baseStep = (id: string, audience?: TourStep['audience']): TourStep => ({
  id,
  target: `#${id}`,
  content: id,
  audience,
})

describe('useStepFilter', () => {
  it('keeps steps without audience unconditionally', () => {
    const steps = [baseStep('a'), baseStep('b')]
    const { result } = renderHook(() => useStepFilter(steps), { wrapper: wrap() })
    expect(result.current).toHaveLength(2)
    expect(result.current.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('filters segment-audience steps via useSegments (always-true segment keeps step)', () => {
    const steps = [baseStep('keep', { segment: 'beta' }), baseStep('drop', { segment: 'admin' })]
    const { result } = renderHook(() => useStepFilter(steps), {
      wrapper: wrap(
        {
          beta: [{ type: 'user_property', key: 'flag', operator: 'equals', value: true }],
          admin: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
        },
        { flag: true, role: 'guest' }
      ),
    })
    expect(result.current.map((s) => s.id)).toEqual(['keep'])
  })

  it('filters legacy AudienceCondition[] steps via matchesAudience', () => {
    const steps = [
      baseStep('keep', [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }]),
      baseStep('drop', [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'enterprise' },
      ]),
    ]
    const { result } = renderHook(() => useStepFilter(steps), {
      wrapper: wrap({}, { plan: 'pro' }),
    })
    expect(result.current.map((s) => s.id)).toEqual(['keep'])
  })

  it('rejects step when its segment is not registered (warn + drop)', () => {
    const steps = [baseStep('orphan', { segment: 'ghost' })]
    const { result } = renderHook(() => useStepFilter(steps), { wrapper: wrap({}, {}) })
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

    it('names useStepFilter in the unknown-segment warning', () => {
      // Use a randomized segment name so module-scope dedupe in
      // `core/lib/audience.ts` never short-circuits across tests.
      const seg = `useStepFilter-only-${Math.random().toString(36).slice(2)}`
      const steps = [baseStep('orphan', { segment: seg })]
      renderHook(() => useStepFilter(steps), { wrapper: wrap({}, {}) })
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useStepFilter/)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(new RegExp(seg))
    })
  })
})
