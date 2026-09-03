/**
 * v2 §1.2 — the acceptance bullet the whole task exists for: a Vue/Svelte
 * consumer can typecheck against `@tour-kit/core/engine` with `@types/react`
 * absent from their entire resolution tree.
 *
 * The planner proved this once by hand in a scratch directory. This is that
 * probe made runnable, with three deliberate differences from the spike:
 *
 * - It imports the BARE specifier `@tour-kit/core/engine`, not
 *   `./dist/engine/index.js`. A relative import never reads the `exports` map,
 *   so the spike could not have caught a typo in the `./engine` → `types` path.
 *   Nothing else in the suite reads that path: Node ignores `types`, so the
 *   runtime resolution test is blind to it. This file is the only net.
 * - It runs the `node16` half too, so `./dist/engine/index.d.cts` is exercised
 *   through the `require` condition, not just the `import` one.
 * - It asserts the CONTROL still fails. A probe that passes against both
 *   entries is proving nothing about the engine — it is proving `types: []`
 *   silently disabled the check.
 *
 * The package is copied, not symlinked, on purpose: a symlink's realpath lands
 * back inside `packages/core`, where `node_modules/@types/react` is one
 * directory up and the control would wrongly pass.
 */
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// Shared exec/temp-dir plumbing already in the package — see
// `packages/core/__tests__/phase-0/_helpers.ts`. The path reads oddly because
// the helper predates this file; it is generic (`run`, `repoRoot`), not
// phase-0-specific.
import { repoRoot, run } from '../../__tests__/phase-0/_helpers'
import { distExists } from './_dist'

const REPO = repoRoot()
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// tsc on a cold program, three times. The 5s default is nowhere near enough.
const TSC_TIMEOUT_MS = 120_000

let sandbox = ''

/** Shared compiler options: strict, no ambient @types, no `lib` beyond DOM. */
const BASE_OPTIONS = {
  strict: true,
  // The whole point: a Vue consumer has `skipLibCheck` off or on, but with it
  // OFF a React import inside our .d.ts is a hard error rather than an `any`.
  skipLibCheck: false,
  noEmit: true,
  target: 'es2020',
  lib: ['ES2020', 'DOM'],
  // `--types []` does not exist on the CLI (it fails with TS2688); the empty
  // array only works from a tsconfig. This is what stops tsc from sweeping
  // `node_modules/@types` into the program behind our back.
  types: [],
}

function writeProject(
  name: string,
  entryFile: string,
  entrySource: string,
  options: Record<string, unknown>
): string {
  writeFileSync(join(sandbox, entryFile), entrySource, 'utf8')
  const configPath = join(sandbox, `tsconfig.${name}.json`)
  writeFileSync(
    configPath,
    JSON.stringify(
      { compilerOptions: { ...BASE_OPTIONS, ...options }, include: [entryFile] },
      null,
      2
    ),
    'utf8'
  )
  return configPath
}

function typecheck(configPath: string): { code: number; output: string } {
  const r = run(`pnpm exec tsc --noEmit --project "${configPath}"`, { cwd: REPO })
  return { code: r.code, output: `${r.stdout}\n${r.stderr}` }
}

describe.skipIf(!distExists())('v2 §1.2 — engine types compile without React installed', () => {
  beforeAll(() => {
    // os.tmpdir(), not a directory inside the repo: the test is only meaningful
    // if nothing up the tree can supply `@types/react`.
    sandbox = mkdtempSync(join(tmpdir(), 'tk-engine-portable-'))
    const dest = join(sandbox, 'node_modules', '@tour-kit', 'core')
    mkdirSync(dest, { recursive: true })
    cpSync(join(PKG_ROOT, 'dist'), join(dest, 'dist'), { recursive: true })
    // The real manifest, verbatim — the `exports` map under test is the
    // published one, typos included.
    cpSync(join(PKG_ROOT, 'package.json'), join(dest, 'package.json'))
  })

  afterAll(() => {
    if (sandbox) rmSync(sandbox, { recursive: true, force: true })
  })

  it(
    'compiles a bundler-resolution consumer importing types AND values',
    () => {
      const config = writeProject(
        'engine',
        'probe.ts',
        [
          "import { type TourStep, matchesAudience, validateTour } from '@tour-kit/core/engine'",
          '',
          "const step: TourStep = { id: 'welcome', target: '#app', content: 'hi' }",
          '',
          'export const surface = { step, matchesAudience, validateTour }',
          '',
        ].join('\n'),
        { module: 'esnext', moduleResolution: 'bundler' }
      )

      const { code, output } = typecheck(config)
      expect(code, output).toBe(0)
    },
    TSC_TIMEOUT_MS
  )

  it(
    'compiles a node16 CJS consumer through the `require` condition (.d.cts)',
    () => {
      const config = writeProject(
        'engine-cjs',
        'probe.cts',
        [
          "import { type TourStep, matchesAudience } from '@tour-kit/core/engine'",
          '',
          "const step: TourStep = { id: 'welcome', target: '#app', content: 'hi' }",
          '',
          'export const surface = { step, matchesAudience }',
          '',
        ].join('\n'),
        { module: 'node16', moduleResolution: 'node16' }
      )

      const { code, output } = typecheck(config)
      expect(code, output).toBe(0)
    },
    TSC_TIMEOUT_MS
  )

  it(
    'CONTROL — the main entry still fails the same compile, naming react and clsx',
    () => {
      const config = writeProject(
        'control',
        'control.ts',
        [
          "import type { TourStep } from '@tour-kit/core'",
          '',
          'export type Step = TourStep',
          '',
        ].join('\n'),
        { module: 'esnext', moduleResolution: 'bundler' }
      )

      const { code, output } = typecheck(config)
      // If this ever exits 0, either React stopped leaking out of the main
      // entry (great — delete this test and celebrate) or `types: []` disabled
      // the check that makes the engine probe above meaningful (not great).
      expect(code, output).not.toBe(0)
      expect(output).toMatch(/Cannot find module 'react'/)
      expect(output).toMatch(/Cannot find module 'clsx'/)
    },
    TSC_TIMEOUT_MS
  )
})
