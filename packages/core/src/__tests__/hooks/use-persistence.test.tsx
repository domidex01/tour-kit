import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { usePersistence } from '../../hooks/use-persistence'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

describe('usePersistence', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('returns empty completed tours initially', () => {
    const { result } = renderHook(() => usePersistence())
    expect(result.current.getCompletedTours()).toEqual([])
  })

  it('returns empty skipped tours initially', () => {
    const { result } = renderHook(() => usePersistence())
    expect(result.current.getSkippedTours()).toEqual([])
  })

  it('marks tour as completed', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markCompleted('onboarding')
    })

    expect(result.current.getCompletedTours()).toContain('onboarding')
  })

  it('does not duplicate completed tours', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markCompleted('tour-1')
      result.current.markCompleted('tour-1')
    })

    expect(result.current.getCompletedTours().filter((t) => t === 'tour-1')).toHaveLength(1)
  })

  it('marks tour as skipped', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markSkipped('tour-1')
    })

    expect(result.current.getSkippedTours()).toContain('tour-1')
  })

  it('does not duplicate skipped tours', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markSkipped('tour-1')
      result.current.markSkipped('tour-1')
    })

    expect(result.current.getSkippedTours().filter((t) => t === 'tour-1')).toHaveLength(1)
  })

  it('saves and retrieves last step', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.saveStep('tour-1', 3)
    })

    expect(result.current.getLastStep('tour-1')).toBe(3)
  })

  it('returns null for unset last step', () => {
    const { result } = renderHook(() => usePersistence())
    expect(result.current.getLastStep('tour-1')).toBeNull()
  })

  it('returns false for dont show again initially', () => {
    const { result } = renderHook(() => usePersistence())
    expect(result.current.getDontShowAgain('tour-1')).toBe(false)
  })

  it('sets dont show again to true', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.setDontShowAgain('tour-1', true)
    })

    expect(result.current.getDontShowAgain('tour-1')).toBe(true)
  })

  it('sets dont show again to false', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.setDontShowAgain('tour-1', true)
    })

    expect(result.current.getDontShowAgain('tour-1')).toBe(true)

    act(() => {
      result.current.setDontShowAgain('tour-1', false)
    })

    expect(result.current.getDontShowAgain('tour-1')).toBe(false)
  })

  it('resets specific tour data', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markCompleted('tour-1')
      result.current.markCompleted('tour-2')
      result.current.saveStep('tour-1', 2)
      result.current.setDontShowAgain('tour-1', true)
    })

    act(() => {
      result.current.reset('tour-1')
    })

    expect(result.current.getCompletedTours()).not.toContain('tour-1')
    expect(result.current.getCompletedTours()).toContain('tour-2')
    expect(result.current.getLastStep('tour-1')).toBeNull()
    expect(result.current.getDontShowAgain('tour-1')).toBe(false)
  })

  it('resets all tour data', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markCompleted('tour-1')
      result.current.markSkipped('tour-2')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.getCompletedTours()).toEqual([])
    expect(result.current.getSkippedTours()).toEqual([])
  })

  it('uses custom key prefix', () => {
    const { result } = renderHook(() => usePersistence({ keyPrefix: 'myapp' }))

    act(() => {
      result.current.markCompleted('tour-1')
    })

    expect(localStorage.getItem('myapp:completed')).not.toBeNull()
    expect(localStorage.getItem('tourkit:completed')).toBeNull()
  })

  it('uses localStorage by default', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markCompleted('tour-1')
    })

    expect(localStorage.getItem('tourkit:completed')).not.toBeNull()
    expect(sessionStorage.getItem('tourkit:completed')).toBeNull()
  })

  it('uses sessionStorage when specified', () => {
    const { result } = renderHook(() => usePersistence({ storage: 'sessionStorage' }))

    act(() => {
      result.current.markCompleted('tour-1')
    })

    expect(sessionStorage.getItem('tourkit:completed')).not.toBeNull()
    expect(localStorage.getItem('tourkit:completed')).toBeNull()
  })

  it('tracks multiple completed tours', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markCompleted('tour-1')
      result.current.markCompleted('tour-2')
      result.current.markCompleted('tour-3')
    })

    const completed = result.current.getCompletedTours()
    expect(completed).toContain('tour-1')
    expect(completed).toContain('tour-2')
    expect(completed).toContain('tour-3')
    expect(completed).toHaveLength(3)
  })

  it('tracks multiple skipped tours', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.markSkipped('tour-1')
      result.current.markSkipped('tour-2')
    })

    const skipped = result.current.getSkippedTours()
    expect(skipped).toContain('tour-1')
    expect(skipped).toContain('tour-2')
    expect(skipped).toHaveLength(2)
  })

  it('saves different steps for different tours', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.saveStep('tour-1', 2)
      result.current.saveStep('tour-2', 5)
    })

    expect(result.current.getLastStep('tour-1')).toBe(2)
    expect(result.current.getLastStep('tour-2')).toBe(5)
  })

  it('overwrites previous step', () => {
    const { result } = renderHook(() => usePersistence())

    act(() => {
      result.current.saveStep('tour-1', 1)
    })

    expect(result.current.getLastStep('tour-1')).toBe(1)

    act(() => {
      result.current.saveStep('tour-1', 3)
    })

    expect(result.current.getLastStep('tour-1')).toBe(3)
  })
})

// Backward-compat (US-4 — Phase 1.1): omitting flowSession/crossTab must
// produce the same storage write set as before. We snapshot the sorted
// localStorage keys after a 3-step provider run; any new key written by
// the new code path will fail this snapshot.
describe('TourProvider — backward-compat: no flowSession / crossTab opt-in (US-4)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  const tour: Tour = {
    id: 'tour-1',
    steps: [
      { id: 's1', target: '#t1', content: 'Step 1' },
      { id: 's2', target: '#t2', content: 'Step 2' },
      { id: 's3', target: '#t3', content: 'Step 3' },
    ],
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={[tour]}>{children}</TourProvider>
  }

  it('writes no localStorage keys when routePersistence is unset', async () => {
    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    await act(async () => {
      result.current.start('tour-1')
    })
    await act(async () => {
      result.current.next()
    })
    await act(async () => {
      result.current.next()
    })

    const keys = Object.keys(localStorage).sort()
    expect(keys).toEqual([])
    const sessionKeys = Object.keys(sessionStorage).sort()
    expect(sessionKeys).toEqual([])
  })
})
