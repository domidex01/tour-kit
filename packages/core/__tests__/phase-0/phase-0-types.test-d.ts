/**
 * Type-only fixture for the DiagnosticGate Phase 0 stub.
 *
 * Picked up by tsconfig.type-tests.json. Assignability IS the assertion —
 * if any of these constructions fail to compile, the Phase 0 contract has
 * regressed.
 */

import type { DiagnosticContext, DiagnosticGate, GateReason } from '../../src/types/diagnostic'

const okReason: GateReason = { ok: true, gate: 'license' }

const errReason: GateReason = {
  ok: false,
  gate: 'license',
  code: 'LICENSE_INVALID',
  message: 'License key has expired',
}

const errReasonWithDetail: GateReason = {
  ok: false,
  gate: 'scheduling',
  code: 'WINDOW_CLOSED',
  message: 'Outside scheduled window',
  detail: { window: 'business-hours' },
}

const ctx: DiagnosticContext = {
  completedTours: ['onboarding'],
  skippedTours: [],
}

const ctxFull: DiagnosticContext = {
  userContext: { plan: 'pro' },
  completedTours: [] as readonly string[],
  skippedTours: [] as readonly string[],
  route: { current: '/', matcher: '/', mode: 'exact' },
  targetResolver: (sel: string) => document.querySelector(sel) as HTMLElement | null,
}

const syncGate: DiagnosticGate = {
  id: 'license',
  evaluate: (c: DiagnosticContext): GateReason => {
    void c
    return { ok: true, gate: 'license' }
  },
}

const asyncGate: DiagnosticGate = {
  id: 'scheduling',
  evaluate: async (c: DiagnosticContext): Promise<GateReason> => {
    void c
    return { ok: true, gate: 'scheduling' }
  },
}

void okReason
void errReason
void errReasonWithDetail
void ctx
void ctxFull
void syncGate
void asyncGate
