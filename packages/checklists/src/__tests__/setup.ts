import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { __resetForTests as resetUrlVisitListener } from '../engine/url-visit-listener'

// v3 Phase 2 (gap 21) — a `// @vitest-environment node` file is FILE-scoped and
// still runs every setupFile, so the SSR spec would die at the `matchMedia`
// defineProperty below before a single case executed. Core's setup has carried
// this guard since its own SSR test. Inert under jsdom.
const hasDOM = typeof window !== 'undefined'

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
  if (hasDOM) {
    cleanup()
  }
  vi.clearAllMocks()
  if (vi.isFakeTimers?.()) {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
  if (hasDOM) {
    document.body.innerHTML = ''
    // Clear localStorage
    localStorage.clear()
    sessionStorage.clear()
  }
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

// `vi.clearAllMocks()`, the fake-timer reset and `resetUrlVisitListener()` stay
// UNGUARDED above: all three are DOM-free, and the listener reset in particular
// must run in every environment or the node spec leaks its registry into the
// next file.
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
}
