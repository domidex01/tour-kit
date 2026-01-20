import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
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

// Mock @radix-ui/react-dialog
vi.mock('@radix-ui/react-dialog', () => ({
  Root: vi.fn(({ children, open }) => (open ? children : null)),
  Portal: vi.fn(({ children }) => children),
  Overlay: vi.fn(({ children, className, ...props }) => (
    <div data-testid="dialog-overlay" className={className} {...props}>
      {children}
    </div>
  )),
  Content: vi.fn(({ children, className, ...props }) => (
    <dialog data-testid="dialog-content" open className={className} {...props}>
      {children}
    </dialog>
  )),
  Title: vi.fn(({ children, ...props }) => <h2 {...props}>{children}</h2>),
  Description: vi.fn(({ children, ...props }) => <p {...props}>{children}</p>),
  Close: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Clear all timers more aggressively for cross-package test isolation
  if (vi.isFakeTimers?.()) {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
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

// Mock offsetParent for jsdom
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    if (this.style?.display === 'none' || !this.isConnected) {
      return null
    }
    return document.body
  },
  configurable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
