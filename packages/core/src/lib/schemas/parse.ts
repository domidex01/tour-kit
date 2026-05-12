import type { z } from 'zod'
import type { TourDefinition } from '../../types/tour-definition'
import { tourStepDefinitionSchema } from './step.schema'
import { tourDefinitionSchema } from './tour.schema'

/**
 * Parse a JSON-authored tour definition. Throws `ZodError` on invalid input.
 *
 * The runtime parse result has the same key shape as `TourDefinition`, but
 * the inferred Zod type is slightly different (e.g. `content: unknown`). We
 * cast once at the boundary so consumers see a clean `TourDefinition` type.
 */
export function parseTourDefinition(input: unknown): TourDefinition {
  return tourDefinitionSchema.parse(input) as TourDefinition
}

/**
 * Non-throwing parse. Returns Zod's tagged union:
 * `{ success: true, data } | { success: false, error: ZodError }`.
 */
export function safeParseTourDefinition(input: unknown) {
  return tourDefinitionSchema.safeParse(input)
}

/**
 * Build a stricter STEP schema where `content` is validated by the caller's
 * schema (e.g. a CMS content-block shape). Useful when the JSON payload has
 * a known content discriminator and you want full-tree validation.
 *
 * Returns a step-level schema — wrap it in `z.array(...).min(1)` and feed it
 * to a custom tour schema if you want a full validation pipeline.
 */
export function createTourStepDefinitionSchema<TContent extends z.ZodTypeAny>(opts: {
  contentSchema: TContent
}) {
  return tourStepDefinitionSchema.extend({ content: opts.contentSchema })
}
