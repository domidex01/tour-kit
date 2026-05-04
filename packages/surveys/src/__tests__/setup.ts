import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeAll(() => {
  // jsdom does not implement matchMedia — required by `useReducedMotion` from
  // `@tour-kit/core` once MediaSlot (Phase 4) renders inside surveys tests.
  if (!window.matchMedia) {
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
})
