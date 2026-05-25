#!/usr/bin/env node
// Raw dist-gzip bundle-size gate — the BINDING merge gate for Sprint 1 (audit F-2).
//
// Measures each published package's shipped `dist/*.js` in the same unit the
// audit + Sprint-1 acceptance gates speak in:
//
//     gzip -c packages/<pkg>/dist/index.js | wc -c
//
// so an audit number == a gate number, no calibration. This is intentionally
// NOT the same metric as `size-limit` (which bundles deps + brotli, ~2× these
// numbers). size-limit is the secondary smoke signal; THIS checker is what
// blocks a merge.
//
// Budgets = the 2026-05-23 audit's raw dist gzip measurement + ~20% headroom.
// Exceptions documented inline:
//   - core: 20 KB temporary ceiling (currently ~19 KB gz). The CLAUDE.md target
//     is <8 KB, tracked as audit B-1 / Sprint 2. An 8 KB gate today would block
//     every PR, so the gate sits at 20 KB until subpath extraction lands.
//
// Note: there is no `analytics:console` entry. The console plugin ships inside
// `analytics/dist/index.js` (the always-on default) — it is not a tsup entry
// point, so no standalone `dist/plugins/console.js` is emitted. Gating a file
// that is never built would always report MISSING; it is covered by the
// `analytics:main` budget instead.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

// Resolve paths relative to the repo root so the checker works regardless of cwd.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** @type {Array<[name: string, relPath: string, budgetBytes: number]>} */
const budgets = [
  ['core', 'packages/core/dist/index.js', 20000],
  ['react', 'packages/react/dist/index.js', 12000],
  ['hints', 'packages/hints/dist/index.js', 5120],
  ['analytics:main', 'packages/analytics/dist/index.js', 4000],
  ['analytics:posthog', 'packages/analytics/dist/plugins/posthog.js', 1500],
  ['analytics:mixpanel', 'packages/analytics/dist/plugins/mixpanel.js', 1500],
  ['analytics:amplitude', 'packages/analytics/dist/plugins/amplitude.js', 1000],
  ['analytics:ga', 'packages/analytics/dist/plugins/google-analytics.js', 1000],
  ['adoption', 'packages/adoption/dist/index.js', 10000],
  ['checklists', 'packages/checklists/dist/index.js', 10000],
  ['announcements', 'packages/announcements/dist/index.js', 8000],
  ['surveys', 'packages/surveys/dist/index.js', 8000],
  ['media', 'packages/media/dist/index.js', 6000],
  ['ai:client', 'packages/ai/dist/index.js', 5000],
  ['ai:server', 'packages/ai/dist/server/index.js', 8000],
  ['scheduling', 'packages/scheduling/dist/index.js', 4000],
  ['license', 'packages/license/dist/index.js', 8000],
]

let fails = 0
for (const [name, relPath, budget] of budgets) {
  try {
    const gz = gzipSync(readFileSync(resolve(repoRoot, relPath))).length
    const over = gz > budget
    if (over) fails++
    const status = over ? '✗ OVER' : '✓'
    console.log(
      `${status.padEnd(8)} ${name.padEnd(24)} gz=${String(gz).padStart(6)}  budget=${budget}`
    )
  } catch (e) {
    console.log(`?        ${name.padEnd(24)} MISSING (${e.code ?? e.message})`)
    fails++
  }
}

if (fails > 0) {
  console.error(`\nBundle-size gate FAILED: ${fails} package(s) over budget or missing.`)
  console.error(
    'Build packages first (pnpm build:packages), or fix the regression / bump the budget with justification.'
  )
}
process.exit(fails === 0 ? 0 : 1)
