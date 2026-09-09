/**
 * v3 Phase 0 — `@tour-kit/scheduling/engine` ships no React.
 *
 * US-1: a Vue/Svelte/Node developer evaluates a schedule with React not
 * installed. That is a property of the BYTES tsup emitted, so every case here
 * reads a real built file — nothing is faked, stubbed or mocked.
 *
 * This package is the harder of the two to guard, because its engine names
 * *nothing* — so "does the file mention X" cannot be its own control. The
 * sibling main entry is the control instead: it legitimately names three of the
 * four forbidden specifiers (see CONTROL_SPECIFIERS for why not the fourth),
 * and if it ever stops, either the matcher broke or the package changed shape.
 * Both deserve a red.
 *
 * `splitting: false`, so the built entry IS its own closure for the JS. The
 * declarations are not: rollup-plugin-dts chunks shared types regardless, under
 * a content-hashed name that changes every rebuild, so the d.ts scan walks with
 * `closureOf` and never spells the hash.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  RELATIVE_SPECIFIER,
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

// `@tour-kit/analytics` is the hooks' optional peer. It must not follow the
// twenty-four pure functions through the engine door.
const FORBIDDEN = ['react', 'react-dom', '@tour-kit/license', '@tour-kit/analytics'] as const

/**
 * What the CONTROL asserts the main entry still names — deliberately NOT the
 * same list as FORBIDDEN, and the difference is measured rather than assumed.
 *
 * `react-dom` is in this package's tsup `external` list, but nothing in the
 * package actually imports it, so it appears in neither built entry. A control
 * that loops over FORBIDDEN therefore fails against a perfectly correct build
 * ("main should name react-dom: expected false to be true"). Forbidding it on
 * the engine side is still right — it is a React-side specifier that must never
 * appear — but a guard may only use as its control what the sibling entry
 * demonstrably contains.
 */
const CONTROL_SPECIFIERS = ['react', '@tour-kit/license', '@tour-kit/analytics'] as const

const read = (p: string) => readFileSync(p, 'utf8')
// rollup-plugin-dts chunks shared declarations even with `splitting: false`,
// under a content-hashed name that changes on every rebuild — so never spell
// it, walk it. `closureOf` maps `.js → .d.ts` / `.cjs → .d.cts` and tries the
// literal path first, so this over-includes real JS. That is a superset scan,
// and it is stronger than the declaration chain alone.
const readDts = (entry: string) => closureOf(entry).map(read).join('\n')

describe('@tour-kit/scheduling/engine ships no React', () => {
  it.skipIf(!distExists())('names the four built engine files', () => {
    for (const f of [ENGINE_JS, ENGINE_CJS, ENGINE_DTS, ENGINE_DCTS]) {
      expect(existsSync(f), `${f} missing — every scan below would be vacuous`).toBe(true)
    }
  })

  it.skipIf(!distExists())('CONTROL — the main entry trips the same matcher', () => {
    // The engine names nothing external, so "the file mentions X" cannot be its
    // own control. The sibling entry is. If any of these stops tripping, the
    // matcher broke or the package changed shape.
    for (const pkg of CONTROL_SPECIFIERS) {
      expect(specifierPattern(pkg).test(read(MAIN_JS)), `main should name ${pkg}`).toBe(true)
    }
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

  it.skipIf(!distExists())('the engine names NO bare specifier at all', () => {
    // Scheduling's engine depends on nothing. Rather than enumerate what it
    // must not import, pin the stronger property: every specifier it emits is
    // relative. A new dependency of any kind — not just a React-side one —
    // fails here, which is the case analytics spends on `@tour-kit/core/engine`.
    const bareFrom = /from\s*["'][^"'.]/
    const bareRequire = /require\(\s*["'][^"'.]/
    for (const f of [ENGINE_JS, ENGINE_CJS]) {
      expect(bareFrom.test(read(f)), `${f} imports a bare specifier`).toBe(false)
      expect(bareRequire.test(read(f)), `${f} requires a bare specifier`).toBe(false)
    }
    for (const entry of [ENGINE_DTS, ENGINE_DCTS]) {
      const source = readDts(entry)
      expect(bareFrom.test(source), `${entry} closure names a bare specifier`).toBe(false)
    }
  })

  it.skipIf(!distExists())("'use client' lands on the React entry only", () => {
    const startsWithDirective = (p: string) => /^['"]use client['"];?/.test(read(p))
    expect(startsWithDirective(ENGINE_JS)).toBe(false)
    expect(startsWithDirective(ENGINE_CJS)).toBe(false)
    // Both halves: losing the directive on the main entry is equally a break —
    // it is what lets <ScheduleGate> work inside an RSC tree.
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

  it('no source file the engine barrel reaches imports react, license or analytics', () => {
    // Walk the barrel's relative imports to fixpoint. `.ts` first, then
    // `/index.ts`, so `../utils`-style directory imports resolve.
    // RELATIVE_SPECIFIER is a module-level /g regex: matchAll only, never .test.
    const seen = new Set<string>()
    const queue = [join(PKG_ROOT, 'src', 'engine', 'index.ts')]
    while (queue.length > 0) {
      const file = queue.shift() as string
      if (seen.has(file)) continue
      seen.add(file)
      for (const [, spec] of read(file).matchAll(RELATIVE_SPECIFIER)) {
        const base = resolve(dirname(file), spec)
        const next = [`${base}.ts`, join(base, 'index.ts'), `${base}.tsx`].find(existsSync)
        if (!next) throw new Error(`${file}: cannot resolve ${spec}`)
        queue.push(next)
      }
    }
    const files = [...seen]
    // A silently-empty walk passes every assertion below it forever. Say out
    // loud what it must have found. 15 = barrel + utils/index + 9 util leaves
    // + types/index + 3 type files, today's exact count — a floor, not a target.
    expect(files.some((f) => f.endsWith('utils/is-schedule-active.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('types/schedule.ts'))).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(15)

    for (const file of files) {
      const source = read(file)
      expect(file.endsWith('.tsx'), `${file} is a React file`).toBe(false)
      expect(/from\s*["']react(\/[^"']*)?["']/.test(source), `${file} imports react`).toBe(false)
      expect(/from\s*["']@tour-kit\/license["']/.test(source), `${file} imports license`).toBe(
        false
      )
      expect(/from\s*["']@tour-kit\/analytics["']/.test(source), `${file} imports analytics`).toBe(
        false
      )
    }
  })
})
