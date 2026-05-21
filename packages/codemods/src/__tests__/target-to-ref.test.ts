/**
 * Phase 5 — target-to-ref codemod fixture suite.
 *
 * Five canonical fixture pairs plus an idempotency assertion. Each pair is
 * `<name>.input.tsx` → `<name>.output.tsx` under the sibling `fixtures/`
 * directory. The test reads each input, runs the transform, and compares the
 * result against the expected output via `normalize` (whitespace-insensitive)
 * to absorb harmless formatter drift between local + CI runs.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import transform from '../transforms/target-to-ref'
import { normalize, reparses, runTransform } from './_helpers'

const FIXTURE_DIR = join(__dirname, '..', '..', '__tests__', 'fixtures', 'target-to-ref')

function readFixture(name: string, suffix: 'input' | 'output'): string {
  return readFileSync(join(FIXTURE_DIR, `${name}.${suffix}.tsx`), 'utf8')
}

const FIXTURES = [
  'happy-path-single',
  'happy-path-multi',
  'no-ref-in-scope',
  'already-ref',
  'mixed-bag',
  // Top-level `return <TourStep target="#orphan" />` — no JSX children array
  // available, so the transform leaves the attribute alone (no rewrite, no
  // TODO) rather than emit a comment that ASI would render unreachable.
  'top-level-no-ref',
] as const

describe('target-to-ref codemod', () => {
  for (const name of FIXTURES) {
    it(`fixture: ${name}`, () => {
      const input = readFixture(name, 'input')
      const expected = readFixture(name, 'output')
      const actual = runTransform(transform, input, `${name}.input.tsx`)
      expect(normalize(actual)).toBe(normalize(expected))
      expect(reparses(actual)).toBe(true)
    })
  }

  it('is idempotent: running twice on happy-path-single yields the same output', () => {
    const input = readFixture('happy-path-single', 'input')
    const firstPass = runTransform(transform, input, 'happy-path-single.input.tsx')
    const secondPass = runTransform(transform, firstPass, 'happy-path-single.input.tsx')
    expect(normalize(secondPass)).toBe(normalize(firstPass))
  })

  it('is idempotent: running twice on no-ref-in-scope does not stack TODO comments', () => {
    const input = readFixture('no-ref-in-scope', 'input')
    const firstPass = runTransform(transform, input, 'no-ref-in-scope.input.tsx')
    const secondPass = runTransform(transform, firstPass, 'no-ref-in-scope.input.tsx')
    const todoCount = (firstPass.match(/target-to-ref/g) ?? []).length
    const todoCountSecond = (secondPass.match(/target-to-ref/g) ?? []).length
    expect(todoCount).toBe(1)
    expect(todoCountSecond).toBe(1)
  })
})
