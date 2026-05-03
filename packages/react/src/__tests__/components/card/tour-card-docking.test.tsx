import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourCard } from '../../../components/card/tour-card'

function mockMatchMedia(reduce: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('reduce') ? reduce : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

function Starter() {
  const { start } = useTour()
  return (
    <button type="button" onClick={() => start()}>
      Start
    </button>
  )
}

describe('TourCard docking transition (US-2)', () => {
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

  const tour: Tour = {
    id: 'docking-test',
    steps: [{ id: 's1', target: '#docking-target', title: 'Title', content: 'Content' }],
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="docking-target">Target</div>'
    const target = document.getElementById('docking-target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  it('applies transition-[transform,top,left] class when reduce=false', async () => {
    mockMatchMedia(false)
    const user = userEvent.setup()
    render(
      <TourProvider tours={[tour]}>
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.className).toContain('transition-[transform,top,left]')
  })

  it('omits the transition class when reduce=true', async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()
    render(
      <TourProvider tours={[tour]}>
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.className).not.toContain('transition-[transform,top,left]')
  })
})
