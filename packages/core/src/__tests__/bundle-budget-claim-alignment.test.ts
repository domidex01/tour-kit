/**
 * v2 §1.2 — ANTI-DRIFT META-TEST for the one thing this task can break
 * silently.
 *
 * Adding a second tsup entry turns on code splitting: `dist/index.js` stops
 * being self-contained and drops ~31% in gzip while the closure a main-entry
 * consumer actually resolves goes UP. Left alone, the gate would have reported
 * a ~6 KB improvement for a ~1.2 KB regression, and CLAUDE.md's core row would
 * read "13.5 KB" with no code deleted. That number is how a real regression
 * gets merged six months from now.
 *
 * This test does not measure anything — `pnpm dist:size` does. It forces the
 * places that STATE a budget to move together: the enforced table, the
 * CLAUDE.md claim, and `.size-limit.json`'s row list.
 *
 * It covers EVERY enforced row, not just the two §1.2 touched. The rows most
 * likely to drift are the ones a human just hand-edited in two files, and §1.2
 * re-baselined five of them (`hints`, `announcements`, `surveys`, `media`,
 * `ai:client`) — leaving those unguarded would have aimed the net away from the
 * change that prompted it. Proven in the same session: a hand-copied budget
 * table silently moved `analytics:amplitude` from 1000 to 1500.
 *
 * Models `coverage-claim-alignment.test.ts`, which does the same job for the
 * coverage floors.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// The enforced numbers themselves — imported, not regex-scraped out of the
// checker's source. `budgets.mjs` is a separate module from the script that
// runs them precisely so a test can read it without triggering a gate run.
import { budgets } from '../../../../tooling/bundle-check/budgets.mjs'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), 'utf8')

const CLAUDE_MD = 'CLAUDE.md'
const SIZE_LIMIT = '.size-limit.json'

/**
 * Where each enforced row is stated in CLAUDE.md's per-package budget list, and
 * how strictly the two must agree.
 *
 * `exact` — the doc names this package and one number; they must be equal, so a
 * gate raised without a doc edit fails here.
 * `ceiling` — the doc states one number for a group ("per-plugin <1.5 KB each")
 * and an individual row may be stricter, so the gate must be at or under it.
 *
 * Loose on wording, strict on the number: the regexes match the claim, not the
 * prose around it.
 */
const CLAIMS: Record<string, { pattern: RegExp; mode: 'exact' | 'ceiling' }> = {
  core: { pattern: /^\s*-\s*core\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  'core:engine': { pattern: /core\/engine[^\n]*?<\s*([\d.]+)\s*KB/, mode: 'exact' },
  react: { pattern: /^\s*-\s*react\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  hints: { pattern: /^\s*-\s*hints\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  'analytics:main': { pattern: /^\s*-\s*analytics\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  'analytics:posthog': { pattern: /per-plugin\s*<\s*([\d.]+)\s*KB/, mode: 'ceiling' },
  'analytics:mixpanel': { pattern: /per-plugin\s*<\s*([\d.]+)\s*KB/, mode: 'ceiling' },
  'analytics:amplitude': { pattern: /per-plugin\s*<\s*([\d.]+)\s*KB/, mode: 'ceiling' },
  'analytics:ga': { pattern: /per-plugin\s*<\s*([\d.]+)\s*KB/, mode: 'ceiling' },
  adoption: { pattern: /adoption,\s*checklists\s*<\s*([\d.]+)\s*KB/, mode: 'exact' },
  checklists: { pattern: /adoption,\s*checklists\s*<\s*([\d.]+)\s*KB/, mode: 'exact' },
  announcements: { pattern: /announcements\s*<\s*([\d.]+)\s*KB/, mode: 'exact' },
  surveys: { pattern: /surveys\s*<\s*([\d.]+)\s*KB/, mode: 'exact' },
  license: { pattern: /license\s*<\s*([\d.]+)\s*KB/, mode: 'exact' },
  media: { pattern: /^\s*-\s*media\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  'ai:client': { pattern: /-\s*ai\s*<\s*([\d.]+)\s*KB\s*\(client\)/, mode: 'exact' },
  'ai:server': { pattern: /<\s*([\d.]+)\s*KB\s*\(server\)/, mode: 'exact' },
  scheduling: { pattern: /^\s*-\s*scheduling\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
}

describe('v2 §1.2 — the bundle-size gate measures the engine entry too', () => {
  it('the enforced table has a core:engine row', () => {
    expect(
      budgets.find(([name]) => name === 'core:engine'),
      'no core:engine row in tooling/bundle-check/budgets.mjs — the engine door ships unmeasured'
    ).toBeDefined()
  })

  it('.size-limit.json has an @tour-kit/core/engine row', () => {
    expect(read(SIZE_LIMIT)).toContain('@tour-kit/core/engine')
  })
})

describe('v2 §1.2 — every enforced budget is stated in CLAUDE.md', () => {
  it('every enforced row has a documented claim', () => {
    // A new gate row with nowhere to look it up is a budget nobody defends.
    const undocumented = budgets.map(([name]) => name).filter((name) => !(name in CLAIMS))
    expect(undocumented, 'add these rows to CLAIMS and to CLAUDE.md').toEqual([])
  })

  it.each(budgets)('%s agrees with its CLAUDE.md claim', (name, _relPath, budgetBytes) => {
    const claim = CLAIMS[name]
    if (!claim) return // reported by the completeness test above, not twice here

    const match = read(CLAUDE_MD).match(claim.pattern)
    expect(match, `no budget claim for \`${name}\` in ${CLAUDE_MD}`).not.toBeNull()

    const claimedKb = Number((match as RegExpMatchArray)[1])
    const enforcedKb = budgetBytes / 1000

    if (claim.mode === 'exact') {
      expect(
        enforcedKb,
        `${name}: gate enforces ${enforcedKb} KB, CLAUDE.md claims ${claimedKb} KB`
      ).toBe(claimedKb)
    } else {
      expect(
        enforcedKb,
        `${name}: gate enforces ${enforcedKb} KB, above the ${claimedKb} KB group ceiling in CLAUDE.md`
      ).toBeLessThanOrEqual(claimedKb)
    }
  })
})
