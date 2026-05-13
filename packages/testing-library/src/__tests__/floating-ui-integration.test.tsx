/// <reference types="vitest-axe/extend-expect" />
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { TourKitTestingError } from '../error'
import { advanceTour } from '../helpers/advance-tour'
import { completeTour } from '../helpers/complete-tour'
import { expectStepVisible } from '../helpers/expect-step-visible'
import { goToStep } from '../helpers/go-to-step'
import { previousTour } from '../helpers/previous-tour'
import { skipTour } from '../helpers/skip-tour'
import { setupTourKitTesting } from '../setup'
import { ThreeStepFixture, TwoStepFixture } from './_fixtures'

// Spy on the dynamic `import('jsdom-testing-mocks')` inside setupTourKitTesting.
// The factory body fires once per resolved import per vitest module cache slot.
let jdmLoadCount = 0
vi.mock('jsdom-testing-mocks', async (importOriginal: () => Promise<unknown>) => {
  jdmLoadCount++
  return importOriginal()
})

beforeEach(async () => {
  jdmLoadCount = 0
  // Default path — no shim. The whole point of Phase 5.
  await setupTourKitTesting()
})

describe('@tour-kit/testing-library — integration against real <TourCard>', () => {
  it('expectStepVisible resolves on the welcome step (no consumer act() flush)', async () => {
    render(<TwoStepFixture />)
    const el = await expectStepVisible('welcome')
    expect(el).toBeInTheDocument()
    expect(el.getAttribute('data-tour-step')).toBe('welcome')
  })

  it('advanceTour moves to the next step', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await advanceTour()
    await expectStepVisible('pricing')
  })

  it('previousTour goes back one step', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await advanceTour()
    await expectStepVisible('pricing')
    await previousTour()
    await expectStepVisible('welcome')
  })

  it('completeTour finishes a 2-step tour', async () => {
    render(<TwoStepFixture />)
    await completeTour('demo')
    // After completion no step card is mounted.
    expect(document.querySelector('[data-tour-step]')).toBeNull()
  })

  it('skipTour invokes the Skip action and ends the tour', async () => {
    render(<TwoStepFixture />)
    await expectStepVisible('welcome')
    await skipTour()
    expect(document.querySelector('[data-tour-step]')).toBeNull()
  })

  it('goToStep jumps to a non-adjacent step', async () => {
    render(<ThreeStepFixture />)
    await expectStepVisible('welcome')
    await goToStep('finale')
    await expectStepVisible('finale')
  })

  it('expectStepVisible throws TourKitTestingError on timeout', async () => {
    render(<TwoStepFixture />)
    await expect(expectStepVisible('not-a-step', { timeout: 50 })).rejects.toThrow(
      /not visible within 50ms/
    )
  })

  it('thrown TourKitTestingError carries stepId', async () => {
    render(<TwoStepFixture />)
    try {
      await expectStepVisible('missing', { timeout: 50 })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(TourKitTestingError)
      expect((e as TourKitTestingError).stepId).toBe('missing')
    }
  })

  it('default setup does NOT lazy-import jsdom-testing-mocks', () => {
    // beforeEach already called setupTourKitTesting() with no args.
    expect(jdmLoadCount).toBe(0)
  })

  it('positionShim:true triggers at least one lazy import', async () => {
    await setupTourKitTesting({ positionShim: true })
    expect(jdmLoadCount).toBeGreaterThanOrEqual(1)
  })

  it('container option scopes queries', async () => {
    const { container } = render(<TwoStepFixture />)
    // <TourCard> portals to document.body, so passing the render container
    // intentionally scopes the query OUT of where the card lives. The helper
    // must throw rather than fall through to body.
    await expect(expectStepVisible('welcome', { container, timeout: 100 })).rejects.toBeInstanceOf(
      TourKitTestingError
    )
  })

  it('container=document.body finds the portalled card', async () => {
    render(<TwoStepFixture />)
    const el = await expectStepVisible('welcome', { container: document.body })
    expect(document.body.contains(el)).toBe(true)
  })

  it('axe zero violations on the rendered welcome step card', async () => {
    render(<TwoStepFixture />)
    const card = await expectStepVisible('welcome')
    // Scope axe to the card itself — the surrounding fixture isn't wrapped in
    // landmarks and that's not something a test-library can fix for consumers.
    const results = await axe(card, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})
