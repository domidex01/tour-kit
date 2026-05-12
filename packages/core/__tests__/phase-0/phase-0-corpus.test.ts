import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

const REPO = repoRoot()
const FIXTURES = 'packages/codemods/__tests__/fixtures/joyride'
const dir = join(REPO, FIXTURES)

const j = jscodeshift.withParser('tsx')

describe('Phase 0 — Joyride fixture corpus', () => {
  const inputs = readdirSync(dir).filter((f) => f.endsWith('.input.tsx'))
  const all = readdirSync(dir)

  it('contains at least 4 input fixtures', () => {
    expect(inputs.length).toBeGreaterThanOrEqual(4)
  })

  it.each(inputs)('%s has a matching .expected.tsx', (input) => {
    const expected = input.replace('.input.tsx', '.expected.tsx')
    expect(all).toContain(expected)
  })

  it.each(inputs)('%s parses as TSX without errors', (input) => {
    const source = readFileSync(join(dir, input), 'utf8')
    expect(() => j(source)).not.toThrow()
  })

  it.each(inputs)('%s expected counterpart parses as TSX without errors', (input) => {
    const expected = input.replace('.input.tsx', '.expected.tsx')
    const source = readFileSync(join(dir, expected), 'utf8')
    expect(() => j(source)).not.toThrow()
  })
})
