import { describe, expect, it } from 'vitest'
import { createNamedTour, createTour } from '../../utils/create-tour'

// Note: The tourIdCounter is module-level, so tests may see incrementing IDs
// We test patterns rather than exact values

describe('createTour', () => {
  it('creates tour with auto-generated ID matching pattern', () => {
    const tour = createTour([{ id: 's1', target: '#t', content: 'c' }])
    expect(tour.id).toMatch(/^tour-\d+$/)
  })

  it('generates incrementing IDs', () => {
    const tour1 = createTour([])
    const tour2 = createTour([])

    const id1Num = Number.parseInt(tour1.id.replace('tour-', ''), 10)
    const id2Num = Number.parseInt(tour2.id.replace('tour-', ''), 10)

    expect(id2Num).toBeGreaterThan(id1Num)
  })

  it('includes all steps', () => {
    const steps = [
      { id: 's1', target: '#t1', content: 'c1' },
      { id: 's2', target: '#t2', content: 'c2' },
      { id: 's3', target: '#t3', content: 'c3' },
    ]
    const tour = createTour(steps)

    expect(tour.steps).toEqual(steps)
    expect(tour.steps).toHaveLength(3)
  })

  it('creates tour with empty steps array', () => {
    const tour = createTour([])

    expect(tour.steps).toEqual([])
    expect(tour.id).toMatch(/^tour-\d+$/)
  })

  it('applies tour options', () => {
    const tour = createTour([], { autoStart: true, startAt: 2 })

    expect(tour.autoStart).toBe(true)
    expect(tour.startAt).toBe(2)
  })

  it('applies keyboard configuration', () => {
    const tour = createTour([], { keyboard: { enabled: false } })

    expect(tour.keyboard).toEqual({ enabled: false })
  })

  it('applies spotlight configuration', () => {
    const tour = createTour([], { spotlight: { padding: 16, color: 'rgba(0,0,0,0.8)' } })

    expect(tour.spotlight).toEqual({ padding: 16, color: 'rgba(0,0,0,0.8)' })
  })

  it('applies callbacks', () => {
    const onStart = () => {}
    const onComplete = () => {}
    const onSkip = () => {}
    const onStepChange = () => {}

    const tour = createTour([], {
      onStart,
      onComplete,
      onSkip,
      onStepChange,
    })

    expect(tour.onStart).toBe(onStart)
    expect(tour.onComplete).toBe(onComplete)
    expect(tour.onSkip).toBe(onSkip)
    expect(tour.onStepChange).toBe(onStepChange)
  })

  it('does not mutate original steps array', () => {
    const originalSteps = [{ id: 's1', target: '#t', content: 'c' }]
    const stepsCopy = [...originalSteps]

    createTour(originalSteps)

    expect(originalSteps).toEqual(stepsCopy)
  })
})

describe('createNamedTour', () => {
  it('uses explicit ID', () => {
    const tour = createNamedTour('onboarding', [])
    expect(tour.id).toBe('onboarding')
  })

  it('includes all steps', () => {
    const steps = [
      { id: 's1', target: '#t1', content: 'c1' },
      { id: 's2', target: '#t2', content: 'c2' },
    ]
    const tour = createNamedTour('my-tour', steps)

    expect(tour.steps).toEqual(steps)
  })

  it('applies tour options', () => {
    const tour = createNamedTour('feature-tour', [], {
      autoStart: true,
      startAt: 1,
    })

    expect(tour.id).toBe('feature-tour')
    expect(tour.autoStart).toBe(true)
    expect(tour.startAt).toBe(1)
  })

  it('allows any string as ID', () => {
    const tour1 = createNamedTour('simple-id', [])
    const tour2 = createNamedTour('complex-id-with-123-numbers', [])
    const tour3 = createNamedTour('id_with_underscores', [])

    expect(tour1.id).toBe('simple-id')
    expect(tour2.id).toBe('complex-id-with-123-numbers')
    expect(tour3.id).toBe('id_with_underscores')
  })

  it('handles empty string ID', () => {
    const tour = createNamedTour('', [])
    expect(tour.id).toBe('')
  })
})
