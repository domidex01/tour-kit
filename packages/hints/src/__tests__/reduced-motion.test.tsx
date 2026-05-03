import { render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HintHotspot, useReducedMotion } from '../index'

const mockRect: DOMRect = {
  top: 100,
  left: 100,
  bottom: 200,
  right: 300,
  width: 200,
  height: 100,
  x: 100,
  y: 100,
  toJSON: () => ({}),
}

function mockMatchMedia(reduce: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (q: string) =>
      ({
        matches: q.includes('reduce') ? reduce : false,
        media: q,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

describe('hints: HintHotspot pulse JS-gate (US-4)', () => {
  it('omits animate-tour-pulse class when prefers-reduced-motion: reduce is true', () => {
    mockMatchMedia(true)

    render(<HintHotspot targetRect={mockRect} position="top-right" pulse isOpen={false} />)

    const button = screen.getByRole('button', { name: 'Show hint' })
    expect(button).not.toHaveClass('animate-tour-pulse')
  })

  it('applies animate-tour-pulse class when reduce mode is false (post-effect)', () => {
    mockMatchMedia(false)

    render(<HintHotspot targetRect={mockRect} position="top-right" pulse isOpen={false} />)

    const button = screen.getByRole('button', { name: 'Show hint' })
    expect(button).toHaveClass('animate-tour-pulse')
  })

  it('omits pulse class when isOpen is true regardless of reduce mode', () => {
    mockMatchMedia(false)

    render(<HintHotspot targetRect={mockRect} position="top-right" pulse isOpen />)

    const button = screen.getByRole('button', { name: 'Show hint' })
    expect(button).not.toHaveClass('animate-tour-pulse')
  })
})

describe('hints: useReducedMotion re-export (US-5)', () => {
  it('exports a function from @tour-kit/hints', () => {
    expect(typeof useReducedMotion).toBe('function')
  })

  it('returns a boolean when called inside a component', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(typeof result.current).toBe('boolean')
  })
})
