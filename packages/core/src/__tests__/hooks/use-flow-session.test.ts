import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlowSession } from '../../hooks/use-flow-session'
import { parse } from '../../lib/flow-session'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('useFlowSession: round-trip (US-1)', () => {
  it('save → load returns the same session on remount', () => {
    const { result, unmount } = renderHook(() =>
      useFlowSession('onboarding', { storage: 'sessionStorage' })
    )
    act(() => {
      result.current.save(2)
    })
    // Force the trailing-edge throttle to flush; without timers we rely on
    // setTimeout actually firing — use real microtask flush via re-render.
    // The first save with a fresh throttle (lastCallTime=0 vs Date.now()=large)
    // executes immediately, so the storage already has the blob.
    const raw = sessionStorage.getItem('tourkit:flow:active')
    expect(raw).not.toBeNull()
    const stored = parse(raw)
    expect(stored?.tourId).toBe('onboarding')
    expect(stored?.stepIndex).toBe(2)
    unmount()

    // Fresh mount reads the persisted session.
    const { result: result2 } = renderHook(() =>
      useFlowSession('onboarding', { storage: 'sessionStorage' })
    )
    expect(result2.current.session?.tourId).toBe('onboarding')
    expect(result2.current.session?.stepIndex).toBe(2)
  })
})

describe('useFlowSession: TTL expiry (US-3 / US-1)', () => {
  it('returns null AND clears the blob when expired', () => {
    // Pre-write a stale blob (lastUpdatedAt very old).
    const stale = JSON.stringify({
      schemaVersion: 1,
      tourId: 'onboarding',
      stepIndex: 1,
      startedAt: 1,
      lastUpdatedAt: 1, // 1970 → very stale
    })
    sessionStorage.setItem('tourkit:flow:active', stale)

    const { result } = renderHook(() =>
      useFlowSession('onboarding', { storage: 'sessionStorage', ttlMs: 1_000 })
    )

    expect(result.current.session).toBeNull()
    expect(sessionStorage.getItem('tourkit:flow:active')).toBeNull()
  })
})

describe('useFlowSession: clear (US-3)', () => {
  it('clear() removes the persisted blob', () => {
    const { result } = renderHook(() =>
      useFlowSession('onboarding', { storage: 'sessionStorage' })
    )
    act(() => {
      result.current.save(1)
    })
    expect(sessionStorage.getItem('tourkit:flow:active')).not.toBeNull()
    act(() => {
      result.current.clear()
    })
    expect(sessionStorage.getItem('tourkit:flow:active')).toBeNull()
    expect(result.current.session).toBeNull()
  })
})

describe('useFlowSession: throttle (US-5)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Fresh fake clock — Date.now()=0. Without this, the throttle's
    // lastCallTime=0 vs Date.now()=large would make the leading call
    // fire immediately, defeating the coalesce assertion.
    vi.setSystemTime(0)
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('coalesces 5 saves in 100ms into a single setItem call', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() =>
      useFlowSession('onboarding', { storage: 'sessionStorage' })
    )
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.save(i)
        vi.advanceTimersByTime(20) // total 100ms across 5 calls
      }
      vi.advanceTimersByTime(200) // flush trailing edge
    })
    expect(setItemSpy).toHaveBeenCalledTimes(1)
    setItemSpy.mockRestore()
  })
})

describe('useFlowSession: SSR-safe (US-3)', () => {
  // The SSR `typeof window === 'undefined'` early return shares its no-op
  // shape with the config-omitted path (covered below). True SSR rendering
  // can't be exercised through @testing-library/react because React DOM
  // requires `window`; the structural guarantee is asserted by the
  // config-omitted assertions on `session === null` and non-throwing save.
  it('exposes a stable no-op shape (same as the SSR fallback) when storage backend is missing', () => {
    const { result } = renderHook(() => useFlowSession('onboarding'))
    expect(result.current.session).toBeNull()
    expect(typeof result.current.save).toBe('function')
    expect(typeof result.current.clear).toBe('function')
    expect(() => result.current.save(1)).not.toThrow()
    expect(() => result.current.clear()).not.toThrow()
  })
})

describe('useFlowSession: fail-safe (US-3)', () => {
  it('does not throw when setItem throws QuotaExceededError', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Object.assign(new DOMException('quota'), { name: 'QuotaExceededError' })
    })
    const { result } = renderHook(() =>
      useFlowSession('onboarding', { storage: 'sessionStorage' })
    )
    expect(() => {
      act(() => {
        result.current.save(1)
      })
    }).not.toThrow()
    setItemSpy.mockRestore()
  })

  it('does nothing when config is omitted', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useFlowSession('onboarding'))
    act(() => {
      result.current.save(1)
    })
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(result.current.session).toBeNull()
    setItemSpy.mockRestore()
  })
})
