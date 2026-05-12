import { describe, expect, it } from 'vitest'
import { distExists, readMainBundle, readMainBundleCjs } from './_dist'

describe('main bundle hygiene — Zod must NOT leak in', () => {
  it.skipIf(!distExists())('does not `import` from zod (ESM)', () => {
    const main = readMainBundle()
    // Match `from "zod"`, `from 'zod'`, or any `zod/...` subpath import.
    expect(main).not.toMatch(/from\s+["']zod(\/[^"']*)?["']/)
  })

  it.skipIf(!distExists())('does not `require("zod")` (CJS)', () => {
    const main = readMainBundleCjs()
    expect(main).not.toMatch(/require\(["']zod(\/[^"']*)?["']\)/)
  })
})
