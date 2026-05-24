import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as adoption from '../index'

// Regression: AdoptionFunnel is defined in
// `src/components/dashboard/adoption-funnel.tsx` and re-exported from the
// dashboard barrel, but it was omitted from the main entry's value re-export
// block. Consumers importing `import { AdoptionFunnel } from '@tour-kit/adoption'`
// got undefined at runtime — only the type made it through.
//
// This file asserts every dashboard component the package ships is reachable
// from the main entry at both the source and built-artifact layer.

const DASHBOARD_VALUE_EXPORTS = [
  'AdoptionDashboard',
  'AdoptionStatCard',
  'AdoptionStatsGrid',
  'AdoptionTable',
  'AdoptionCategoryChart',
  'AdoptionStatusBadge',
  'AdoptionFilters',
  'AdoptionFunnel',
] as const

describe('@tour-kit/adoption main entry — dashboard components', () => {
  it.each(DASHBOARD_VALUE_EXPORTS)('re-exports %s as a renderable value', (name) => {
    const value = (adoption as Record<string, unknown>)[name]
    expect(value, `${name} is undefined — not re-exported from main entry`).toBeDefined()
    // Components are React.forwardRef wrappers (objects) or plain functions —
    // accept either, just reject `undefined`/primitives.
    const t = typeof value
    expect(t === 'function' || t === 'object', `${name} is ${t}, not a component`).toBe(true)
  })
})

const __here = dirname(fileURLToPath(import.meta.url))
const DIST_DTS = join(__here, '..', '..', 'dist', 'index.d.ts')
const DIST_DTS_CTS = join(__here, '..', '..', 'dist', 'index.d.cts')

describe('@tour-kit/adoption dist artifact — dashboard components', () => {
  it.skipIf(!existsSync(DIST_DTS))('index.d.ts declares every dashboard component name', () => {
    const dts = readFileSync(DIST_DTS, 'utf8')
    for (const name of DASHBOARD_VALUE_EXPORTS) {
      expect(dts, `${name} missing from index.d.ts`).toMatch(new RegExp(`\\b${name}\\b`))
    }
  })

  it.skipIf(!existsSync(DIST_DTS_CTS))(
    'index.d.cts declares every dashboard component name (CJS consumers)',
    () => {
      const dts = readFileSync(DIST_DTS_CTS, 'utf8')
      for (const name of DASHBOARD_VALUE_EXPORTS) {
        expect(dts, `${name} missing from index.d.cts`).toMatch(new RegExp(`\\b${name}\\b`))
      }
    }
  )
})
