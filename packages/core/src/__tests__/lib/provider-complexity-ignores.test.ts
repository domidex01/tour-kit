import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const COMPLEXITY_IGNORE = /noExcessiveCognitiveComplexity/g

describe('Phase 5 — provider complexity ignores (M5 gate)', () => {
  // Ratchet, not a floor. v2 §1.3 walked this to zero as engine logic left the
  // provider: the reducer's ignore went with it in §1.3a (3 -> 2), the
  // flow-restore effect's in §1.3c (2 -> 1), `prev`'s in §1.3d (1 -> 0). The
  // provider is React wiring now; a new ignore here means engine logic has
  // crept back in. Never raise it.
  it('tour-provider needs no noExcessiveCognitiveComplexity ignore at all', () => {
    const src = readFileSync(resolve(__dirname, '../../context/tour-provider.tsx'), 'utf-8')
    const matches = src.match(COMPLEXITY_IGNORE) ?? []
    expect(matches.length, 'engine logic has crept back into the provider').toBe(0)
  })
})
