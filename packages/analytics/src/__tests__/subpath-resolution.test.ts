/**
 * v3 Phase 0 — `@tour-kit/analytics/engine` actually resolves.
 *
 * US-2: the `exports` map is proven, not just written. The guard file next door
 * reads bytes; this one asks Node to resolve the subpath for real, in both
 * module systems — ESM through a dynamic `import()` (a self-reference through
 * `exports`, which needs no self-link in `node_modules`) and CJS through a
 * child process, because this worker is ESM.
 *
 * The refusal list is a first-class assertion, not a footnote: the barrel is
 * defined as much by what it withholds as by what it exports. Without it,
 * `export *` from the main entry would satisfy every other case in this file.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distExists = () => existsSync(join(PKG_ROOT, 'dist'))

describe('@tour-kit/analytics/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/analytics/engine')
    expect(typeof mod.createAnalytics).toBe('function')
    expect(typeof mod.TourAnalytics).toBe('function')
    // All five plugins are factories, so `function` is the right typeof.
    for (const name of [
      'consolePlugin',
      'posthogPlugin',
      'mixpanelPlugin',
      'amplitudePlugin',
      'googleAnalyticsPlugin',
    ] as const) {
      expect(typeof mod[name], name).toBe('function')
    }
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/analytics/engine'); console.log(typeof m.createAnalytics, typeof m.consolePlugin, 'AnalyticsProvider' in m);",
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim()).toBe('function function false')
  })

  it.skipIf(!distExists())('does NOT re-export the React surface', async () => {
    const mod = (await import('@tour-kit/analytics/engine')) as Record<string, unknown>
    for (const name of [
      'AnalyticsProvider',
      'useAnalytics',
      'useAnalyticsOptional',
      // Not React, but equally not public: the tracker's internal queue seam.
      'createEventQueue',
    ]) {
      expect(mod, `@tour-kit/analytics/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })
})
