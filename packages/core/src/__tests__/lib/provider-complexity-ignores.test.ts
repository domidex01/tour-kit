import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const COMPLEXITY_IGNORE = /noExcessiveCognitiveComplexity/g

describe('Phase 5 — provider complexity ignores (M5 gate)', () => {
  // Ratchet, not a floor. v2 §1.3 walks this down as engine logic leaves the
  // provider: the reducer's ignore went with it in §1.3a (3 -> 2), the
  // flow-restore effect's goes in §1.3c, `prev`'s in §1.3d. Lower it with each
  // slice; never raise it.
  it('tour-provider keeps exactly 2 noExcessiveCognitiveComplexity ignores (flow restore, prev)', () => {
    const src = readFileSync(resolve(__dirname, '../../context/tour-provider.tsx'), 'utf-8')
    const matches = src.match(COMPLEXITY_IGNORE) ?? []
    expect(matches.length, 'expected flow-restore + prev only').toBe(2)
  })
})
