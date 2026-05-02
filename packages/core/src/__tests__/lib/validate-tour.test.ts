import { describe, expect, it } from 'vitest'
import { TourValidationError, validateTour } from '../../lib/validate-tour'
import type { Tour, TourStep } from '../../types'

const visibleStep: TourStep = { id: 'a', target: '#a', content: 'A' }

describe('validateTour: happy paths (US-5 no regression)', () => {
  it('passes a tour of all visible steps without throwing', () => {
    const tour: Tour = {
      id: 't',
      steps: [visibleStep, { id: 'b', target: '#b', content: 'B' }],
    }
    expect(() => validateTour(tour)).not.toThrow()
  })

  it('passes a tour with a clean hidden step (no UI fields)', () => {
    const tour: Tour = {
      id: 't',
      steps: [
        visibleStep,
        // biome-ignore lint/suspicious/noExplicitAny: hidden step omits required UI fields by design
        { id: 'h', kind: 'hidden', onEnter: async () => {} } as any,
      ],
    }
    expect(() => validateTour(tour)).not.toThrow()
  })

  it('passes when kind is explicitly "visible"', () => {
    const tour: Tour = {
      id: 't',
      steps: [{ ...visibleStep, kind: 'visible' }],
    }
    expect(() => validateTour(tour)).not.toThrow()
  })
})

describe('validateTour: rejection cases (US-2)', () => {
  it.each<[string, Partial<TourStep>]>([
    ['target', { target: '#x' }],
    ['content', { content: 'should not be here' }],
    ['title', { title: 'nope' }],
    ['placement', { placement: 'top' }],
    ['advanceOn', { advanceOn: { event: 'click' } }],
  ])('throws TourValidationError when hidden step declares `%s`', (field, badFields) => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately constructing invalid step for validation
    const badStep = { id: 'h', kind: 'hidden', ...badFields } as any
    const tour: Tour = { id: 't', steps: [badStep] }

    let caught: unknown
    try {
      validateTour(tour)
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(TourValidationError)
    const e = caught as TourValidationError
    expect(e.code).toBe('INVALID_HIDDEN_STEP')
    expect(e.stepId).toBe('h')
    expect(e.message).toContain('h')
    expect(e.message).toContain(field)
  })

  it('error message includes the step id and is human-readable', () => {
    const tour: Tour = {
      id: 't',
      // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid hidden step
      steps: [{ id: 'fork-a', kind: 'hidden', target: '#oops' } as any],
    }
    expect(() => validateTour(tour)).toThrow(/Hidden step "fork-a" must not declare/)
  })

  it('TourValidationError exposes readonly code and stepId', () => {
    const tour: Tour = {
      id: 't',
      // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid hidden step
      steps: [{ id: 'bad', kind: 'hidden', content: 'x' } as any],
    }
    let caught: unknown
    try {
      validateTour(tour)
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(TourValidationError)
    expect((caught as TourValidationError).code).toBe('INVALID_HIDDEN_STEP')
    expect((caught as TourValidationError).stepId).toBe('bad')
    expect((caught as TourValidationError).name).toBe('TourValidationError')
  })
})
