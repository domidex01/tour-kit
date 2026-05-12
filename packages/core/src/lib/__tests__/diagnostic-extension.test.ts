import { describe, expect, it } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import type { DiagnosticContext } from '../../types/diagnostic'
import { explainTour } from '../diagnostic'
import { failingGate, okGate, recordingGate } from './_gate-mocks'

const baseCtx = (): DiagnosticContext => ({ completedTours: [], skippedTours: [] })

describe('explainTour — extension gates', () => {
  it('runs extensions AFTER all built-ins', async () => {
    const calls: string[] = []
    const ext = recordingGate('license', calls)
    const r = await explainTour(twoStepTour, baseCtx(), [ext])
    const lastBuiltIn = r.reasons.findIndex((x) => x.gate === 'autostart')
    const extIndex = r.reasons.findIndex((x) => x.gate === 'license')
    expect(extIndex).toBeGreaterThan(lastBuiltIn)
    expect(calls).toEqual(['license'])
  })

  it('preserves extension registration order', async () => {
    const r = await explainTour(twoStepTour, baseCtx(), [
      { id: 'first', evaluate: () => ({ ok: true, gate: 'first' }) },
      { id: 'second', evaluate: () => ({ ok: true, gate: 'second' }) },
    ])
    const extGates = r.reasons
      .filter((x) => x.gate === 'first' || x.gate === 'second')
      .map((x) => x.gate)
    expect(extGates).toEqual(['first', 'second'])
  })

  it('surfaces failing extension in firstFailingGate when no built-in failed first', async () => {
    const r = await explainTour(twoStepTour, baseCtx(), [failingGate])
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.gate).toBe('mock-fail')
    expect(r.firstFailingGate?.code).toBe('MOCK_FAIL')
  })

  it('does NOT pollute firstFailingGate when extension is ok', async () => {
    const r = await explainTour(twoStepTour, baseCtx(), [okGate])
    expect(r.willFire).toBe(true)
    expect(r.firstFailingGate).toBeNull()
  })
})
