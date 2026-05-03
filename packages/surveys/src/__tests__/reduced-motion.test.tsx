import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  modalContentVariants,
  modalOverlayVariants,
  slideoutContentVariants,
  slideoutOverlayVariants,
  useReducedMotion,
} from '../index'

// Surveys vitest setup is minimal — make sure matchMedia is callable so the
// hook smoke can run.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

const BARE_ANIM_RE =
  /(?<!motion-safe:)(?:^|\s|\]:)(animate-in|animate-out|fade-in-0|fade-out-0|fade-in|fade-out|slide-in-from-[\w/-]+|slide-out-to-[\w/-]+|zoom-in-95|zoom-out-95|zoom-in|zoom-out)\b/

const REQUIRED_MOTION_SAFE_RE = /motion-safe:animate-in/

const cases: Array<[label: string, classes: string]> = [
  ['modalOverlayVariants()', modalOverlayVariants()],
  ['modalContentVariants({ size: md })', modalContentVariants({ size: 'md' })],
  ['slideoutOverlayVariants()', slideoutOverlayVariants()],
  ['slideoutContentVariants({ position: left })', slideoutContentVariants({ position: 'left' })],
  ['slideoutContentVariants({ position: right })', slideoutContentVariants({ position: 'right' })],
]

describe('surveys: motion-safe CSS-prefix coverage (US-2)', () => {
  it.each(cases)('%s exposes motion-safe:animate-in', (_label, classes) => {
    expect(classes).toMatch(REQUIRED_MOTION_SAFE_RE)
  })

  it.each(cases)('%s contains no bare animate-* utility', (_label, classes) => {
    expect(classes).not.toMatch(BARE_ANIM_RE)
  })
})

describe('surveys: useReducedMotion re-export (US-5)', () => {
  it('exports a function from @tour-kit/surveys', () => {
    expect(typeof useReducedMotion).toBe('function')
  })

  it('returns a boolean when called inside a component', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(typeof result.current).toBe('boolean')
  })
})
