import { act, fireEvent, render, screen } from '@testing-library/react'
import { Profiler, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../components/theme/theme-provider'
import type { ThemeVariation } from '../../components/theme/types'

const TRAITS = Object.fromEntries(
  Array.from({ length: 100 }, (_, i) => [`t${i}`, false])
) as Record<string, boolean>

const variations: ThemeVariation[] = [
  {
    id: 'dark',
    when: {
      kind: 'predicate',
      fn: (t) => (t as Record<string, boolean>).t42 === true,
    },
    theme: {},
  },
  { id: 'light', when: { kind: 'system' }, theme: {} },
]

function Stress() {
  const [t, setT] = useState(TRAITS)
  return (
    <>
      <ThemeProvider traits={t} variations={variations}>
        <div data-testid="root" />
      </ThemeProvider>
      <button type="button" onClick={() => setT((p) => ({ ...p, t42: !p.t42 }))}>
        flip
      </button>
    </>
  )
}

describe('100-trait stress (Phase 1.4b US-3)', () => {
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

  it('flipping t42 stays within ≤ 2 ThemeProvider renders', () => {
    let count = 0
    const onRender = () => {
      count++
    }
    render(
      <Profiler id="theme" onRender={onRender}>
        <Stress />
      </Profiler>
    )
    // Reset after mount; we measure only the cost of one trait flip,
    // matching the Phase 0 spike 0.3 budget contract.
    count = 0
    act(() => {
      fireEvent.click(screen.getByText('flip'))
    })
    expect(count).toBeLessThanOrEqual(2)
  })
})
