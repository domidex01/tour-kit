import { existsSync, statSync } from 'node:fs'
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
})
