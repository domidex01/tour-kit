import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SurveysProvider } from '../context'
import { useSurvey, useSurveyScoring } from '../hooks'
import type { CESResult, CSATResult, NPSResult } from '../types'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
  }
})

const configs: SurveyConfig[] = [
  {
    id: 'nps',
    type: 'nps',
    displayMode: 'modal',
    questions: [{ id: 'q', type: 'rating', text: 'How likely?', scale: { min: 0, max: 10 } }],
  },
  {
    id: 'csat',
    type: 'csat',
    displayMode: 'modal',
    questions: [{ id: 'q', type: 'rating', text: 'Satisfied?', scale: { min: 1, max: 5 } }],
  },
  {
    id: 'ces',
    type: 'ces',
    displayMode: 'modal',
    questions: [{ id: 'q', type: 'rating', text: 'Effort?', scale: { min: 1, max: 7 } }],
  },
  {
    id: 'custom',
    type: 'custom',
    displayMode: 'modal',
    questions: [{ id: 'q', type: 'rating', text: 'Rate', scale: { min: 1, max: 5 } }],
  },
  {
    id: 'textonly',
    type: 'nps',
    displayMode: 'modal',
    questions: [{ id: 'q', type: 'text', text: 'Why?' }],
  },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SurveysProvider surveys={configs} storage={null}>
      {children}
    </SurveysProvider>
  )
}

// Drive a real survey to completion via the public hooks, then read its score.
function useScoringHarness() {
  const scoring = useSurveyScoring()
  const nps = useSurvey('nps')
  const csat = useSurvey('csat')
  const ces = useSurvey('ces')
  const custom = useSurvey('custom')
  const textonly = useSurvey('textonly')
  return { scoring, nps, csat, ces, custom, textonly }
}

describe('useSurveyScoring', () => {
  it('exposes the raw scoring calculators', () => {
    const { result } = renderHook(() => useSurveyScoring(), { wrapper })
    expect(result.current.calculateNPS([9, 10]).score).toBe(100)
    expect(result.current.calculateCSAT([5, 4]).score).toBe(100)
    expect(result.current.calculateCES([7, 7]).score).toBe(7)
  })

  it('getSurveyScore returns null before the survey is completed', () => {
    const { result } = renderHook(() => useScoringHarness(), { wrapper })
    act(() => {
      result.current.nps.show()
    })
    act(() => {
      result.current.nps.answer('q', 9)
    })
    // Answered but not completed → null.
    expect(result.current.scoring.getSurveyScore('nps')).toBeNull()
  })

  it('getSurveyScore computes an NPS result once completed', () => {
    const { result } = renderHook(() => useScoringHarness(), { wrapper })
    act(() => {
      result.current.nps.show()
    })
    act(() => {
      result.current.nps.answer('q', 9)
    })
    act(() => {
      result.current.nps.complete()
    })
    const score = result.current.scoring.getSurveyScore('nps') as NPSResult
    expect(score).not.toBeNull()
    expect(score.promoters).toBe(1)
    expect(score.score).toBe(100)
  })

  it('getSurveyScore computes CSAT and CES by config type', () => {
    const { result } = renderHook(() => useScoringHarness(), { wrapper })
    act(() => {
      result.current.csat.show()
      result.current.ces.show()
    })
    act(() => {
      result.current.csat.answer('q', 5)
      result.current.ces.answer('q', 6)
    })
    act(() => {
      result.current.csat.complete()
      result.current.ces.complete()
    })
    const csat = result.current.scoring.getSurveyScore('csat') as CSATResult
    const ces = result.current.scoring.getSurveyScore('ces') as CESResult
    expect(csat.score).toBe(100) // 5 >= threshold 4
    expect(csat.positive).toBe(1)
    expect(ces.score).toBe(6)
    expect(ces.easy).toBe(1)
  })

  it('getSurveyScore returns null for a custom type (default arm)', () => {
    const { result } = renderHook(() => useScoringHarness(), { wrapper })
    act(() => {
      result.current.custom.show()
    })
    act(() => {
      result.current.custom.answer('q', 5)
    })
    act(() => {
      result.current.custom.complete()
    })
    expect(result.current.scoring.getSurveyScore('custom')).toBeNull()
  })

  it('getSurveyScore returns null when completed with no numeric responses', () => {
    const { result } = renderHook(() => useScoringHarness(), { wrapper })
    act(() => {
      result.current.textonly.show()
    })
    act(() => {
      result.current.textonly.answer('q', 'a comment')
    })
    act(() => {
      result.current.textonly.complete()
    })
    expect(result.current.scoring.getSurveyScore('textonly')).toBeNull()
  })

  it('getSurveyScore returns null for an unknown survey id', () => {
    const { result } = renderHook(() => useSurveyScoring(), { wrapper })
    expect(result.current.getSurveyScore('does-not-exist')).toBeNull()
  })
})
