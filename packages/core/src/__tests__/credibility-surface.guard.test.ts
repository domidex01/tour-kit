/**
 * Slice 0 — Credibility Surface meta-guards. Source-as-fixture: read the visible
 * tree and assert the cheap "AI-generated" tells a skeptic greps for in the first
 * 90 seconds are gone. Each FAILS before the Slice 0 hygiene edits and PASSES
 * after — meta-TDD, the same RED→GREEN as a feature test.
 *
 * Idiom copied from `no-zod-in-main.test.ts`. We use `node:fs`
 * `readdirSync(..., { recursive: true })` instead of fast-glob: fast-glob is not
 * resolvable from this package under pnpm's strict node_modules, and Node
 * ≥18.17/20.1 ships recursive readdir (no dependency added).
 *
 * Scope: scans `packages/core/src` + `packages/codemods/src` + the codemods
 * published README only. CHANGELOG.md history and codemods `__tests__/fixtures`
 * are intentionally out of scope (Task 0.2) — the fixtures are guarded by the
 * codemods fixture-runner instead.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// 4 levels up from packages/core/src/__tests__/ → repo root.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const SELF = basename(fileURLToPath(import.meta.url))

/** Recursively collect files under `dir` matching one of `exts`. */
function collect(dir: string, exts: readonly string[]): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((rel) => exts.some((ext) => rel.endsWith(ext)))
    .map((rel) => join(dir, rel))
}

describe('credibility surface — wrong-domain links are gone', () => {
  it('no deprecated marketing domain in core/codemods source or codemods README', () => {
    // Built from parts so this guard's own source never contains the literal
    // string it forbids (which would make it match itself).
    const DEPRECATED_DOMAIN = new RegExp(['tourkit', 'dev'].join('\\.'))

    const targets = [
      ...collect(join(REPO_ROOT, 'packages/core/src'), ['.ts', '.tsx']),
      ...collect(join(REPO_ROOT, 'packages/codemods/src'), ['.ts', '.tsx']),
      join(REPO_ROOT, 'packages/codemods/README.md'),
    ].filter((f) => basename(f) !== SELF)

    const offenders = targets.filter(
      (f) => existsSync(f) && DEPRECATED_DOMAIN.test(readFileSync(f, 'utf8'))
    )

    expect(offenders, `deprecated domain still present in:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('credibility surface — scratch spikes are gone', () => {
  it('no __spikes__ scratch directory remains anywhere under ai/src', () => {
    const spikeDir = join(REPO_ROOT, 'packages/ai/src/__spikes__')
    expect(existsSync(spikeDir)).toBe(false)

    // Belt-and-braces: no file lives in any `__spikes__/` path (in case the
    // scratch dir reappears nested). We target the `__spikes__` convention
    // specifically — the legitimate API-key-gated `__tests__/spikes/`
    // integration tests are NOT scratch code and are intentionally untouched.
    const strays = collect(join(REPO_ROOT, 'packages/ai/src'), ['.ts', '.tsx']).filter((f) =>
      f.includes('__spikes__')
    )
    expect(strays, `files still under a __spikes__ dir:\n${strays.join('\n')}`).toEqual([])
  })
})

describe('credibility surface — floating-ui keyword dropped from core', () => {
  it('core/package.json keywords does not advertise floating-ui (core has no such dep)', () => {
    const pkg = JSON.parse(
      readFileSync(join(REPO_ROOT, 'packages/core/package.json'), 'utf8')
    ) as { keywords?: string[] }
    expect(pkg.keywords ?? []).not.toContain('floating-ui')
  })
})
