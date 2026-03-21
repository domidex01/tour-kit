import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIST = resolve(__dirname, '../../../dist')

const EXPECTED_FILES = [
  // Client entry
  'index.js',
  'index.cjs',
  'index.d.ts',
  'index.d.cts',
  // Server entry
  'server/index.js',
  'server/index.cjs',
  'server/index.d.ts',
  'server/index.d.cts',
  // Headless entry
  'headless.js',
  'headless.cjs',
  'headless.d.ts',
  'headless.d.cts',
  // Tailwind entry
  'tailwind/index.js',
  'tailwind/index.cjs',
  'tailwind/index.d.ts',
  'tailwind/index.d.cts',
]

describe('Build Output — US-1', () => {
  it.each(EXPECTED_FILES)('dist/%s exists', (file) => {
    const fullPath = resolve(DIST, file)
    expect(existsSync(fullPath)).toBe(true)
  })

  it('dist/ contains no unexpected __spikes__ directory', () => {
    const entries = readdirSync(DIST)
    expect(entries).not.toContain('__spikes__')
  })
})
