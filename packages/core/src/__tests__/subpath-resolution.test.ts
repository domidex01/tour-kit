import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { distExists } from './_dist'

describe('@tour-kit/core/schemas subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/core/schemas')
    expect(typeof mod.parseTourDefinition).toBe('function')
    expect(typeof mod.safeParseTourDefinition).toBe('function')
    expect(typeof mod.createTourStepDefinitionSchema).toBe('function')
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    // Use a child process to prove the CJS entry resolves under Node's CJS
    // loader — `createRequire` from this ESM test wouldn't exercise the same
    // resolution path.
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/core/schemas'); console.log(typeof m.parseTourDefinition);",
      ],
      { encoding: 'utf8' }
    )
    expect(stdout.trim()).toBe('function')
  })
})

/**
 * v2 §1.2 — the React-free door. Same two nets as `/schemas` above, because
 * the resolution failure modes are the same (a missing `exports` key, a wrong
 * `default` path, a CJS entry that was never emitted) and the `/schemas` block
 * is the proven template.
 *
 * These assert the RUNTIME half only. The `types` half of the `exports` entry
 * is never read by Node, so a typo there survives this file — that is
 * `engine-types-are-portable.test.ts`'s job.
 */
describe('@tour-kit/core/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/core/engine')

    // One representative value per source group in the planned barrel, so a
    // half-written barrel fails here rather than at a consumer.
    expect(typeof mod.matchesAudience).toBe('function') // lib/audience
    expect(typeof mod.canShowByFrequency).toBe('function') // lib/frequency
    expect(typeof mod.validateTour).toBe('function') // lib/validate-tour
    expect(typeof mod.waitForStepTarget).toBe('function') // lib/wait-for-step-target
    expect(typeof mod.interpolate).toBe('function') // lib/interpolate
    expect(typeof mod.explainTour).toBe('function') // lib/diagnostic
    expect(Array.isArray(mod.BUILTIN_GATE_ORDER)).toBe(true) // lib/diagnostic
    expect(typeof mod.isI18nKey).toBe('function') // lib/localized-text
    expect(typeof mod.resolvePlural).toBe('function') // lib/i18n/plural — LEAF
    expect(typeof mod.parseUserIdsFromCsv).toBe('function') // lib/segmentation/csv — LEAF
    expect(typeof mod.resolveTarget).toBe('function') // types (runtime value)
    expect(typeof mod.isVisibleStep).toBe('function') // types (runtime value)
    expect(typeof mod.defaultKeyboardConfig).toBe('object') // types (runtime default)
    expect(typeof mod.getElement).toBe('function') // utils
    expect(typeof mod.createTour).toBe('function') // utils
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/core/engine'); console.log(typeof m.matchesAudience, typeof m.validateTour, Array.isArray(m.BUILTIN_GATE_ORDER));",
      ],
      { encoding: 'utf8' }
    )
    expect(stdout.trim()).toBe('function function true')
  })

  /**
   * The barrel is defined as much by what it refuses as by what it exports.
   * Each name below drags something the engine door exists to keep out:
   * `cn` → clsx + tailwind-merge; the schema parsers → zod; the providers and
   * hooks → React; `navigateToStepImpl` → an internal shape §1.3 is about to
   * redesign (exporting it now freezes an API before it settles).
   */
  it.skipIf(!distExists())('does NOT re-export the React, zod or clsx surface', async () => {
    const mod = (await import('@tour-kit/core/engine')) as Record<string, unknown>

    for (const name of [
      'cn',
      'parseTourDefinition',
      'safeParseTourDefinition',
      'TourProvider',
      'TourKitProvider',
      'useTour',
      'useResolvedText',
      'LocaleProvider',
      'useT',
      'SegmentationProvider',
      'useSegment',
      'UnifiedSlot',
      'navigateToStepImpl',
      'handleBranchTargetImpl',
    ]) {
      expect(mod, `@tour-kit/core/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })
})
