/**
 * v2 §1.3g — the flat-main-entry guard.
 *
 * `createTourEngine` is reachable only from `@tour-kit/core/engine`. Nothing
 * in `src/index.ts` imports it, so esbuild's splitting should keep the factory
 * body out of the main entry's import closure — a React consumer must not pay
 * for the plain-JS adapter they will never construct.
 *
 * "Should" is why this file exists. Memory #640 records the dist-gzip gate
 * silently mis-measuring this exact package once already, and a second tsup
 * entry is precisely the condition that caused it.
 *
 * ## Why a string literal and not the identifier
 *
 * The obvious guard — grep the closure for `/\bcreateTourEngine\b/` — passes
 * whether or not the factory is there, because `minify: true` renames the
 * function. `dist/engine/index.js` exports it as `X as createTourEngine`, and
 * the body it points at carries a mangled name. A string literal from inside
 * the body survives minification untouched, so that is what we look for.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { closureOf } from '../../../../tooling/bundle-check/closure.mjs'

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..')
const MAIN_ENTRY = resolve(REPO_ROOT, 'packages/core/dist/index.js')
const ENGINE_ENTRY = resolve(REPO_ROOT, 'packages/core/dist/engine/index.js')

/**
 * A string only `create-tour-engine.ts` contains. If the factory is ever
 * rewritten without it, the self-check below fails loudly rather than this
 * guard silently passing on everything.
 */
const FACTORY_FINGERPRINT = 'createTourEngine: listener threw'

const built = existsSync(MAIN_ENTRY) && existsSync(ENGINE_ENTRY)
const describeBuilt = built ? describe : describe.skip

if (!built) {
  // `__tests__/**` is on the noConsole override list; this is the only way to
  // say why the suite skipped.
  console.warn(
    '[engine-not-in-main-closure] dist/ missing — run `pnpm build --filter @tour-kit/core`'
  )
}

describeBuilt('the engine factory stays out of the main entry (v2 §1.3g)', () => {
  it('self-check: the fingerprint IS found in the engine entry closure', () => {
    // Without this, a fingerprint that stopped matching would make the real
    // assertion below vacuously true forever.
    const found = closureOf(ENGINE_ENTRY).some((file) =>
      readFileSync(file, 'utf8').includes(FACTORY_FINGERPRINT)
    )

    expect(found, `${FACTORY_FINGERPRINT} no longer appears in dist/engine — update it`).toBe(true)
  })

  it('the factory body is absent from every file in the main entry closure', () => {
    const offenders = closureOf(MAIN_ENTRY).filter((file) =>
      readFileSync(file, 'utf8').includes(FACTORY_FINGERPRINT)
    )

    expect(
      offenders,
      'createTourEngine entered dist/index.js closure — a React consumer now pays for the plain-JS adapter'
    ).toEqual([])
  })

  it('the two closures do share a chunk — this guard is about the factory, not about splitting', () => {
    // Documents the shape rather than asserting a byte count: both entries
    // read one shared chunk (reducer, boot, actions, transition effects,
    // adapters), because the provider uses all of it too. That sharing is
    // wanted; what is not wanted is the factory riding along.
    const main = new Set(closureOf(MAIN_ENTRY).map((f) => f.replace(/.*[/\\]/, '')))
    const engine = closureOf(ENGINE_ENTRY).map((f) => f.replace(/.*[/\\]/, ''))

    expect(engine.some((f) => main.has(f) && f.startsWith('chunk-'))).toBe(true)
  })
})
