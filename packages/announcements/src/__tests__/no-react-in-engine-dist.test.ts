/**
 * v3 Phase 3 — `@tour-kit/announcements/engine` ships no React.
 *
 * US-1: a Vue/Svelte/Node developer runs announcements with React not
 * installed. That is a property of the BYTES tsup emitted, so every case here
 * reads a real built file — nothing is faked, stubbed or mocked.
 *
 * Composed from `tooling/bundle-check/engine-guard.mjs` + `closure.mjs` (PR
 * #139); no walker is written here. Three things differ from the checklists
 * original this was copied from, each measured on 2026-09-10:
 *
 *  1. THE ALLOW-SET IS WIDER (§0 C4). Checklists asserts every reachable file
 *     lives under `lib/checklists-engine/`. This engine deliberately reaches
 *     `src/core/` — scheduler, priority queue, frequency, audience, the
 *     schedule resolver — so that rule is red by design. The discriminating
 *     rule that replaces it is `../types`: `src/types/announcement.ts` imports
 *     `react` and `@tour-kit/media`, so ONE `import type … from '../types'`
 *     would put both in the declaration closure, invisibly (recipe gap 18).
 *
 *  2. THE FORBIDDEN LIST HAS A RAW-LITERAL LAYER (§0 C14). `minify: true`
 *     renames the locally-declared `require` binding in `resolve-schedule.ts`
 *     to a single letter, so `specifierPattern('@tour-kit/scheduling')` is
 *     FALSE against a closure that plainly contains the string. Any forbidden
 *     name reached through a minified renamed call is invisible the same way,
 *     so every scoped, distinctive name is also checked as a raw substring.
 *
 *  3. `@tour-kit/scheduling` IS MEASURED-PRESENT, NOT FORBIDDEN (Decision 7b).
 *     It is the optional peer, React-free at its own `/engine` subpath, and it
 *     legitimately sits in this closure through the call-time resolver.
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
  readCode,
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
 * `sonner` is here and in no control: `scripts/check-no-sonner-in-main.sh`
 * keeps it out of the main entry too, so no closure can demonstrate it — but
 * it is still a React-side specifier and forbidding it is still right.
 */
const FORBIDDEN = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@tour-kit/media',
  '@tour-kit/analytics',
  '@tour-kit/license',
  '@floating-ui/react',
  '@radix-ui/react-slot',
  '@radix-ui/react-dialog',
  'class-variance-authority',
  'sonner',
] as const

/**
 * The §0 C14 layer. Distinctive enough that a raw substring is not a false
 * positive, and `react` is quoted so it cannot match `react-dom` or a comment.
 */
