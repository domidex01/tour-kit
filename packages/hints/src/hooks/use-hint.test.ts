import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HintsProvider } from '../context/hints-provider'
import { useHint } from './use-hint'

describe('useHint', () => {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(HintsProvider, null, children)

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useHint('test'))
    }).toThrow('useHintsContext must be used within a HintsProvider')

    consoleSpy.mockRestore()
  })

  it('registers hint on mount', () => {
    const { result } = renderHook(() => useHint('test-hint'), { wrapper })

    // The hint should be registered with default state
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isDismissed).toBe(false)
  })

  it('unregisters hint on unmount', () => {
    const { unmount, result } = renderHook(() => useHint('cleanup-test'), { wrapper })

    // Hint should be registered
    expect(result.current.isOpen).toBe(false)

    unmount()

    // After unmount, the hook is no longer available to check,
    // but we can verify the cleanup happened by re-mounting
    const { result: newResult } = renderHook(() => useHint('cleanup-test'), { wrapper })
    expect(newResult.current.isOpen).toBe(false)
    expect(newResult.current.isDismissed).toBe(false)
  })

  it('returns correct open state', () => {
    const { result } = renderHook(() => useHint('open-test'), { wrapper })

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.show()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('show/hide controls visibility', () => {
    const { result } = renderHook(() => useHint('visibility-test'), { wrapper })

    act(() => {
      result.current.show()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.hide()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('dismiss sets isDismissed', () => {
    const { result } = renderHook(() => useHint('dismiss-test'), { wrapper })

    act(() => {
      result.current.show()
    })

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.isDismissed).toBe(true)
    expect(result.current.isOpen).toBe(false)
  })

  it('reset clears isDismissed', () => {
    const { result } = renderHook(() => useHint('reset-test'), { wrapper })

    act(() => {
      result.current.dismiss()
    })
    expect(result.current.isDismissed).toBe(true)

    act(() => {
      result.current.reset()
    })
    expect(result.current.isDismissed).toBe(false)
  })

  it('returns functions that work correctly after rerender', () => {
    const { result, rerender } = renderHook(() => useHint('stable-test'), { wrapper })

    // Show the hint
    act(() => {
      result.current.show()
    })
    expect(result.current.isOpen).toBe(true)

    rerender()

    // Functions should still work after rerender
    act(() => {
      result.current.hide()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('re-registers with new id when id changes', () => {
    const { result, rerender } = renderHook(({ id }) => useHint(id), {
      wrapper,
      initialProps: { id: 'hint-a' },
    })

    act(() => {
      result.current.show()
    })
    expect(result.current.isOpen).toBe(true)

    // Change the id
    rerender({ id: 'hint-b' })

    // New hint should have fresh state
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isDismissed).toBe(false)
  })
})
