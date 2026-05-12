/**
 * Diagnostic engine types — Phase 3 (full surface).
 *
 * The `EligibilityReport` is what `explainTour` produces and
 * `useTourDiagnostic` exposes. The `DiagnosticGate` interface is the
 * extension contract — upper packages (`@tour-kit/license`,
 * `@tour-kit/scheduling`, etc.) implement it WITHOUT this package importing
 * any of them. Hard rule: `@tour-kit/core` sits at the bottom of the
 * dependency graph; never `import { ... } from '@tour-kit/<anything>'` here.
 */

/**
 * Canonical failure codes. The `(string & {})` escape hatch keeps
 * literal-union autocomplete for built-ins while allowing extension gates to
 * surface their own codes (`'LICENSE_INVALID'`, `'OUT_OF_WINDOW'`, ...).
 */
export type GateCode =
  | 'STRUCTURE_INVALID'
  | 'AUDIENCE_MISMATCH'
  | 'ALREADY_COMPLETED'
  | 'ALREADY_SKIPPED'
  | 'OUT_OF_WINDOW'
  | 'LICENSE_INVALID'
  | 'LICENSE_EXPIRED'
  | 'TARGET_NOT_FOUND'
  | 'WHEN_RETURNED_FALSE'
  | 'ROUTE_MISMATCH'
  | 'AUTOSTART_DISABLED'
  | (string & {})

export type GateName =
  | 'structure'
  | 'audience'
  | 'persistence'
  | 'scheduling'
  | 'license'
  | 'target'
  | 'when'
  | 'route'
  | 'autostart'
  | (string & {})

export type GateReason =
  | { ok: true; gate: GateName; detail?: Record<string, unknown> }
  | {
      ok: false
      gate: GateName
      code: GateCode
      message: string
      detail?: Record<string, unknown>
    }

export interface EligibilityReport {
  tourId: string
  willFire: boolean
  reasons: GateReason[]
  firstFailingGate: Extract<GateReason, { ok: false }> | null
  evaluatedAt: number
}

export interface DiagnosticContext {
  userContext?: Record<string, unknown>
  completedTours: readonly string[]
  skippedTours: readonly string[]
  schedule?: { from?: Date; to?: Date }
  route?: {
    current: string
    matcher: string
    mode: 'exact' | 'startsWith' | 'contains'
  }
  targetResolver?: (selector: string) => HTMLElement | null
}

export interface DiagnosticGate {
  /** Stable identifier, e.g. 'license', 'scheduling', 'audience'. */
  id: string
  /** Run synchronously OR async. May throw — orchestrator captures the error. */
  evaluate: (ctx: DiagnosticContext) => GateReason | Promise<GateReason>
}
