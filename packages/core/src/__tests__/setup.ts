import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  if (typeof window !== 'undefined') cleanup()
  vi.clearAllMocks()
  // Clear all timers more aggressively for cross-package test isolation
  if (vi.isFakeTimers?.()) {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// Everything below patches the DOM, and the whole file runs for every test —
// including a `// @vitest-environment node` one (create-tour-engine.ssr.test.ts
// is the first). Bail out rather than throwing on the first `window` read;
// under node there is nothing to patch and nothing that wants it patched.
const hasDOM = typeof window !== 'undefined'

if (hasDOM) {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
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

  // Mock scrollTo
  window.scrollTo = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()

  // Mock offsetParent for jsdom (it's always null in jsdom but we need it for
  // visibility checks)
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get() {
      // Return body for most elements (simulates visible elements)
      // Elements with display:none or not in DOM will still have null
      if (this.style?.display === 'none' || !this.isConnected) {
        return null
      }
      return document.body
    },
    configurable: true,
  })
}