const FORBIDDEN_RAW: readonly (string | RegExp)[] = [
  '@tour-kit/media',
  '@tour-kit/analytics',
  '@tour-kit/license',
  '@floating-ui/react',
  '@radix-ui/',
  'class-variance-authority',
  'sonner',
  /["']react["']/,
  /["']react\/jsx-runtime["']/,
] as const

/** Measured on the main closure on 2026-09-10, not assumed. */
const CONTROL_JS = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@tour-kit/media',
  '@tour-kit/analytics',
  '@tour-kit/license',
  '@floating-ui/react',
  '@radix-ui/react-slot',
  '@radix-ui/react-dialog',
  'class-variance-authority',
] as const

/**
 * Also measured. `react-dom` and `@radix-ui/react-dialog` are FALSE in the
 * declaration closure, so they are deliberately absent — putting them here
 * would red a correct build, which is the exact failure the measured-control
 * rule exists to prevent (Phase 0's finding, second occurrence).
 */
const CONTROL_DTS = [
  'react',
  'react/jsx-runtime',
  '@tour-kit/media',
  '@tour-kit/analytics',
  '@tour-kit/license',
  '@floating-ui/react',
  '@radix-ui/react-slot',
  'class-variance-authority',
] as const

/**
 * Bare `@tour-kit/core` — the MAIN entry, not the `/engine` subpath. Built from
 * `SPECIFIER_PREFIX` so it covers `from`, `import(` and `require(`; the closing
 * quote sits right after `core`, so `@tour-kit/core/engine` does not match.
 * It must NOT join `FORBIDDEN`: `specifierPattern('@tour-kit/core')` matches
 * the `/engine` subpath by design.
 */
const BARE_CORE = new RegExp(`${SPECIFIER_PREFIX}["']@tour-kit/core["']`)
/** Same shape for scheduling — `specifierPattern` would match `/engine` too. */
const BARE_SCHEDULING = new RegExp(`${SPECIFIER_PREFIX}["']@tour-kit/scheduling["']`)

describe('@tour-kit/announcements/engine ships no React', () => {
  it.skipIf(!distExists())('names the four built engine files', () => {
    assertEngineFilesExist(expect, P)
  })

  it.skipIf(!distExists())('ANTI-VACUITY — the engine closure is more than the shell', () => {
    // This package builds with `splitting: true`, so `dist/engine/index.js` is
    // a re-export shell and the code lives in `chunk-*.js` beside it. A scan of
    // the shell passes forever. The BYTE count is the load-bearing half: file
    // count is a normal shape and discriminates almost nothing.
    for (const entry of [P.engineJs, P.engineCjs]) assertClosureIsNotTheShell(expect, entry)
  })

  it.skipIf(!distExists())('CONTROL — the main closure trips the same matchers', () => {
    // The engine names almost nothing, so "does the file mention X" cannot be
    // its own control. The sibling main closure is. If any of these stops
    // tripping, the matcher broke or the package changed shape — both deserve
    // a red, because a broken matcher makes every assertion below vacuous.
    for (const src of [closureSrc(P.mainJs), closureSrc(P.mainCjs)]) {
      for (const pkg of CONTROL_JS) {
        expect(specifierPattern(pkg).test(src), `main should name ${pkg}`).toBe(true)
      }
    }
    const dts = closureSrc(P.mainDts)
    for (const pkg of CONTROL_DTS) {
      expect(specifierPattern(pkg).test(dts), `main .d.ts should name ${pkg}`).toBe(true)
    }
    expect(BARE_CORE.test(closureSrc(P.mainJs)), 'BARE_CORE stopped matching').toBe(true)
  })

  it.skipIf(!distExists())('CONTROL — the raw-literal layer trips on the main closure too', () => {
    // §0 C14's own control. Without it, a FORBIDDEN_RAW entry that no longer
    // appears anywhere would turn the raw case below into a vacuous pass.
    const src = closureSrc(P.mainJs)
    for (const needle of FORBIDDEN_RAW) {
      if (needle === 'sonner') continue // kept out of main by design (check-no-sonner-in-main.sh)
      const hit = typeof needle === 'string' ? src.includes(needle) : needle.test(src)
      expect(hit, `main should contain the raw literal ${needle}`).toBe(true)
    }
  })

  it.skipIf(!distExists())('the engine JS closure names none of the React-side specifiers', () => {
    for (const entry of [P.engineJs, P.engineCjs]) {
      const src = closureSrc(entry)
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(src), `${entry} closure imports ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('…and none of them as a RAW literal either (§0 C14)', () => {
    // The layer that `specifierPattern` cannot provide. Measured: the main
    // closure contains `a("@tour-kit/scheduling")` — esbuild renamed the local
    // `require` binding, so the specifier matcher is blind to it. Any forbidden
    // name reached the same way would be invisible in exactly the same manner.
    for (const entry of [P.engineJs, P.engineCjs]) {
      const src = closureSrc(entry)
      for (const needle of FORBIDDEN_RAW) {
        const hit = typeof needle === 'string' ? src.includes(needle) : needle.test(src)
        expect(hit, `${entry} closure contains the raw literal ${needle}`).toBe(false)
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
    // Bare `@tour-kit/core` would pull the main barrel's providers, fourteen
    // hooks and `UnifiedSlot` into a Vue consumer's graph.
    for (const entry of [P.engineJs, P.engineCjs, P.engineDts, P.engineDcts]) {
      const src = closureSrc(entry)
      expect(BARE_CORE.test(src), `${entry} closure imports bare @tour-kit/core`).toBe(false)
      expect(
        specifierPattern('@tour-kit/core').test(src),
        `${entry} closure does not reach core at all`
      ).toBe(true)
    }
  })

  it.skipIf(!distExists())('scheduling is present, and ONLY at its /engine subpath', () => {
    // Decision 7b. The optional peer is measured-present in the JS closure —
    // through the call-time resolver, which is why it is a raw substring here
    // and not `specifierPattern` (§0 C14). In the DECLARATION closure the bare
    // main entry must be absent: its `.d.ts` names `react` four times, so a
    // `Schedule` typed from it would put React back in this chain.
    expect(
      closureSrc(P.engineJs).includes('@tour-kit/scheduling'),
      'engine lost the optional scheduling peer'
    ).toBe(true)
    for (const entry of [P.engineDts, P.engineDcts]) {
      expect(
        BARE_SCHEDULING.test(closureSrc(entry)),
        `${entry} types Schedule from the React-carrying main entry`
      ).toBe(false)
    }
  })

  it.skipIf(!distExists())('core is externalised, not bundled in', () => {
    // Read the CLOSURE, not the entry: the entry is a shell and the case would
    // be vacuous forever. `createTourEngine` is a core symbol announcements
    // imports nowhere, so its appearance means core's source was inlined.
    for (const entry of [P.engineJs, P.engineCjs]) {
      expect(closureSrc(entry), `${entry} inlined core`).not.toMatch(/createTourEngine/)
    }
    expect(closureSrc(P.mainJs), 'main inlined core').not.toMatch(/createTourEngine/)
  })

  it.skipIf(!distExists())("'use client' lands on the React entries only", () => {
    // §0 C12: this package stamps FOUR entries, not one pair. `tailwind/index`
    // is deliberately absent — it is a build-time Node module.
    expect(startsWithClientDirective(P.engineJs)).toBe(false)
    expect(startsWithClientDirective(P.engineCjs)).toBe(false)
    for (const name of ['index', 'headless', 'changelog/index', 'adapters/sonner']) {
      expect(startsWithClientDirective(join(PKG_ROOT, 'dist', `${name}.js`)), name).toBe(true)
      expect(startsWithClientDirective(join(PKG_ROOT, 'dist', `${name}.cjs`)), name).toBe(true)
    }
    expect(startsWithClientDirective(join(PKG_ROOT, 'dist', 'tailwind/index.js'))).toBe(false)
  })

  it.skipIf(!distExists())('every path the ./engine exports block names resolves', () => {
    assertEngineExportsResolve(expect, PKG_ROOT)
  })

  it('every source file the engine barrel reaches is React-free and avoids ../types', () => {
    const files = reachableFrom(BARREL)
    // A silently-empty walk passes every assertion below it forever. Say out
    // loud what it must have found.
    expect(files.some((f) => f.endsWith('lib/announcements-engine/reducer.ts'))).toBe(true)
    expect(
      files.some((f) => f.endsWith('lib/announcements-engine/create-announcements-engine.ts'))
    ).toBe(true)
    expect(files.some((f) => f.endsWith('lib/announcements-engine/eligibility.ts'))).toBe(true)
    // The wider allow-set is real: the barrel reaches src/core/ on purpose.
    expect(files.some((f) => f.endsWith(join('src', 'core', 'scheduler.ts')))).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(12)

    // §0 C4: `src/core/` is allowed, `src/types/` is not — that is the rule
    // that still discriminates once the allow-set widens.
    const ALLOWED = [join('lib', 'announcements-engine'), join('src', 'core')]
    // `../types` and `../../types` only. `./types` is the ENGINE's own React-free
    // types file, which every module here is supposed to import.
    const REACT_TYPES_BARREL = /from ['"](\.\.\/)+types(\/[a-z-]+)?['"]/

    for (const file of files) {
      // COMMENTS STRIPPED. A specifier matcher cannot distinguish an import
      // from a doc comment quoting one, and three engine-reachable files here
      // carry exactly such comments (see `readCode`'s own note).
      const source = readCode(file)
      expect(file.endsWith('.tsx'), `${file} is a React file`).toBe(false)
      if (file !== BARREL) {
        expect(
          ALLOWED.some((dir) => file.includes(dir)),
          `${file} is reachable from the engine barrel but is outside the allow-set`
        ).toBe(true)
      }
      expect(
        REACT_TYPES_BARREL.test(source),
        `${file} imports the React types barrel — types/announcement.ts imports react`
      ).toBe(false)
      expect(specifierPattern('react').test(source), `${file} imports react`).toBe(false)
      expect(
        specifierPattern('@tour-kit/media').test(source),
        `${file} imports @tour-kit/media`
      ).toBe(false)
      expect(BARE_CORE.test(source), `${file} imports bare @tour-kit/core`).toBe(false)
      // `from` only, NOT the full SPECIFIER_PREFIX. The runtime
      // `require('@tour-kit/scheduling')` in `core/resolve-schedule.ts` is the
      // optional-peer load and is deliberate (Decision 7b); what must never
      // appear is a static import of the bare main entry, whose `.d.ts` names
      // react four times. Measured: a `require(` -inclusive pattern also trips
      // on doc comments that quote the call, which is prose, not a dependency.
      expect(
        /from ['"]@tour-kit\/scheduling['"]/.test(source),
        `${file} imports the bare @tour-kit/scheduling entry — use /engine`
      ).toBe(false)
    }
  })

  it('the engine entry is never stamped with a client directive', () => {
    // The source half of the `'use client'` byte case above: adding the engine
    // entry to `injectUseClient` is a one-word change that the built-bytes case
    // only catches after a rebuild.
    assertEngineNotInInjectUseClient(expect, PKG_ROOT)
  })
})
