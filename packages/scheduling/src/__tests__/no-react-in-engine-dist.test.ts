/**
 * v3 Phase 0 — `@tour-kit/scheduling/engine` ships no React.
 *
 * US-1: a Vue/Svelte/Node developer evaluates a schedule with React not
 * installed. That is a property of the BYTES tsup emitted, so every case here
 * reads a real built file — nothing is faked, stubbed or mocked.
 *
 * This package is the harder one to guard, because its engine names *nothing* —
 * so "does the file mention X" cannot be its own control. The sibling main
 * closure is the control instead: it legitimately names three of the four
 * forbidden specifiers (see CONTROL_SPECIFIERS for why not the fourth), and if
 * it ever stops, either the matcher broke or the package changed shape.
 *
 * Every scan reads the import CLOSURE, never the entry. This package builds
 * with `splitting: false` today, so the two happen to be the same file for the
 * JS — but that is a property of the tsup config, asserted nowhere, and the v3
 * Phase 1 review demonstrated what an entry-only scan costs: with the guard
 * reading the entry, a React provider exported from the engine barrel left the
 * specifier scan GREEN. The anti-vacuity case makes the difference visible if
 * `splitting` is ever flipped.
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

// `@tour-kit/analytics` is the hooks' optional peer. It must not follow the
// twenty-four pure functions through the engine door.
const FORBIDDEN = ['react', 'react-dom', '@tour-kit/license', '@tour-kit/analytics'] as const

/**
 * What the CONTROL asserts the main closure still names — deliberately NOT the
 * same list as FORBIDDEN, and the difference is measured rather than assumed.
 *
 * `react-dom` is in this package's tsup `external` list, but nothing in the
 * package actually imports it, so it appears in neither built entry. A control
 * that loops over FORBIDDEN therefore fails against a perfectly correct build.
 * Forbidding it on the engine side is still right; a guard may only use as its
 * control what the sibling demonstrably contains.
 */
const CONTROL_SPECIFIERS = ['react', '@tour-kit/license', '@tour-kit/analytics'] as const

/**
 * Any BARE specifier, in every call shape a bundler emits — `from`, `import(`
 * and `require(`. The leading `[^"\'.]` excludes relative paths, which all
 * start with `.`; everything else is a package.
 */
const BARE_SPECIFIER = new RegExp(`${SPECIFIER_PREFIX}["\'][^"\'.]`)

describe('@tour-kit/scheduling/engine ships no React', () => {
  it.skipIf(!distExists())('names the four built engine files', () => {
    assertEngineFilesExist(expect, P)
  })

  it.skipIf(!distExists())('ANTI-VACUITY — the engine closure is more than a shell', () => {
    for (const entry of [P.engineJs, P.engineCjs]) assertClosureIsNotTheShell(expect, entry)
  })

  it.skipIf(!distExists())('CONTROL — the main closure trips the same matcher', () => {
    for (const pkg of CONTROL_SPECIFIERS) {
      expect(specifierPattern(pkg).test(closureSrc(P.mainJs)), `main should name ${pkg}`).toBe(true)
    }
    expect(specifierPattern('react').test(closureSrc(P.mainDts))).toBe(true)
  })

  it.skipIf(!distExists())('the engine JS closure names none of the React-side specifiers', () => {
    for (const entry of [P.engineJs, P.engineCjs]) {
      const src = closureSrc(entry)
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(src), `${entry} closure imports ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('the engine .d.ts closure names none of them either', () => {
    for (const entry of [P.engineDts, P.engineDcts]) {
      const src = closureSrc(entry)
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(src), `${entry} closure names ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('the engine names NO bare specifier at all', () => {
    // Scheduling's engine depends on nothing. Rather than enumerate what it
    // must not import, pin the stronger property: every specifier it emits is
    // relative. Built from `SPECIFIER_PREFIX`, so it covers `from`, `import(`
    // AND `require(` — a hand-rolled pair covering only two would miss a lazy
    // `import('some-package')`, which is exactly how a bare specifier enters a
    // bundle in this repo.
    for (const entry of [P.engineJs, P.engineCjs, P.engineDts, P.engineDcts]) {
      expect(BARE_SPECIFIER.test(closureSrc(entry)), `${entry} names a bare specifier`).toBe(false)
    }
  })

  it.skipIf(!distExists())("'use client' lands on the React entry only", () => {
    expect(startsWithClientDirective(P.engineJs)).toBe(false)
    expect(startsWithClientDirective(P.engineCjs)).toBe(false)
    // Both halves: losing the directive on the main entry is equally a break —
    // it is what lets <ScheduleGate> work inside an RSC tree.
    expect(startsWithClientDirective(P.mainJs)).toBe(true)
    expect(startsWithClientDirective(P.mainCjs)).toBe(true)
  })

  it.skipIf(!distExists())('every path the ./engine exports block names resolves', () => {
    assertEngineExportsResolve(expect, PKG_ROOT)
  })

  it('no source file the engine barrel reaches imports react, license or analytics', () => {
    const files = reachableFrom(join(PKG_ROOT, 'src', 'engine', 'index.ts'))
    // A silently-empty walk passes every assertion below it forever. Say out
    // loud what it must have found. 15 = barrel + utils/index + 9 util leaves +
    // types/index + 3 type files — today's exact count, a floor not a target.
    expect(files.some((f) => f.endsWith('utils/is-schedule-active.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('types/schedule.ts'))).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(15)

    for (const file of files) {
      const source = read(file)
      expect(file.endsWith('.tsx'), `${file} is a React file`).toBe(false)
      for (const pkg of ['react', '@tour-kit/license', '@tour-kit/analytics'] as const) {
        expect(specifierPattern(pkg).test(source), `${file} imports ${pkg}`).toBe(false)
      }
    }
  })
})
