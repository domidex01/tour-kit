import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import { useTour } from '@tour-kit/core'
import { describe, expect, it, vi } from 'vitest'
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

describe('Tour analytics', () => {
  it('emits tour start and step viewed events', async () => {
    const user = userEvent.setup()
    const track = vi.fn<AnalyticsPlugin['track']>()
    const plugin: AnalyticsPlugin = { name: 'test', track }
    document.body.innerHTML = '<div id="tour-target">Target</div>'

    renderWithProviders(
      <AnalyticsProvider config={{ plugins: [plugin] }}>
        <TourComponent id="analytics-tour">
          <TourStep id="intro" target="#tour-target" title="Intro" content="Body" />
          <Starter />
        </TourComponent>
      </AnalyticsProvider>
    )

    await user.click(screen.getByText('Start'))
    await screen.findByText('Intro')

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'tour_started',
        tourId: 'analytics-tour',
        totalSteps: 1,
      })
    )
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'step_viewed',
        tourId: 'analytics-tour',
        stepId: 'intro',
        stepIndex: 0,
        totalSteps: 1,
      })
    )
  })
})
