import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpotlight } from '../../hooks/use-spotlight'

describe('useSpotlight', () => {
  let targetElement: HTMLDivElement

  beforeEach(() => {
    targetElement = document.createElement('div')
    document.body.appendChild(targetElement)

    vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 100,
      bottom: 200,
      right: 300,
      width: 200,
      height: 100,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    })
  })

  afterEach(() => {
    document.body.removeChild(targetElement)
  })

  it('returns isVisible false initially', () => {
    const { result } = renderHook(() => useSpotlight())
    expect(result.current.isVisible).toBe(false)
    expect(result.current.targetRect).toBeNull()
  })

  it('show() makes spotlight visible', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.targetRect).toEqual(
      expect.objectContaining({
        top: 100,
        left: 100,
        width: 200,
        height: 100,
      })
    )
  })

  it('hide() hides spotlight and clears rect', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    expect(result.current.isVisible).toBe(true)

    act(() => {
      result.current.hide()
    })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.targetRect).toBeNull()
  })

  it('overlayStyle has fixed positioning', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    expect(result.current.overlayStyle.position).toBe('fixed')
    expect(result.current.overlayStyle.inset).toBe(0)
  })

  it('cutoutStyle creates spotlight hole with box-shadow', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement, { padding: 8, color: 'rgba(0,0,0,0.5)' })
    })

    expect(result.current.cutoutStyle.boxShadow).toContain('9999px')
    expect(result.current.cutoutStyle.boxShadow).toContain('rgba(0,0,0,0.5)')
  })

  it('cutoutStyle applies padding', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement, { padding: 16 })
    })

    // Top should be 100 - 16 = 84
    expect(result.current.cutoutStyle.top).toBe(100 - 16)
    // Left should be 100 - 16 = 84
    expect(result.current.cutoutStyle.left).toBe(100 - 16)
    // Width should be 200 + 16*2 = 232
    expect(result.current.cutoutStyle.width).toBe(200 + 32)
    // Height should be 100 + 16*2 = 132
    expect(result.current.cutoutStyle.height).toBe(100 + 32)
  })

  it('cutoutStyle applies borderRadius', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement, { borderRadius: 8 })
    })

    expect(result.current.cutoutStyle.borderRadius).toBe(8)
  })

  it('adds scroll listener when visible', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
      capture: true,
    })

    addEventListenerSpy.mockRestore()
  })

  it('adds resize listener when visible', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), {
      passive: true,
    })

    addEventListenerSpy.mockRestore()
  })

  it('removes listeners on hide', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    act(() => {
      result.current.hide()
    })

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('updates rect on scroll', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    vi.mocked(targetElement.getBoundingClientRect).mockClear()

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(targetElement.getBoundingClientRect).toHaveBeenCalled()
    rafSpy.mockRestore()
  })

  it('updates rect on resize', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    vi.mocked(targetElement.getBoundingClientRect).mockClear()

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(targetElement.getBoundingClientRect).toHaveBeenCalled()
    rafSpy.mockRestore()
  })

  it('update() manually refreshes rect', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement)
    })

    vi.mocked(targetElement.getBoundingClientRect).mockClear()

    act(() => {
      result.current.update()
    })

    expect(targetElement.getBoundingClientRect).toHaveBeenCalled()
  })

  it('applies animation transition when animate is true', () => {
    const { result } = renderHook(() => useSpotlight())

    act(() => {
      result.current.show(targetElement, { animate: true, animationDuration: 300 })
    })

    expect(result.current.overlayStyle.transition).toContain('300ms')
    expect(result.current.cutoutStyle.transition).toContain('300ms')
  })

  it('returns empty cutoutStyle when targetRect is null', () => {
    const { result } = renderHook(() => useSpotlight())

    expect(result.current.cutoutStyle).toEqual({})
  })
})
