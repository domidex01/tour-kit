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
