import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'
import { afterEach, vi } from 'vitest'

// Mock @floating-ui/react globally
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
    },
    floatingStyles: { position: 'absolute', top: 0, left: 0 },
    context: {},
    middlewareData: { arrow: {} },
  })),
  autoUpdate: vi.fn(),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
  arrow: vi.fn(),
  FloatingArrow: vi.fn(() => null),
  FloatingPortal: vi.fn(({ children }) => children),
  useDismiss: vi.fn(() => ({})),
  useRole: vi.fn(() => ({})),
  useInteractions: vi.fn(() => ({
    getReferenceProps: vi.fn((props) => props),
    getFloatingProps: vi.fn((props) => props),
  })),
}))

// Everything below patches the DOM, and the whole file runs for every test —
// including a `// @vitest-environment node` one (`persistence.ssr.test.ts` and
// `create-hints-engine.ssr.test.ts` are the first, v3 Phase 1). Bail out rather
// than throwing on the first `window` read; under node there is nothing to
// patch and nothing that wants it patched. Core's setup has carried the same
// guard since its own SSR test landed.
const hasDOM = typeof window !== 'undefined'

// Cleanup after each test
afterEach(() => {
  if (hasDOM) cleanup()
  vi.clearAllMocks()
  // Clear all timers more aggressively for cross-package test isolation
  if (vi.isFakeTimers?.()) {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
  if (hasDOM) document.body.innerHTML = ''
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

if (hasDOM) {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)

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

  // Mock offsetParent for jsdom (it's always null in jsdom but we need it for visibility checks)
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
