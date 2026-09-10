import { act, render, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SurveysProvider } from '../context'
import { useSurvey } from '../hooks'
import type { SurveyConfig } from '../types'

/**
 * v3 Phase 3 (§0 C5) — the binding passes the adapter it builds from core's
 * MAIN barrel, and the engine never resolves its own.
 *
 * This is the case that keeps six existing suites honest.
 * `queue-drain`, `analytics-callbacks`, `show-guards`, `turnkey-modals`,
 * `survey-modal` and `context-awareness` all stub `createStorageAdapter` with
 * `vi.mock('@tour-kit/core')` and return a null-storage adapter. `vi.mock` does
 * NOT intercept `@tour-kit/core/engine` — a different specifier is a different
 * module — so an engine that resolved its own adapter through `/engine` would
 * leave all six silently running against real jsdom `localStorage`, which
 * persists across cases inside a file. They would keep passing. They would stop
 * testing what they say.
 *
 * The oracle cannot see that failure. This case can: it asserts the spy the
 * mock installs is the one the engine actually wrote through.
 */

const written = new Map<string, string>()
const adapterSpy = vi.fn(() => ({
  getItem: (k: string) => written.get(k) ?? null,
  setItem: (k: string, v: string) => void written.set(k, v),
  removeItem: (k: string) => void written.delete(k),
}))

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
    createStorageAdapter: () => adapterSpy(),
  }
})

const surveys: SurveyConfig[] = [
  { id: 's1', type: 'nps', displayMode: 'modal', questions: [{ id: 'q1', type: 'rating' }] },
]

describe('the storage seam (§0 C5)', () => {
  it('builds the adapter through the MOCKED core barrel, not inside the engine', async () => {
    adapterSpy.mockClear()
    written.clear()
    render(
      <SurveysProvider surveys={surveys}>
        <div />
      </SurveysProvider>
    )
    // If the engine resolved its own through `/engine`, this spy would never
    // fire and every write below would land in real jsdom localStorage.
    await waitFor(() => expect(adapterSpy).toHaveBeenCalled())
  })

  it('writes through THAT adapter — the mock is what the engine persists to', async () => {
    adapterSpy.mockClear()
    written.clear()
    window.localStorage.clear()

    // A real state change is required: the engine is SEEDED with these configs,
    // so `boot()`'s REGISTER is a genuine no-op and persists nothing. Showing a
    // survey is the smallest thing that actually moves state.
    let show: () => void = () => {}
    function Probe() {
      show = useSurvey('s1').show
      return null
    }
    render(
      <SurveysProvider surveys={surveys}>
        <Probe />
      </SurveysProvider>
    )
    await waitFor(() => expect(adapterSpy).toHaveBeenCalled())
    await act(async () => {
      show()
      await Promise.resolve()
    })

    await waitFor(() => expect(written.size).toBeGreaterThan(0))
    expect(JSON.parse([...written.values()][0] ?? '{}').surveys[0][1].viewCount).toBe(1)
    // The other half of the claim: nothing reached real jsdom storage.
    expect(window.localStorage.getItem('tour-kit:surveys:state')).toBeNull()
  })

  it('a null storage prop skips the adapter entirely', () => {
    adapterSpy.mockClear()
    render(
      <SurveysProvider surveys={surveys} storage={null}>
        <div />
      </SurveysProvider>
    )
    expect(adapterSpy).not.toHaveBeenCalled()
  })
})
