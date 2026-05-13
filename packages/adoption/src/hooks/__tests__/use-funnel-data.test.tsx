import { renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { AdoptionContext } from '../../context/adoption-context'
import { mockAdoptionContext } from '../../__tests__/_fixtures'
import { useFunnelData } from '../use-funnel-data'

function wrapperFactory(value: ReturnType<typeof mockAdoptionContext>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AdoptionContext.Provider value={value}>
        {children}
      </AdoptionContext.Provider>
    )
  }
}

describe('useFunnelData', () => {
  it('maps two features into a FunnelStep[] of length 2 with current-state numbers', () => {
    const ctxVal = mockAdoptionContext({
      onboarding: { useCount: 5, status: 'adopted' },
      checkout: { useCount: 2, status: 'exploring' },
    })
    const { result } = renderHook(
      () => useFunnelData({ featureIds: ['onboarding', 'checkout'] }),
      { wrapper: wrapperFactory(ctxVal) }
    )
    expect(result.current.steps).toHaveLength(2)
    // Adopted feature: entered = useCount, completed = useCount (100% conversion).
    expect(result.current.steps[0]).toMatchObject({
      id: 'onboarding',
      label: 'onboarding',
      entered: 5,
      completed: 5,
    })
    // Exploring feature: entered = useCount, completed = 0.
    expect(result.current.steps[1]).toMatchObject({
      id: 'checkout',
      entered: 2,
      completed: 0,
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns zero metrics for unknown feature ids', () => {
    const ctxVal = mockAdoptionContext({
      tracked: { useCount: 3, status: 'adopted' },
    })
    const { result } = renderHook(
      () => useFunnelData({ featureIds: ['tracked', 'unknown'] }),
      { wrapper: wrapperFactory(ctxVal) }
    )
    expect(result.current.steps).toHaveLength(2)
    expect(result.current.steps[1]).toMatchObject({
      id: 'unknown',
      label: 'unknown',
      entered: 0,
      completed: 0,
    })
  })

  it('applies label overrides via opts.labels', () => {
    const ctxVal = mockAdoptionContext({
      feat: { useCount: 1, status: 'exploring' },
    })
    const { result } = renderHook(
      () =>
        useFunnelData({
          featureIds: ['feat'],
          labels: { feat: 'Pretty Feature' },
        }),
      { wrapper: wrapperFactory(ctxVal) }
    )
    expect(result.current.steps[0]?.label).toBe('Pretty Feature')
  })

  it('falls back to the feature.name when no label override is provided', () => {
    const ctxVal = mockAdoptionContext({
      feat: { useCount: 1, status: 'exploring', name: 'Friendly Name' },
    })
    const { result } = renderHook(
      () => useFunnelData({ featureIds: ['feat'] }),
      { wrapper: wrapperFactory(ctxVal) }
    )
    expect(result.current.steps[0]?.label).toBe('Friendly Name')
  })
})
