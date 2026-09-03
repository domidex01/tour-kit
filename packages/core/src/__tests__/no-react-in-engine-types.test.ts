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
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The five files named in the §1.1 acceptance criteria. */
const ENGINE_TYPE_FILES = [
  'types/step.ts',
  'types/hints.ts',
  'types/target.ts',
  'lib/tour-engine/context.ts',
  'lib/segmentation/types.ts',
] as const

/**
 * Matches `from 'react'`, `from "react/jsx-runtime"`, and the `import type`
 * / `export … from` forms alike — the specifier is what matters, not whether
 * the import is elided at build time.
 */
const REACT_MODULE_SPECIFIER = /from\s+["']react(\/[^"']*)?["']/
const REACT_REQUIRE = /require\(\s*["']react(\/[^"']*)?["']\s*\)/

describe('v2 §1.1 — engine type files are React-free at the source level', () => {
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
