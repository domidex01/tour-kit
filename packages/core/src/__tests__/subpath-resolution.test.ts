import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { distExists } from './_dist'

describe('@tour-kit/core/schemas subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/core/schemas')
    expect(typeof mod.parseTourDefinition).toBe('function')
    expect(typeof mod.safeParseTourDefinition).toBe('function')
    expect(typeof mod.createTourDefinitionSchema).toBe('function')
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
