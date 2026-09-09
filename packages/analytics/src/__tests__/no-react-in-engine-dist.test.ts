/**
 * v3 Phase 0 — `@tour-kit/analytics/engine` ships no React.
 *
 * US-1: a Vue/Svelte/Node developer tracks tour events with React not
 * installed. That is a property of the BYTES tsup emitted, so every case here
 * reads a real built file — nothing is faked, stubbed or mocked.
 *
 * The two anti-vacuity devices are not decoration:
 *   - Case 1 asserts the four engine files exist. A wrong path makes every
 *     negative assertion below pass forever.
 *   - Case 2 is a POSITIVE CONTROL over the sibling main entry, which
 *     legitimately names React and the licence gate. If it stops tripping,
 *     either the matcher broke or the package changed shape — both deserve a
 *     red, and without it a broken regex is green forever.
 *
 * `splitting: false` in this package, so the built entry IS its own closure —
 * no walk needed for the JS. The declarations are different: rollup-plugin-dts
 * chunks shared types regardless, under a content-hashed name that changes on
 * every rebuild, so the d.ts scan walks with `closureOf` and never spells the
 * hash.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  RELATIVE_SPECIFIER,
  SPECIFIER_PREFIX,
  closureOf,
  specifierPattern,
} from '../../../../tooling/bundle-check/closure.mjs'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = join(PKG_ROOT, 'dist')
// The DIRECTORY, not the files: gating on a filename turns a typo into a
// silent skip (measured in v2 §1.5 — "3 skipped", green, proving nothing).
const distExists = () => existsSync(DIST)

const ENGINE_JS = join(DIST, 'engine', 'index.js')
const ENGINE_CJS = join(DIST, 'engine', 'index.cjs')
const ENGINE_DTS = join(DIST, 'engine', 'index.d.ts')
const ENGINE_DCTS = join(DIST, 'engine', 'index.d.cts')
const MAIN_JS = join(DIST, 'index.js')
const MAIN_DTS = join(DIST, 'index.d.ts')

const FORBIDDEN = ['react', 'react-dom', '@tour-kit/license'] as const

/**
 * The BARE `@tour-kit/core`, in every call shape a bundler emits.
 *
 * Built from `SPECIFIER_PREFIX` rather than hand-rolled, because the hand-rolled
 * version covered `from` and `require(` and silently missed `import(` — and this
 * repo reaches bare specifiers that way on purpose: the four vendor plugins load
 * `posthog-js`, `mixpanel-browser` and `@amplitude/analytics-browser` through
 * lazy `import()` behind magic comments, and all three appear in this package's
 * engine dist. A guard that cannot see the shape its own package uses most is
 * not a guard.
 *
 * The closing quote sits immediately after `core`, so `@tour-kit/core/engine`
 * does NOT match — which is the whole point of this check, and why
 * `specifierPattern('@tour-kit/core')` cannot serve here: it allows a
 * `/subpath` and so can only ever prove presence.
 */
const BARE_CORE = new RegExp(`${SPECIFIER_PREFIX}["']@tour-kit/core["']`)

const read = (p: string) => readFileSync(p, 'utf8')
// rollup-plugin-dts chunks shared declarations even with `splitting: false`
// (a content-hashed `dist/plugin-*.d.ts` exists today); `closureOf` follows
// them because `resolveEmitted` maps `.js → .d.ts` and `.cjs → .d.cts`. It
// tries the literal path first, so a `'../plugins/posthog.js'` re-export also
// pulls the real plugin JS in — a superset scan, deliberately kept.
const readDts = (entry: string) => closureOf(entry).map(read).join('\n')

