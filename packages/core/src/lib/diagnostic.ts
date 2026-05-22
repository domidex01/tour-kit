/**
 * Diagnostic engine — Phase 3.
 *
 * Wraps every reason a tour might not fire into a single structured
 * `EligibilityReport`. Runs seven built-in gates in a fixed order, then any
 * extension gates registered via `<TourProvider diagnosticGates>`. NEVER
 * throws: internal errors are captured as `ok: false` reasons.
 */
import type {
  DiagnosticContext,
  DiagnosticGate,
  EligibilityReport,
  GateReason,
} from '../types/diagnostic'
import { type AudienceProp, isVisibleStep, type VisibleTourStep } from '../types/step'
import type { Tour } from '../types/tour'
import { explainAudience } from './audience'
import { TourValidationError, validateTour } from './validate-tour'

/**
 * Canonical built-in evaluation order. Tests pin this tuple — the order is
 * part of the contract that consumers (and `<TourDebugger>`) rely on.
 */
export const BUILTIN_GATE_ORDER = [
  'structure',
  'audience',
  'persistence',
  'route',
  'target',
  'when',
  'autostart',
] as const

function gateStructure(tour: Tour): GateReason {
  try {
    if (!Array.isArray(tour.steps) || tour.steps.length === 0) {
      return {
        ok: false,
        gate: 'structure',
        code: 'STRUCTURE_INVALID',
        message: 'Tour has no steps',
        detail: { tourId: tour.id, stepCount: Array.isArray(tour.steps) ? tour.steps.length : 0 },
      }
    }
    validateTour(tour)
    return { ok: true, gate: 'structure' }
  } catch (e) {
    const error = e as Error
    // Preserve `TourValidationError`'s structured fields (the offending step
    // id and the specific validation code) so operators can route on them.
    const detail: Record<string, unknown> = { error: error.message }
    if (error instanceof TourValidationError) {
      detail.tourErrorCode = error.code
      detail.stepId = error.stepId
    }
    return {
      ok: false,
      gate: 'structure',
      code: 'STRUCTURE_INVALID',
      message: error.message ?? 'Tour failed structural validation',
      detail,
    }
  }
}

function gateAudience(audience: AudienceProp | undefined, ctx: DiagnosticContext): GateReason {
  return explainAudience(audience, ctx.userContext)
}

function gatePersistence(tour: Tour, ctx: DiagnosticContext): GateReason {
  if (ctx.completedTours.includes(tour.id)) {
    return {
      ok: false,
      gate: 'persistence',
      code: 'ALREADY_COMPLETED',
      message: `Tour ${tour.id} already completed`,
      detail: { tourId: tour.id },
    }
  }
  if (ctx.skippedTours.includes(tour.id)) {
    return {
      ok: false,
      gate: 'persistence',
      code: 'ALREADY_SKIPPED',
      message: `Tour ${tour.id} previously skipped`,
      detail: { tourId: tour.id },
    }
  }
  return { ok: true, gate: 'persistence' }
}

function gateRoute(tour: Tour, ctx: DiagnosticContext): GateReason {
  if (!ctx.route) return { ok: true, gate: 'route' }
  const { current, matcher, mode } = ctx.route
  let matches = false
  switch (mode) {
    case 'exact':
      matches = current === matcher
      break
    case 'startsWith':
      matches = current.startsWith(matcher)
      break
    case 'contains':
      matches = current.includes(matcher)
      break
    default:
      matches = false
  }
  if (matches) return { ok: true, gate: 'route' }
  return {
    ok: false,
    gate: 'route',
    code: 'ROUTE_MISMATCH',
    message: `Route ${current} does not match ${matcher} (${mode})`,
    detail: { expected: matcher, actual: current, mode, tourId: tour.id },
  }
}

function firstVisibleStep(tour: Tour): VisibleTourStep | undefined {
  return tour.steps.find(isVisibleStep)
}

