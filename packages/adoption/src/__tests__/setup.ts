import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'

// =============================================================================
// CLEANUP
// =============================================================================

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Clear all timers more aggressively
  if (vi.isFakeTimers?.()) {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
  localStorage.clear()
  sessionStorage.clear()
  document.body.innerHTML = ''
})

beforeEach(() => {
  vi.resetModules()
})

// =============================================================================
// BROWSER API MOCKS
// =============================================================================

// ResizeObserver Mock
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// IntersectionObserver Mock
class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

// matchMedia Mock
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

// =============================================================================
// ENHANCED STORAGE MOCKS (for adoption package)
// =============================================================================

interface EnhancedStorageMock extends Storage {
  __setQuotaExceeded: (value: boolean) => void
  __getStore: () => Record<string, string>
  __reset: () => void
}

const createStorageMock = (): EnhancedStorageMock => {
  let store: Record<string, string> = {}
  let quotaExceeded = false

  return {
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      if (quotaExceeded) {
        const error = new DOMException('QuotaExceededError', 'QuotaExceededError')
        throw error
      }
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    __setQuotaExceeded: (value: boolean) => {
      quotaExceeded = value
    },
    __getStore: () => ({ ...store }),
    __reset: () => {
      store = {}
      quotaExceeded = false
    },
  }
}

export const localStorageMock = createStorageMock()
export const sessionStorageMock = createStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// =============================================================================
// HELPERS
// =============================================================================

export function dispatchCustomEvent(eventName: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export function simulateSelectorClick(selector: string) {
  const element = document.querySelector(selector)
  if (element) {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
    element.dispatchEvent(event)
  }
}
