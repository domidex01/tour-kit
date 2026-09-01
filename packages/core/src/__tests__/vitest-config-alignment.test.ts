import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

const REPO_ROOT = join(__dirname, '..', '..', '..', '..')
const NON_AI = PACKAGES.filter((p) => p !== 'ai')

// Slice 7 (coverage truth) raised the phase-5 lows. Three feature packages
// enforce honest, below-canonical floors backed by real behavior tests; everyone
// else — including core and surveys, both restored — holds the canonical
// 80/75/80/80. `coverage-claim-alignment.test.ts` is the forward guard that keeps
// the CLAUDE.md claim in sync with these enforced numbers.
const REDUCED_FLOORS: Record<
  string,
  { statements: number; branches: number; functions: number; lines: number }
> = {
  announcements: { statements: 75, branches: 70, functions: 80, lines: 75 },
  scheduling: { statements: 75, branches: 65, functions: 80, lines: 75 },
  media: { statements: 70, branches: 60, functions: 70, lines: 70 },
}
const CANONICAL_THRESHOLDS = NON_AI.filter((p) => !(p in REDUCED_FLOORS))

function readConfig(pkg: string): string {
  return readFileSync(join(REPO_ROOT, 'packages', pkg, 'vitest.config.ts'), 'utf8')
}

function readSetup(pkg: string): string | null {
  const p = join(REPO_ROOT, 'packages', pkg, 'vitest.setup.ts')
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

describe('Phase 4 — vitest config alignment', () => {
  describe('Canonical fields (US-1)', () => {
    it.each(NON_AI)('%s has environment: jsdom', (pkg) => {
      expect(readConfig(pkg)).toMatch(/environment:\s*['"]jsdom['"]/)
    })

    it.each(CANONICAL_THRESHOLDS)('%s has canonical coverage thresholds', (pkg) => {
      const cfg = readConfig(pkg)
      expect(cfg).toMatch(/statements:\s*80\b/)
      expect(cfg).toMatch(/branches:\s*75\b/)
      expect(cfg).toMatch(/functions:\s*80\b/)
      expect(cfg).toMatch(/lines:\s*80\b/)
    })

    it.each(Object.entries(REDUCED_FLOORS))(
      '%s enforces its Slice-7 earned floor',
      (pkg, floor) => {
        const cfg = readConfig(pkg)
        expect(cfg).toMatch(new RegExp(`statements:\\s*${floor.statements}\\b`))
        expect(cfg).toMatch(new RegExp(`branches:\\s*${floor.branches}\\b`))
        expect(cfg).toMatch(new RegExp(`functions:\\s*${floor.functions}\\b`))
        expect(cfg).toMatch(new RegExp(`lines:\\s*${floor.lines}\\b`))
      }
    )

    it.each(NON_AI)(
      '%s no longer carries a phase-5 "temporarily lowered" / follow-up comment',
      (pkg) => {
        const cfg = readConfig(pkg)
        expect(cfg, `${pkg} still carries a phase-5 lowered comment`).not.toMatch(
          /temporarily lowered/i
        )
        expect(cfg, `${pkg} still carries a stale issues/13 follow-up link`).not.toMatch(
          /Follow-up:\s*https:\/\/github\.com\/[^\s]+\/issues\/13\b/
        )
      }
    )
  })

  describe('ai exception (US-6)', () => {
    it('ai uses node environment', () => {
      expect(readConfig('ai')).toMatch(/environment:\s*['"]node['"]/)
    })

    it('ai setup (if present) does not import vitest-axe', () => {
      const setup = readSetup('ai')
      if (setup === null) return
      expect(setup).not.toMatch(/vitest-axe/)
    })
  })

  describe('Setup files (US-3, US-5)', () => {
    it.each(NON_AI)('%s vitest.setup.ts imports vitest-axe/extend-expect', (pkg) => {
      const setup = readSetup(pkg)
      expect(setup, `${pkg}/vitest.setup.ts missing`).not.toBeNull()
      expect(setup as string).toMatch(/['"]vitest-axe\/extend-expect['"]/)
    })
  })

  describe('package.json catalog references (US-2)', () => {
    it.each(NON_AI)('%s declares "vitest-axe": "catalog:"', (pkg) => {
      const pj = JSON.parse(
        readFileSync(join(REPO_ROOT, 'packages', pkg, 'package.json'), 'utf8')
      ) as { devDependencies?: Record<string, string> }
      expect(pj.devDependencies?.['vitest-axe']).toBe('catalog:')
    })

    it('ai does not declare vitest-axe', () => {
      const pj = JSON.parse(
        readFileSync(join(REPO_ROOT, 'packages', 'ai', 'package.json'), 'utf8')
      ) as { devDependencies?: Record<string, string> }
      expect(pj.devDependencies?.['vitest-axe']).toBeUndefined()
    })
  })

  describe('Workspace catalog pin (US-2)', () => {
    it('pins vitest-axe in pnpm-workspace.yaml catalog', () => {
      const ws = readFileSync(join(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf8')
      expect(ws).toMatch(/vitest-axe:\s*['"]?\^1\.0\.0-pre\.3['"]?/)
    })
  })
})
