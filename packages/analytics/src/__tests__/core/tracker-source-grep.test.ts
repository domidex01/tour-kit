import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Phase 4 (M4) source-grep gates for `tracker.ts`.
 *
 * Co-located with the unit tests so future PRs can't sneak the old
 * per-method try/catch + `if (this.config.debug)` pattern back in.
 */
describe('tracker.ts — Phase 4 source gates (M4)', () => {
  const src = readFileSync(resolve(__dirname, '../../core/tracker.ts'), 'utf-8')

  it('consolidates debug-gated `logger.error` into a single block (helper-owned)', () => {
    // The pre-Phase-4 code had this pattern repeated 5 times across lifecycle
    // methods. The Phase 4 refactor must collapse it to exactly one location
    // (inside safeDispatch's `report` closure). A separate, unrelated
    // `if (this.config.debug) { logger.debug(...) }` in `track()` is allowed.
    const matches = src.match(/if \(this\.config\.debug\) \{[\s\S]{0,200}?logger\.error/g) ?? []
    expect(matches.length).toBe(1)
  })

  it('contains 6 `safeDispatch` references (1 definition + 5 call sites)', () => {
    const matches = src.match(/safeDispatch/g) ?? []
    expect(matches.length).toBe(6)
  })

  it('does NOT call console.error directly (routes through logger.error)', () => {
    expect(src).not.toMatch(/^\s*console\.error/m)
  })
})
