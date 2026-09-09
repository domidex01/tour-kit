/**
 * v3 Phase 0 — `@tour-kit/scheduling/engine` actually resolves.
 *
 * US-2: the `exports` map is proven, not just written. The guard file next door
 * reads bytes; this one asks Node to resolve the subpath for real, in both
 * module systems — ESM through a dynamic `import()` (a self-reference through
 * `exports`, which needs no self-link in `node_modules`) and CJS through a
 * child process, because this worker is ESM.
 *
 * The refusal list is a first-class assertion, not a footnote: the barrel is
 * defined as much by what it withholds as by what it exports. Without it,
 * `export *` from the main entry would satisfy every other case in this file —
 * and this barrel really is two `export *` lines, so that is not hypothetical.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distExists = () => existsSync(join(PKG_ROOT, 'dist'))

describe('@tour-kit/scheduling/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/scheduling/engine')
    // One per evaluation family, not all twenty-four: the barrel is `export *`,
    // so a representative from each leaf proves the re-export chain without
    // duplicating `utils/index.ts` as a list that rots.
    for (const name of [
      'checkSchedule',
      'isScheduleActive',
      'getScheduleStatus',
      'matchesRecurringPattern',
      'isWithinBusinessHours',
    ] as const) {
      expect(typeof mod[name], name).toBe('function')
    }
    // The two constants come through `../types`, the other star-export.
    expect(Array.isArray(mod.DAY_NAMES)).toBe(true)
    expect(typeof mod.BUSINESS_HOURS_PRESETS).toBe('object')
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/scheduling/engine'); console.log(typeof m.checkSchedule, typeof m.getScheduleStatus, Array.isArray(m.DAY_NAMES), 'useSchedule' in m);",
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim()).toBe('function function true false')
  })

  it.skipIf(!distExists())('does NOT re-export the React surface', async () => {
    const mod = (await import('@tour-kit/scheduling/engine')) as Record<string, unknown>
    for (const name of ['ScheduleGate', 'useSchedule', 'useScheduleStatus', 'useUserTimezone']) {
      expect(mod, `@tour-kit/scheduling/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })
})
