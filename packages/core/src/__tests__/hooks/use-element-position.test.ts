import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useElementPosition } from '../../hooks/use-element-position'

describe('useElementPosition', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    element = document.createElement('div')
    element.id = 'test-element'
    document.body.appendChild(element)

    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 50,
      left: 50,
      bottom: 150,
      right: 250,
      width: 200,
      height: 100,
      x: 50,
      y: 50,
      toJSON: () => ({}),
    })
  })

  afterEach(() => {
    document.body.removeChild(element)
  })

  it('returns null for null target', () => {
    const { result } = renderHook(() => useElementPosition(null))

    expect(result.current.element).toBeNull()
    expect(result.current.rect).toBeNull()
  })

  it('resolves selector to element', () => {
    const { result } = renderHook(() => useElementPosition('#test-element'))

    expect(result.current.element).toBe(element)
  })

  it('uses HTMLElement directly', () => {
    const { result } = renderHook(() => useElementPosition(element))

    expect(result.current.element).toBe(element)
  })

  it('returns element rect', () => {
    const { result } = renderHook(() => useElementPosition('#test-element'))

    expect(result.current.rect).toEqual(
      expect.objectContaining({
        top: 50,
        left: 50,
        width: 200,
        height: 100,
      })
    )
  })

  it('sets up ResizeObserver', () => {
    const observeSpy = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observeSpy
        unobserve = vi.fn()
        disconnect = vi.fn()
      }
    )

    renderHook(() => useElementPosition('#test-element'))

    expect(observeSpy).toHaveBeenCalledWith(element)
  })

  it('updates rect on scroll', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    const { result } = renderHook(() => useElementPosition('#test-element'))

    vi.mocked(element.getBoundingClientRect).mockReturnValue({
      top: 0,
      left: 50,
      bottom: 100,
      right: 250,
      width: 200,
      height: 100,
      x: 50,
      y: 0,
      toJSON: () => ({}),
    })

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.rect?.top).toBe(0)
    rafSpy.mockRestore()
  })

  it('updates rect on window resize', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    const { result } = renderHook(() => useElementPosition('#test-element'))

    vi.mocked(element.getBoundingClientRect).mockReturnValue({
      top: 75,
      left: 50,
      bottom: 175,
      right: 250,
      width: 200,
      height: 100,
      x: 50,
      y: 75,
      toJSON: () => ({}),
    })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.rect?.top).toBe(75)
    rafSpy.mockRestore()
  })

  it('cleans up observers on unmount', () => {
    const disconnectSpy = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = disconnectSpy
      }
    )

    const { unmount } = renderHook(() => useElementPosition('#test-element'))
    unmount()

    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useElementPosition('#test-element'))
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('update() manually refreshes rect', () => {
    const { result } = renderHook(() => useElementPosition('#test-element'))

    vi.mocked(element.getBoundingClientRect).mockClear()

    act(() => {
      result.current.update()
    })

    expect(element.getBoundingClientRect).toHaveBeenCalled()
  })

  it('returns null element when selector not found', () => {
    const { result } = renderHook(() => useElementPosition('#nonexistent'))

    expect(result.current.element).toBeNull()
    expect(result.current.rect).toBeNull()
  })

  it('updates element when target changes', () => {
    const element2 = document.createElement('div')
    element2.id = 'test-element-2'
    document.body.appendChild(element2)

    vi.spyOn(element2, 'getBoundingClientRect').mockReturnValue({
      top: 200,
      left: 200,
      bottom: 300,
      right: 400,
      width: 200,
      height: 100,
      x: 200,
      y: 200,
      toJSON: () => ({}),
    })

    const { result, rerender } = renderHook(({ target }) => useElementPosition(target), {
      initialProps: { target: '#test-element' },
    })

    expect(result.current.element).toBe(element)

    rerender({ target: '#test-element-2' })

    expect(result.current.element).toBe(element2)
    expect(result.current.rect?.top).toBe(200)

    document.body.removeChild(element2)
  })
})
