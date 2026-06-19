import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Slice 5 (D6) — `ScheduleStatus.nextInactiveAt` was declared-only:
 * `get-schedule-status.ts` only ever set `nextActiveAt`. It is deleted (not
 * Studio-authored), which also reclaims the type surface. `nextActiveAt` stays.
 */

const here = dirname(fileURLToPath(import.meta.url))
const statusSrc = readFileSync(join(here, '../types/status.ts'), 'utf8')

describe('Slice 5 deletion guard — ScheduleStatus.nextInactiveAt is gone (D6)', () => {
  it('nextInactiveAt no longer appears in the status type', () => {
    expect(statusSrc).not.toMatch(/nextInactiveAt/)
  })

  it('nextActiveAt is retained', () => {
    expect(statusSrc).toMatch(/nextActiveAt\?: Date/)
  })
})
