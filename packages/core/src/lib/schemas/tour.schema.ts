import { z } from 'zod'
import { audienceSchema } from './audience.schema'
import { tourStepDefinitionSchema } from './step.schema'

/**
 * Top-level JSON-safe tour shape. Mirrors `TourDefinition` 1:1 — when a new
 * key is added to `TourDefinition`, add it here AND update `TourJsonSafeKeys`
 * in `parity.test-d.ts`, or the compile-time parity assertion will fail.
 */
export const tourDefinitionSchema = z.object({
  id: z.string().min(1),
  steps: z.array(tourStepDefinitionSchema).min(1),
  audience: audienceSchema.optional(),
  autoStart: z.boolean().optional(),
  startAt: z.number().int().nonnegative().optional(),
})

/**
 * Top-level container shape for a JSON file or CMS payload that ships multiple
 * tours at once: `{ "tours": [...] }`.
 */
export const flowSourceSchema = z.object({
  tours: z.array(tourDefinitionSchema),
})
