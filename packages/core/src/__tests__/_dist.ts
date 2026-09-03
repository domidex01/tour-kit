/**
 * Shared `dist/` path helpers for build-dependent tests (bundle hygiene,
 * subpath resolution). Tests that import this file MUST guard with
 * `distExists()` and `it.skip(...)` so local-dev test runs don't fail
 * before the package has been built.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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

/**
 * Matches a relative module specifier in built output, in every form tsup
 * emits: `from"./chunk-X.js"`, `require("./chunk-X.cjs")`, `import("./x.js")`
 * and the `export … from` variant. Minified output drops the space after
 * `from`, hence `\s*`.
 */
const RELATIVE_SPECIFIER = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)["'](\.[^"']*)["']/g

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
 * Externals (`react`, `zod`, …) are bare specifiers and are never followed —
 * they stay in `source` for the scan to find, which is the point.
 */
/**
 * tsup writes `.js` specifiers inside emitted `.d.ts` files even though the
 * chunk on disk is `config-XXX.d.ts`. Follow the declaration graph by trying
 * the declaration twin when the literal path is absent; returns null for a
 * specifier that resolves to nothing (a bare external never reaches here).
 */
function resolveEmitted(path: string): string | null {
  const candidates = [path]
  if (path.endsWith('.js')) candidates.push(path.replace(/\.js$/, '.d.ts'))
  if (path.endsWith('.cjs')) candidates.push(path.replace(/\.cjs$/, '.d.cts'))
  return candidates.find((c) => existsSync(c)) ?? null
}

export function readClosure(entry: string): Closure {
  // Throw rather than return an empty closure: a scan of a file that was never
  // emitted passes every "does X leak in?" assertion vacuously, which is the
  // exact failure this helper exists to prevent.
  if (resolveEmitted(resolve(entry)) === null) {
    throw new Error(`Run \`pnpm --filter @tour-kit/core build\` first — ${entry} missing.`)
  }

  const seen = new Set<string>()
  const sources: string[] = []
  const queue = [resolve(entry)]

  while (queue.length > 0) {
    const file = resolveEmitted(queue.shift() as string)
    if (file === null || seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    sources.push(source)
    for (const [, specifier] of source.matchAll(RELATIVE_SPECIFIER)) {
      queue.push(resolve(dirname(file), specifier))
    }
  }

  return { files: [...seen], source: sources.join('\n') }
}
