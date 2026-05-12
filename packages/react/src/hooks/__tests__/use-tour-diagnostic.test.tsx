import { act, renderHook } from '@testing-library/react'
import { TourProvider, useTourDiagnostic } from '@tour-kit/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as tkReact from '../../index'

describe('@tour-kit/react re-export smoke', () => {
  it('exposes useTourDiagnostic from the public surface', () => {
    expect(typeof tkReact.useTourDiagnostic).toBe('function')
  })

  it('exposes the diagnostic engine runtime entrypoints', () => {
    expect(typeof tkReact.explainTour).toBe('function')
    expect(typeof tkReact.explainAudience).toBe('function')
    expect(Array.isArray(tkReact.BUILTIN_GATE_ORDER)).toBe(true)
  })
})

describe('useTourDiagnostic via @tour-kit/react surface', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns a populated EligibilityReport when diagnose is on', async () => {
    const tour = {
      id: 'demo',
      steps: [
        { id: 's1', target: '#a', content: 'a' },
        { id: 's2', target: '#b', content: 'b' },
      ],
    }
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[tour]} diagnose>
          {children}
        </TourProvider>
      ),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current?.tourId).toBe('demo')
    expect(result.current?.willFire).toBe(true)
  })
})
