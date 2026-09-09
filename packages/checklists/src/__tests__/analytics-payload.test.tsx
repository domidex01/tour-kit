/**
 * v3 Phase 2 — the analytics claims `analytics-events.test.tsx` cannot make.
 *
 * That file is one of the 24 pinned by SHA, and Success 1 requires the pinned
 * set to be byte-identical apart from `dead-fields.guard.test.ts`. So the three
 * cases the extraction actually needs live here instead: the exact
 * `completedCount` (which the pinned file only asserts loosely), the redundant
 * complete (which it does not exercise at all), and the event ORDER (which it
 * asserts nowhere, and which the engine deliberately reverses).
 */
import { act, renderHook } from '@testing-library/react'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useChecklistContext } from '../context/checklist-context'
import { ChecklistProvider } from '../context/checklist-provider'
import type { ChecklistConfig } from '../types'

const twoTasks: ChecklistConfig = {
  id: 'activation',
  title: 'Activation',
  tasks: [
    { id: 'profile', title: 'Complete profile' },
    { id: 'invite', title: 'Invite teammate' },
  ],
}

const oneTask: ChecklistConfig = {
  id: 'solo',
  title: 'Solo',
  tasks: [{ id: 'only', title: 'The only task' }],
}

function createWrapper(track: AnalyticsPlugin['track'], checklists: ChecklistConfig[]) {
  const plugin: AnalyticsPlugin = { name: 'test', track }
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider config={{ plugins: [plugin] }}>
        <ChecklistProvider checklists={checklists}>{children}</ChecklistProvider>
      </AnalyticsProvider>
    )
  }
}

const names = (track: ReturnType<typeof vi.fn<AnalyticsPlugin['track']>>) =>
  track.mock.calls.map((c) => c[0].eventName)

describe('checklist_task_completed payload', () => {
  // C7. The pre-extraction provider computed this from a PRE-dispatch snapshot
  // as `completedCount + 1`; the binding reads the post-dispatch snapshot and
  // drops the `+ 1`. Same number — asserted here exactly, because the pinned
  // file only uses `objectContaining` on the ids.
  it('counts the task that was just completed', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const { result } = renderHook(() => useChecklistContext(), {
      wrapper: createWrapper(track, [twoTasks]),
    })

    act(() => {
      result.current.completeTask('activation', 'profile')
    })

    const first = track.mock.calls.find((c) => c[0].eventName === 'checklist_task_completed')?.[0]
    expect(first?.metadata?.completedCount).toBe(1)
    expect(first?.metadata?.totalCount).toBe(2)

    act(() => {
      result.current.completeTask('activation', 'invite')
    })

    const calls = track.mock.calls.filter((c) => c[0].eventName === 'checklist_task_completed')
    const second = calls[calls.length - 1]?.[0]
    expect(second?.metadata?.completedCount).toBe(2)
  })

  // The guard the engine's `changed` flag exists to preserve. Without it a
  // redundant `completeTask` double-fires the event — a bug this repo has
  // shipped before.
  it('does not fire again for a task that is already complete', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const { result } = renderHook(() => useChecklistContext(), {
      wrapper: createWrapper(track, [twoTasks]),
    })

    act(() => {
      result.current.completeTask('activation', 'profile')
    })
    const after = names(track).filter((n) => n === 'checklist_task_completed').length

    act(() => {
      result.current.completeTask('activation', 'profile')
    })
    expect(names(track).filter((n) => n === 'checklist_task_completed').length).toBe(after)
  })

  it('fires checklist_completed exactly once', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const { result } = renderHook(() => useChecklistContext(), {
      wrapper: createWrapper(track, [oneTask]),
    })

    act(() => {
      result.current.completeTask('solo', 'only')
    })
    act(() => {
      result.current.completeTask('solo', 'only')
    })

    expect(names(track).filter((n) => n === 'checklist_completed')).toHaveLength(1)
  })
})

// C8 — a deliberate, recorded flip. The provider tracked the task event inside
// the action and the checklist event from an effect after the commit, so a
// consumer saw TASK then CHECKLIST. The engine notifies completion from inside
// `dispatch`, so the order is now CHECKLIST then TASK. The events are
// independent and both payloads are correct either way; this pins the choice
// so it is recorded rather than discovered by a consumer.
describe('event order on the completing task (C8)', () => {
  it('emits checklist_completed before checklist_task_completed', () => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const { result } = renderHook(() => useChecklistContext(), {
      wrapper: createWrapper(track, [oneTask]),
    })

    act(() => {
      result.current.completeTask('solo', 'only')
    })

    expect(names(track)).toEqual(['checklist_completed', 'checklist_task_completed'])
  })
})
