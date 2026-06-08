import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

/**
 * The TRUE end-to-end guard for the `next build` / `Module not found` defect.
 *
 * A unit test cannot reproduce webpack's build-time resolution error — so this
 * drives a real webpack 5 compile of the *built* `dist/index.js` with the
 * optional peers (`posthog-js`, `mixpanel-browser`,
 * `@amplitude/analytics-browser`) deliberately NOT installed, and asserts the
 * build surfaces no `Module not found` (webpack emits it as a warning for an
 * unresolved `import()`; Next promotes that to a failing build).
 *
 * Isolation: the dist is copied into an OS temp dir (outside any node_modules),
 * and react + workspace deps are externalized, so the optional-peer `import()`
 * is the *only* variable under test. A stripped-comment control build is run
 * alongside to prove the assertion is faithful (it must reproduce the failure).
 *
 * Gated: resolves a webpack (Next's bundled copy in this monorepo, or a real
 * `webpack` devDep in CI). If neither is present the suite skips rather than
 * failing — keeping the default `vitest run` green on a bare checkout.
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../../../../')
const distIndex = join(here, '../../../dist/index.js')

type WebpackFn = (config: unknown, cb: (err: unknown, stats: unknown) => void) => void

function resolveWebpack(): WebpackFn | null {
  // 1) Next's precompiled webpack 5 (present in this monorepo via apps/docs).
  try {
    const reqFromDocs = createRequire(join(repoRoot, 'apps/docs/package.json'))
    const mod = reqFromDocs('next/dist/compiled/webpack/webpack')
    if (typeof mod.webpack === 'function') return mod.webpack as WebpackFn
  } catch {
    /* fall through */
  }
  // 2) A real `webpack` dependency (e.g. added as a CI devDep).
  try {
    const reqLocal = createRequire(here)
    const wp = reqLocal('webpack')
    if (typeof wp === 'function') return wp as WebpackFn
  } catch {
    /* fall through */
  }
  return null
}

const webpack = resolveWebpack()
const distBuilt = existsSync(distIndex)

const EXTERNALS = {
  react: 'module react',
  'react-dom': 'module react-dom',
  'react/jsx-runtime': 'module react/jsx-runtime',
  '@tour-kit/core': 'module @tour-kit/core',
  '@tour-kit/license': 'module @tour-kit/license',
}

const tmpDirs: string[] = []

function compile(analyticsFile: string): Promise<number> {
  const dir = mkdtempSync(join(tmpdir(), 'tk-analytics-wp-'))
  tmpDirs.push(dir)
  writeFileSync(
    join(dir, 'entry.mjs'),
    "import * as a from 'analytics-under-test'\nglobalThis.__a = a\n"
  )
  return new Promise((resolve, reject) => {
    ;(webpack as WebpackFn)(
      {
        mode: 'development',
        optimization: { minimize: false },
        entry: join(dir, 'entry.mjs'),
        output: {
          path: join(dir, 'out'),
          filename: 'bundle.js',
          module: true,
          chunkFormat: 'module',
        },
        experiments: { outputModule: true },
        resolve: { alias: { 'analytics-under-test': analyticsFile } },
        externals: EXTERNALS,
        externalsType: 'module',
      },
      (err, stats) => {
        if (err) return reject(err)
        const s = stats as {
          toJson: (o: unknown) => {
            errors?: { message?: string }[]
            warnings?: { message?: string }[]
          }
        }
        const json = s.toJson({ errors: true, warnings: true })
        const all = [...(json.errors ?? []), ...(json.warnings ?? [])]
        resolve(all.filter((e) => /Module not found/.test(e.message ?? String(e))).length)
      }
    )
  })
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

describe.skipIf(!webpack || !distBuilt)('webpack build with optional peers absent', () => {
  it('built dist/index.js produces NO "Module not found" (optional peers ignored)', async () => {
    const fixedDir = mkdtempSync(join(tmpdir(), 'tk-analytics-fixed-'))
    tmpDirs.push(fixedDir)
    const fixed = join(fixedDir, 'analytics.fixed.js')
    writeFileSync(fixed, readFileSync(distIndex, 'utf8'))

    const moduleNotFound = await compile(fixed)
    expect(moduleNotFound).toBe(0)
  }, 60_000)

  it('control: stripping the magic comment reproduces the build failure', async () => {
    const ctrlDir = mkdtempSync(join(tmpdir(), 'tk-analytics-ctrl-'))
    tmpDirs.push(ctrlDir)
    const stripped = readFileSync(distIndex, 'utf8')
      .replace(/\/\* webpackIgnore: true \*\//g, '')
      .replace(/\/\* @vite-ignore \*\//g, '')
    const ctrl = join(ctrlDir, 'analytics.stripped.js')
    writeFileSync(ctrl, stripped)

    const moduleNotFound = await compile(ctrl)
    // Without the magic comment webpack tries to resolve the optional peers
    // and reports them missing — exactly the defect we are guarding against.
    expect(moduleNotFound).toBeGreaterThan(0)
  }, 60_000)
})