function gateTarget(tour: Tour, ctx: DiagnosticContext): GateReason {
  if (!ctx.targetResolver) return { ok: true, gate: 'target' }
  const step = firstVisibleStep(tour)
  if (!step) return { ok: true, gate: 'target' }
  // Refs (objects with `.current`) are not checked in diagnostic mode — runtime owns them.
  if (typeof step.target !== 'string') return { ok: true, gate: 'target' }
  const el = ctx.targetResolver(step.target)
  if (el) return { ok: true, gate: 'target' }
  return {
    ok: false,
    gate: 'target',
    code: 'TARGET_NOT_FOUND',
    message: `Selector ${step.target} did not resolve`,
    detail: { selector: step.target, stepId: step.id, tourId: tour.id },
  }
}

function gateWhen(tour: Tour): GateReason {
  if (!tour.when) return { ok: true, gate: 'when' }
  try {
    const result = tour.when()
    if (result instanceof Promise) {
      // Async when() is owned by the runtime pipeline. Document the carveout.
      return {
        ok: true,
        gate: 'when',
        detail: {
          note: 'Async when() callbacks are evaluated at runtime, not in diagnostic mode',
        },
      }
    }
    if (result === false) {
      return {
        ok: false,
        gate: 'when',
        code: 'WHEN_RETURNED_FALSE',
        message: 'Tour-level when() returned false',
        detail: { tourId: tour.id },
      }
    }
    return { ok: true, gate: 'when' }
  } catch (e) {
    const error = e as Error
    return {
      ok: false,
      gate: 'when',
      code: 'WHEN_RETURNED_FALSE',
      message: error.message ?? 'Tour-level when() threw',
      detail: { error: error.message, tourId: tour.id },
    }
  }
}

function gateAutostart(tour: Tour): GateReason {
  if (tour.autoStart === false) {
    return {
      ok: false,
      gate: 'autostart',
      code: 'AUTOSTART_DISABLED',
      message: 'Tour has autoStart: false',
      detail: { tourId: tour.id },
    }
  }
  return { ok: true, gate: 'autostart' }
}

function finalize(tourId: string, reasons: GateReason[], evaluatedAt: number): EligibilityReport {
  const firstFailingGate =
    reasons.find((r): r is Extract<GateReason, { ok: false }> => !r.ok) ?? null
  return {
    tourId,
    willFire: firstFailingGate === null,
    reasons,
    firstFailingGate,
    evaluatedAt,
  }
}

/**
 * Evaluate every built-in gate (in `BUILTIN_GATE_ORDER`) and any extension
 * gates (in registration order), then return the aggregated report.
 *
 * Built-in gates are sync; extension gates may be async. NEVER throws — a
 * throwing extension yields a synthetic `{ ok: false, code: '${ID}_THREW' }`.
 * A failing `structure` gate short-circuits the rest of the pipeline: nothing
 * else matters when the tour shape is invalid.
 */
export async function explainTour(
  tour: Tour,
  ctx: DiagnosticContext,
  extensions: DiagnosticGate[] = []
): Promise<EligibilityReport> {
  const reasons: GateReason[] = []
  const evaluatedAt = Date.now()

  try {
    const structure = gateStructure(tour)
    reasons.push(structure)
    if (!structure.ok) return finalize(tour.id, reasons, evaluatedAt)

    reasons.push(gateAudience(tour.audience, ctx))
    reasons.push(gatePersistence(tour, ctx))
    reasons.push(gateRoute(tour, ctx))
    reasons.push(gateTarget(tour, ctx))
    reasons.push(gateWhen(tour))
    reasons.push(gateAutostart(tour))

    for (const gate of extensions) {
      try {
        const result = await gate.evaluate(ctx)
        reasons.push(result)
      } catch (e) {
        const error = e as Error
        reasons.push({
          ok: false,
          gate: gate.id,
          code: `${gate.id.toUpperCase()}_THREW`,
          message: error.message ?? 'Gate threw',
          detail: { error: error.message },
        })
      }
    }
  } catch (e) {
    // Defensive catch-all — diagnostic engine must never throw.
    const error = e as Error
    reasons.push({
      ok: false,
      gate: 'structure',
      code: 'STRUCTURE_INVALID',
      message: error.message ?? 'Diagnostic engine threw',
      detail: { error: error.message },
    })
  }

  return finalize(tour.id, reasons, evaluatedAt)
}
