import { z } from 'zod'
import { audienceSchema } from './audience.schema'

// keep in sync with `Placement` from `../../types/config.ts`
const placementEnum = z.enum([
  'top',
  'top-start',
  'top-end',
  'right',
  'right-start',
  'right-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
])

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
