/**
 * The scaffolding every `no-react-in-engine-dist.test.ts` repeats.
 *
 * Three packages ship an `/engine` subpath today (`analytics`, `scheduling`,
 * `hints`) and three more land in v3 Phases 2–3. Their guards were
 * copy-and-edit descendants of one another, ~700 lines of shared boilerplate
 * with the real per-package content — the forbidden list, the control list, the
 * source-walk rule — buried inside it.
 *
 * This file holds only what is genuinely identical, and deliberately NOT a
 * `describeEngineGuard(config)` case factory: the cases differ per package in
 * ways that are the point (scheduling's engine may name NO bare specifier;
 * hints' names exactly one), and a factory with eight config flags would hide
 * that behind a mechanism. Each package keeps its own readable `describe`; the
 * plumbing lives here.
 *
 * The one discipline this exists to propagate:
 *
 *   **Scan the import CLOSURE, never the entry.**
 *
 * Under `splitting: true` a built entry is a re-export shell of a couple of
 * hundred bytes and the code sits in `chunk-*.js` beside it, so a scan of the
 * entry passes forever no matter what the package imports. Demonstrated in v3
 * Phase 1: with a guard reading the entry, exporting the React provider from
 * the engine barrel left "the engine names no React-side specifier" GREEN.
 *
 * `analytics` and `scheduling` build with `splitting: false` today, so reading
 * their entry happens to be equivalent — but that is a property of their tsup
 * config, which is asserted nowhere. `assertClosureIsNotTheShell` closes that:
 * it is cheap for an unsplit package and it is the only thing standing between
 * a future `splitting: true` and a silently vacuous guard.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { RELATIVE_SPECIFIER, closureOf } from './closure.mjs'

/** Read a built file as UTF-8. */
export const read = (p) => readFileSync(p, 'utf8')

/**
 * The four built files an `/engine` subpath must emit, plus the sibling main
 * entry every guard uses as its positive control.
 */
export function enginePaths(pkgRoot) {
  const dist = join(pkgRoot, 'dist')
  return {
    dist,
    engineJs: join(dist, 'engine', 'index.js'),
    engineCjs: join(dist, 'engine', 'index.cjs'),
    engineDts: join(dist, 'engine', 'index.d.ts'),
    engineDcts: join(dist, 'engine', 'index.d.cts'),
    mainJs: join(dist, 'index.js'),
    mainCjs: join(dist, 'index.cjs'),
    mainDts: join(dist, 'index.d.ts'),
  }
}

/**
 * Gate on the `dist` DIRECTORY, never a filename: gating on a file turns a typo
 * into a silent skip (measured in v2 §1.5 — "3 skipped", green, proving
 * nothing).
 */
export const distExists = (pkgRoot) => existsSync(join(pkgRoot, 'dist'))

/**
 * The four built engine files exist. Every scan below a missing file would be
 * vacuous, so this runs first in each guard.
 */
export function assertEngineFilesExist(expect, paths) {
  for (const f of [paths.engineJs, paths.engineCjs, paths.engineDts, paths.engineDcts]) {
    expect(existsSync(f), `${f} missing — every scan below would be vacuous`).toBe(true)
  }
}

/**
 * The source of every specifier scan: the entry PLUS every chunk it imports,
 * concatenated. `closureOf` maps `.js -> .d.ts` / `.cjs -> .d.cts` and tries
 * the literal path first, so for declarations this over-includes — a superset
 * scan, stronger than the declaration chain alone.
 */
export const closureSrc = (entry) => closureOf(entry).map(read).join('\n')

/**
 * Assert a closure is bigger than a re-export shell could be.
 *
 * The BYTE floor is the load-bearing half. File count discriminates almost
 * nothing: shell-plus-one-chunk is exactly what a correct split build looks
 * like, and an unsplit entry is legitimately one file. What this catches is a
 * walker that followed nothing and is reading ~200 bytes of re-export.
 */
export function assertClosureIsNotTheShell(expect, entry, minBytes = 2000) {
  const files = closureOf(entry)
  const bytes = files.reduce((n, f) => n + readFileSync(f).length, 0)
  expect(
    bytes,
    `expected the closure of ${entry} to exceed ${minBytes} raw bytes — got ${bytes}; closureOf followed nothing and is reading the re-export shell`
  ).toBeGreaterThan(minBytes)
}

/**
 * Every source file reachable from `entry` through relative imports, to
 * fixpoint. `.ts` first, then `/index.ts`, then `.tsx` — a `.tsx` leaking in is
 * caught by the caller's assertions rather than by failing to resolve.
 *
 * `RELATIVE_SPECIFIER` is a module-level /g regex: `matchAll` only, never
 * `.test`, which would carry `lastIndex` between calls.
 */
export function reachableFrom(entry) {
  const seen = new Set()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)
    for (const [, spec] of read(file).matchAll(RELATIVE_SPECIFIER)) {
      const base = resolve(dirname(file), spec)
      const next = [`${base}.ts`, join(base, 'index.ts'), `${base}.tsx`].find(existsSync)
      if (!next) throw new Error(`${file}: cannot resolve ${spec}`)
      queue.push(next)
    }
  }
  return [...seen]
}

/**
 * Every path the `./engine` exports block names exists on disk.
 *
 * The `types` condition is never exercised by an `import()`, so a `.d.mts`
 * typo, a dropped `./`, or a `.d.ts`/`.d.cts` swap is invisible to every other
 * case and breaks a consumer's typecheck rather than their build.
 */
export function assertEngineExportsResolve(expect, pkgRoot) {
  const pkg = JSON.parse(read(join(pkgRoot, 'package.json')))
  const block = pkg.exports?.['./engine']
  expect(block, 'package.json has no "./engine" exports key').toBeDefined()

  const paths = [
    block.import?.types,
    block.import?.default,
    block.require?.types,
    block.require?.default,
  ]
  expect(paths.filter(Boolean)).toHaveLength(4)
  for (const rel of paths) {
    expect(rel.startsWith('./'), `${rel} is not a relative exports target`).toBe(true)
    expect(existsSync(join(pkgRoot, rel)), `${rel} does not exist on disk`).toBe(true)
  }
}

/** Does the file begin with a `'use client'` directive? */
export const startsWithClientDirective = (p) => /^['"]use client['"];?/.test(read(p))

/**
 * The engine entry is never listed in tsup's `injectUseClient(...)` call.
 *
 * The source half of the `'use client'` byte assertion: adding the engine entry
 * to that list is a one-word change, and the built-bytes case only catches it
 * after a rebuild.
 */
export function assertEngineNotInInjectUseClient(expect, pkgRoot) {
  const config = read(join(pkgRoot, 'tsup.config.ts'))
  const call = config.match(/injectUseClient\(\[([^\]]*)\]\)/)
  expect(call, 'injectUseClient call not found in tsup.config.ts').not.toBeNull()
  expect(call?.[1]).not.toMatch(/engine/)
}
