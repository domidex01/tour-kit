/**
 * v2 §1.1 — the five type files that task 1.2 will carve into
 * `@tour-kit/core/engine` must not name `react` at all.
 *
 * Today all five use `import type … from 'react'`. That emits zero runtime
 * code, so the shipped JS is already React-free — what leaks is the emitted
 * `.d.ts`. A Vue/Svelte consumer with `skipLibCheck: false` gets
 * `Cannot find module 'react'`; with `skipLibCheck: true` the types quietly
 * degrade to `any`.
 *
 * Source-scan rather than a dist-scan on purpose: the bundled
 * `dist/index.d.ts` still opens with `import * as React$1 from 'react'`
 * because hooks and providers legitimately keep it. The consumer-level
 * guarantee belongs to §1.2, once the engine subpath exists.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The five files named in the §1.1 acceptance criteria. */
const ENGINE_TYPE_SEEDS = [
  'types/step.ts',
  'types/hints.ts',
  'types/target.ts',
  'lib/tour-engine/context.ts',
  'lib/segmentation/types.ts',
] as const

/**
 * Every `.ts` under `lib/tour-engine/`, excluding `__tests__/`.
 *
 * v2 §1.3 widened the guard from the fixed five to the whole directory: the
 * reducer, boot resolver, actions, transition effects and the engine factory
 * all land here, and `createTourEngine()` is the front door a Vue/Svelte/Node
 * consumer imports. One React specifier anywhere in the tree ends that.
 */
function engineSourceFiles(): string[] {
  const root = join(SRC_ROOT, 'lib', 'tour-engine')
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === '__tests__') continue
        walk(full)
        continue
      }
      if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        out.push(relative(SRC_ROOT, full))
      }
    }
  }
  walk(root)
  return out.sort()
}

const ENGINE_TYPE_FILES = [
  ...new Set([...ENGINE_TYPE_SEEDS, ...engineSourceFiles()]),
] as readonly string[]

/**
 * Matches `from 'react'`, `from "react/jsx-runtime"`, and the `import type`
 * / `export … from` forms alike — the specifier is what matters, not whether
 * the import is elided at build time.
 */
const REACT_MODULE_SPECIFIER = /from\s+["']react(\/[^"']*)?["']/
const REACT_REQUIRE = /require\(\s*["']react(\/[^"']*)?["']\s*\)/

describe('v2 §1.1/§1.3 — the engine source tree is React-free at the source level', () => {
  it('scans the whole lib/tour-engine directory, not just the seed list', () => {
    // A glob that silently matches nothing is a guard that passes forever.
    expect(ENGINE_TYPE_FILES.length).toBeGreaterThan(ENGINE_TYPE_SEEDS.length)
    expect(ENGINE_TYPE_FILES).toContain('lib/tour-engine/helpers.ts')
  })

  it.each(ENGINE_TYPE_FILES)('%s does not import from react', (relPath) => {
    const lines = readFileSync(join(SRC_ROOT, relPath), 'utf8').split('\n')
    const offending = lines.filter(
      (line) => REACT_MODULE_SPECIFIER.test(line) || REACT_REQUIRE.test(line)
    )

    // Assert on the offending lines, not the file body — a failure should read
    // as "this import has to go", not as a wall of source.
    expect(offending).toEqual([])
  })
})

/**
 * v2 §1.2 — the same guarantee one level up, on the barrel that becomes
 * `@tour-kit/core/engine`.
 *
 * Two barrels inside core are traps: `lib/i18n/index.ts` re-exports
 * `LocaleProvider`/`useT` beside the pure `resolvePlural`, and
 * `lib/segmentation/index.ts` re-exports `SegmentationProvider`/`useSegment`
 * beside the pure `parseUserIdsFromCsv`. Re-exporting either from the engine
 * barrel drags React into the shared chunk. The dist scan
 * (`no-react-in-engine-dist.test.ts`) catches that too, but only after a build
 * — this catches it in the editor, on the line that caused it.
 */
describe('v2 §1.2 — the engine barrel imports leaves, not the mixed barrels', () => {
  const ENGINE_BARREL = join(SRC_ROOT, 'engine', 'index.ts')

  /** Barrels that mix React and non-React exports. Import their leaves instead. */
  const TRAP_BARRELS = [
    { specifier: './lib/i18n', instead: './lib/i18n/plural' },
    { specifier: '../lib/i18n', instead: '../lib/i18n/plural' },
    { specifier: './lib/segmentation', instead: './lib/segmentation/csv' },
    { specifier: '../lib/segmentation', instead: '../lib/segmentation/csv' },
  ] as const

  it('exists', () => {
    expect(existsSync(ENGINE_BARREL), `${ENGINE_BARREL} is missing`).toBe(true)
  })

  it('does not import from react', () => {
    const lines = readFileSync(ENGINE_BARREL, 'utf8').split('\n')
    expect(
      lines.filter((line) => REACT_MODULE_SPECIFIER.test(line) || REACT_REQUIRE.test(line))
    ).toEqual([])
  })

  it.each(TRAP_BARRELS)(
    'does not re-export the mixed $specifier barrel (use $instead)',
    ({ specifier }) => {
      const source = readFileSync(ENGINE_BARREL, 'utf8')
      const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`from\\s*["']${escaped}["']`)
      expect(pattern.test(source)).toBe(false)
    }
  )

  it('is re-exports and comments only — no logic, no side effects', () => {
    // `sideEffects: false` is a promise the barrel keeps or breaks. A bare
    // `import './x'` (a side-effect import, like the `window-augment` one the
    // main barrel deliberately has) or any declaration here makes it a lie —
    // and turns a ~50-line door into a file with behaviour to test.
    const DISALLOWED =
      /^\s*(?:import\s+["']|const\s|let\s|var\s|function\s|class\s|if\s*\(|for\s*\(|while\s*\()/
    const offending = readFileSync(ENGINE_BARREL, 'utf8')
      .split('\n')
      .filter((line) => DISALLOWED.test(line))
    expect(offending).toEqual([])
  })
})
