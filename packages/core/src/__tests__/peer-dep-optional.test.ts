import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_JSON_PATH = join(__dirname, '..', '..', 'package.json')

interface ConditionalExport {
  types?: string
  default?: string
}

interface CorePackageJson {
  sideEffects?: boolean
  exports?: Record<string, Record<string, ConditionalExport> | string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

function readCorePkg(): CorePackageJson {
  return JSON.parse(readFileSync(PKG_JSON_PATH, 'utf8')) as CorePackageJson
}

describe('@tour-kit/core package.json — zod is an optional peer', () => {
  it('declares the canonical dual-major zod peer range', () => {
    const pkg = readCorePkg()
    expect(pkg.peerDependencies?.zod).toBe('^3.25.0 || ^4.0.0')
  })

  it('marks zod as optional in peerDependenciesMeta', () => {
    const pkg = readCorePkg()
    expect(pkg.peerDependenciesMeta?.zod?.optional).toBe(true)
  })
})

/**
 * v2 §1.2 — React joins zod as an optional peer.
 *
 * Without this, npm 7+ and bun auto-install React into a Vue project and pnpm
 * (which defaults `autoInstallPeers: true`) does the same and warns. Optional
 * is what makes npm and bun skip them; on pnpm the win is the silenced warning
 * rather than a smaller install, because of the open auto-install bug (#11155,
 * seen on 10.33).
 *
 * The peer RANGE stays — this is not a removal. A React consumer who installs
 * the wrong major must still be told.
 */
describe('@tour-kit/core package.json — react is an optional peer', () => {
  it.each(['react', 'react-dom'])('keeps the %s peer range', (dep) => {
    const pkg = readCorePkg()
    expect(pkg.peerDependencies?.[dep]).toBe('^18.0.0 || ^19.0.0')
  })

  it.each(['react', 'react-dom'])('marks %s optional in peerDependenciesMeta', (dep) => {
    const pkg = readCorePkg()
    expect(pkg.peerDependenciesMeta?.[dep]?.optional).toBe(true)
  })
})

/**
 * v2 §1.2 — the door itself, at the manifest level. The runtime resolution test
 * proves the two `default` paths load; nothing but `engine-types-are-portable`
 * reads the two `types` paths, and only in one condition at a time. This block
 * is the cheap shape check that all four keys are present and point where the
 * `./schemas` entry points, structurally.
 */
describe('@tour-kit/core package.json — the ./engine subpath is published', () => {
  it('exposes ./engine with import + require conditions', () => {
    const engine = readCorePkg().exports?.['./engine']
    expect(engine, 'exports["./engine"] is missing').toBeDefined()
    expect(engine).toEqual({
      import: {
        types: './dist/engine/index.d.ts',
        default: './dist/engine/index.js',
      },
      require: {
        types: './dist/engine/index.d.cts',
        default: './dist/engine/index.cjs',
      },
    })
  })

  it('stays side-effect free — the barrel is re-exports only', () => {
    // A `sideEffects: true` here would make every bundler ship the whole
    // engine closure to a consumer who imported one predicate from it.
    expect(readCorePkg().sideEffects).toBe(false)
  })
})
