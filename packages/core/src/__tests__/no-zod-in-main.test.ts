import { describe, expect, it } from 'vitest'
import { MAIN_CJS, MAIN_MJS, distExists, readClosure } from './_dist'

/**
 * Retrofitted for v2 §1.2. This used to read `dist/index.js` alone, which was
 * exact while core emitted a single self-contained entry. Once a second entry
 * exists, `splitting: true` moves the shared code into a `chunk-*.js` and the
 * entry file becomes a re-export shell — a zod import could land in the chunk
 * and this test would never see it. Same blind spot the bundle-size gate has,
 * same fix: read the import closure.
 */
describe('main bundle hygiene — Zod must NOT leak in', () => {
  it.skipIf(!distExists())('does not `import` from zod (ESM)', () => {
    const { source } = readClosure(MAIN_MJS)
    // Match `from "zod"`, `from 'zod'`, or any `zod/...` subpath import.
    expect(source).not.toMatch(/from\s*["']zod(\/[^"']*)?["']/)
  })

  it.skipIf(!distExists())('does not `require("zod")` (CJS)', () => {
    const { source } = readClosure(MAIN_CJS)
    expect(source).not.toMatch(/require\(["']zod(\/[^"']*)?["']\)/)
  })
})
