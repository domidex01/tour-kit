// ANTI-DRIFT META-TEST — the CLAUDE.md coverage claim must match the enforced
// per-package thresholds. Without this, an author could raise a config and forget
// the doc (or vice-versa) and the headline claim silently becomes a lie again —
// the exact failure Slice 0 left behind.
//
// Models: no-zod-in-main.test.ts (file scan) + vitest-config-alignment.test.ts
// (config read). The ENFORCED_FLOORS table below is the single source of truth;
// a future slice that raises a config updates this table AND the CLAUDE.md line
// in the SAME change — the test reds if it touches only one.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..', '..', '..')

type Floor = { statements: number; branches: number; functions: number; lines: number }
const METRICS = ['statements', 'branches', 'functions', 'lines'] as const

// The canonical repo shape. NOTE branches is 75, not 80 — so "clears canonical"
// is the right yardstick, not "≥80 on all four" (no package with branches:75 can
// meet that). A package is "reduced" when any metric sits below this shape.
const CANONICAL: Floor = { statements: 80, branches: 75, functions: 80, lines: 80 }

// The five packages Slice 7 raised from the phase-5 lows. Single source of truth.
const ENFORCED_FLOORS: Record<string, Floor> = {
  scheduling: { statements: 75, branches: 65, functions: 80, lines: 75 },
  media: { statements: 70, branches: 60, functions: 70, lines: 70 },
  surveys: { statements: 80, branches: 75, functions: 80, lines: 80 },
  announcements: { statements: 75, branches: 70, functions: 80, lines: 75 },
  core: { statements: 80, branches: 75, functions: 80, lines: 80 }, // branches raised 65→75
}

function readConfig(pkg: string): string {
  return readFileSync(join(REPO_ROOT, 'packages', pkg, 'vitest.config.ts'), 'utf8')
}

/** Pull a numeric threshold out of a `thresholds:` block, e.g. `branches: 75`. */
function thresholdOf(cfg: string, metric: (typeof METRICS)[number]): number {
  const m = cfg.match(new RegExp(`${metric}:\\s*(\\d+)`))
  expect(m, `no ${metric} threshold found`).not.toBeNull()
  return Number((m as RegExpMatchArray)[1])
}

function isReduced(floor: Floor): boolean {
  return METRICS.some((m) => floor[m] < CANONICAL[m])
}

// Extract the full "Test coverage" bullet (the line + its indented continuation
// lines) so the claim can span multiple lines and still be checked as one block.
const CLAUDE_MD = readFileSync(join(REPO_ROOT, 'CLAUDE.md'), 'utf8')
const claimBlock = (() => {
  const lines = CLAUDE_MD.split('\n')
  const start = lines.findIndex((l) => /Test coverage/i.test(l))
  if (start === -1) return ''
  let block = lines[start]
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/^- /.test(l) || /^#{1,6}\s/.test(l) || l.trim() === '') break
    block += `\n${l}`
  }
  return block
})()

describe('coverage claim ⟂ enforced config (anti-drift)', () => {
  it('each config enforces AT LEAST the floor this slice promised', () => {
    for (const [pkg, floor] of Object.entries(ENFORCED_FLOORS)) {
      const cfg = readConfig(pkg)
      for (const metric of METRICS) {
        expect(
          thresholdOf(cfg, metric),
          `${pkg}.${metric} config threshold dropped below the Slice-7 floor`
        ).toBeGreaterThanOrEqual(floor[metric])
      }
    }
  })

  it('the CLAUDE.md claim is present, not a placeholder, and points at the per-package configs', () => {
    expect(claimBlock, 'no "Test coverage" claim found in CLAUDE.md').not.toBe('')
    expect(claimBlock, 'CLAUDE.md coverage claim still reads as a placeholder').not.toMatch(
      /placeholder/i
    )
    // It must NOT assert a blanket > 80% it cannot keep (feature packages are below 80).
    expect(claimBlock, 'claim asserts a blanket >80% it does not enforce').not.toMatch(
      /coverage\s*>\s*80%\s*$/im
    )
    // It must direct readers to the enforced source of truth.
    expect(claimBlock, 'claim must say thresholds are per-package').toMatch(/per-package/i)
    expect(claimBlock, 'claim must reference the per-package vitest.config enforcement').toMatch(
      /vitest\.config/i
    )
  })

  it('every below-canonical package is named in the claim', () => {
    for (const [pkg, floor] of Object.entries(ENFORCED_FLOORS)) {
      if (isReduced(floor)) {
        expect(claimBlock, `claim omits ${pkg}, which enforces a below-canonical floor`).toMatch(
          new RegExp(`\\b${pkg}\\b`, 'i')
        )
      }
    }
  })

  it('no phase-5 "temporarily lowered" / issues/13 follow-up comment survives in the raised configs', () => {
    for (const pkg of Object.keys(ENFORCED_FLOORS)) {
      const cfg = readConfig(pkg)
      expect(cfg, `${pkg} still carries a phase-5 lowered comment`).not.toMatch(
        /temporarily lowered/i
      )
      expect(cfg, `${pkg} still carries a stale issues/13 follow-up link`).not.toMatch(
        /Follow-up:\s*https:\/\/github\.com\/[^\s]+\/issues\/13\b/
      )
    }
  })
})
