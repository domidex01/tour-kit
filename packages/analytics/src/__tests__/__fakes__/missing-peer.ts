import { vi } from 'vitest'

/**
 * Per-test helper to simulate the optional `@amplitude/analytics-browser` peer
 * not being installed. The plugin uses dynamic `import()`, so this rejects
 * the import promise on the next module load.
 *
 * Call inside the test after `vi.resetModules()` and before re-importing
 * `../../plugins/amplitude`.
 */
export function mockMissingAmplitude(): void {
  vi.doMock('@amplitude/analytics-browser', () => {
    throw new Error("Cannot find module '@amplitude/analytics-browser'")
  })
}
