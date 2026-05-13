import { describe, expect, it } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import type { DiagnosticContext } from '../../types/diagnostic'
import { explainTour } from '../diagnostic'
import { asyncGate, recordingGate } from './_gate-mocks'

const baseCtx = (): DiagnosticContext => ({ completedTours: [], skippedTours: [] })

describe('explainTour — async extensions', () => {
  it('awaits async extensions and preserves order vs sync extensions', async () => {
    const calls: string[] = []
    const slowAsync = {
      id: 'slow',
      evaluate: async () => {
        await new Promise((r) => setTimeout(r, 10))
        calls.push('slow')
        return { ok: true as const, gate: 'slow' }
      },
    }
    const fastSync = recordingGate('fast', calls)
    const r = await explainTour(twoStepTour, baseCtx(), [slowAsync, fastSync])
    expect(calls).toEqual(['slow', 'fast'])
    const tail = r.reasons.slice(-2).map((x) => x.gate)
    expect(tail).toEqual(['slow', 'fast'])
  })

  it('resolves multiple async gates in registration order', async () => {
    const r = await explainTour(twoStepTour, baseCtx(), [asyncGate, asyncGate])
    const asyncReasons = r.reasons.filter((x) => x.gate === 'mock-async')
    expect(asyncReasons).toHaveLength(2)
  })
})
