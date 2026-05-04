import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { __resetForTests as resetUrlVisitListener } from '../engine/url-visit-listener'

// Partially mock @floating-ui/react: stub the positioning-only pieces that
// depend on layout (which jsdom can't compute), but pass through interaction
// hooks and FloatingFocusManager so a11y flows in the launcher work.
vi.mock('@floating-ui/react', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    autoUpdate: vi.fn(() => () => undefined),
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  if (vi.isFakeTimers?.()) {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
  document.body.innerHTML = ''
  // Clear localStorage
  localStorage.clear()
  sessionStorage.clear()
  // Reset module-level URL-visit listener registry between tests so per-spec
  // mounts/unmounts don't leak handlers into the next test. Sync + static
  // import — the listener module is SSR-safe (no top-level browser API access),
  // so importing it without a `window` global is harmless.
  resetUrlVisitListener()
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
