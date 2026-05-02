import type { Tour } from '../types'

const FORBIDDEN_HIDDEN_FIELDS = ['target', 'content', 'title', 'placement', 'advanceOn'] as const

type TourValidationCode = 'INVALID_HIDDEN_STEP' | 'HIDDEN_STEP_LOOP'

/**
 * Thrown by `validateTour` (config-time) and by the provider's hidden-step
 * loop guard (runtime). Catch-site filtering uses the readonly `code` field.
 */
export class TourValidationError extends Error {
  readonly code: TourValidationCode
  readonly stepId: string

  constructor(args: { code: TourValidationCode; stepId: string; message: string }) {
    super(args.message)
    this.name = 'TourValidationError'
    this.code = args.code
    this.stepId = args.stepId
  }
}

/**
 * Validate a Tour at provider mount.
 *
 * Currently enforces: hidden steps must not declare UI fields. Throws a
 * `TourValidationError` whose message names the offending step id and field.
 */
export function validateTour(tour: Tour): void {
  for (const step of tour.steps) {
    if (step.kind !== 'hidden') continue
    for (const field of FORBIDDEN_HIDDEN_FIELDS) {
      if ((step as unknown as Record<string, unknown>)[field] != null) {
        throw new TourValidationError({
          code: 'INVALID_HIDDEN_STEP',
          stepId: step.id,
          message: `Hidden step "${step.id}" must not declare \`${field}\`.`,
        })
      }
    }
  }
}
