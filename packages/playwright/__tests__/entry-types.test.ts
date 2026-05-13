import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DTS = join(__dirname, '..', 'dist', 'index.d.ts')

describe('@tour-kit/playwright — strict typings', () => {
  it('built dist/index.d.ts exists (run `pnpm --filter @tour-kit/playwright build` first)', () => {
    expect(existsSync(DTS)).toBe(true)
  })

  it('public surface contains zero `any` types', () => {
    if (!existsSync(DTS)) {
      // The previous test already failed loudly — short-circuit so this
      // assertion reports the meaningful "0 any" expectation.
      return
    }
    const dts = readFileSync(DTS, 'utf8')
    // Word-boundary regex so we don't count `many`, `company`, etc.
    const matches = dts.match(/\bany\b/g) ?? []
    expect(matches.length).toBe(0)
  })
})
