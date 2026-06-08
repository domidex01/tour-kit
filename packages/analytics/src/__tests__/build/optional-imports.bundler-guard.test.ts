import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Regression guard for the "@tour-kit/analytics breaks `next build`" defect
 * (utk-studio QA matrix, 2026-06-08).
 *
 * The optional analytics SDKs (`posthog-js`, `mixpanel-browser`,
 * `@amplitude/analytics-browser`) are loaded via guarded dynamic `import()`.
 * A bare `import('posthog-js')` is still *resolved at build time* by webpack
 * (Next's bundler), so when the optional peer isn't installed the build fails
 * with `Module not found`. The fix is the `/* webpackIgnore: true *​/`
 * (and `/* @vite-ignore *​/` for Rollup/Vite) magic comment on each import.
 *
 * This test asserts the magic comments survive into the *built* output — which
 * is exactly what breaks if someone removes the comment, or re-enables the
 * umbrella `minify: true` in tsup.config.ts (esbuild's whitespace minifier
 * strips these comments). It is the cheapest, most deterministic insurance and
 * must never be skipped. See the end-to-end proof in
 * `optional-imports.webpack-smoke.test.ts`.
 */

const OPTIONAL_SDKS = ['posthog-js', 'mixpanel-browser', '@amplitude/analytics-browser']

// Files in `dist` that should contain each optional import with its magic
// comment. `index.js`/`index.cjs` inline the plugin bodies (splitting: false),
// so all three appear there; the subpath bundles carry one each.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../')
const DIST_FILES = [
  { file: 'dist/index.js', sdks: OPTIONAL_SDKS },
  { file: 'dist/index.cjs', sdks: OPTIONAL_SDKS },
  { file: 'dist/plugins/posthog.js', sdks: ['posthog-js'] },
  { file: 'dist/plugins/mixpanel.js', sdks: ['mixpanel-browser'] },
  { file: 'dist/plugins/amplitude.js', sdks: ['@amplitude/analytics-browser'] },
]

function read(rel: string): string {
  const path = join(ROOT, rel)
  if (!existsSync(path)) {
    throw new Error(
      `${rel} not found — build the package before running this guard (\`pnpm --filter @tour-kit/analytics build\`). Turbo runs \`build\` before \`test\`, so this only fails on a standalone \`vitest run\`.`
    )
  }
  return readFileSync(path, 'utf8')
}

function escapeRe(s: string): string {
  return s.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')
}

describe('optional analytics SDKs are bundler-ignored in dist', () => {
  for (const { file, sdks } of DIST_FILES) {
    for (const sdk of sdks) {
      it(`${file}: import('${sdk}') carries webpackIgnore + @vite-ignore`, () => {
        const code = read(file)

        // Locate every `import(... 'sdk' ...)` call, tolerating the multi-line
        // formatting that survives when whitespace minification is disabled.
        // The tempered `(?!import\()` token keeps each match anchored to the
        // `import(` that directly precedes the specifier (never spanning across
        // a sibling import to a different SDK).
        const re = new RegExp(
          `import\\(((?:(?!import\\()[\\s\\S])*?)['"\`]${escapeRe(sdk)}['"\`]`,
          'g'
        )
        const calls = [...code.matchAll(re)]

        expect(calls.length, `no import('${sdk}') found in ${file}`).toBeGreaterThan(0)

        for (const [, head] of calls) {
          // The captured span between `import(` and the specifier must not jump
          // over another import() (which would mean we matched the wrong call).
          expect(head, `matched across another import() for '${sdk}'`).not.toContain('import(')
          expect(head, `import('${sdk}') in ${file} is missing /* webpackIgnore: true */`).toMatch(
            /webpackIgnore:\s*true/
          )
          expect(head, `import('${sdk}') in ${file} is missing /* @vite-ignore */`).toMatch(
            /@vite-ignore/
          )
        }
      })
    }
  }
})
