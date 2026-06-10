import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SurveysProvider } from '../context'
import { useSurveys } from '../hooks'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  it('hydration merges with registered surveys instead of wiping them', async () => {
    // Regression (QA 2026-06-10): stale persisted state written by a DIFFERENT
    // survey set on the same origin must not blank freshly-configured surveys.
    // REGISTER runs synchronously on mount; the async HYDRATE used to replace
    // the whole map, deleting every registered id missing from the blob.
    sharedStore.set(
      'test-storage:state',
      JSON.stringify({
        surveys: [
          [
            'foreign-survey',
            {
              id: 'foreign-survey',
              isActive: false,
              isVisible: false,
              isDismissed: false,
              isSnoozed: false,
              isCompleted: true,
              viewCount: 1,
              lastViewedAt: new Date().toISOString(),
              dismissedAt: null,
              dismissalReason: null,
              completedAt: new Date().toISOString(),
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
    await act(async () => {
      await Promise.resolve()
    })

    // The configured survey survives hydration…
    expect(result.current.getState('persisted')).toBeTruthy()
    // …and the foreign persisted history is retained too.
    expect(result.current.getState('foreign-survey')?.isCompleted).toBe(true)
  })
})
