import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SNAP = join(__dirname, '..', '..', '..', '..', 'plan', 'code-health-coverage-snapshot.md')

const PACKAGES = [
  'core',
  'react',
  'hints',
  'adoption',
  'announcements',
  'checklists',
  'media',
  'surveys',
  'analytics',
  'scheduling',
  'license',
  'ai',
] as const

describe('Phase 5 — coverage snapshot shape contract', () => {
  it('snapshot file exists', () => {
    expect(existsSync(SNAP)).toBe(true)
  })

  it('contains a BEFORE section and an AFTER section', () => {
    const txt = readFileSync(SNAP, 'utf8')
    expect(txt).toMatch(/BEFORE/i)
    expect(txt).toMatch(/AFTER/i)
  })

  it('lists every package by name', () => {
    const txt = readFileSync(SNAP, 'utf8')
    for (const pkg of PACKAGES) {
      expect(txt, `package @tour-kit/${pkg} missing from snapshot`).toMatch(
        new RegExp(`@tour-kit/${pkg}\\b`)
      )
    }
  })

  it('every package row carries a Gate Posture value', () => {
    const txt = readFileSync(SNAP, 'utf8')
    const POSTURE = /(PASS|TESTS_WRITTEN|THRESHOLD_LOWERED|NOT_RUN)/
    const lines = txt.split('\n')
    for (const pkg of PACKAGES) {
      const row = lines.find((l) => l.includes(`@tour-kit/${pkg}`) && POSTURE.test(l))
      expect(row, `@tour-kit/${pkg} row missing Gate Posture value`).toBeDefined()
    }
  })

  it('every THRESHOLD_LOWERED row has a follow-up GitHub issue URL', () => {
    const txt = readFileSync(SNAP, 'utf8')
    const rows = txt.match(/THRESHOLD_LOWERED[^\n]*/g) ?? []
    for (const row of rows) {
      expect(row, `THRESHOLD_LOWERED row missing follow-up: ${row}`).toMatch(
        /https:\/\/github\.com\/.+\/issues\/\d+/
      )
    }
  })
})
