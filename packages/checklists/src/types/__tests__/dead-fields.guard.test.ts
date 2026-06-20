import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Slice 5 (D4/D5) — two typed-but-dead checklist fields:
 *   - `ChecklistTaskState.active` (checklist.ts) — always `false`; the provider
 *     hardcoded `active: false` and no updater ever flipped it.
 *   - `ChecklistProviderConfig.tourKitIntegration` (config.ts) — never read by
 *     the provider; the `case 'tour':` task-action arm is a different symbol and
 *     is left untouched.
 *
 * Proven by source scan (the package `typecheck` excludes tests, so an
 * `@ts-expect-error` here would be an unenforced false-green).
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(here, rel), 'utf8')

describe('Slice 5 deletion guards — checklists dead fields (D4/D5)', () => {
  it('ChecklistTaskState no longer declares active (checklist.ts)', () => {
    expect(read('../checklist.ts')).not.toMatch(/^\s*active:\s*boolean/m)
  })

  it('the provider no longer seeds active: false (checklist-provider.tsx)', () => {
    expect(read('../../context/checklist-provider.tsx')).not.toMatch(/active:\s*false/)
  })

  it('ChecklistProviderConfig no longer declares tourKitIntegration (config.ts)', () => {
    expect(read('../config.ts')).not.toMatch(/tourKitIntegration/)
  })

  it('keeps the tour task-action arm intact (different symbol)', () => {
    // The dead config flag is gone, but `{ type: 'tour'; tourId: string }` and
    // its `case 'tour':` handler are a real task-action type — must remain.
    expect(read('../checklist.ts')).toMatch(/type:\s*'tour'/)
  })
})
