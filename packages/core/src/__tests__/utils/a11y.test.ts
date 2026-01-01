import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { announce, generateId, getStepAnnouncement, prefersReducedMotion } from '../../utils/a11y'

describe('announce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    // Clean up any remaining announcer elements
    for (const el of document.querySelectorAll('[role="status"]')) {
      el.remove()
    }
  })

  it('creates announcer element with role status', () => {
    announce('test message')
    const announcer = document.querySelector('[role="status"]')
    expect(announcer).toBeInTheDocument()
  })

  it('sets aria-live to polite by default', () => {
    announce('test message')
    const announcer = document.querySelector('[role="status"]')
    expect(announcer).toHaveAttribute('aria-live', 'polite')
  })

  it('sets aria-live to assertive when specified', () => {
    announce('test message', 'assertive')
    const announcer = document.querySelector('[role="status"]')
    expect(announcer).toHaveAttribute('aria-live', 'assertive')
  })

  it('sets aria-atomic to true', () => {
    announce('test message')
    const announcer = document.querySelector('[role="status"]')
    expect(announcer).toHaveAttribute('aria-atomic', 'true')
  })

  it('applies visually hidden styles', () => {
    announce('test message')
    const announcer = document.querySelector('[role="status"]') as HTMLElement
    expect(announcer.style.position).toBe('absolute')
    expect(announcer.style.width).toBe('1px')
    expect(announcer.style.height).toBe('1px')
    expect(announcer.style.overflow).toBe('hidden')
  })

  it('starts with empty text content', () => {
    announce('delayed message')
    const announcer = document.querySelector('[role="status"]')
    expect(announcer?.textContent).toBe('')
  })

  it('sets message content after 100ms delay', () => {
    announce('delayed message')
    const announcer = document.querySelector('[role="status"]')

    expect(announcer?.textContent).toBe('')

    vi.advanceTimersByTime(100)
    expect(announcer?.textContent).toBe('delayed message')
  })

  it('removes announcer element after 1000ms', () => {
    announce('temporary message')

    let announcer = document.querySelector('[role="status"]')
    expect(announcer).toBeInTheDocument()

    vi.advanceTimersByTime(1000)

    announcer = document.querySelector('[role="status"]')
    expect(announcer).not.toBeInTheDocument()
  })

  it('handles multiple concurrent announcements', () => {
    announce('first message')
    announce('second message')

    const announcers = document.querySelectorAll('[role="status"]')
    expect(announcers).toHaveLength(2)
  })
})

describe('generateId', () => {
  it('generates ID with default prefix', () => {
    const id = generateId()
    expect(id).toMatch(/^tourkit-[a-z0-9]+$/)
  })

  it('uses custom prefix', () => {
    const id = generateId('hint')
    expect(id).toMatch(/^hint-[a-z0-9]+$/)
  })

  it('generates unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('generates IDs with sufficient length', () => {
    const id = generateId()
    const suffix = id.replace('tourkit-', '')
    expect(suffix.length).toBeGreaterThanOrEqual(5)
  })

  it('handles empty prefix', () => {
    const id = generateId('')
    expect(id).toMatch(/^-[a-z0-9]+$/)
  })
})

describe('prefersReducedMotion', () => {
  it('returns false when motion is preferred', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns true when reduced motion is preferred', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    expect(prefersReducedMotion()).toBe(true)
  })

  it('queries the correct media query', () => {
    prefersReducedMotion()
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })
})

describe('getStepAnnouncement', () => {
  it('returns step info without title', () => {
    expect(getStepAnnouncement(undefined, 1, 3)).toBe('Step 1 of 3')
  })

  it('includes title when provided', () => {
    expect(getStepAnnouncement('Welcome', 1, 3)).toBe('Step 1 of 3: Welcome')
  })

  it('handles different step numbers', () => {
    expect(getStepAnnouncement(undefined, 2, 5)).toBe('Step 2 of 5')
    expect(getStepAnnouncement(undefined, 5, 5)).toBe('Step 5 of 5')
  })

  it('handles single step tour', () => {
    expect(getStepAnnouncement('Only Step', 1, 1)).toBe('Step 1 of 1: Only Step')
  })

  it('handles empty string title', () => {
    expect(getStepAnnouncement('', 1, 3)).toBe('Step 1 of 3')
  })
})
