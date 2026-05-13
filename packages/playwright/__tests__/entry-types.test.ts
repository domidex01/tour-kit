import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')

/**
 * Both d.ts surfaces ship to consumers via the package `exports` field — ESM
 * via `.types: ./dist/index.d.ts`, CJS via `require.types: ./dist/index.d.cts`.
 * tsup normally emits identical content, but a future conditional re-export
 * could diverge; assert the strict-typing promise holds on BOTH.
 */
const DTS_FILES = ['index.d.ts', 'index.d.cts'].map((f) => join(DIST, f))

describe('@tour-kit/playwright — strict typings', () => {
  it.each(DTS_FILES)('%s contains zero `any` types', (file) => {
    if (!existsSync(file)) {
      // Fail loudly rather than silently passing — a missing dist means the
      // gate didn't actually run, which is worse than a real `any` slipping in.
      expect.fail(
        `Missing ${file}. Run \`pnpm --filter @tour-kit/playwright build\` before this test.`
      )
    }
    const dts = readFileSync(file, 'utf8')
    // Word-boundary regex so we don't count `many`, `company`, etc.
    const matches = dts.match(/\bany\b/g) ?? []
    expect(matches.length).toBe(0)
  })
})
