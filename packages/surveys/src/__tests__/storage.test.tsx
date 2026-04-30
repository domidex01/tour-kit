import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SurveysProvider } from '../context'
import { useSurveys } from '../hooks'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const sharedStore = new Map<string, string>()

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
    createStorageAdapter: () => ({
      getItem: (key: string) => sharedStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sharedStore.set(key, value)
      },
      removeItem: (key: string) => {
        sharedStore.delete(key)
      },
    }),
  }
})

const configs: SurveyConfig[] = [
  { id: 'persisted', type: 'csat', displayMode: 'modal', questions: [] },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SurveysProvider surveys={configs} storageKey="test-storage">
      {children}
    </SurveysProvider>
  )
}

describe('Storage persistence', () => {
  beforeEach(() => {
    sharedStore.clear()
  })

  it('persists state changes to storage', async () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    await act(async () => {
      result.current.show('persisted')
    })
    await act(async () => {
      result.current.complete('persisted')
    })

    const serialized = sharedStore.get('test-storage:state')
    expect(serialized).toBeTruthy()
    const parsed = JSON.parse(serialized ?? '{}')
    const entry = parsed.surveys.find(([id]: [string, unknown]) => id === 'persisted')
    expect(entry?.[1]?.isCompleted).toBe(true)
    expect(entry?.[1]?.viewCount).toBe(1)
  })

  it('hydrates survey state from storage on mount', async () => {
    // Seed the store with a dismissed state
    sharedStore.set(
      'test-storage:state',
      JSON.stringify({
        surveys: [
          [
            'persisted',
            {
              id: 'persisted',
              isActive: false,
              isVisible: false,
              isDismissed: true,
              isSnoozed: false,
              isCompleted: false,
              viewCount: 3,
              lastViewedAt: new Date().toISOString(),
              dismissedAt: new Date().toISOString(),
              dismissalReason: 'close_button',
              completedAt: null,
              snoozeCount: 0,
              snoozeUntil: null,
              currentStep: 0,
              responses: [],
            },
          ],
        ],
        queue: [],
        lastShownAt: null,
      })
    )

    const { result } = renderHook(() => useSurveys(), { wrapper })
    // Wait a microtask for hydrate promise
    await act(async () => {
      await Promise.resolve()
    })

    const state = result.current.getState('persisted')
    expect(state?.isDismissed).toBe(true)
    expect(state?.viewCount).toBe(3)
  })
})
