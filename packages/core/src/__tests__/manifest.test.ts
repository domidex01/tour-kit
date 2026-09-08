/**
 * `packages/core/package.json` facts that nothing else pins.
 *
 * Core's manifest assertions were scattered — `peer-dep-optional.test.ts` owns
 * the optional-peer contract, `credibility-surface.guard.test.ts` owns the
 * keywords — and v2 §1.6 added two CDN fields with no home at all. This is that
 * home, modelled on `packages/vue/src/__tests__/manifest.test.ts` and
 * `packages/analytics/src/__tests__/package-contract.test.ts`. New manifest
 * facts belong here rather than wherever the feature that added them lives.
 *
 * Deliberately NOT a dist-tier file: these hold on an unbuilt clone, so only
 * the one case that resolves a path guards on `distExists()`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { distExists } from './_dist'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')) as {
  unpkg?: string
  jsdelivr?: string
  files?: string[]
}

/** v2 §1.6 — what `unpkg` and `jsdelivr` must both name. */
const IIFE = './dist/engine/index.global.js'

describe('v2 §1.6 — the manifest points a CDN at the IIFE', () => {
  // The only other thing that reads these two fields is
  // `apps/smoke/scripts/probe-cdn.mjs`, and that runs POST-PUBLISH. Without
  // these cases a typo (`.global.mjs`, a dropped `./`, a rename) ships and is
  // found by a user.
  it.each(['unpkg', 'jsdelivr'] as const)('%s points at the IIFE', (field) => {
    // `https://unpkg.com/@tour-kit/core` with no path serves whatever this
    // names; without the field it would serve `main`, the React CJS build.
    expect(pkg[field]).toBe(IIFE)
  })

  it('the published `files` list still ships dist', () => {
    expect(pkg.files).toContain('dist')
  })

  it.skipIf(!distExists())('the path those fields name actually resolves', () => {
    expect(existsSync(join(PKG_ROOT, IIFE))).toBe(true)
  })
})
