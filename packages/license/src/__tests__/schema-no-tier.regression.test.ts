import { describe, expect, it } from 'vitest'
import { PolarValidateResponseSchema } from '../lib/schemas'

// Pins the wire-contract decision from Phase 0 §6 / memory #187:
// Polar /v1/customer-portal/license-keys/validate has NO `tier` field.
// Trial state is client-derived; do not add `tier` to this schema.
describe('PolarValidateResponseSchema regression (memory #187, Phase 0 §6)', () => {
  it('does NOT include a `tier` field — Polar API has no tier; trial is client-derived', () => {
    expect('tier' in PolarValidateResponseSchema.shape).toBe(false)
  })
})
