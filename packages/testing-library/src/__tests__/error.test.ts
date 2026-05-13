import { describe, expect, it } from 'vitest'
import { TourKitTestingError } from '../error'

describe('TourKitTestingError', () => {
  it('is instanceof Error', () => {
    expect(new TourKitTestingError('x')).toBeInstanceOf(Error)
  })

  it('is instanceof TourKitTestingError', () => {
    expect(new TourKitTestingError('x')).toBeInstanceOf(TourKitTestingError)
  })

  it('preserves stepId and tourId', () => {
    const e = new TourKitTestingError('x', { stepId: 's', tourId: 't' })
    expect(e.stepId).toBe('s')
    expect(e.tourId).toBe('t')
  })

  it('preserves cause', () => {
    const inner = new Error('inner')
    const e = new TourKitTestingError('outer', { cause: inner })
    expect(e.cause).toBe(inner)
  })

  it('name === "TourKitTestingError"', () => {
    expect(new TourKitTestingError('x').name).toBe('TourKitTestingError')
  })
})
