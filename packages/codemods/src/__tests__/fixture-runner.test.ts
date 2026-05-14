import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXPERIMENTAL_TRANSFORMS } from '../cli'
import fromDriver from '../transforms/from-driver'
import fromJoyride from '../transforms/from-joyride'
import fromShepherd from '../transforms/from-shepherd'
import { normalize, reparses, runTransform, tscNoEmit } from './_helpers'

interface Source {
  name: 'joyride' | 'shepherd' | 'driver'
  transform: typeof fromJoyride
  // Joyride covers two distinct surface APIs; the gate asserts the pass-set
  // spans both. Other sources have a single surface.
  requirePairings?: ReadonlyArray<{ label: string; prefix: string }>
}

const SOURCES: readonly Source[] = [
  {
    name: 'joyride',
    transform: fromJoyride,
    requirePairings: [
      { label: 'JSX form', prefix: 'joyride-jsx' },
      { label: 'useJoyride hook form', prefix: 'useJoyride' },
    ],
  },
  { name: 'shepherd', transform: fromShepherd as unknown as typeof fromJoyride },
  { name: 'driver', transform: fromDriver as unknown as typeof fromJoyride },
]

interface FixtureResult {
  name: string
  diffOk: boolean
  reparses: boolean
  tscOk: boolean
  tscOutput: string
  actual: string
}

interface Computed {
  src: Source
  results: FixtureResult[]
  skip: boolean
}

const computed: Computed[] = SOURCES.map((src) => {
  const dir = join(__dirname, '..', '..', '__tests__', 'fixtures', src.name)
  if (!existsSync(dir)) {
    return { src, results: [], skip: true }
  }
  const inputs = readdirSync(dir)
    .filter((f) => f.endsWith('.input.tsx'))
    .sort()
  const results: FixtureResult[] = inputs.map((file) => {
    const name = file.replace('.input.tsx', '')
    const expectedPath = join(dir, `${name}.expected.tsx`)
    if (!existsSync(expectedPath)) {
      return {
        name,
        diffOk: false,
        reparses: false,
        tscOk: false,
        tscOutput: `expected file missing: ${expectedPath}`,
        actual: '',
      }
    }
    const inputSrc = readFileSync(join(dir, file), 'utf8')
    const expected = readFileSync(expectedPath, 'utf8')
    const actual = runTransform(src.transform, inputSrc, file)
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
    }
  })
  return { src, results, skip: false }
})

for (const { src, results, skip } of computed) {
  if (skip) {
    describe(`${src.name} fixtures`, () => {
      it.skip(`corpus not present at packages/codemods/__tests__/fixtures/${src.name} — Phase 0.6 may have been skipped`, () => {})
    })
    continue
  }

  describe(`${src.name} transform — per-fixture diff against expected output`, () => {
    for (const r of results) {
      it(`${r.name} matches expected output (normalized whitespace)`, () => {
        if (!r.diffOk) {
          console.error(`--- ${r.name} actual ---\n${r.actual}`)
        }
        expect(r.diffOk, `normalized diff mismatch for ${r.name}`).toBe(true)
      })
    }
  })

  describe(`${src.name} transform — every output is parseable TSX`, () => {
    for (const r of results) {
      it(`${r.name} reparses through jscodeshift`, () => {
        expect(r.reparses, `output is not parseable TSX for ${r.name}`).toBe(true)
      })
    }
  })

  describe(`${src.name} transform — every passing output is tsc --noEmit clean`, () => {
    for (const r of results) {
      if (!r.diffOk) continue
      it(`${r.name} output passes tsc --noEmit`, () => {
        expect(r.tscOk, r.tscOutput).toBe(true)
      })
    }
  })

  describe(`${src.name} transform — coverage gate`, () => {
    it('hits ≥80% of committed fixtures with diff AND tsc clean (OR is flagged experimental)', () => {
      const passed = results.filter((r) => r.diffOk && r.tscOk).length
      const total = results.length
      const ratio = total > 0 ? passed / total : 0
      const failing = results.filter((r) => !(r.diffOk && r.tscOk)).map((r) => r.name)
      const isExperimental = (EXPERIMENTAL_TRANSFORMS as ReadonlySet<string>).has(src.name)
      expect(
        ratio >= 0.8 || isExperimental,
        `${src.name} coverage ${(ratio * 100).toFixed(0)}% < 80% AND not flagged experimental — failing: ${failing.join(
          ', '
        )}`
      ).toBe(true)
    })

    const pairings = src.requirePairings
    if (pairings && pairings.length > 0) {
      it(`includes at least one of each required surface in the pass-set: ${pairings
        .map((p) => p.label)
        .join(', ')}`, () => {
        const passed = results.filter((r) => r.diffOk && r.tscOk).map((r) => r.name)
        for (const pairing of pairings) {
          expect(
            passed.some((n) => n.startsWith(pairing.prefix)),
            `no ${pairing.label} fixture in the pass-set (looked for prefix '${pairing.prefix}')`
          ).toBe(true)
        }
      })
    }
  })
}
