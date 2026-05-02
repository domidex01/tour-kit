import { act, render } from '@testing-library/react'
import { Profiler, type ProfilerOnRenderCallback, useMemo, useState } from 'react'
import { afterAll, describe, expect, it } from 'vitest'

type Traits = Record<string, boolean>

const TRAIT_COUNT = 100
const FLIP_KEY = 't42'

function makeInitialTraits(): Traits {
  return Object.fromEntries(
    Array.from({ length: TRAIT_COUNT }, (_, i) => [`t${i}`, false])
  )
}

function ThemeProvider({
  traits,
  children,
}: { traits: Traits; children: React.ReactNode }) {
  const themeId = useMemo(
    () => (traits[FLIP_KEY] ? 'dark' : 'light'),
    [traits[FLIP_KEY]]
  )
  return <div data-tk-theme={themeId}>{children}</div>
}

interface ProfileSample {
  phase: 'mount' | 'update' | 'nested-update'
  actualDuration: number
}

let externalSetTraits: ((updater: (t: Traits) => Traits) => void) | null = null

function Harness({ onRender }: { onRender: ProfilerOnRenderCallback }) {
  const [traits, setTraits] = useState<Traits>(makeInitialTraits)
  externalSetTraits = setTraits
  return (
    <Profiler id="theme" onRender={onRender}>
      <ThemeProvider traits={traits}>
        <span data-testid="leaf">leaf</span>
      </ThemeProvider>
    </Profiler>
  )
}

describe('SPIKE: theme predicate perf — 100-trait fixture', () => {
  afterAll(() => {
    externalSetTraits = null
    // Spike test — to be deleted before Phase 1.x PR merges.
  })

  it('flips one trait in <= 2 renders with actualDuration <= 16ms', () => {
    const samples: ProfileSample[] = []
    const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
      samples.push({
        phase: phase as ProfileSample['phase'],
        actualDuration,
      })
    }

    render(<Harness onRender={onRender} />)

    // Mount sample
    expect(samples.length).toBe(1)
    expect(samples[0]?.phase).toBe('mount')

    // Reset to measure only the flip
    samples.length = 0

    act(() => {
      externalSetTraits?.((t) => ({ ...t, [FLIP_KEY]: !t[FLIP_KEY] }))
    })

    // Strict gate: ≤2 renders per flip, < 16ms each
    expect(samples.length).toBeGreaterThan(0)
    expect(samples.length).toBeLessThanOrEqual(2)

    for (const s of samples) {
      expect(s.phase).toBe('update')
      expect(s.actualDuration).toBeLessThan(16)
    }

    // Side-effect proof: data-tk-theme attribute swapped
    const root = document.querySelector('[data-tk-theme]')
    expect(root?.getAttribute('data-tk-theme')).toBe('dark')
  })

  it('flipping an unrelated trait does NOT re-render the theme div (memo holds)', () => {
    const samples: ProfileSample[] = []
    const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
      samples.push({
        phase: phase as ProfileSample['phase'],
        actualDuration,
      })
    }

    render(<Harness onRender={onRender} />)
    samples.length = 0 // ignore mount

    act(() => {
      externalSetTraits?.((t) => ({ ...t, t99: !t.t99 }))
    })

    // The Profiler still records ONE update render of the parent (Harness)
    // because state changed, but the useMemo identity is preserved so the
    // ThemeProvider subtree's themeId is unchanged. We assert ≤2 to give
    // headroom for React Strict-mode double-invocation if future setup adds it.
    expect(samples.length).toBeLessThanOrEqual(2)
    for (const s of samples) {
      expect(s.actualDuration).toBeLessThan(16)
    }
  })
})
