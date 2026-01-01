import { describe, expect, it } from 'vitest'
import { createNamedStep, createStep } from '../../utils/create-step'

describe('createStep', () => {
  it('creates step with auto-generated ID matching pattern', () => {
    const step = createStep('#target', 'Content')
    expect(step.id).toMatch(/^step-\d+$/)
  })

  it('generates incrementing IDs', () => {
    const step1 = createStep('#t1', 'c1')
    const step2 = createStep('#t2', 'c2')

    const id1Num = Number.parseInt(step1.id.replace('step-', ''), 10)
    const id2Num = Number.parseInt(step2.id.replace('step-', ''), 10)

    expect(id2Num).toBeGreaterThan(id1Num)
  })

  it('sets target and content', () => {
    const step = createStep('#button', 'Click this button')

    expect(step.target).toBe('#button')
    expect(step.content).toBe('Click this button')
  })

  it('handles different target selectors', () => {
    const step1 = createStep('#id-selector', 'content')
    const step2 = createStep('.class-selector', 'content')
    const step3 = createStep('[data-tour="step"]', 'content')

    expect(step1.target).toBe('#id-selector')
    expect(step2.target).toBe('.class-selector')
    expect(step3.target).toBe('[data-tour="step"]')
  })

  it('applies placement option', () => {
    const step = createStep('#t', 'c', { placement: 'top-start' })
    expect(step.placement).toBe('top-start')
  })

  it('applies showClose option', () => {
    const step = createStep('#t', 'c', { showClose: false })
    expect(step.showClose).toBe(false)
  })

  it('applies showNavigation option', () => {
    const step = createStep('#t', 'c', { showNavigation: false })
    expect(step.showNavigation).toBe(false)
  })

  it('applies showProgress option', () => {
    const step = createStep('#t', 'c', { showProgress: true })
    expect(step.showProgress).toBe(true)
  })

  it('applies multiple options', () => {
    const step = createStep('#t', 'c', {
      placement: 'bottom',
      showClose: true,
      showNavigation: true,
      interactive: true,
      spotlightPadding: 16,
    })

    expect(step.placement).toBe('bottom')
    expect(step.showClose).toBe(true)
    expect(step.showNavigation).toBe(true)
    expect(step.interactive).toBe(true)
    expect(step.spotlightPadding).toBe(16)
  })

  it('applies offset option', () => {
    const step = createStep('#t', 'c', { offset: [10, 20] })
    expect(step.offset).toEqual([10, 20])
  })

  it('applies className option', () => {
    const step = createStep('#t', 'c', { className: 'custom-step' })
    expect(step.className).toBe('custom-step')
  })

  it('applies advanceOn option', () => {
    const step = createStep('#t', 'c', {
      advanceOn: { event: 'click', selector: '#next-btn' },
    })
    expect(step.advanceOn).toEqual({ event: 'click', selector: '#next-btn' })
  })

  it('applies route option', () => {
    const step = createStep('#t', 'c', {
      route: '/dashboard',
      routeDelay: 500,
    })
    expect(step.route).toBe('/dashboard')
    expect(step.routeDelay).toBe(500)
  })

  it('applies waitForTarget option', () => {
    const step = createStep('#t', 'c', {
      waitForTarget: true,
      waitTimeout: 10000,
    })
    expect(step.waitForTarget).toBe(true)
    expect(step.waitTimeout).toBe(10000)
  })

  it('applies callback options', () => {
    const onBeforeShow = () => true
    const onShow = () => {}
    const onBeforeHide = () => true
    const onHide = () => {}

    const step = createStep('#t', 'c', {
      onBeforeShow,
      onShow,
      onBeforeHide,
      onHide,
    })

    expect(step.onBeforeShow).toBe(onBeforeShow)
    expect(step.onShow).toBe(onShow)
    expect(step.onBeforeHide).toBe(onBeforeHide)
    expect(step.onHide).toBe(onHide)
  })

  it('applies when option', () => {
    const when = () => true
    const step = createStep('#t', 'c', { when })
    expect(step.when).toBe(when)
  })
})

describe('createNamedStep', () => {
  it('uses explicit ID', () => {
    const step = createNamedStep('welcome-step', '#t', 'c')
    expect(step.id).toBe('welcome-step')
  })

  it('sets target and content', () => {
    const step = createNamedStep('intro', '#header', 'Welcome message')

    expect(step.id).toBe('intro')
    expect(step.target).toBe('#header')
    expect(step.content).toBe('Welcome message')
  })

  it('applies step options', () => {
    const step = createNamedStep('custom-step', '#t', 'c', {
      placement: 'left',
      showClose: false,
      interactive: true,
    })

    expect(step.id).toBe('custom-step')
    expect(step.placement).toBe('left')
    expect(step.showClose).toBe(false)
    expect(step.interactive).toBe(true)
  })

  it('allows any string as ID', () => {
    const step1 = createNamedStep('simple-id', '#t', 'c')
    const step2 = createNamedStep('step-with-123', '#t', 'c')
    const step3 = createNamedStep('step_underscore', '#t', 'c')

    expect(step1.id).toBe('simple-id')
    expect(step2.id).toBe('step-with-123')
    expect(step3.id).toBe('step_underscore')
  })

  it('handles empty string ID', () => {
    const step = createNamedStep('', '#t', 'c')
    expect(step.id).toBe('')
  })
})
