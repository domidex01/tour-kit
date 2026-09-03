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
// v2 §1.2 — it measures an entry's IMPORT CLOSURE, not the entry file. Once a
// package emits more than one tsup entry, `splitting: true` moves the shared
// code into a `chunk-*.js` and the entry becomes a re-export shell. Statting
// that shell reported a 6 KB *improvement* for core the day the engine subpath
// landed, while the bytes a consumer resolves went UP by 1.2 KB. Single-entry
// packages measure identically to before — their closure is the entry file —
// so every pre-existing budget keeps its meaning.
//
// The closure is summed as per-file gzip rather than gzipped once as a
// concatenation, because that is how the bytes actually travel: a server
// compresses each file it serves on its own, with no shared dictionary
// between them.
//
// Budgets = the 2026-05-23 audit's raw dist gzip measurement + ~20% headroom.
// Exceptions documented inline:
//   - core: 21 KB ceiling, measuring the closure (13.5 KB entry + 7.3 KB shared
//     chunk = 20.8 KB). NOT a relaxation of the old 20 KB: that number measured
//     a self-contained entry that no longer exists. The CLAUDE.md target is
//     <8 KB, tracked as audit B-1 — and the engine subpath did NOT move the
//     main entry toward it. B-1 is §1.4's to earn, when the hooks stop pulling
//     the whole provider.
//   - core:engine: 9 KB against a measured 8.1 KB (797 B door + the same
//     7.3 KB chunk). This is the non-React consumer's real cost; the 797-byte
//     entry file on its own would measure the plumbing, not the engine.
//   - hints, announcements, surveys, media, ai:client: re-baselined in v2 §1.2
//     WITHOUT a byte being added. All five ship a `headless` entry alongside
//     `index`, so they have been split since long before core was, and the
//     entry-file gate was reading their shell (announcements: 6 517 measured
//     against a 13 322 reality). The new numbers are the first honest ones.
//     Do not compare them to a pre-§1.2 build unless you re-measure it the
//     new way.
//
// Note: there is no `analytics:console` entry. The console plugin ships inside
// `analytics/dist/index.js` (the always-on default) — it is not a tsup entry
// point, so no standalone `dist/plugins/console.js` is emitted. Gating a file
// that is never built would always report MISSING; it is covered by the
// `analytics:main` budget instead.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

// Resolve paths relative to the repo root so the checker works regardless of cwd.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Matches a relative module specifier in built output, in every form tsup
 * emits. Minified output writes `from"./chunk-X.js"` with no space, hence the
 * `\s*`. Mirrors `packages/core/src/__tests__/_dist.ts`'s walker — duplicated
 * on purpose, because this file is plain `.mjs` in `tooling/` and cannot import
 * a TypeScript test helper. Keep the two in step.
 */
const RELATIVE_SPECIFIER = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)["'](\.[^"']*)["']/g

/**
 * Every file reachable from `entry` by following relative specifiers to
 * fixpoint. Bare specifiers (`react`, `zod`, …) are externals and are never
 * followed — they are not our bytes.
 *
 * Throws on a missing entry rather than returning an empty set: a closure of
 * nothing gzips to nothing and would pass every budget silently, which is the
 * exact failure this function exists to prevent.
 */
function closureOf(entry) {
  if (!existsSync(entry)) {
    const err = new Error(`${entry} missing — build the package first`)
    err.code = 'ENOENT'
    throw err
  }
  const seen = new Set()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()
    if (seen.has(file) || !existsSync(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    for (const [, specifier] of source.matchAll(RELATIVE_SPECIFIER)) {
      queue.push(resolve(dirname(file), specifier))
    }
  }
  return [...seen]
}

/** @type {Array<[name: string, relPath: string, budgetBytes: number]>} */
const budgets = [
  ['core', 'packages/core/dist/index.js', 21000],
  ['core:engine', 'packages/core/dist/engine/index.js', 9000],
  ['react', 'packages/react/dist/index.js', 12000],
  ['hints', 'packages/hints/dist/index.js', 6000],
  ['analytics:main', 'packages/analytics/dist/index.js', 4000],
  ['analytics:posthog', 'packages/analytics/dist/plugins/posthog.js', 1500],
  ['analytics:mixpanel', 'packages/analytics/dist/plugins/mixpanel.js', 1500],
  ['analytics:amplitude', 'packages/analytics/dist/plugins/amplitude.js', 1000],
  ['analytics:ga', 'packages/analytics/dist/plugins/google-analytics.js', 1000],
  ['adoption', 'packages/adoption/dist/index.js', 10000],
  ['checklists', 'packages/checklists/dist/index.js', 10000],
  ['announcements', 'packages/announcements/dist/index.js', 14000],
  ['surveys', 'packages/surveys/dist/index.js', 12500],
  ['media', 'packages/media/dist/index.js', 9000],
  ['ai:client', 'packages/ai/dist/index.js', 7000],
  ['ai:server', 'packages/ai/dist/server/index.js', 8000],
  ['scheduling', 'packages/scheduling/dist/index.js', 4000],
  ['license', 'packages/license/dist/index.js', 8000],
]

let fails = 0
for (const [name, relPath, budget] of budgets) {
  try {
    const files = closureOf(resolve(repoRoot, relPath))
    const gz = files.reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0)
    const over = gz > budget
    if (over) fails++
    const status = over ? '✗ OVER' : '✓'
    // Name the file count when the closure is more than the entry, so a
    // reviewer can see at a glance which rows are reading a chunk graph.
    const shape = files.length > 1 ? `  (${files.length} files)` : ''
    console.log(
      `${status.padEnd(8)} ${name.padEnd(24)} gz=${String(gz).padStart(6)}  budget=${budget}${shape}`
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
