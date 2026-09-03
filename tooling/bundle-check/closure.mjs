/**
 * The canonical import-closure walker.
 *
 * One copy, imported by both the merge gate (`check-dist-gzip.mjs`) and the
 * bundle-hygiene tests (`packages/core/src/__tests__/_dist.ts`). It used to be
 * two copies with a "keep the two in step" comment, which is not an enforcement
 * mechanism — they drifted into sharing a defect (see SPECIFIER_PREFIX below).
 *
 * This file is `.mjs` rather than `.ts` on purpose: `check-dist-gzip.mjs` runs
 * under bare `node` with no build step, so the shared module has to be plain
 * ESM. Vitest imports it from a `.ts` test without ceremony.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * The ways built output introduces a module specifier:
 *
 *   from'./x.js'        `import … from` / `export … from` (minified: no space)
 *   import'./x.js'      side-effect-only import — NO `from`, NO parens
 *   import('./x.js')    dynamic import
 *   require('./x.cjs')  CJS
 *
 * The `\(?` is load-bearing. Without it the side-effect form is invisible, and
 * esbuild emits that form today — `packages/announcements/dist/index.js` and 14
 * other built files carry `import'./chunk-2YXXFGBV.js'`. Those chunks currently
 * happen to be reachable through a second, `from`-shaped edge, so the totals
 * were right by luck; a side-effect-only chunk that nothing re-exports from
 * would have been dropped from the closure silently. That is the exact class of
 * under-count this walker exists to prevent.
 */
export const SPECIFIER_PREFIX = String.raw`(?:from\s*|import\s*\(?\s*|require\s*\(\s*)`

/** Relative specifiers — the edges of the closure. Bare ones are externals. */
export const RELATIVE_SPECIFIER = new RegExp(`${SPECIFIER_PREFIX}["'](\\.[^"']*)["']`, 'g')

/**
 * Matches one package as a MODULE SPECIFIER — `from "react"`,
 * `require("react")`, `import("react/jsx-runtime")` — never a minified
 * identifier or the word in a comment. `react` does not match `"react-dom"`:
 * the char after the name must be `/` or the closing quote.
 */
export function specifierPattern(pkg) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${SPECIFIER_PREFIX}["']${escaped}(/[^"']*)?["']`)
}

/**
 * tsup writes `.js` specifiers inside emitted `.d.ts` files even though the
 * chunk on disk is `config-XXX.d.ts`. Follow the declaration graph by trying the
 * declaration twin when the literal path is absent. Returns null for a
 * specifier that resolves to nothing (a bare external never reaches here).
 */
function resolveEmitted(path) {
  const candidates = [path]
  if (path.endsWith('.js')) candidates.push(path.replace(/\.js$/, '.d.ts'))
  if (path.endsWith('.cjs')) candidates.push(path.replace(/\.cjs$/, '.d.cts'))
  return candidates.find((c) => existsSync(c)) ?? null
}

/**
 * Every file reachable from `entry` by following relative specifiers to
 * fixpoint, entry first. Externals are bare specifiers and are never followed —
 * they are not our bytes, and a leak scan wants them left in the source.
 *
 * Throws on a missing entry rather than returning an empty closure: nothing
 * gzips to nothing and passes every budget, and an empty source passes every
 * "does X leak in?" assertion vacuously.
 *
 * @param {string} entry
 * @returns {string[]}
 */
export function closureOf(entry) {
  const root = resolveEmitted(resolve(entry))
  if (root === null) {
    const error = new Error(`${entry} missing — build the package first`)
    error.code = 'ENOENT'
    throw error
  }

  const seen = new Set()
  const queue = [root]

  while (queue.length > 0) {
    const file = resolveEmitted(queue.shift())
    if (file === null || seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    for (const [, specifier] of source.matchAll(RELATIVE_SPECIFIER)) {
      queue.push(resolve(dirname(file), specifier))
    }
  }

  return [...seen]
}
