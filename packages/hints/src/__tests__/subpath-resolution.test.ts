/**
 * v3 Phase 1 — `@tour-kit/hints/engine` actually resolves.
 *
 * The guard file next door reads bytes; this one asks Node to resolve the
 * subpath for real, in both module systems — ESM through a dynamic `import()`
 * (a self-reference through `exports`, which needs no self-link in
 * `node_modules`) and CJS through a child process, because this worker is ESM.
 *
 * The refusal list is a first-class assertion, not a footnote: the barrel is
 * defined as much by what it withholds as by what it exports. Without it, an
 * `export *` from the main entry would satisfy every other case in this file.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distExists = () => existsSync(join(PKG_ROOT, 'dist'))

interface HintsPackageJson {
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}
const readPkg = (): HintsPackageJson =>
  JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')) as HintsPackageJson

describe('@tour-kit/hints/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/hints/engine')
    // The exact key list, not a subset: this barrel is hand-written
    // `export … from` lines, so an accidental addition is as much a break as an
    // accidental removal — `hintsReducer` leaking out would pass a subset check.
    expect(Object.keys(mod).sort().join(',')).toBe(
      'INITIAL_HINTS_STATE,createHintsEngine,createHintsHandle,getHotspotPosition'
    )
    expect(typeof mod.createHintsEngine).toBe('function')
    expect(typeof mod.createHintsHandle).toBe('function')
    expect(typeof mod.getHotspotPosition).toBe('function')
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/hints/engine'); console.log(typeof m.createHintsEngine, typeof m.createHintsHandle, typeof m.getHotspotPosition, 'HintsProvider' in m, 'useHint' in m);",
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim()).toBe('function function function false false')
  })

  it.skipIf(!distExists())('does NOT re-export the React surface', async () => {
    const mod = (await import('@tour-kit/hints/engine')) as Record<string, unknown>
    for (const name of [
      'HintsProvider',
      'HintsContext',
      'useHintsContext',
      'useHint',
      'useHints',
      'Hint',
      'HintHotspot',
      'HintTooltip',
      'cn',
      'UnifiedSlot',
      'useReducedMotion',
    ]) {
      expect(mod, `@tour-kit/hints/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })

  it.skipIf(!distExists())('withholds the reducer, as core withholds tourReducer', async () => {
    // A reducer is the seam the engine and a binding share, not a consumer API.
    // Publishing it would make every handler's signature a compatibility
    // promise for a state shape that is deliberately internal.
    const mod = (await import('@tour-kit/hints/engine')) as Record<string, unknown>
    expect(mod).not.toHaveProperty('hintsReducer')
    expect(mod).not.toHaveProperty('emptyFrequencyState')
  })
})

/**
 * v3 Phase 1 — React joins tailwindcss and @mui/base as an optional peer.
 *
 * The one change in this phase a consumer's `pnpm install` can see. A Vue app
 * installing `@tour-kit/hints` for its engine should get no unmet-peer warning;
 * optional is what makes npm 7+ and bun skip the auto-install, and on pnpm the
 * win is the silenced warning. Core's manifest has said this since v2 §1.2.
 *
 * The peer RANGE stays — this is not a removal. A React consumer who installs
 * the wrong major must still be told.
 */
describe('@tour-kit/hints package.json — react is an optional peer', () => {
  it.each(['react', 'react-dom'])('keeps the %s peer range', (dep) => {
    expect(readPkg().peerDependencies?.[dep]).toBe('^18.0.0 || ^19.0.0')
  })

  it.each(['react', 'react-dom'])('marks %s optional in peerDependenciesMeta', (dep) => {
    expect(readPkg().peerDependenciesMeta?.[dep]?.optional).toBe(true)
  })
})
