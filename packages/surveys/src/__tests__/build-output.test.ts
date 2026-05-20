import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIST = resolve(__dirname, '../../dist')

describe('Build output verification', () => {
  it('index entry point produces ESM, CJS, and declaration files', () => {
    const files = ['index.js', 'index.cjs', 'index.d.ts', 'index.d.cts']

    for (const file of files) {
      const filePath = resolve(DIST, file)
      expect(existsSync(filePath), `missing: dist/${file}`).toBe(true)
      expect(statSync(filePath).size, `empty: dist/${file}`).toBeGreaterThan(0)
    }
  })

  it('headless entry point produces ESM, CJS, and declaration files', () => {
    const files = ['headless.js', 'headless.cjs', 'headless.d.ts', 'headless.d.cts']

    for (const file of files) {
      const filePath = resolve(DIST, file)
      expect(existsSync(filePath), `missing: dist/${file}`).toBe(true)
      expect(statSync(filePath).size, `empty: dist/${file}`).toBeGreaterThan(0)
    }
  })

  it('CSS variables file is copied to dist/styles/', () => {
    const cssPath = resolve(DIST, 'styles/variables.css')
    expect(existsSync(cssPath), 'missing: dist/styles/variables.css').toBe(true)
  })

  // ── Phase 2 (v2-package-polish) — turnkey modal export + budget ──────────
  it('exposes CsatModal / NpsModal / CesModal as ESM exports', () => {
    const esm = readFileSync(resolve(DIST, 'index.js'), 'utf8')
    for (const name of ['CsatModal', 'NpsModal', 'CesModal']) {
      expect(esm, `missing export: ${name}`).toMatch(new RegExp(`\\b${name}\\b`))
    }
  })

  it('exposes computeNpsCategory / computeCesCategory as ESM exports', () => {
    const esm = readFileSync(resolve(DIST, 'index.js'), 'utf8')
    for (const name of ['computeNpsCategory', 'computeCesCategory']) {
      expect(esm, `missing export: ${name}`).toMatch(new RegExp(`\\b${name}\\b`))
    }
  })

  it('exposes the same turnkey exports in the .d.ts declarations', () => {
    const dts = readFileSync(resolve(DIST, 'index.d.ts'), 'utf8')
    for (const name of [
      'CsatModal',
      'NpsModal',
      'CesModal',
      'CsatModalProps',
      'NpsModalProps',
      'CesModalProps',
      'NpsCategory',
      'CesCategory',
    ]) {
      expect(dts, `missing declaration: ${name}`).toMatch(new RegExp(`\\b${name}\\b`))
    }
  })
})
