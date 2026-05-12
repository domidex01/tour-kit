import type { DiagnosticGate } from '../../types/diagnostic'

export const okGate: DiagnosticGate = {
  id: 'mock-ok',
  evaluate: () => ({ ok: true, gate: 'mock-ok' }),
}

export const failingGate: DiagnosticGate = {
  id: 'mock-fail',
  evaluate: () => ({
    ok: false,
    gate: 'mock-fail',
    code: 'MOCK_FAIL',
    message: 'mock failure',
    detail: { reason: 'test' },
  }),
}

export const asyncGate: DiagnosticGate = {
  id: 'mock-async',
  evaluate: async () => {
    await new Promise((r) => setTimeout(r, 1))
    return { ok: true, gate: 'mock-async' }
  },
}

export const throwingGate: DiagnosticGate = {
  id: 'crashy',
  evaluate: () => {
    throw new Error('boom from extension')
  },
}

export function recordingGate(id: string, calls: string[]): DiagnosticGate {
  return {
    id,
    evaluate: () => {
      calls.push(id)
      return { ok: true, gate: id }
    },
  }
}
