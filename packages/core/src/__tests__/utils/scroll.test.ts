import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getScrollPosition, lockScroll, scrollIntoView, scrollTo } from '../../utils/scroll'

describe('scrollIntoView', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.removeChild(element)
    vi.useRealTimers()
  })

  it('resolves immediately if element is visible', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 200,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    })

    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    const scrollSpy = vi.spyOn(element, 'scrollIntoView')
    const promise = scrollIntoView(element)

    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('does not scroll when disabled', async () => {
    const scrollSpy = vi.spyOn(element, 'scrollIntoView')

    const promise = scrollIntoView(element, { enabled: false })
    await promise

    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('scrolls element that is not visible', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -100,
      bottom: -50,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    })

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    const scrollSpy = vi.spyOn(element, 'scrollIntoView')

    scrollIntoView(element)
    vi.advanceTimersByTime(500)

    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
        block: 'center',
      })
    )
  })

  it('uses smooth behavior by default', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -100,
      bottom: -50,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    })

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    const scrollSpy = vi.spyOn(element, 'scrollIntoView')

    scrollIntoView(element)
    vi.advanceTimersByTime(500)

    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      })
    )
  })

  it('uses custom behavior when specified', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -100,
      bottom: -50,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    })

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    const scrollSpy = vi.spyOn(element, 'scrollIntoView')

    scrollIntoView(element, { behavior: 'auto' })
    vi.advanceTimersByTime(0)

    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'auto',
      })
    )
  })

  it('resolves after estimated duration for smooth scroll', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -100,
      bottom: -50,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    })

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    let resolved = false
    const promise = scrollIntoView(element).then(() => {
      resolved = true
    })

    vi.advanceTimersByTime(499)
    expect(resolved).toBe(false)

    vi.advanceTimersByTime(1)
    await promise
    expect(resolved).toBe(true)
  })
})

describe('scrollTo', () => {
  it('scrolls window to specified position', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo')

    scrollTo(window, { top: 100, left: 50 })

    expect(scrollSpy).toHaveBeenCalledWith({
      top: 100,
      left: 50,
      behavior: 'smooth',
    })
  })

  it('scrolls element to specified position', () => {
    const element = document.createElement('div')
    element.scrollTo = vi.fn()

    scrollTo(element, { top: 200 })

    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 200,
      behavior: 'smooth',
    })
  })

  it('uses smooth behavior by default', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo')

    scrollTo(window, { top: 0 })

    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      })
    )
  })

  it('supports custom behavior', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo')

    scrollTo(window, { top: 0 }, 'auto')

    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'auto',
      })
    )
  })
})

describe('getScrollPosition', () => {
  it('returns window scroll position', () => {
    Object.defineProperty(window, 'scrollX', { value: 100, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

    const position = getScrollPosition()

    expect(position).toEqual({ x: 100, y: 200 })
  })

  it('returns element scroll position', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollLeft', { value: 50, writable: true })
    Object.defineProperty(element, 'scrollTop', { value: 75, writable: true })

    const position = getScrollPosition(element)

    expect(position).toEqual({ x: 50, y: 75 })
  })

  it('uses window by default', () => {
    Object.defineProperty(window, 'scrollX', { value: 10, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 20, writable: true })

    const position = getScrollPosition()

    expect(position).toEqual({ x: 10, y: 20 })
  })
})

describe('lockScroll', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true })
    // Reset body styles
    document.body.style.cssText = ''
  })

  it('locks body scroll with fixed position', () => {
    lockScroll()

    expect(document.body.style.position).toBe('fixed')
  })

  it('preserves scroll position in top style', () => {
    lockScroll()

    expect(document.body.style.top).toBe('-200px')
  })

  it('sets full width', () => {
    lockScroll()

    expect(document.body.style.width).toBe('100%')
  })

  it('enables overflowY scroll to prevent layout shift', () => {
    lockScroll()

    expect(document.body.style.overflowY).toBe('scroll')
  })

  it('returns unlock function that restores styles', () => {
    const unlock = lockScroll()

    expect(document.body.style.position).toBe('fixed')

    unlock()

    expect(document.body.style.position).toBe('')
    expect(document.body.style.top).toBe('')
    expect(document.body.style.width).toBe('')
    expect(document.body.style.overflowY).toBe('')
  })

  it('restores scroll position when unlocking', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo')

    const unlock = lockScroll()
    unlock()

    expect(scrollSpy).toHaveBeenCalledWith(0, 200)
  })
})
