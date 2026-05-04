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

describe('Tour audience filtering (US-2 / US-3)', () => {
  it('filters a step out when its segment evaluates false', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="kept-target">Target</div>'
    renderWithProviders(
      <TourComponent id="t-seg-1">
        <TourStep
          id="filtered"
          target="#filtered"
          title="Filtered Title"
          content="Filtered Body"
          audience={{ segment: 'beta' }}
        />
        <TourStep
          id="kept"
          target="#kept-target"
          title="Kept Title"
          content="Kept Body"
        />
        <Starter />
      </TourComponent>,
      { segments: { beta: () => false } }
    )

    await user.click(screen.getByText('Start'))
    expect(await screen.findByText('Kept Title')).toBeInTheDocument()
    expect(screen.queryByText('Filtered Title')).not.toBeInTheDocument()
  })

  it('renders a step when its segment evaluates true', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="seg2">Target</div>'
    renderWithProviders(
      <TourComponent id="t-seg-2">
        <TourStep
          id="seg-kept"
          target="#seg2"
          title="Beta Visible"
          content="Body"
          audience={{ segment: 'beta' }}
        />
        <Starter />
      </TourComponent>,
      { segments: { beta: () => true } }
    )

    await user.click(screen.getByText('Start'))
    expect(await screen.findByText('Beta Visible')).toBeInTheDocument()
  })

  it('legacy AudienceCondition[] shape filters correctly (regression guard)', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="legacy-target">Target</div>'

    const { unmount } = renderWithProviders(
      <TourComponent id="t-seg-3a">
        <TourStep
          id="pro-only"
          target="#legacy-target"
          title="Pro Title"
          content="Pro Body"
          audience={[
            { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
          ]}
        />
        <Starter />
      </TourComponent>,
      { userContext: { plan: 'free' } }
    )
    await user.click(screen.getByText('Start'))
    // Filtered out → no card content in the DOM
    expect(screen.queryByText('Pro Title')).not.toBeInTheDocument()
    unmount()

    renderWithProviders(
      <TourComponent id="t-seg-3b">
        <TourStep
          id="pro-only"
          target="#legacy-target"
          title="Pro Title"
          content="Pro Body"
          audience={[
            { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
          ]}
        />
        <Starter />
      </TourComponent>,
      { userContext: { plan: 'pro' } }
    )
    await user.click(screen.getByText('Start'))
    expect(await screen.findByText('Pro Title')).toBeInTheDocument()
  })

  it('tour-level audience gate skips registration entirely when false', () => {
    renderWithProviders(
      <TourComponent id="t-seg-4" audience={{ segment: 'admin' }}>
        <TourStep id="s" target="#nope" title="Hidden" content="Body" />
        <Starter />
      </TourComponent>,
      { segments: { admin: () => false } }
    )

    // Tour returned null — Starter inside its children never rendered
    expect(screen.queryByText('Start')).not.toBeInTheDocument()
  })
})
