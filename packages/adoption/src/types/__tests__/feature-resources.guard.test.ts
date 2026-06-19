import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Slice 5 (D3) — `FeatureResources` and `Feature.resources` were typed-but-dead
 * (no runtime consumer) and PUBLICLY re-exported from two barrels
 * (`index.ts`, `types/index.ts`). A `@ts-expect-error` in a test file is not
 * enforced here (the package `typecheck` excludes tests and vitest does not
 * typecheck), so the deletion is proven the same way `no-zod-in-main.test.ts`
 * proves a dependency is gone: a recursive source scan. The interface name is
 * referenced by the interface decl, the field type, and both re-exports, so a
 * single "no `FeatureResources` anywhere in src" assertion covers all four.
 */

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '../../') // types/__tests__ -> types -> src

function collectTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue // scan production src only
      out.push(...collectTsFiles(full))
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

describe('Slice 5 deletion guard — FeatureResources is gone (D3)', () => {
  const files = collectTsFiles(SRC)

  it('finds zero occurrences of FeatureResources across adoption/src', () => {
    const offenders = files.filter((f) => /FeatureResources/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('Feature no longer carries a resources field (feature.ts)', () => {
    const feature = readFileSync(join(SRC, 'types/feature.ts'), 'utf8')
    expect(feature).not.toMatch(/resources\?:/)
  })
})