describe('@tour-kit/analytics/engine ships no React', () => {
  it.skipIf(!distExists())('names the four built engine files', () => {
    for (const f of [ENGINE_JS, ENGINE_CJS, ENGINE_DTS, ENGINE_DCTS]) {
      expect(existsSync(f), `${f} missing — every scan below would be vacuous`).toBe(true)
    }
  })

  it.skipIf(!distExists())('CONTROL — the main entry trips the same matcher', () => {
    // If this stops tripping, the matcher broke or the package changed shape.
    expect(specifierPattern('react').test(read(MAIN_JS))).toBe(true)
    expect(specifierPattern('@tour-kit/license').test(read(MAIN_JS))).toBe(true)
    expect(specifierPattern('react').test(read(MAIN_DTS))).toBe(true)
  })

  it.skipIf(!distExists())('the engine JS names none of the React-side specifiers', () => {
    for (const f of [ENGINE_JS, ENGINE_CJS]) {
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(read(f)), `${f} must not import ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('the engine .d.ts closure names none of them either', () => {
    for (const entry of [ENGINE_DTS, ENGINE_DCTS]) {
      const source = readDts(entry)
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(source), `${entry} closure names ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('imports @tour-kit/core/engine, never the bare main entry', () => {
    // `specifierPattern('@tour-kit/core')` matches the `/engine` form too, so it
    // can only prove PRESENCE. Absence of the bare form needs `BARE_CORE`.
    for (const f of [ENGINE_JS, ENGINE_CJS]) {
      const source = read(f)
      expect(BARE_CORE.test(source), `${f} imports bare core`).toBe(false)
      expect(
        specifierPattern('@tour-kit/core').test(source),
        `${f} should import core/engine`
      ).toBe(true)
    }
    for (const entry of [ENGINE_DTS, ENGINE_DCTS]) {
      expect(BARE_CORE.test(readDts(entry)), `${entry} names bare core`).toBe(false)
    }
  })

  it.skipIf(!distExists())('core is externalised, not bundled in', () => {
    // The failure this guards: tsup stops treating `@tour-kit/core/engine` as
    // external and inlines core. The budget row would only catch it after the
    // ~50 B threshold, and `analytics:main` would jump by kilobytes. Naming a
    // symbol that exists ONLY inside core is the cheap direct test.
    expect(read(MAIN_JS)).not.toMatch(/createTourEngine/)
    expect(read(ENGINE_JS)).not.toMatch(/createTourEngine/)
  })

  it.skipIf(!distExists())("'use client' lands on the React entry only", () => {
    const startsWithDirective = (p: string) => /^['"]use client['"];?/.test(read(p))
    expect(startsWithDirective(ENGINE_JS)).toBe(false)
    expect(startsWithDirective(ENGINE_CJS)).toBe(false)
    // Both halves: losing the directive on the main entry is equally a break —
    // it is what lets <AnalyticsProvider> work inside an RSC tree.
    expect(startsWithDirective(MAIN_JS)).toBe(true)
    expect(startsWithDirective(join(DIST, 'index.cjs'))).toBe(true)
  })

  it.skipIf(!distExists())('every path the ./engine exports block names resolves', () => {
    // The `types` condition of an `exports` block is never exercised by an
    // `import()` — core solves this with a separate portability test, which
    // neither new package gets. This is the cheap closure: a `.d.mts` typo, a
    // dropped `./`, or a `.d.ts`/`.d.cts` swap is invisible to every other case
    // here and breaks a consumer's typecheck rather than their build.
    const pkg = JSON.parse(read(join(PKG_ROOT, 'package.json'))) as {
      exports: Record<string, { import: Record<string, string>; require: Record<string, string> }>
    }
    const block = pkg.exports['./engine']
    expect(block, 'package.json has no "./engine" exports key').toBeDefined()

    const paths = [
      block.import.types,
      block.import.default,
      block.require.types,
      block.require.default,
    ]
    expect(paths.filter(Boolean)).toHaveLength(4)
    for (const rel of paths) {
      expect(rel.startsWith('./'), `${rel} is not a relative exports target`).toBe(true)
      expect(existsSync(join(PKG_ROOT, rel)), `${rel} does not exist on disk`).toBe(true)
    }
  })

  it('no source file the engine barrel reaches imports react, license or bare core', () => {
    // Walk the barrel's relative imports to fixpoint. `.ts` first, then
    // `/index.ts`, so `../utils`-style directory imports resolve too.
    // RELATIVE_SPECIFIER is a module-level /g regex: matchAll only, never .test.
    const seen = new Set<string>()
    const queue = [join(PKG_ROOT, 'src', 'engine', 'index.ts')]
    while (queue.length > 0) {
      const file = queue.shift() as string
      if (seen.has(file)) continue
      seen.add(file)
      const source = read(file)
      for (const [, spec] of source.matchAll(RELATIVE_SPECIFIER)) {
        const base = resolve(dirname(file), spec)
        const next = [`${base}.ts`, join(base, 'index.ts'), `${base}.tsx`].find(existsSync)
        if (!next) throw new Error(`${file}: cannot resolve ${spec}`)
        queue.push(next)
      }
    }
    const files = [...seen]
    // The walker can fail silently; say out loud what it must have found.
    // The floor is pinned at today's exact count (barrel + tracker + queue +
    // 5 plugins + 2 type files = 10) — an anti-vacuity floor, not a target.
    expect(files.some((f) => f.endsWith('core/tracker.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('plugins/posthog.ts'))).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(10)

    for (const file of files) {
      const source = read(file)
      expect(file.endsWith('.tsx'), `${file} is a React file`).toBe(false)
      expect(/from\s*["']react(\/[^"']*)?["']/.test(source), `${file} imports react`).toBe(false)
      expect(/from\s*["']@tour-kit\/license["']/.test(source), `${file} imports license`).toBe(
        false
      )
      expect(/from\s*["']@tour-kit\/core["']/.test(source), `${file} imports bare core`).toBe(false)
    }
  })
})
