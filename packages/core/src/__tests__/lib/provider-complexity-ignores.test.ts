import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const COMPLEXITY_IGNORE = /noExcessiveCognitiveComplexity/g

describe('Phase 5 — provider complexity ignores (M5 gate)', () => {
  it('tour-provider keeps exactly 3 noExcessiveCognitiveComplexity ignores (reducer, flow restore, prev)', () => {
    const src = readFileSync(resolve(__dirname, '../../context/tour-provider.tsx'), 'utf-8')
    const matches = src.match(COMPLEXITY_IGNORE) ?? []
    expect(matches.length, 'expected reducer + flow-restore + prev only').toBe(3)
  })
})
