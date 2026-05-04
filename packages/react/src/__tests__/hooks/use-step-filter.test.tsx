import { renderHook } from '@testing-library/react'
import {
  LocaleProvider,
  SegmentationProvider,
  type SegmentSource,
  type TourStep,
} from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
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
    const steps = [
      baseStep('keep', { segment: 'beta' }),
      baseStep('drop', { segment: 'admin' }),
    ]
    const { result } = renderHook(() => useStepFilter(steps), {
      wrapper: wrap({
        beta: [{ type: 'user_property', key: 'flag', operator: 'equals', value: true }],
        admin: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
      }, { flag: true, role: 'guest' }),
    })
    expect(result.current.map((s) => s.id)).toEqual(['keep'])
  })

  it('filters legacy AudienceCondition[] steps via matchesAudience', () => {
    const steps = [
      baseStep('keep', [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }]),
      baseStep('drop', [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'enterprise' }]),
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
})
