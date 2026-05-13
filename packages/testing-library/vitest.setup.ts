import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

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

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollIntoView = vi.fn()

Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get(this: HTMLElement) {
    if ((this as HTMLElement).style?.display === 'none' || !this.isConnected) {
      return null
    }
    return document.body
  },
  configurable: true,
})

// IMPORTANT: This setup intentionally does NOT touch
// Element.prototype.getBoundingClientRect. Phase 5's contract is that the
// default test setup leaves that descriptor alone — opt in via
// setupTourKitTesting({ positionShim: true }) when you need it.
