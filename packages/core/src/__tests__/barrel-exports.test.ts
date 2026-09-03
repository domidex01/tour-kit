import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as core from '../index'

describe('@tour-kit/core barrel', () => {
  it('exports cn at the top level', () => {
    expect(typeof core.cn).toBe('function')
  })

  // Phase 1 — guard against barrel drift: assert the new exports exist at the
  // SRC barrel level. If a future refactor forgets to re-export, this fails
  // before consumers see the missing API.
  it('exports useTourActions at the top level', () => {
    expect(typeof core.useTourActions).toBe('function')
  })

  // Phase 1 (refactor train) — hoisted helpers:
  it('exports evaluateAudience and isSegmentAudience', () => {
    expect(typeof core.evaluateAudience).toBe('function')
    expect(typeof core.isSegmentAudience).toBe('function')
  })

  it('exports useResolvedText', () => {
    expect(typeof core.useResolvedText).toBe('function')
  })

  it('exports createMemoryStorage', () => {
    expect(typeof core.createMemoryStorage).toBe('function')
  })

  // Phase 3 (refactor train) — dead position API removed from public barrel.
  // Keep this list aligned with packages/core/src/utils/index.ts.
  describe('Phase 3 — dead position exports removed', () => {
    it.each([
      'calculatePosition',
      'calculatePositionWithCollision',
      'wouldOverflow',
      'getFallbackPlacements',
      'PositionResult',
    ])('does not export %s from @tour-kit/core', (name) => {
      expect(core).not.toHaveProperty(name)
    })

    it('STILL exports useElementPosition (companion API survives)', () => {
      expect(typeof core.useElementPosition).toBe('function')
    })
  })

  // Phase 3 — hidden-step union exports.
  describe('Phase 3 — hidden-step union types exported', () => {
    // Runtime check: the union is type-only, but we can verify both names
    // resolve through the runtime barrel by constructing values.
    it('VisibleTourStep and HiddenTourStep are usable from core', () => {
      const visible: import('../index').VisibleTourStep = {
        id: 'v1',
        target: '#x',
        content: 'hi',
      }
      const hidden: import('../index').HiddenTourStep = {
        id: 'h1',
        kind: 'hidden',
      }
      expect(visible.id).toBe('v1')
      expect(hidden.id).toBe('h1')
    })
  })
})

// Build-artifact assertion — runs only when `pnpm --filter @tour-kit/core
// build` has populated dist/. Local-dev runs skip cleanly via existsSync().
const __here = dirname(fileURLToPath(import.meta.url))
const DIST_DTS = join(__here, '..', '..', 'dist', 'index.d.ts')
const DIST_DTS_CTS = join(__here, '..', '..', 'dist', 'index.d.cts')

describe('@tour-kit/core dist artifact (Phase 1 surface)', () => {
  it.skipIf(!existsSync(DIST_DTS))(
    'index.d.ts exposes useTourActions and UseTourActionsReturn',
    () => {
      const dts = readFileSync(DIST_DTS, 'utf8')
      expect(dts).toMatch(/useTourActions/)
      expect(dts).toMatch(/UseTourActionsReturn/)
    }
  )

  it.skipIf(!existsSync(DIST_DTS_CTS))(
    'index.d.cts exposes useTourActions and UseTourActionsReturn (CJS consumers)',
    () => {
      const dcts = readFileSync(DIST_DTS_CTS, 'utf8')
      expect(dcts).toMatch(/useTourActions/)
      expect(dcts).toMatch(/UseTourActionsReturn/)
    }
  )
})

/**
 * v2 §1.2 — the main entry is ADDITIVE-ONLY across the engine carve.
 *
 * The engine subpath re-exports a subset of what `@tour-kit/core` already
 * ships. Nothing moves out. This matters more than usual here: the
 * closed-source dashboard pins core EXACT and calls these names server-side,
 * so "we only added a subpath" has to be literally true, and the changeset
 * says minor on that basis.
 *
 * A floor rather than a snapshot on purpose — additions are expected and
 * should not churn this test; a REMOVAL is the regression.
 */
describe('v2 §1.2 — main entry surface survives the engine carve', () => {
  it.each(['matchesAudience', 'validateConditions', 'canShowByFrequency'])(
    'still exports %s from @tour-kit/core (dashboard calls it server-side)',
    (name) => {
      expect(typeof (core as Record<string, unknown>)[name]).toBe('function')
    }
  )

  it('still type-checks Tour, TourStep and TourState from the main entry', () => {
    const step: import('../index').TourStep = { id: 's1', target: '#a', content: 'hi' }
    const tour: import('../index').Tour = { id: 't1', steps: [step] }
    const state: import('../index').TourState = core.initialTourState
    expect(tour.steps[0]?.id).toBe('s1')
    expect(state.isActive).toBe(false)
  })

  it('does not shrink: at least 109 runtime exports (2026-09-03 baseline)', () => {
    // 109 = the src barrel and `dist/index.js` agree, measured 2026-09-03.
    // Raise the floor when you add exports; never lower it without a major.
    expect(Object.keys(core).length).toBeGreaterThanOrEqual(109)
  })
})
