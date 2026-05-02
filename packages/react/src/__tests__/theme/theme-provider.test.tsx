import { act, render } from '@testing-library/react'
import type { RouterAdapter } from '@tour-kit/core'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useThemeContext } from '../../components/theme/theme-provider'
import type { ThemeVariation } from '../../components/theme/types'

function createMockRouter(initial = '/'): RouterAdapter {
  let current = initial
  const subs = new Set<(r: string) => void>()
  return {
    getCurrentRoute: () => current,
    navigate: vi.fn((r: string) => {
      current = r
      for (const cb of subs) cb(r)
      return undefined
    }),
    matchRoute: vi.fn((p: string) => current === p),
    onRouteChange: vi.fn((cb: (r: string) => void) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    }),
  }
}

const variations: ThemeVariation[] = [
  { id: 'dark', when: { kind: 'dark' }, theme: { '--tour-card-bg': '#000' } },
  { id: 'light', when: { kind: 'light' }, theme: { '--tour-card-bg': '#fff' } },
]

describe('<ThemeProvider> (US-2)', () => {
  beforeEach(() => {
    // Reset matchMedia to "light" by default for each test.
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    const { getByTestId } = render(
      <ThemeProvider variations={variations}>
        <div data-testid="child">hello</div>
      </ThemeProvider>
    )
    expect(getByTestId('child').textContent).toBe('hello')
  })

  it('forceMode="dark" flips data-tk-theme to "dark" after mount', () => {
    const { container } = render(
      <ThemeProvider variations={variations} forceMode="dark">
        <span>x</span>
      </ThemeProvider>
    )
    // Effects flush synchronously inside render with @testing-library; the
    // attribute should be present after the initial mount cycle.
    expect(container.querySelector('[data-tk-theme="dark"]')).not.toBeNull()
  })

  it('flips attribute when router navigates to a URL-matched route', () => {
    const urlVariations: ThemeVariation[] = [
      { id: 'billing', when: { kind: 'url', pattern: '/billing' }, theme: {} },
      {
        id: 'docs',
        when: { kind: 'url', pattern: '/docs', mode: 'startsWith' },
        theme: {},
      },
    ]
    const router = createMockRouter('/')
    const { container } = render(
      <ThemeProvider variations={urlVariations} router={router}>
        <span>x</span>
      </ThemeProvider>
    )

    // Initial route '/' matches nothing → falls back to first variation.
    expect(container.querySelector('[data-tk-theme="billing"]')).not.toBeNull()

    act(() => {
      router.navigate('/docs/start')
    })
    expect(container.querySelector('[data-tk-theme="docs"]')).not.toBeNull()

    act(() => {
      router.navigate('/billing')
    })
    expect(container.querySelector('[data-tk-theme="billing"]')).not.toBeNull()
  })

  it('reflects system colour scheme via matchMedia mock', () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-color-scheme: dark'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    )

    const sysVariations: ThemeVariation[] = [
      { id: 'systemDark', when: { kind: 'system' }, theme: {} },
      { id: 'fallback', when: { kind: 'url', pattern: '/never-match' }, theme: {} },
    ]
    const { container } = render(
      <ThemeProvider variations={sysVariations}>
        <span>x</span>
      </ThemeProvider>
    )
    // Effect resolves systemColorScheme = 'dark' → matches system variation.
    expect(container.querySelector('[data-tk-theme="systemDark"]')).not.toBeNull()
  })
})

describe('<ThemeProvider> SSR safety (US-3)', () => {
  it('renderToString output does NOT contain data-tk-theme="dark"', () => {
    const html = renderToString(
      <ThemeProvider variations={variations} forceMode="dark">
        <span>x</span>
      </ThemeProvider>
    )
    expect(html).not.toContain('data-tk-theme="dark"')
    // Acceptable: neutral default attribute (no per-variation theme leak).
    expect(html).toContain('data-tk-theme="default"')
  })

  it('renderToString does not emit inline style on the wrapper', () => {
    // Inline style is computed client-side; emitting it server-side would
    // diverge from the first client render and trip hydration warnings.
    const html = renderToString(
      <ThemeProvider variations={variations} forceMode="dark">
        <span>x</span>
      </ThemeProvider>
    )
    expect(html).not.toMatch(/style="[^"]*--tour-card-bg/)
  })
})

describe('<ThemeProvider> render budget (US-2)', () => {
  it('renders the provider subtree at most twice per route change', () => {
    const counter = vi.fn()

    const urlVariations: ThemeVariation[] = [
      { id: 'home', when: { kind: 'url', pattern: '/' }, theme: {} },
      { id: 'billing', when: { kind: 'url', pattern: '/billing' }, theme: {} },
      { id: 'docs', when: { kind: 'url', pattern: '/docs', mode: 'startsWith' }, theme: {} },
      {
        id: 'admin',
        when: { kind: 'url', pattern: /^\/admin/ },
        theme: {},
      },
    ]

    const router = createMockRouter('/')

    function ContextConsumer() {
      const ctx = useThemeContext()
      return <span data-testid="ctx">{ctx.activeId}</span>
    }

    render(
      <React.Profiler id="theme" onRender={counter}>
        <ThemeProvider variations={urlVariations} router={router}>
          <ContextConsumer />
        </ThemeProvider>
      </React.Profiler>
    )

    // Reset render count after initial mount; we only measure the cost of one
    // route change (the budget set in Phase 0 spike 0.3).
    counter.mockClear()

    act(() => {
      router.navigate('/billing')
    })

    expect(counter.mock.calls.length).toBeLessThanOrEqual(2)
  })
})

describe('useThemeContext', () => {
  it('throws when used outside <ThemeProvider>', () => {
    function Consumer() {
      useThemeContext()
      return null
    }
    // Suppress React's expected error output for this negative-path test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Consumer />)).toThrow(
      /useThemeContext must be used inside <ThemeProvider>/
    )
    spy.mockRestore()
  })

  it('returns active theme context inside <ThemeProvider>', () => {
    function Consumer() {
      const ctx = useThemeContext()
      return <span data-testid="active">{ctx.activeId}</span>
    }
    const { getByTestId } = render(
      <ThemeProvider variations={variations} forceMode="light">
        <Consumer />
      </ThemeProvider>
    )
    expect(getByTestId('active').textContent).toBe('light')
  })
})
