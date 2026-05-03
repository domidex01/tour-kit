import { act, fireEvent, render, screen } from '@testing-library/react'
import { Profiler, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../components/theme/theme-provider'
import type { ThemeVariation } from '../../components/theme/types'
import { mockMatchMedia } from './_helpers'

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
    mockMatchMedia()
  })

  it('flipping t42 changes the theme and stays within ≤ 2 ThemeProvider renders', () => {
    let count = 0
    const onRender = () => {
      count++
    }
    const { container } = render(
      <Profiler id="theme" onRender={onRender}>
        <Stress />
      </Profiler>
    )
    // Predicate is false at mount (t42 === false) → resolver falls through to system → 'light'.
    expect(container.querySelector('[data-tk-theme="light"]')).not.toBeNull()
    // Reset after mount; we measure only the cost of one trait flip,
    // matching the Phase 0 spike 0.3 budget contract.
    count = 0
    act(() => {
      fireEvent.click(screen.getByText('flip'))
    })
    // Predicate now matches → resolver returns 'dark'. Both ends of the
    // assertion matter: a broken predicate would leave the theme on 'light'
    // AND lower the render count below 1, so we check both.
    expect(container.querySelector('[data-tk-theme="dark"]')).not.toBeNull()
    expect(count).toBeGreaterThanOrEqual(1)
    expect(count).toBeLessThanOrEqual(2)
  })
})
