// Confirmed: zod ^3.25.0 || ^4.0.0 (peer range per zod.dev/v4/versioning).
// Use the root `zod` import — Zod 4 lives at the package root.
import { z } from 'zod'

/**
 * One condition inside the array form of `AudienceDefinition`. JSON-safe subset
 * of the runtime `AudienceCondition` (no `type` discriminator — consumers attach
 * it after parsing if they need to bridge to the runtime shape).
 */
export const audienceConditionSchema = z.object({
  key: z.string().min(1),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'in',
    'not_in',
    'exists',
    'not_exists',
  ]),
  value: z.unknown().optional(),
})

/**
 * Audience filter — accepts either the legacy condition-array form or the
 * named-segment object form. Mirrors `AudienceProp` from `types/step.ts` but
 * skips the runtime `type` discriminator on each condition.
 */
export const audienceSchema = z.union([
  z.array(audienceConditionSchema),
  z.object({ segment: z.string().min(1) }),
])
