import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * US-1: a Svelte developer gets the whole engine with no React installed.
 *
 * The POSITIVE CONTROL is not decoration. A bare
 * `expect(dist).not.toContain('react')` passes when the path is wrong, when the
 * build never ran, or when the matcher is broken — and it passes forever.
 * `svelte` is `external` in tsup, so the built file genuinely names it; if that
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
 */
const distExists = () => existsSync(ESM) && existsSync(CJS) && existsSync(DTS)

const FORBIDDEN = ['react', 'react-dom', 'clsx', 'tailwind-merge', 'zod']

describe('@tour-kit/svelte ships no React', () => {
  it.skipIf(!distExists())('CONTROL — the built files name `svelte`, so the scan works', () => {
    for (const file of [ESM, CJS, DTS]) {
      expect(
        specifierPattern('svelte').test(readFileSync(file, 'utf8')),
        `${file} names svelte`
      ).toBe(true)
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

  it('the source never imports the bare main entry either', async () => {
    const { globSync } = await import('node:fs')
    const files = globSync('src/**/*.ts', { cwd: PKG_ROOT })
    for (const rel of files) {
      const source = readFileSync(join(PKG_ROOT, rel), 'utf8')
      expect(/from\s*["']@tour-kit\/core["']/.test(source), `${rel} imports bare core`).toBe(false)
      expect(/from\s*["']react["']/.test(source), `${rel} imports react`).toBe(false)
    }
  })
})
