import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import transform from '../transforms/from-joyride'
import { normalize, reparses, runTransform, tscNoEmit } from './_helpers'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')
const inputs = readdirSync(FIXTURES)
  .filter((f) => f.endsWith('.input.tsx'))
  .sort()

interface FixtureResult {
  name: string
  diffOk: boolean
  reparses: boolean
  tscOk: boolean
  tscOutput: string
  actual: string
  expected: string
}

const results: FixtureResult[] = inputs.map((file) => {
  const name = file.replace('.input.tsx', '')
  const expectedPath = join(FIXTURES, `${name}.expected.tsx`)
  if (!existsSync(expectedPath)) {
    return {
      name,
      diffOk: false,
      reparses: false,
      tscOk: false,
      tscOutput: `expected file missing: ${expectedPath}`,
      actual: '',
      expected: '',
    }
  }

  const source = readFileSync(join(FIXTURES, file), 'utf8')
  const expected = readFileSync(expectedPath, 'utf8')
  const actual = runTransform(transform, source, file)
  const diffOk = normalize(actual) === normalize(expected)
  const reparsed = reparses(actual)
  const tsc = tscNoEmit(actual)
  return {
    name,
    diffOk,
    reparses: reparsed,
    tscOk: tsc.ok,
    tscOutput: tsc.output,
    actual,
    expected,
  }
})

describe('Joyride transform — per-fixture diff against expected output', () => {
  for (const r of results) {
    it(`${r.name} matches expected output (normalized whitespace)`, () => {
      if (!r.diffOk) {
        // Surface the actual output to help iteration when the diff fails.
        // Vitest assertion below is the source of truth; the console hint
        // is just for the developer.
        // eslint-disable-next-line no-console
        console.error(`--- ${r.name} actual ---\n${r.actual}`)
      }
      expect(r.diffOk, `normalized diff mismatch for ${r.name}`).toBe(true)
    })
  }
})

describe('Joyride transform — every output is parseable TSX', () => {
  for (const r of results) {
    it(`${r.name} reparses through jscodeshift`, () => {
      expect(r.reparses, `output is not parseable TSX for ${r.name}`).toBe(true)
    })
  }
})

describe('Joyride transform — every passing output is tsc --noEmit clean', () => {
  for (const r of results) {
    if (!r.diffOk) continue
    it(`${r.name} output passes tsc --noEmit`, () => {
      expect(r.tscOk, r.tscOutput).toBe(true)
    })
  }
})

describe('Joyride transform — coverage gate', () => {
  it('hits ≥80% of committed fixtures with diff AND tsc clean', () => {
    const passed = results.filter((r) => r.diffOk && r.tscOk).length
    const total = results.length
    const ratio = total > 0 ? passed / total : 0
    const failing = results.filter((r) => !(r.diffOk && r.tscOk)).map((r) => r.name)
    expect(
      ratio,
      `passed ${passed}/${total}; failing: ${failing.join(', ')}`
    ).toBeGreaterThanOrEqual(0.8)
  })

  it('includes at least one JSX-form AND one useJoyride-hook-form fixture in the pass-set', () => {
    const passed = results.filter((r) => r.diffOk && r.tscOk).map((r) => r.name)
    expect(passed.some((n) => n.startsWith('joyride-jsx'))).toBe(true)
    expect(passed.some((n) => n.startsWith('useJoyride'))).toBe(true)
  })
})
