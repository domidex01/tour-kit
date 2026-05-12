/**
 * DiagnosticGate extension contract (Phase 0 — type-only stub).
 *
 * Phase 3.1 owns the runtime implementation; this file ships the structural
 * contract so upper packages (@tour-kit/license, @tour-kit/scheduling, etc.)
 * can prototype gates against a stable interface.
 *
 * Hard rule: @tour-kit/core sits at the bottom of the dependency graph —
 * NEVER import from any other @tour-kit/* package here.
 */

export interface DiagnosticContext {
  userContext?: Record<string, unknown>
  completedTours: readonly string[]
  skippedTours: readonly string[]
  route?: {
    current: string
    matcher: string
    mode: 'exact' | 'startsWith' | 'contains'
  }
  targetResolver?: (selector: string) => HTMLElement | null
}

export type GateReason =
  | { ok: true; gate: string }
  | {
      ok: false
      gate: string
      code: string
      message: string
      detail?: Record<string, unknown>
    }

export interface DiagnosticGate {
  /** Stable identifier, e.g. 'license', 'scheduling', 'audience'. */
  id: string
  /** Run synchronously OR async. Must NOT throw — return an `ok: false` reason instead. */
  evaluate: (ctx: DiagnosticContext) => GateReason | Promise<GateReason>
}
