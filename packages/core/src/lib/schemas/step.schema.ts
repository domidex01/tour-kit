import { z } from 'zod'
import type { Placement } from '../../types/config'
import { audienceSchema } from './audience.schema'

// `satisfies readonly Placement[]` makes the literal list assignable to
// Placement (one direction); the `_AssertCoversPlacement` check below proves
// the other direction. Together they reject silent drift if `Placement` gains
// a new literal — typecheck:types fails until this array is updated.
const PLACEMENT_VALUES = [
  'top',
  'top-start',
  'top-center',
  'top-end',
  'right',
  'right-start',
  'right-center',
  'right-end',
  'bottom',
  'bottom-start',
  'bottom-center',
  'bottom-end',
  'left',
  'left-start',
  'left-center',
  'left-end',
] as const satisfies readonly Placement[]

type _AssertCoversPlacement = Placement extends (typeof PLACEMENT_VALUES)[number] ? true : never
const _placementCoverage: _AssertCoversPlacement = true
void _placementCoverage

const placementEnum = z.enum(PLACEMENT_VALUES)

/**
 * JSON-safe step shape. Mirrors `TourStepDefinition` 1:1 — when a new key is
 * added to `TourStepDefinition`, add it here AND update `TourStepJsonSafeKeys`
 * in `parity.test-d.ts`, or the compile-time parity assertion will fail.
 */
export const tourStepDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['visible', 'hidden']).optional(),
  target: z.string().min(1),
  title: z.unknown().optional(),
  description: z.unknown().optional(),
  content: z.unknown(),
  audience: audienceSchema.optional(),
  placement: placementEnum.optional(),
})
