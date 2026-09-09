/**
 * v3 Phase 1 — `@tour-kit/hints/engine` ships no React.
 *
 * US-1: a Vue/Svelte/vanilla developer runs hints with React not installed.
 * That is a property of the BYTES tsup emitted, so every case here reads a real
 * built file — nothing is faked, stubbed or mocked.
 *
 * This file starts from `packages/scheduling/src/__tests__/`'s and changes ONE
 * structural thing: **what the JS cases read.** Scheduling and analytics build
 * with `splitting: false`, so "the entry IS the closure" and a one-file read is
 * honest. Hints builds with `splitting: true`, like core: `dist/engine/index.js`
 * is a ~200-byte re-export shell and the code lives in `chunk-*.js` beside it. A
 * scan of the shell passes forever, no matter what the package imports. So every
 * scan below reads `closureOf(...)` — the same walker the size gate uses — and
 * one case asserts the closure is bigger than the shell could possibly be.
 *
 * The hints-specific rule is in the source walk: every file the barrel reaches
 * must live under `src/lib/hints-engine/`. The package's own `src/types/index.ts`
 * imports `react` for `RefObject` and `@tour-kit/media` for `MediaSlotProps`,
 * and one `import type … from '../../types'` in a lib file would put both in the
 * declaration closure.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SPECIFIER_PREFIX, specifierPattern } from '../../../../tooling/bundle-check/closure.mjs'
import {
  assertClosureIsNotTheShell,
  assertEngineExportsResolve,
  assertEngineFilesExist,
  assertEngineNotInInjectUseClient,
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
const BARREL = join(PKG_ROOT, 'src', 'engine', 'index.ts')

/**
 * Everything that must never follow the state machine through the engine door.
 * `react-dom` is here and NOT in either control below: it is in tsup's
 * `external` list but nothing in the package imports it, so it appears in no
 * entry at all. Forbidding it is still right — it is a React-side specifier —
 * but a control may only assert what the sibling entry demonstrably contains.
 */
const FORBIDDEN = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@tour-kit/media',
  '@tour-kit/analytics',
  '@floating-ui/react',
  '@radix-ui/react-slot',
  'class-variance-authority',
] as const

/** Measured on the main closure, 2026-09-09. Not assumed, and not FORBIDDEN. */
const CONTROL_JS = [
  'react',
  'react/jsx-runtime',
  '@tour-kit/media',
  '@tour-kit/analytics',
  '@floating-ui/react',
  '@radix-ui/react-slot',
  'class-variance-authority',
] as const

/**
 * Also measured. `@tour-kit/analytics` and `@floating-ui/react` are measured
 * FALSE in the declaration closure, so they are deliberately absent — putting
 * them here would red a correct build, which is the exact failure the
 * measured-control rule exists to prevent.
 */
const CONTROL_DTS = [
  'react',
  'react/jsx-runtime',
  '@tour-kit/media',
  '@radix-ui/react-slot',
  'class-variance-authority',
] as const

/**
 * Bare `@tour-kit/core` — the MAIN entry, not the `/engine` subpath. Built from
 * `SPECIFIER_PREFIX` so it covers `from`, `import(` and `require(`; the closing
 * quote sits right after `core`, so `@tour-kit/core/engine` does not match.
 */
const BARE_CORE = new RegExp(`${SPECIFIER_PREFIX}["']@tour-kit/core["']`)

