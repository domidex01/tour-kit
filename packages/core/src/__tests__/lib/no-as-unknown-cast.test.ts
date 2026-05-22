import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Phase 3 (refactor train) — source-level grep gate co-located with the test.
// The `as unknown as Record<string, unknown>` cast in `validateTour` was
// needed when `TourStep` lacked the hidden-branch type. Now that
// `HiddenTourStep` declares the forbidden fields as `?: never`, the cast is
// removable — and this gate prevents Phase 4/5 from re-introducing it.

const __here = dirname(fileURLToPath(import.meta.url))
const VALIDATE_TOUR_PATH = resolve(__here, '../../lib/validate-tour.ts')

describe('validate-tour.ts source — Phase 3 grep gate', () => {
  const source = readFileSync(VALIDATE_TOUR_PATH, 'utf-8')

  it('does not contain `as unknown as Record<string, unknown>`', () => {
    expect(source).not.toMatch(/as unknown as Record<string, unknown>/)
  })

  it('reads step[field] without a cast', () => {
    expect(source).toMatch(/step\[field\]/)
  })
})
