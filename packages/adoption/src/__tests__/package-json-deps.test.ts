import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards Phase 0's "native CSS, no chart peer" decision.
 *
 * If a future refactor accidentally pulls in `recharts` (or similar), this
 * fails before the package can ship a fat bundle.
 */
describe('package.json — peerDependencies hygiene', () => {
  const pkgPath = resolve(__dirname, '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    peerDependencies?: Record<string, string>
  }

  const FORBIDDEN_CHART_DEPS = [
    'recharts',
    'd3',
    'd3-shape',
    'd3-scale',
    'victory',
    'chart.js',
    'react-chartjs-2',
    'nivo',
    '@nivo/core',
    'visx',
    '@visx/visx',
  ] as const

  it.each(FORBIDDEN_CHART_DEPS)(
    'has no `%s` in peerDependencies (Phase 0 decision: native CSS)',
    (dep) => {
      const peers = pkg.peerDependencies ?? {}
      expect(peers).not.toHaveProperty(dep)
    }
  )

  it('peerDependencies match the locked Phase 4 snapshot', () => {
    // Snapshot of the legal peers as of Phase 4 — Phase 0 chart decision locked
    // these. Adding a new peer requires an explicit code change + decision log.
    const expected = new Set([
      '@tour-kit/analytics',
      'react',
      'react-dom',
      'tailwindcss',
      '@mui/base',
    ])
    const actual = new Set(Object.keys(pkg.peerDependencies ?? {}))
    expect(actual).toEqual(expected)
  })
})
