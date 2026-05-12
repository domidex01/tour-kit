import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

const REPO = repoRoot()
const SPIKE_REL = 'packages/codemods/__spike__/transform.ts'
const SPIKE_ABS = join(REPO, SPIKE_REL)
const FIXTURE_REL = 'packages/codemods/__tests__/fixtures/joyride/joyride-jsx-basic.input.tsx'
const FIXTURE_ABS = join(REPO, FIXTURE_REL)

describe('Phase 0 — jscodeshift spike round-trip', () => {
  if (!existsSync(SPIKE_ABS)) {
    it.skip('spike transform is gitignored away in this checkout', () => {})
    return
  }

  it('renames react-joyride import to @tour-kit/react and round-trips through TSX', async () => {
    const module = (await import(SPIKE_ABS)) as {
      default: (file: { source: string; path: string }, api: unknown, options: unknown) => string
      parser?: string
    }

    const j = jscodeshift.withParser('tsx')
    const api = {
      jscodeshift: j,
      j,
      stats: () => {},
      report: () => {},
    }

    const source = readFileSync(FIXTURE_ABS, 'utf8')
    const output = module.default({ source, path: FIXTURE_REL }, api, {})

    expect(typeof output).toBe('string')
    expect(output).toMatch(/from '@tour-kit\/react'/)
    expect(output).not.toContain('[object Object]')

    expect(() => j(output)).not.toThrow()
  })
})
