import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourCard } from '../../../components/card/tour-card'

function Starter() {
  const { start } = useTour()
  return (
    <button type="button" onClick={() => start()}>
      Start
    </button>
  )
}

// Step ids must be unique per test because the deprecation-warn dedup Set
// lives at module scope and a static import binding can't be reset by
// `vi.resetModules()`. Each test allocates fresh ids via `nextIds()`.
let testCounter = 0
function nextIds() {
  testCounter += 1
  return { a: `s1-${testCounter}`, b: `s2-${testCounter}` }
}

function makeSingleStepTour(id: string): Tour {
  return {
    id: `classic-single-${id}`,
    steps: [{ id, target: '#target', title: 'Welcome', content: 'Content' }],
  }
}

function makeTwoStepTour(idA: string, idB: string): Tour {
  return {
    id: `classic-two-${idA}`,
    steps: [
      { id: idA, target: '#target', title: 'Welcome', content: 'Step 1' },
      { id: idB, target: '#target', title: 'Next', content: 'Step 2' },
    ],
  }
}

describe('TourCard variant="classic" opt-out', () => {
  const mockRect: DOMRect = {
    top: 100,
    left: 100,
    bottom: 150,
    right: 200,
    width: 100,
    height: 50,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  }

  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('renders no step-indicator span', async () => {
    const { a } = nextIds()
    const user = userEvent.setup()

    render(
      <TourProvider tours={[makeSingleStepTour(a)]}>
        <TourCard variant="classic" />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    await screen.findByRole('dialog')

    expect(document.querySelector('[data-slot="tour-step-indicator"]')).toBeNull()
  })

  // NOTE: classic-vs-refreshed arrow rendering is enforced by the
  // Playwright placement matrix at e2e/next/tour-card-placements.localhost.spec.ts.
  // jsdom can't run Floating UI's layout calculations, so the arrow svg
  // never paints in either variant here — a jsdom no-arrow assertion is
  // trivially true and carries no signal.

  it('preserves shipped Skip/Back/Next variants', async () => {
    const { a, b } = nextIds()
    const user = userEvent.setup()

    render(
      <TourProvider tours={[makeTwoStepTour(a, b)]}>
        <TourCard variant="classic" />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    await screen.findByRole('dialog')

    const skip = screen.getByRole('button', { name: 'Skip tour' })
    const next = screen.getByRole('button', { name: /next/i })

    expect(skip.className).toContain('underline-offset')
    expect(next.className).toContain('bg-primary')

    await user.click(next)
    const back = await screen.findByRole('button', { name: /back/i })
    expect(back.className).toContain('border-input')
  })

  it('emits a one-time deprecation warning per currentStep.id', async () => {
    const { a, b } = nextIds()
    const user = userEvent.setup()

    const countDeprecationWarns = () =>
      warnSpy.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && /variant="classic">? is deprecated/.test(call[0])
      ).length

    const tour = makeTwoStepTour(a, b)
    const { rerender } = render(
      <TourProvider tours={[tour]}>
        <TourCard variant="classic" />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    await screen.findByRole('dialog')

    expect(countDeprecationWarns()).toBe(1)

    rerender(
      <TourProvider tours={[tour]}>
        <TourCard variant="classic" />
        <Starter />
      </TourProvider>
    )
    expect(countDeprecationWarns()).toBe(1)

    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { level: 3, name: 'Next' })
    expect(countDeprecationWarns()).toBe(2)
  })

  it('keeps aria-label and drops aria-labelledby on the dialog', async () => {
    const { a } = nextIds()
    const user = userEvent.setup()

    render(
      <TourProvider tours={[makeSingleStepTour(a)]}>
        <TourCard variant="classic" />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')

    expect(dialog).toHaveAttribute('aria-label', 'Step 1 of 1: Welcome')
    expect(dialog).not.toHaveAttribute('aria-labelledby')
    expect(dialog).toHaveAttribute('data-tour-variant', 'classic')
  })
})
