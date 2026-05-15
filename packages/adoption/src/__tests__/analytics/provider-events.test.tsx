import { act, renderHook, waitFor } from '@testing-library/react'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useAdoptionContext } from '../../context/adoption-context'
import { AdoptionProvider } from '../../context/adoption-provider'
import type { Feature } from '../../types'

const feature: Feature = {
  id: 'export-csv',
  name: 'Export CSV',
  trigger: { event: 'export-csv' },
  adoptionCriteria: { minUses: 1 },
  category: 'reports',
  priority: 2,
}

function createWrapper(track: AnalyticsPlugin['track']) {
  const plugin: AnalyticsPlugin = { name: 'test', track }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider config={{ plugins: [plugin] }}>
        <AdoptionProvider features={[feature]} storage={{ type: 'memory' }}>
          {children}
        </AdoptionProvider>
      </AnalyticsProvider>
    )
  }
}

describe('AdoptionProvider analytics', () => {
  it('emits usage, adoption, and nudge lifecycle events', async () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const wrapper = createWrapper(track)
    const { result } = renderHook(() => useAdoptionContext(), { wrapper })

    act(() => {
      result.current.trackUsage('export-csv')
    })

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'feature_used',
          tourId: 'export-csv',
          metadata: expect.objectContaining({
            feature_id: 'export-csv',
            previous_status: 'not_started',
            status: 'adopted',
          }),
        })
      )
    })
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'feature_adopted',
        tourId: 'export-csv',
        metadata: expect.objectContaining({
          feature_id: 'export-csv',
          use_count: 1,
        }),
      })
    )

    act(() => {
      result.current.showNudge('export-csv')
    })
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'nudge_shown',
        tourId: 'export-csv',
        metadata: expect.objectContaining({
          feature_id: 'export-csv',
          session_count: 1,
        }),
      })
    )

    act(() => {
      result.current.dismissNudge('export-csv')
    })
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'nudge_dismissed',
        tourId: 'export-csv',
        metadata: expect.objectContaining({
          feature_id: 'export-csv',
          permanent: true,
        }),
      })
    )
  })
})
