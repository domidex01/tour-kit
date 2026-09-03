/**
 * Shared `dist/` path helpers for build-dependent tests (bundle hygiene,
 * subpath resolution). Tests that import this file MUST guard with
 * `distExists()` and `it.skip(...)` so local-dev test runs don't fail
 * before the package has been built.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { closureOf } from '../../../../tooling/bundle-check/closure.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PKG_ROOT = join(__dirname, '..', '..')

export const MAIN_MJS = join(PKG_ROOT, 'dist', 'index.js')
export const MAIN_CJS = join(PKG_ROOT, 'dist', 'index.cjs')
export const MAIN_DTS = join(PKG_ROOT, 'dist', 'index.d.ts')
export const SCHEMAS_MJS = join(PKG_ROOT, 'dist', 'schemas', 'index.js')
export const SCHEMAS_CJS = join(PKG_ROOT, 'dist', 'schemas', 'index.cjs')

// v2 §1.2 — the `@tour-kit/core/engine` subpath. Note these are FILE paths:
// tsup's `clean: true` leaves an empty `dist/engine/` directory behind once the
// entry is removed, so a directory check would pass on a build that emits
// nothing.
export const ENGINE_MJS = join(PKG_ROOT, 'dist', 'engine', 'index.js')
export const ENGINE_CJS = join(PKG_ROOT, 'dist', 'engine', 'index.cjs')
export const ENGINE_DTS = join(PKG_ROOT, 'dist', 'engine', 'index.d.ts')
export const ENGINE_DCTS = join(PKG_ROOT, 'dist', 'engine', 'index.d.cts')

/**
 * Is the package built at all? Guards `it.skipIf` on a fresh clone.
 *
 * Deliberately does NOT cover `dist/engine/*` even though that is a published
 * entry: the §1.2 guards must go RED on a built package that lacks the engine
 * door, and a wider `distExists()` would turn every one of those REDs into a
 * silent skip.
 */
export function distExists(): boolean {
  return existsSync(MAIN_MJS) && existsSync(SCHEMAS_MJS) && existsSync(SCHEMAS_CJS)
}

export interface Closure {
  /** Every file reached, entry first. */
  files: string[]
  /** Their sources concatenated — what a "does X leak in?" scan must read. */
  source: string
}

/**
 * Follow relative imports out of a built entry to fixpoint and return the
 * union. `splitting: true` moves shared code into `chunk-*.js`, so scanning an
 * entry file alone proves nothing: `dist/engine/index.js` is a ~800-byte
 * re-export shell that would pass a `react` grep forever, even the day a React
 * import lands in the chunk beside it.
 *
 * The walk itself lives in `tooling/bundle-check/closure.mjs` — the same module
 * the merge gate runs, so the gate and these scans cannot disagree about what a
 * closure is. It throws on a missing entry; an empty closure would pass every
 * assertion below vacuously.
 *
 * Externals (`react`, `zod`, …) are bare specifiers and are never followed —
 * they stay in `source` for the scan to find, which is the point.
 */
export function readClosure(entry: string): Closure {
  const files = closureOf(entry)
  return { files, source: files.map((f) => readFileSync(f, 'utf8')).join('\n') }
}
