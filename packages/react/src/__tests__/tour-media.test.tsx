import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTour } from '@tour-kit/core'
import { describe, expect, it } from 'vitest'
import { Tour as TourComponent } from '../components/tour/tour'
import { TourStep } from '../components/tour/tour-step'
import { renderWithProviders } from './render-with-providers'

function Starter() {
  const { start } = useTour()
  return (
    <button type="button" onClick={() => start()}>
      Start
    </button>
  )
}

describe('TourCard renders MediaSlot when step.media is set', () => {
  it('renders MediaSlot above content when media is provided (YouTube)', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="m1">Target</div>'
    renderWithProviders(
      <TourComponent id="t-media-1">
        <TourStep
          id="s1"
          target="#m1"
          title="Demo"
          content="Body"
          media={{ src: 'https://youtu.be/dQw4w9WgXcQ', alt: 'Demo video' }}
        />
        <Starter />
      </TourComponent>
    )

    await user.click(screen.getByText('Start'))
    await screen.findByText('Body')
    const card = document.querySelector('[role="dialog"]')
    expect(card).not.toBeNull()
    expect(card?.querySelector('[data-slot="tour-card-media"]')).not.toBeNull()
    expect(card?.querySelector('iframe')).not.toBeNull()
  })

  it('renders no media slot when step.media is absent', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="m2">Target</div>'
    renderWithProviders(
      <TourComponent id="t-media-2">
        <TourStep id="s1" target="#m2" title="No media" content="Body" />
        <Starter />
      </TourComponent>
    )

    await user.click(screen.getByText('Start'))
    await screen.findByText('Body')
    const card = document.querySelector('[role="dialog"]')
    expect(card).not.toBeNull()
    expect(card?.querySelector('[data-slot="tour-card-media"]')).toBeNull()
    expect(card?.querySelector('iframe')).toBeNull()
  })
})
