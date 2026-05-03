import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  bannerVariants,
  modalContentVariants,
  modalOverlayVariants,
  slideoutContentVariants,
  slideoutOverlayVariants,
  spotlightContentVariants,
  toastVariants,
  useReducedMotion,
} from '../index'

// Catches any bare animation utility that's missing the `motion-safe:` prefix.
// `tailwindcss-animate` does NOT honor `prefers-reduced-motion: reduce` on its
// own; the prefix is the contract.
const BARE_ANIM_RE =
  /(?<!motion-safe:)(?:^|\s|\]:)(animate-in|animate-out|fade-in-0|fade-out-0|fade-in|fade-out|slide-in-from-[\w/-]+|slide-out-to-[\w/-]+|zoom-in-95|zoom-out-95|zoom-in|zoom-out)\b/

const REQUIRED_MOTION_SAFE_RE = /motion-safe:animate-in/

const cases: Array<[label: string, classes: string]> = [
  ['modalOverlayVariants()', modalOverlayVariants()],
  ['modalContentVariants({ size: md })', modalContentVariants({ size: 'md' })],
  ['slideoutOverlayVariants()', slideoutOverlayVariants()],
  ['slideoutContentVariants({ position: left })', slideoutContentVariants({ position: 'left' })],
  ['slideoutContentVariants({ position: right })', slideoutContentVariants({ position: 'right' })],
  ['bannerVariants({ position: top })', bannerVariants({ position: 'top' })],
  ['bannerVariants({ position: bottom })', bannerVariants({ position: 'bottom' })],
  ['toastVariants({ position: top-right })', toastVariants({ position: 'top-right' })],
  ['toastVariants({ position: bottom-left })', toastVariants({ position: 'bottom-left' })],
  ['toastVariants({ position: top-center })', toastVariants({ position: 'top-center' })],
  ['toastVariants({ position: bottom-center })', toastVariants({ position: 'bottom-center' })],
  ['spotlightContentVariants({ placement: top })', spotlightContentVariants({ placement: 'top' })],
  [
    'spotlightContentVariants({ placement: bottom })',
    spotlightContentVariants({ placement: 'bottom' }),
  ],
  [
    'spotlightContentVariants({ placement: left })',
    spotlightContentVariants({ placement: 'left' }),
  ],
  [
    'spotlightContentVariants({ placement: right })',
    spotlightContentVariants({ placement: 'right' }),
  ],
]

describe('announcements: motion-safe CSS-prefix coverage (US-1)', () => {
  it.each(cases)('%s exposes motion-safe:animate-in', (_label, classes) => {
    expect(classes).toMatch(REQUIRED_MOTION_SAFE_RE)
  })

  it.each(cases)('%s contains no bare animate-* utility', (_label, classes) => {
    expect(classes).not.toMatch(BARE_ANIM_RE)
  })
})

describe('announcements: useReducedMotion re-export (US-5)', () => {
  it('exports a function from @tour-kit/announcements', () => {
    expect(typeof useReducedMotion).toBe('function')
  })

  it('returns a boolean when called inside a component', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(typeof result.current).toBe('boolean')
  })
})
