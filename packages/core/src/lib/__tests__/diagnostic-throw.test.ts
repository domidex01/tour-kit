import { describe, expect, it } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import type { DiagnosticContext } from '../../types/diagnostic'
import { explainTour } from '../diagnostic'
import { throwingGate } from './_gate-mocks'

const baseCtx = (): DiagnosticContext => ({ completedTours: [], skippedTours: [] })

describe('explainTour — throwing extensions', () => {
  it('catches a throwing extension into a synthetic _THREW reason', async () => {
    const r = await explainTour(twoStepTour, baseCtx(), [throwingGate])
    const crashy = r.reasons.find((x) => x.gate === 'crashy')
    expect(crashy?.ok).toBe(false)
    if (crashy && !crashy.ok) {
      expect(crashy.code).toBe('CRASHY_THREW')
      expect(crashy.detail?.error).toMatch(/boom from extension/)
    }
  })

  it('does not throw upward — return value is still a valid EligibilityReport', async () => {
    await expect(explainTour(twoStepTour, baseCtx(), [throwingGate])).resolves.toMatchObject({
      tourId: 'demo',
      reasons: expect.any(Array),
    })
  })
})
