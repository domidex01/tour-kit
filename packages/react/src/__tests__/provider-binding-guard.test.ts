/**
 * Issue #154 — the react side of the no-drift guard.
 *
 * Core's twin (`packages/core/src/__tests__/context/provider-is-a-binding.test.ts`)
 * pins that core's `<TourProvider>` is a binding over `createTourEngine()`.
 * This one pins the react-owned seam: the symbols a consumer imports from
 * `@tour-kit/react` must be core's components behind the `LicenseGate` shim —
 * never a second provider implementation with its own lifecycle handling.
 *
 * It reads the source for the same reason #121's meta-guard does: the failure
 * mode is code that must never be written, and no behaviour test can catch it.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The react-owned provider files — the only providers this package may have. */
const PROVIDER_FILES = [
  'components/provider/licensed-providers.tsx',
  'components/provider/tourkit-provider.tsx',
] as const

const SECOND_ENGINE_MARKERS = [
  "'START_TOUR'",
  "'NEXT_STEP'",
  "'STOP_TOUR'",
  "'COMPLETE_TOUR'",
  '.onBeforeShow',
  '.onBeforeHide',
  '.onEnter',
  '.onShow',
  '.onHide',
  '.onStart',
  '.onComplete',
  '.onSkip',
  '.onStepChange',
  'invokeCallback',
  'invokeAsyncCallback',
] as const

function sourceOf(relPath: (typeof PROVIDER_FILES)[number]): string {
  const source = readFileSync(resolve(__dirname, '..', relPath), 'utf8')
  // Self-check: a moved file must fail the guard, not neuter it.
  expect(source.length, `${relPath} looks empty — did it move?`).toBeGreaterThan(100)
  return source
}

describe("@tour-kit/react's providers are core's, behind the licence shim (#154)", () => {
  it('self-check: the shim renders core TourProvider/TourKitProvider', () => {
    const shim = sourceOf('components/provider/licensed-providers.tsx')
    expect(shim).toContain("from '@tour-kit/core'")
    expect(shim).toContain('CoreTourProvider')
    expect(shim).toContain('CoreTourKitProvider')
  })

  it.each([...SECOND_ENGINE_MARKERS])('no provider file contains `%s`', (marker) => {
    for (const file of PROVIDER_FILES) {
      expect(
        sourceOf(file),
        `${file} contains \`${marker}\` — react must re-export core's providers, not reimplement them`
      ).not.toContain(marker)
    }
  })
})