describe('@tour-kit/hints/engine ships no React', () => {
  it.skipIf(!distExists())('names the four built engine files', () => {
    assertEngineFilesExist(expect, P)
  })

  it.skipIf(!distExists())('ANTI-VACUITY — the engine closure is more than the shell', () => {
    // Two files is the NORMAL shape for a split package (the main closure is
    // four), so the file count discriminates almost nothing. The BYTE count is
    // the load-bearing half: the shell alone is ~200 B, a real closure ~6 KB.
    for (const entry of [P.engineJs, P.engineCjs]) assertClosureIsNotTheShell(expect, entry)
  })

  it.skipIf(!distExists())('CONTROL — the main closure trips the same matchers', () => {
    // The engine names almost nothing, so "does the file mention X" cannot be
    // its own control. The sibling main closure is. If any of these stops
    // tripping, the matcher broke or the package changed shape — both deserve
    // a red, because a broken matcher turns every assertion below into a
    // vacuous pass.
    for (const src of [closureSrc(P.mainJs), closureSrc(P.mainCjs)]) {
      for (const pkg of CONTROL_JS) {
        expect(specifierPattern(pkg).test(src), `main should name ${pkg}`).toBe(true)
      }
    }
    const dts = closureSrc(P.mainDts)
    for (const pkg of CONTROL_DTS) {
      expect(specifierPattern(pkg).test(dts), `main .d.ts should name ${pkg}`).toBe(true)
    }
    // A positive control analytics never had: hints' main closure genuinely
    // imports bare `@tour-kit/core` (twenty source files do). Without this, a
    // BARE_CORE that silently stopped matching would turn the engine's
    // "never bare core" case into a vacuous pass.
    expect(BARE_CORE.test(closureSrc(P.mainJs)), 'BARE_CORE stopped matching').toBe(true)
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

  it.skipIf(!distExists())('the engine imports @tour-kit/core/engine, never bare core', () => {
    // The one bare specifier the engine is allowed. Scheduling's "no bare
    // specifier at all" case cannot be reused here — hints' engine legitimately
    // names one — so this is the narrower claim: it reaches core through the
    // React-free door only. Bare `@tour-kit/core` would pull the main barrel's
    // providers, fourteen hooks and `UnifiedSlot` into a Vue consumer's graph.
    for (const entry of [P.engineJs, P.engineCjs, P.engineDts, P.engineDcts]) {
      const src = closureSrc(entry)
      expect(BARE_CORE.test(src), `${entry} closure imports bare @tour-kit/core`).toBe(false)
      expect(
        specifierPattern('@tour-kit/core').test(src),
        `${entry} closure does not reach core at all`
      ).toBe(true)
    }
  })

  it.skipIf(!distExists())('core is externalised, not bundled in', () => {
    // Read the CLOSURE, not the entry: analytics can assert this on its entry
    // because `splitting: false` makes the entry its own closure; here the
    // entry is a shell and the case would be vacuous forever.
    // `createTourEngine` is a core symbol hints imports nowhere, so its
    // appearance means core's source was inlined rather than externalised.
    for (const entry of [P.engineJs, P.engineCjs]) {
      expect(closureSrc(entry), `${entry} inlined core`).not.toMatch(/createTourEngine/)
    }
    expect(closureSrc(P.mainJs), 'main inlined core').not.toMatch(/createTourEngine/)
  })

  it.skipIf(!distExists())("'use client' lands on the React entries only", () => {
    expect(startsWithClientDirective(P.engineJs)).toBe(false)
    expect(startsWithClientDirective(P.engineCjs)).toBe(false)
    // Both halves, and `headless` too: losing the directive on either React
    // entry is equally a break.
    expect(startsWithClientDirective(P.mainJs)).toBe(true)
    expect(startsWithClientDirective(P.mainCjs)).toBe(true)
    expect(startsWithClientDirective(join(P.dist, 'headless.js'))).toBe(true)
    expect(startsWithClientDirective(join(P.dist, 'headless.cjs'))).toBe(true)
  })

  it.skipIf(!distExists())('every path the ./engine exports block names resolves', () => {
    assertEngineExportsResolve(expect, PKG_ROOT)
  })

  it('every source file the engine barrel reaches lives under lib/hints-engine/', () => {
    const files = reachableFrom(BARREL)
    // A silently-empty walk passes every assertion below it forever. Say out
    // loud what it must have found: the barrel plus six lib modules is today's
    // exact count — a floor, not a target.
    expect(files.some((f) => f.endsWith('lib/hints-engine/reducer.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('lib/hints-engine/create-hints-engine.ts'))).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(7)

    for (const file of files) {
      const source = read(file)
      expect(file.endsWith('.tsx'), `${file} is a React file`).toBe(false)
      // The hints-specific rule. `src/types/index.ts` imports react and
      // @tour-kit/media, so one `import type … from '../../types'` in a lib
      // file would put both in the declaration closure — and a TYPE import
      // leaves no trace in the JS, so only this case would catch it.
      if (file !== BARREL) {
        expect(
          file.includes(`${join('lib', 'hints-engine')}`),
          `${file} is reachable from the engine barrel but is not under lib/hints-engine/`
        ).toBe(true)
      }
      expect(specifierPattern('react').test(source), `${file} imports react`).toBe(false)
      expect(
        specifierPattern('@tour-kit/media').test(source),
        `${file} imports @tour-kit/media`
      ).toBe(false)
      expect(BARE_CORE.test(source), `${file} imports bare @tour-kit/core`).toBe(false)
    }
  })

  it('the engine entry is never stamped with a client directive', () => {
    // The source half of the `'use client'` byte case above: adding the engine
    // entry to `injectUseClient` is a one-word change that the built-bytes case
    // only catches after a rebuild.
    assertEngineNotInInjectUseClient(expect, PKG_ROOT)
  })
})
