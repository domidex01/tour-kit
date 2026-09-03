/**
 * v2 §1.2 — the dist-scan §1.1 deferred.
 *
 * §1.1 shipped a SOURCE scan (`no-react-in-engine-types.test.ts`) and said
 * plainly that the consumer-level guarantee belonged here, once the engine
 * subpath existed. This is that guarantee: what a Vue/Svelte consumer actually
 * downloads from `@tour-kit/core/engine` must name none of the five things
 * they do not have — `react`, `react-dom`, `clsx`, `tailwind-merge`, `zod`.
 *
 * Two traps this file is shaped around:
 *
 * 1. `dist/engine/index.js` is a ~800-byte re-export shell. `splitting: true`
 *    puts the real 42 files in a shared `chunk-*.js` beside it, so grepping the
 *    entry file passes forever — including the day a React import lands in the
 *    chunk. Every scan below reads the IMPORT CLOSURE (`readClosure`).
 * 2. A scan that can only ever pass proves nothing. The positive control at the
 *    bottom asserts the same scanner DOES find React in the main entry's
 *    closure, so a broken regex fails loudly instead of going quietly green.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// The same matcher the merge gate walks with — one definition, so a scan here
// and a measurement there cannot disagree about what a specifier is.
import { specifierPattern } from '../../../../tooling/bundle-check/closure.mjs'
import {
  ENGINE_CJS,
  ENGINE_DCTS,
  ENGINE_DTS,
  ENGINE_MJS,
  MAIN_CJS,
  MAIN_DTS,
  MAIN_MJS,
  distExists,
  readClosure,
} from './_dist'

/** A Vue consumer installs none of these. */
const FORBIDDEN = ['react', 'react-dom', 'clsx', 'tailwind-merge', 'zod'] as const

/** Every offending line, so a failure reads as "this import has to go". */
function offendingLines(source: string, pkg: string): string[] {
  const pattern = specifierPattern(pkg)
  return source
    .split('\n')
    .filter((line) => pattern.test(line))
    .map((line) => (line.length > 160 ? `${line.slice(0, 160)}…` : line))
}

const ENGINE_ENTRIES: Array<[label: string, path: string]> = [
  ['dist/engine/index.js (ESM runtime)', ENGINE_MJS],
  ['dist/engine/index.cjs (CJS runtime)', ENGINE_CJS],
  ['dist/engine/index.d.ts (ESM types)', ENGINE_DTS],
  ['dist/engine/index.d.cts (CJS types)', ENGINE_DCTS],
]

describe.skipIf(!distExists())('v2 §1.2 — the engine entry is emitted at all', () => {
  it.each(ENGINE_ENTRIES)('%s exists', (_label, path) => {
    // Assert the FILE, never the directory: tsup's `clean: true` leaves an
    // empty `dist/engine/` behind once the entry is removed, so a directory
    // check would pass on a build that emits nothing.
    expect(existsSync(path)).toBe(true)
  })
})

describe.skipIf(!distExists()).each(ENGINE_ENTRIES)(
  'v2 §1.2 — %s is React-free through its whole closure',
  (_label, path) => {
    it.each(FORBIDDEN)('names no `%s` specifier', (pkg) => {
      const { source } = readClosure(path)
      expect(offendingLines(source, pkg)).toEqual([])
    })
  }
)

/**
 * Unknown 3's hazard, made into a net. Core's `tsup.config.ts` hardcodes
 * `dist/index.js` / `dist/index.cjs` in its inline `onSuccess`, so the engine
 * entry is directive-free today by accident. The live risk is a future cleanup
 * PR migrating core to the shared `injectUseClient(...)` helper and passing the
 * full entry list — that would stamp `'use client'` onto the framework-agnostic
 * door. Both halves are asserted: dropping the directive from the main entry is
 * just as much a regression (it is what makes TourProvider work in RSC).
 */
describe.skipIf(!distExists())(
  "v2 §1.2 — the 'use client' directive lands on the React entry only",
  () => {
    // Deliberately NOT `readClosure`: the directive is a property of ONE
    // file's first bytes. Feeding a concatenated closure to a `^` anchor only
    // works because the entry happens to land first in the walk order, which
    // is not what this test means to assert.
    const startsWithDirective = (path: string) =>
      /^['"]use client['"];?/.test(readFileSync(path, 'utf8'))

    it('dist/engine/index.js does NOT start with it', () => {
      expect(startsWithDirective(ENGINE_MJS)).toBe(false)
    })

    it('dist/engine/index.cjs does NOT start with it', () => {
      expect(startsWithDirective(ENGINE_CJS)).toBe(false)
    })

    it('dist/index.js STILL starts with it', () => {
      expect(startsWithDirective(MAIN_MJS)).toBe(true)
    })

    it('dist/index.cjs STILL starts with it', () => {
      expect(startsWithDirective(MAIN_CJS)).toBe(true)
    })
  }
)

/**
 * Positive control for the scanner itself. The main entry legitimately imports
 * React — if this ever passes, `readClosure` or `specifierPattern` is broken
 * and every assertion above has been vacuously green.
 */
describe.skipIf(!distExists())('v2 §1.2 — the scanner can actually see an import (control)', () => {
  it('finds react in the main entry closure', () => {
    expect(offendingLines(readClosure(MAIN_MJS).source, 'react').length).toBeGreaterThan(0)
  })

  it('finds clsx in the main entry closure', () => {
    expect(offendingLines(readClosure(MAIN_MJS).source, 'clsx').length).toBeGreaterThan(0)
  })

  it('follows a .d.ts into its declaration chunk', () => {
    // `dist/index.d.ts` imports `./config-XXX.js` while the file on disk is
    // `config-XXX.d.ts`. If `resolveEmitted` stops following that twin, every
    // `.d.ts` scan above silently degrades to reading one re-export shell.
    const closure = readClosure(MAIN_DTS)
    expect(closure.files[0]).toBe(MAIN_DTS)
    expect(closure.files.length).toBeGreaterThan(1)
  })
})
