/**
 * Meta-guard (Slice 0 — Credibility Surface): the adapter test suite must
 * contain no `expect(true).toBe(true)` placeholder assertions. Those were the
 * stubbed direct-hook resolution tests; Slice 0 replaced them with real
 * `Module._load`-driven require-fallback tests. This guard FAILS while any
 * placeholder remains and stays GREEN once they're gone — a regression tripwire
 * so they never creep back.
 *
 * Source-as-fixture idiom (cf. core's `no-zod-in-main.test.ts`): read the files
 * with `node:fs` and assert zero matches. We use `readdirSync(..., { recursive
 * true })` rather than fast-glob — fast-glob is not resolvable from this package
 * under pnpm's strict node_modules, and Node ≥18.17/20.1 ships recursive
 * readdir natively (no dependency added).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ADAPTERS_DIR = dirname(fileURLToPath(import.meta.url))
const SELF = basename(fileURLToPath(import.meta.url))

// Built from parts so this guard's own source never contains the literal string
// it forbids (which would make it match itself).
const PLACEHOLDER = new RegExp(['expect\\(', 'true', '\\)\\.toBe\\(', 'true', '\\)'].join('\\s*'))

describe('adapter test hygiene — no placeholder assertions', () => {
  it('no `expect(true).toBe(true)` placeholder remains in any adapter test', () => {
    const offenders = readdirSync(ADAPTERS_DIR, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.test.ts') && basename(f) !== SELF)
      .filter((f) => PLACEHOLDER.test(readFileSync(join(ADAPTERS_DIR, f), 'utf8')))

    expect(
      offenders,
      `placeholder assertions still present in:\n${offenders.join('\n')}`
    ).toEqual([])
  })
})
