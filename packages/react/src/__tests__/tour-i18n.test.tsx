import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, useTour } from '@tour-kit/core'
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

describe('Tour i18n integration (US-1)', () => {
  it('interpolates {{user.name}} in a string title against userContext', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="t1">Target</div>'
    renderWithProviders(
      <TourComponent id="t-i18n-1">
        <TourStep id="s1" target="#t1" title="Hi {{user.name}}" content="Body" />
        <Starter />
      </TourComponent>,
      { userContext: { user: { name: 'Domi' } } }
    )

    await user.click(screen.getByText('Start'))
    expect(await screen.findByText('Hi Domi')).toBeInTheDocument()
  })

  it('resolves a { key } title via the messages dictionary', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="t2">Target</div>'
    renderWithProviders(
      <TourComponent id="t-i18n-2">
        <TourStep id="s1" target="#t2" title={{ key: 'tour.welcome' }} content="Body" />
        <Starter />
      </TourComponent>,
      { messages: { 'tour.welcome': 'Hello' } }
    )

    await user.click(screen.getByText('Start'))
    expect(await screen.findByText('Hello')).toBeInTheDocument()
  })

  it('renders a ReactNode title as-is', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="t3">Target</div>'
    renderWithProviders(
      <TourComponent id="t-i18n-3">
        <TourStep id="s1" target="#t3" title={<strong>Custom</strong>} content="Body" />
        <Starter />
      </TourComponent>
    )

    await user.click(screen.getByText('Start'))
    const strong = await screen.findByText('Custom')
    expect(strong.tagName).toBe('STRONG')
  })

  it('renders an interpolated description above content', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="t4">Target</div>'
    renderWithProviders(
      <TourComponent id="t-i18n-4">
        <TourStep
          id="s1"
          target="#t4"
          title="Title"
          description="For {{user.name}}"
          content="Body"
        />
        <Starter />
      </TourComponent>,
      { userContext: { user: { name: 'Domi' } } }
    )

    await user.click(screen.getByText('Start'))
    const desc = await screen.findByText('For Domi')
    expect(desc).toHaveAttribute('data-slot', 'tour-card-description')
  })

  it('falls back to the key string when a missing key is referenced (dev breadcrumb)', async () => {
    const user = userEvent.setup()
    document.body.innerHTML = '<div id="t5">Target</div>'
    renderWithProviders(
      <TourComponent id="t-i18n-5">
        <TourStep id="s1" target="#t5" title={{ key: 'tour.missing' }} content="Body" />
        <Starter />
      </TourComponent>,
      { messages: {} }
    )

    await user.click(screen.getByText('Start'))
    expect(await screen.findByText('tour.missing')).toBeInTheDocument()
  })
})

// Type-level smoke check — the legacy `audience: AudienceCondition[]` on
// the Tour shape stays assignable. Compile-time guard, not a runtime test.
const _legacy: Tour = {
  id: '_smoke',
  steps: [
    {
      id: 's',
      target: '#x',
      content: 'c',
      audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
    },
  ],
  audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
}
void _legacy
