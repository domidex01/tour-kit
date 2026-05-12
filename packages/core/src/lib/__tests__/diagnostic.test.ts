import { describe, expect, it } from 'vitest'
import {
  tourAutoStartFalse,
  tourWithSegmentAudience,
  tourWithWhenAsync,
  tourWithWhenFalse,
  tourWithWhenThrows,
  twoStepTour,
} from '../../__tests__/_fixtures'
import type { DiagnosticContext } from '../../types/diagnostic'
import type { Tour } from '../../types/tour'
import { BUILTIN_GATE_ORDER, explainTour } from '../diagnostic'
import { withDOM } from './_dom'

const baseCtx = (overrides: Partial<DiagnosticContext> = {}): DiagnosticContext => ({
  completedTours: [],
  skippedTours: [],
  ...overrides,
})

describe('explainTour — orchestrator', () => {
  it('returns willFire:true for a valid tour with all gates passing', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    expect(r.willFire).toBe(true)
    expect(r.firstFailingGate).toBeNull()
    expect(r.tourId).toBe('demo')
    expect(typeof r.evaluatedAt).toBe('number')
  })

  it('reports each built-in gate in the documented order', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    const gates = r.reasons.slice(0, BUILTIN_GATE_ORDER.length).map((x) => x.gate)
    expect(gates).toEqual([...BUILTIN_GATE_ORDER])
  })

  it('exposes BUILTIN_GATE_ORDER as a readonly tuple', () => {
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

  it('NEVER throws — internal errors land in firstFailingGate', async () => {
    const malformed = { id: 'x', steps: null } as unknown as Tour
    const r = await explainTour(malformed, baseCtx())
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.gate).toBe('structure')
    expect(r.firstFailingGate?.code).toBe('STRUCTURE_INVALID')
  })
})

describe('built-in gates — failure paths', () => {
  it('gateStructure fails when tour.steps is empty', async () => {
    const r = await explainTour({ id: 'bad', steps: [] }, baseCtx())
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.gate).toBe('structure')
    expect(r.firstFailingGate?.code).toBe('STRUCTURE_INVALID')
  })

  it('gateStructure short-circuits the rest of the pipeline', async () => {
    const r = await explainTour({ id: 'bad', steps: [] }, baseCtx())
    // Structure failure short-circuits — only `structure` reason is present.
    expect(r.reasons).toHaveLength(1)
    expect(r.reasons[0]?.gate).toBe('structure')
  })

  it('gateAudience fails when segment-form audience does not match', async () => {
    const r = await explainTour(
      tourWithSegmentAudience,
      baseCtx({ userContext: { segments: ['viewers'] } })
    )
    const aud = r.reasons.find((x) => x.gate === 'audience')
    expect(aud?.ok).toBe(false)
    if (aud && !aud.ok) expect(aud.code).toBe('AUDIENCE_MISMATCH')
  })

  it('gatePersistence fails when tour id is in completedTours', async () => {
    const r = await explainTour(twoStepTour, baseCtx({ completedTours: ['demo'] }))
    expect(r.willFire).toBe(false)
    expect(r.firstFailingGate?.code).toBe('ALREADY_COMPLETED')
  })

  it('gatePersistence fails when tour id is in skippedTours', async () => {
    const r = await explainTour(twoStepTour, baseCtx({ skippedTours: ['demo'] }))
    expect(r.firstFailingGate?.code).toBe('ALREADY_SKIPPED')
  })

  it('gateRoute fails when route mode is exact and current differs', async () => {
    const r = await explainTour(twoStepTour, {
      ...baseCtx(),
      route: { current: '/dashboard', matcher: '/pricing', mode: 'exact' },
    })
    const route = r.reasons.find((x) => x.gate === 'route')
    expect(route?.ok).toBe(false)
    if (route && !route.ok) {
      expect(route.code).toBe('ROUTE_MISMATCH')
      expect(route.detail).toMatchObject({ expected: '/pricing', actual: '/dashboard' })
    }
  })

  it('gateRoute passes when ctx.route is undefined', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    const route = r.reasons.find((x) => x.gate === 'route')
    expect(route?.ok).toBe(true)
  })

  it('gateTarget fails when selector does not resolve in DOM', async () => {
    await withDOM('<div id="a"></div>', async () => {
      const r = await explainTour(
        { id: 't', steps: [{ id: 's', target: '#not-here', content: '' }] },
        baseCtx({
          targetResolver: (sel) => document.querySelector<HTMLElement>(sel),
        })
      )
      const target = r.reasons.find((x) => x.gate === 'target')
      expect(target?.ok).toBe(false)
      if (target && !target.ok) {
        expect(target.code).toBe('TARGET_NOT_FOUND')
        expect(target.detail?.selector).toBe('#not-here')
      }
    })
  })

  it('gateTarget passes when first visible step uses a React ref (skipped)', async () => {
    const r = await explainTour(
      {
        id: 't',
        // biome-ignore lint/suspicious/noExplicitAny: ref shape from test data
        steps: [{ id: 's', target: { current: null } as any, content: '' }],
      },
      baseCtx({ targetResolver: () => null })
    )
    const target = r.reasons.find((x) => x.gate === 'target')
    expect(target?.ok).toBe(true)
  })

  it('gateWhen fails when sync callback returns false', async () => {
    const r = await explainTour(tourWithWhenFalse, baseCtx())
    const when = r.reasons.find((x) => x.gate === 'when')
    expect(when?.ok).toBe(false)
    if (when && !when.ok) expect(when.code).toBe('WHEN_RETURNED_FALSE')
  })

  it('gateWhen captures a throwing sync callback with error in detail', async () => {
    const r = await explainTour(tourWithWhenThrows, baseCtx())
    const when = r.reasons.find((x) => x.gate === 'when')
    expect(when?.ok).toBe(false)
    if (when && !when.ok) {
      expect(when.code).toBe('WHEN_RETURNED_FALSE')
      expect(when.detail?.error).toMatch(/when blew up/)
    }
  })

  it('gateWhen returns ok with detail.note for async callbacks', async () => {
    const r = await explainTour(tourWithWhenAsync, baseCtx())
    const when = r.reasons.find((x) => x.gate === 'when')
    expect(when?.ok).toBe(true)
    if (when?.ok && 'detail' in when) {
      // `ok: true` allows an optional `detail` for the async-note carveout
      const note = (when as { detail?: { note?: string } }).detail?.note
      expect(typeof note).toBe('string')
    }
  })

  it('gateAutostart fails when tour.autoStart === false', async () => {
    const r = await explainTour(tourAutoStartFalse, baseCtx())
    const auto = r.reasons.find((x) => x.gate === 'autostart')
    expect(auto?.ok).toBe(false)
    if (auto && !auto.ok) expect(auto.code).toBe('AUTOSTART_DISABLED')
  })

  it('gateAutostart passes when tour.autoStart is unset', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    const auto = r.reasons.find((x) => x.gate === 'autostart')
    expect(auto?.ok).toBe(true)
  })
})

describe('firstFailingGate semantics', () => {
  it('points at the first ok:false reason in evaluation order', async () => {
    // tour fails BOTH persistence (completedTours) and autostart — first failing is persistence.
    const r = await explainTour(tourAutoStartFalse, baseCtx({ completedTours: ['no-auto'] }))
    expect(r.firstFailingGate?.gate).toBe('persistence')
  })

  it('is null when every gate passes', async () => {
    const r = await explainTour(twoStepTour, baseCtx())
    expect(r.firstFailingGate).toBeNull()
    expect(r.willFire).toBe(true)
  })
})
