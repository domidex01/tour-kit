import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * US-1: a Vue developer gets the whole engine with no React installed.
 *
 * The POSITIVE CONTROL is not decoration. A bare
 * `expect(dist).not.toContain('react')` passes when the path is wrong, when the
 * build never ran, or when the matcher is broken — and it passes forever.
 * `vue` is `external` in tsup, so the built file genuinely names it; if that
 * assertion fails, every negative one above it was meaningless.
 */
import { describe, expect, it } from 'vitest'
import { specifierPattern } from '../../../../tooling/bundle-check/closure.mjs'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ESM = join(PKG_ROOT, 'dist', 'index.js')
const CJS = join(PKG_ROOT, 'dist', 'index.cjs')
const DTS = join(PKG_ROOT, 'dist', 'index.d.ts')

/**
 * `splitting: false` and one entry, so `dist/index.js` IS the whole closure —
 * no `closureOf` walk needed. Core's `_dist.ts` `distExists()` checks core's
 * schemas entry and is useless here.
 *
 * This gates on the DIRECTORY, not on the three files, and that distinction is
 * the whole point. `it.skipIf(!distExists())` turns a wrong path into a SILENT
 * SKIP — measured: pointing `ESM` at a nonexistent filename left the suite
 * reporting "3 skipped" and green, which is exactly the vacuity the positive
 * control below exists to prevent. Gating on `dist/` means a genuine no-build
 * run still skips, while a wrong filename reaches the assertion in
 * `names the three built entry files` and fails loudly.
 */
const DIST = join(PKG_ROOT, 'dist')
const distExists = () => existsSync(DIST)

const FORBIDDEN = ['react', 'react-dom', 'clsx', 'tailwind-merge', 'zod']

describe('@tour-kit/vue ships no React', () => {
  it.skipIf(!distExists())('names the three built entry files', () => {
    // The guard against `distExists()` silently disarming everything below.
    for (const file of [ESM, CJS, DTS]) {
      expect(existsSync(file), `${file} missing — the scan below would skip`).toBe(true)
    }
  })

  it.skipIf(!distExists())('CONTROL — the built files name `vue`, so the scan works', () => {
    for (const file of [ESM, CJS, DTS]) {
      expect(specifierPattern('vue').test(readFileSync(file, 'utf8')), `${file} names vue`).toBe(
        true
      )
    }
  })

  it.skipIf(!distExists())('names none of the React-side specifiers', () => {
    for (const file of [ESM, CJS, DTS]) {
      const source = readFileSync(file, 'utf8')
      for (const pkg of FORBIDDEN) {
        expect(specifierPattern(pkg).test(source), `${file} must not import ${pkg}`).toBe(false)
      }
    }
  })

  it.skipIf(!distExists())('imports @tour-kit/core/engine, never the bare main entry', () => {
    for (const file of [ESM, CJS, DTS]) {
      const source = readFileSync(file, 'utf8')
      // The bare specifier pulls React into the .d.ts chain. `specifierPattern`
      // allows a `/subpath`, so match the exact bare form here.
      expect(/from\s*["']@tour-kit\/core["']/.test(source), `${file} imports bare core`).toBe(false)
      expect(specifierPattern('@tour-kit/core').test(source), `${file} imports core`).toBe(true)
    }
  })

  it('the source never imports the bare main entry either', () => {
    // `readdirSync(..., { recursive: true })`, NOT `fs.globSync`: globSync
    // landed in Node 22 and CI runs Node 20, so the glob version passed on
    // every modern local machine and could only ever fail in CI —
    // `TypeError: globSync is not a function`. Recursive readdir has been in
    // Node since 18.17 and returns the identical set (verified: 18 files here).
    const files = readdirSync(join(PKG_ROOT, 'src'), { recursive: true, encoding: 'utf8' })
    const sources = files.filter((f) => f.endsWith('.ts'))
    // This file's whole thesis is that a scan which cannot fail proves nothing.
    // An empty list — wrong join, moved directory — would pass every assertion
    // below it forever, so say out loud that there was something to scan.
    expect(sources.length, 'no source files found to scan').toBeGreaterThan(0)

    for (const rel of sources) {
      const source = readFileSync(join(PKG_ROOT, 'src', rel), 'utf8')
      expect(/from\s*["']@tour-kit\/core["']/.test(source), `${rel} imports bare core`).toBe(false)
      expect(/from\s*["']react["']/.test(source), `${rel} imports react`).toBe(false)
    }
  })
})
