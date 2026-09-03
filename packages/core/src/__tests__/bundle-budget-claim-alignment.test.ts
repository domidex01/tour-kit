/**
 * v2 §1.2 — ANTI-DRIFT META-TEST for the one thing this task can break
 * silently.
 *
 * Adding a second tsup entry turns on code splitting: `dist/index.js` stops
 * being self-contained and drops ~31% in gzip while the closure a main-entry
 * consumer actually resolves goes UP. The merge gate
 * (`tooling/bundle-check/check-dist-gzip.mjs`) reads the entry file, so left
 * alone it would report a ~6 KB improvement for a ~1.2 KB regression, and
 * CLAUDE.md's core row would read "13.5 KB" with no code deleted. That number
 * is how a real regression gets merged six months from now.
 *
 * This test does not measure anything — `pnpm dist:size` does. It forces the
 * three places that STATE a budget to move together: the checker, the
 * CLAUDE.md claim, and `.size-limit.json`'s row list.
 *
 * Models `coverage-claim-alignment.test.ts`, which does the same job for the
 * coverage floors.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')

const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), 'utf8')

const CHECKER = 'tooling/bundle-check/check-dist-gzip.mjs'
const CLAUDE_MD = 'CLAUDE.md'
const SIZE_LIMIT = '.size-limit.json'

/** Pull `['<row>', '<path>', <budget>]` out of the checker's budgets table. */
function checkerBudget(row: string): number | null {
  const escaped = row.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = read(CHECKER).match(new RegExp(`\\['${escaped}',\\s*'[^']+',\\s*(\\d+)\\]`))
  return match ? Number(match[1]) : null
}

/** Pull the `<N KB` claim off a bullet in CLAUDE.md's per-package budget list. */
function claimedKb(pattern: RegExp): number | null {
  const match = read(CLAUDE_MD).match(pattern)
  return match ? Number(match[1]) : null
}

describe('v2 §1.2 — the bundle-size gate measures the engine entry too', () => {
  it('the checker has a core:engine row', () => {
    expect(
      checkerBudget('core:engine'),
      `no ['core:engine', …] row in ${CHECKER} — the engine door ships unmeasured`
    ).not.toBeNull()
  })

  it('.size-limit.json has an @tour-kit/core/engine row', () => {
    expect(read(SIZE_LIMIT)).toContain('@tour-kit/core/engine')
  })
})

describe('v2 §1.2 — the stated budgets agree with the enforced ones', () => {
  it('CLAUDE.md core budget matches the checker', () => {
    const budget = checkerBudget('core')
    const claimed = claimedKb(/^\s*-\s*core\s*<\s*(\d+)\s*KB/m)
    expect(claimed, 'no `- core <N KB` line in CLAUDE.md').not.toBeNull()
    expect(Math.round((budget as number) / 1000)).toBe(claimed)
  })

  it('CLAUDE.md engine budget matches the checker', () => {
    const budget = checkerBudget('core:engine')
    // Loose on wording, strict on the number — the coder picks the prose.
    const claimed = claimedKb(/^\s*-\s*[^\n]*engine[^\n]*<\s*(\d+)\s*KB/im)
    expect(claimed, 'no engine bullet with a `<N KB` budget in CLAUDE.md').not.toBeNull()
    expect(Math.round((budget as number) / 1000)).toBe(claimed)
  })
})
