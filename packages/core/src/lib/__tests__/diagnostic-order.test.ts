import { describe, expect, it } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import type { DiagnosticContext } from '../../types/diagnostic'
import { BUILTIN_GATE_ORDER, explainTour } from '../diagnostic'

const baseCtx = (): DiagnosticContext => ({ completedTours: [], skippedTours: [] })

describe('BUILTIN_GATE_ORDER', () => {
  it('is the canonical built-in evaluation order', () => {
    expect(BUILTIN_GATE_ORDER).toStrictEqual([
      'structure',
      'audience',
      'persistence',
      'route',
      'target',
      'when',
      'autostart',
    ])
  })

  it('matches the leading slice of reasons[].gate', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    const gates = r.reasons.slice(0, BUILTIN_GATE_ORDER.length).map((x) => x.gate)
    expect(gates).toEqual([...BUILTIN_GATE_ORDER])
  })

  it('appends extensions AFTER built-ins in registration order', async () => {
    const r = await explainTour(twoStepTour, baseCtx(), [
      { id: 'first', evaluate: () => ({ ok: true, gate: 'first' }) },
      { id: 'second', evaluate: () => ({ ok: true, gate: 'second' }) },
    ])
    const tail = r.reasons.slice(BUILTIN_GATE_ORDER.length).map((x) => x.gate)
    expect(tail).toEqual(['first', 'second'])
  })
})
