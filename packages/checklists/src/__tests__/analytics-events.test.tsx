import { act, renderHook, waitFor } from '@testing-library/react'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useChecklistContext } from '../context/checklist-context'
import { ChecklistProvider } from '../context/checklist-provider'
import type { ChecklistConfig } from '../types'

const checklist: ChecklistConfig = {
  id: 'activation',
  title: 'Activation',
  tasks: [
    { id: 'profile', title: 'Complete profile' },
    { id: 'invite', title: 'Invite teammate' },
  ],
}

function createWrapper(track: AnalyticsPlugin['track']) {
  const plugin: AnalyticsPlugin = { name: 'test', track }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider config={{ plugins: [plugin] }}>
        <ChecklistProvider checklists={[checklist]}>{children}</ChecklistProvider>
      </AnalyticsProvider>
    )
  }
}

describe('ChecklistProvider analytics', () => {
  it('emits task and checklist completion events', async () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const wrapper = createWrapper(track)
    const { result } = renderHook(() => useChecklistContext(), { wrapper })

    act(() => {
      result.current.completeTask('activation', 'profile')
    })

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'checklist_task_completed',
        tourId: 'activation',
        metadata: expect.objectContaining({
          checklistId: 'activation',
          taskId: 'profile',
          taskTitle: 'Complete profile',
        }),
      })
    )

    act(() => {
      result.current.completeTask('activation', 'invite')
    })

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'checklist_completed',
          tourId: 'activation',
          metadata: expect.objectContaining({
            checklistId: 'activation',
            completedCount: 2,
            totalCount: 2,
          }),
        })
      )
    })
  })
})
