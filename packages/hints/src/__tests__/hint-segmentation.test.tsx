import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../components/hint'
import { HintsProvider } from '../context/hints-provider'
import type { HintConfig } from '../types'
import { renderWithProviders } from './render-with-providers'

vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: { setFloating: vi.fn() },
    floatingStyles: { position: 'absolute', top: 0, left: 0 },
    context: {},
  })),
  FloatingPortal: ({ children }: { children: ReactNode }) => children,
  autoUpdate: vi.fn(),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
  useDismiss: vi.fn(() => ({})),
  useRole: vi.fn(() => ({})),
  useInteractions: vi.fn(() => ({ getFloatingProps: () => ({}) })),
}))

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

describe('Hint audience filtering', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="seg-target">Target</div>'
    const el = document.getElementById('seg-target')
    if (el) vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('drops a hint config with an unmet segment audience (provider hintsById excludes it)', () => {
    const hint: HintConfig = {
      id: 'beta-only',
      target: '#seg-target',
      title: 'Beta Title',
      content: 'Body',
      audience: { segment: 'beta' },
    }
    // The hint title surfaces only when the tooltip opens. Without rendering
    // the hotspot, the absence of audience-matching means the provider's
    // filtered registry has no entry for this id — calling showHint(id)
    // becomes a no-op, so no DOM artifact appears.
    renderWithProviders(
      <HintsProvider hints={[hint]}>
        <span data-testid="probe">probe</span>
      </HintsProvider>,
      { segments: { beta: () => false } }
    )
    expect(screen.queryByText('Beta Title')).not.toBeInTheDocument()
  })

  it('shows a hint when its segment audience evaluates true (click reveals title)', async () => {
    const user = userEvent.setup()
    const hint: HintConfig = {
      id: 'beta-shown',
      target: '#seg-target',
      title: 'Beta Title',
      content: 'Body',
      audience: { segment: 'beta' },
    }
    renderWithProviders(
      <HintsProvider hints={[hint]}>
        <Hint {...hint} />
      </HintsProvider>,
      { segments: { beta: () => true } }
    )
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(await screen.findByText('Beta Title')).toBeInTheDocument()
  })

  it('legacy AudienceCondition[] shape filters correctly (regression guard)', async () => {
    const user = userEvent.setup()
    const hint: HintConfig = {
      id: 'pro-only',
      target: '#seg-target',
      title: 'Pro Title',
      content: 'Body',
      audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
    }

    // Pro user → tooltip opens with the title
    renderWithProviders(
      <HintsProvider hints={[hint]}>
        <Hint {...hint} />
      </HintsProvider>,
      { userContext: { plan: 'pro' } }
    )
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(await screen.findByText('Pro Title')).toBeInTheDocument()
  })
})
