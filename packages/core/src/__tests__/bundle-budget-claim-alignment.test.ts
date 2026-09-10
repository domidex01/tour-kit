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
/**
 * The per-plugin ceiling is a parenthetical inside the analytics bullet, not a
 * bullet of its own: `- analytics <4 KB (root; per-plugin <1.5 KB each)`. Bind
 * it to that bullet so a stray "per-plugin <N KB" in prose cannot be read as a
 * budget row (v3 Phase 3 — the four rows below shared one unanchored pattern).
 */
const PER_PLUGIN = /^\s*-\s*analytics\s*<[^\n]*per-plugin\s*<\s*([\d.]+)\s*KB/m

const CLAIMS: Record<string, { pattern: RegExp; mode: 'exact' | 'ceiling' }> = {
  core: { pattern: /^\s*-\s*core\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  // Both anchored on the word that distinguishes them. The `core:engine`
  // pattern used to be a bare /core\/engine[^\n]*?<…/ — unanchored and
  // first-match, which was fine while it was the only `core/engine … <N KB`
  // bullet in the file. v2 §1.6 adds the second one, so an unanchored pattern
  // would read whichever bullet comes first; both claim 18.5 today, so the two
  // rows could silently swap and nothing would notice until they diverged.
  'core:engine': { pattern: /core\/engine subpath[^\n]*?<\s*([\d.]+)\s*KB/, mode: 'exact' },
  'core:engine:iife': { pattern: /core\/engine IIFE[^\n]*?<\s*([\d.]+)\s*KB/, mode: 'exact' },
  react: { pattern: /^\s*-\s*react\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  hints: { pattern: /^\s*-\s*hints\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  // v3 Phase 1 — anchored on `hints/engine subpath`. The sibling `hints`
  // pattern is `/^\s*-\s*hints\s*<…/m`, so a bullet beginning `- hints/engine`
  // cannot satisfy it (the character after `hints` is `/`, not whitespace).
  'hints:engine': {
    pattern: /hints\/engine subpath[^\n]*?<\s*([\d.]+)\s*KB/,
    mode: 'exact',
  },
  'analytics:main': { pattern: /^\s*-\s*analytics\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  // The four per-plugin rows read one claim, and it is a parenthetical inside
  // the `- analytics <4 KB (root; per-plugin <1.5 KB each)` bullet rather than a
  // bullet of its own — so it is anchored to that bullet's start, not to `-`.
  'analytics:posthog': { pattern: PER_PLUGIN, mode: 'ceiling' },
  'analytics:mixpanel': { pattern: PER_PLUGIN, mode: 'ceiling' },
  'analytics:amplitude': { pattern: PER_PLUGIN, mode: 'ceiling' },
  'analytics:ga': { pattern: PER_PLUGIN, mode: 'ceiling' },
  // v3 Phase 0 — anchored on `analytics/engine subpath` exactly as `core:engine`
  // is on `core/engine subpath`. The sibling `analytics:main` pattern is
  // `/^\s*-\s*analytics\s*<…/m`, so a bullet beginning `- analytics/engine`
  // cannot satisfy it (the character after the name is `/`, not whitespace).
  'analytics:engine': {
    pattern: /analytics\/engine subpath[^\n]*?<\s*([\d.]+)\s*KB/,
    mode: 'exact',
  },
  // Anchored in v3 Phase 2: `adoption` and `checklists` shared one bullet and
  // one unanchored pattern, so raising either raised both. The `^\s*-\s*` is
  // load-bearing — an unanchored pattern is a first-match scan of the whole
  // file, so the two rows would read whichever bullet came first.
  adoption: { pattern: /^\s*-\s*adoption\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  checklists: { pattern: /^\s*-\s*checklists\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  'checklists:engine': {
    pattern: /checklists\/engine subpath\s*<\s*([\d.]+)\s*KB/,
    mode: 'exact',
  },
  // Anchored in v3 Phase 3, and the bullet they shared was split three ways in
  // the same commit — `- announcements <14 KB, surveys <12.5 KB, license <8 KB`
  // gave all three patterns the SAME line to match, so an unanchored
  // /surveys\s*<…/ read the announcements number and raising one raised all
  // three. `license` is the sharp edge the recipe calls out: prose elsewhere in
  // CLAUDE.md must say "licence gate", never "license <", or this first-match
  // scan reads a sentence instead of a budget row (:196 and :206 already do).
  announcements: {
    pattern: /^\s*-\s*announcements\s*<\s*([\d.]+)\s*KB/m,
    mode: 'exact',
  },
  // v3 Phase 3 — anchored on `announcements/engine subpath`, exactly as
  // `checklists:engine` is. The sibling `announcements` pattern is
  // `/^\s*-\s*announcements\s*<…/m`, so a bullet beginning
  // `- announcements/engine` cannot satisfy it (the character after the name is
  // `/`, not whitespace).
  'announcements:engine': {
    pattern: /announcements\/engine subpath\s*<\s*([\d.]+)\s*KB/,
    mode: 'exact',
  },
  surveys: { pattern: /^\s*-\s*surveys\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  // v3 Phase 3 — anchored on `surveys/engine subpath`, as `checklists:engine`
  // is. The sibling `surveys` pattern is `/^\s*-\s*surveys\s*<…/m`, so a
  // bullet beginning `- surveys/engine` cannot satisfy it.
  'surveys:engine': {
    pattern: /surveys\/engine subpath\s*<\s*([\d.]+)\s*KB/,
    mode: 'exact',
  },
  license: { pattern: /^\s*-\s*license\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  media: { pattern: /^\s*-\s*media\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  'ai:client': { pattern: /-\s*ai\s*<\s*([\d.]+)\s*KB\s*\(client\)/, mode: 'exact' },
  'ai:server': { pattern: /<\s*([\d.]+)\s*KB\s*\(server\)/, mode: 'exact' },
  scheduling: { pattern: /^\s*-\s*scheduling\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  // v3 Phase 0 — anchored on `scheduling/engine subpath`. The sibling
  // `scheduling` pattern is `/^\s*-\s*scheduling\s*<…/m`, so a bullet
  // beginning `- scheduling/engine` cannot satisfy it.
  'scheduling:engine': {
    pattern: /scheduling\/engine subpath[^\n]*?<\s*([\d.]+)\s*KB/,
    mode: 'exact',
  },
  // Anchored like `media` and `scheduling`: an unanchored /vue/ would match the
  // word anywhere else in CLAUDE.md and read the wrong number.
  vue: { pattern: /^\s*-\s*vue\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
  svelte: { pattern: /^\s*-\s*svelte\s*<\s*([\d.]+)\s*KB/m, mode: 'exact' },
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
