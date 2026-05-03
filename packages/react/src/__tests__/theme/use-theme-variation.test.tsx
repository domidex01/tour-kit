import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../components/theme/theme-provider'
import type { ThemeVariation } from '../../components/theme/types'
import { type UseThemeVariationReturn, useThemeVariation } from '../../hooks/use-theme-variation'

const variations: ThemeVariation[] = [
  { id: 'system', when: { kind: 'system' }, theme: { '--tour-card-bg': '#fff' } },
]

let captured: UseThemeVariationReturn[] = []

// Capture during render so every re-execution of the component records the
// hook's return reference. Pushing in useEffect would miss renders that React
// elides via element-identity bailout when rerender(...) is passed the same JSX.
function Capture() {
  captured.push(useThemeVariation())
  return null
}

describe('useThemeVariation (Phase 1.4b US-2)', () => {
  beforeEach(() => {
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
    captured = []
  })

  function lastCaptured(): UseThemeVariationReturn {
    const last = captured[captured.length - 1]
    if (!last) throw new Error('expected at least one captured render')
    return last
  }

  it('returns the active variation', () => {
    render(
      <ThemeProvider variations={variations}>
        <Capture />
      </ThemeProvider>
    )
    expect(captured.length).toBeGreaterThan(0)
    const last = lastCaptured()
    expect(last.activeId).toBe('system')
    expect(last.tokens).toEqual({ '--tour-card-bg': '#fff' })
  })

  it('reference is stable across 5 unrelated re-renders', () => {
    const result = render(
      <ThemeProvider variations={variations}>
        <Capture />
      </ThemeProvider>
    )
    // Drop mount captures — the resolver effect commits a fresh value once
    // after the first render, so we only compare references after settle.
    const settled = lastCaptured()
    captured = []
    for (let i = 0; i < 5; i++) {
      result.rerender(
        <ThemeProvider variations={variations}>
          <Capture />
        </ThemeProvider>
      )
    }
    expect(captured.length).toBeGreaterThanOrEqual(5)
    expect(captured.every((v) => Object.is(v, settled))).toBe(true)
  })

  it('reference changes when activeId flips (forceMode swap)', () => {
    // Use light + dark explicit variations so findExplicit picks light first
    // by declaration order; forceMode="dark" then flips the active id.
    const fullVariations: ThemeVariation[] = [
      { id: 'lightVar', when: { kind: 'light' }, theme: {} },
      { id: 'darkVar', when: { kind: 'dark' }, theme: {} },
    ]
    const result = render(
      <ThemeProvider variations={fullVariations}>
        <Capture />
      </ThemeProvider>
    )
    const before = lastCaptured()
    expect(before.activeId).toBe('lightVar')
    captured = []
    result.rerender(
      <ThemeProvider variations={fullVariations} forceMode="dark">
        <Capture />
      </ThemeProvider>
    )
    const [firstDark] = captured.filter((v) => v.activeId === 'darkVar')
    expect(firstDark).toBeDefined()
    expect(Object.is(firstDark, before)).toBe(false)
  })
})
