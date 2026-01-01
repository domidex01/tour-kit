import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

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
