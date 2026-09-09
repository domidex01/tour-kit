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
 * Every scan reads the import CLOSURE, never the entry, through the shared
 * helpers in `tooling/bundle-check/engine-guard.mjs`. This package builds with
 * `splitting: false`, so for the JS the two are the same file today — but that
 * is a tsup setting asserted nowhere, and the v3 Phase 1 review MEASURED what an
 * entry-only scan costs when it flips: with the guard reading the entry, a React
 * provider exported from the engine barrel left the specifier scan green. The
 * declarations were never equivalent anyway — rollup-plugin-dts chunks shared
 * types regardless, under a content-hashed name that changes on every rebuild,
 * so the d.ts scan has always had to walk. Never spell the hash.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SPECIFIER_PREFIX, specifierPattern } from '../../../../tooling/bundle-check/closure.mjs'
import {
  assertClosureIsNotTheShell,
  assertEngineExportsResolve,
  assertEngineFilesExist,
  closureSrc,
  enginePaths,
  distExists as pkgDistExists,
  reachableFrom,
  read,
  startsWithClientDirective,
} from '../../../../tooling/bundle-check/engine-guard.mjs'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const P = enginePaths(PKG_ROOT)
// The DIRECTORY, not the files: gating on a filename turns a typo into a
// silent skip (measured in v2 §1.5 — "3 skipped", green, proving nothing).
const distExists = () => pkgDistExists(PKG_ROOT)

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

describe('@tour-kit/analytics/engine ships no React', () => {
  it.skipIf(!distExists())('ANTI-VACUITY — the engine closure is more than a shell', () => {
    // This package builds with `splitting: false`, so the entry IS the closure
    // today — but that is a tsup setting asserted nowhere else, and the v3
    // Phase 1 review measured what an entry-only scan costs when it flips.
    for (const entry of [P.engineJs, P.engineCjs]) assertClosureIsNotTheShell(expect, entry)
  })

  it.skipIf(!distExists())('names the four built engine files', () => {
    assertEngineFilesExist(expect, P)
  })

  it.skipIf(!distExists())('CONTROL — the main entry trips the same matcher', () => {
    // If this stops tripping, the matcher broke or the package changed shape.
    expect(specifierPattern('react').test(closureSrc(P.mainJs))).toBe(true)
    expect(specifierPattern('@tour-kit/license').test(closureSrc(P.mainJs))).toBe(true)
    expect(specifierPattern('react').test(closureSrc(P.mainDts))).toBe(true)
  })

  it.skipIf(!distExists())('the engine JS names none of the React-side specifiers', () => {
    for (const f of [P.engineJs, P.engineCjs]) {
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(closureSrc(f)), `${f} closure imports ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('the engine .d.ts closure names none of them either', () => {
    for (const entry of [P.engineDts, P.engineDcts]) {
      const source = closureSrc(entry)
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(source), `${entry} closure names ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('imports @tour-kit/core/engine, never the bare main entry', () => {
    // `specifierPattern('@tour-kit/core')` matches the `/engine` form too, so it
    // can only prove PRESENCE. Absence of the bare form needs `BARE_CORE`.
    for (const f of [P.engineJs, P.engineCjs]) {
      const source = closureSrc(f)
      expect(BARE_CORE.test(source), `${f} imports bare core`).toBe(false)
      expect(
        specifierPattern('@tour-kit/core').test(source),
        `${f} should import core/engine`
      ).toBe(true)
    }
    for (const entry of [P.engineDts, P.engineDcts]) {
      expect(BARE_CORE.test(closureSrc(entry)), `${entry} names bare core`).toBe(false)
    }
  })

  it.skipIf(!distExists())('core is externalised, not bundled in', () => {
    // The failure this guards: tsup stops treating `@tour-kit/core/engine` as
    // external and inlines core. The budget row would only catch it after the
    // ~50 B threshold, and `analytics:main` would jump by kilobytes. Naming a
    // symbol that exists ONLY inside core is the cheap direct test.
    expect(closureSrc(P.mainJs)).not.toMatch(/createTourEngine/)
    expect(closureSrc(P.engineJs)).not.toMatch(/createTourEngine/)
  })

  it.skipIf(!distExists())("'use client' lands on the React entry only", () => {
    expect(startsWithClientDirective(P.engineJs)).toBe(false)
    expect(startsWithClientDirective(P.engineCjs)).toBe(false)
    // Both halves: losing the directive on the main entry is equally a break —
    // it is what lets <AnalyticsProvider> work inside an RSC tree.
    expect(startsWithClientDirective(P.mainJs)).toBe(true)
    expect(startsWithClientDirective(P.mainCjs)).toBe(true)
  })

  it.skipIf(!distExists())('every path the ./engine exports block names resolves', () => {
    assertEngineExportsResolve(expect, PKG_ROOT)
  })

  it('no source file the engine barrel reaches imports react, license or bare core', () => {
    const files = reachableFrom(join(PKG_ROOT, 'src', 'engine', 'index.ts'))
    // The walker can fail silently; say out loud what it must have found.
    // The floor is pinned at today's exact count (barrel + tracker + queue +
    // 5 plugins + 2 type files = 10) — an anti-vacuity floor, not a target.
    expect(files.some((f) => f.endsWith('core/tracker.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('plugins/posthog.ts'))).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(10)

    for (const file of files) {
      const source = read(file)
      expect(file.endsWith('.tsx'), `${file} is a React file`).toBe(false)
      expect(specifierPattern('react').test(source), `${file} imports react`).toBe(false)
      expect(specifierPattern('@tour-kit/license').test(source), `${file} imports license`).toBe(
        false
      )
      expect(BARE_CORE.test(source), `${file} imports bare core`).toBe(false)
    }
  })
})
