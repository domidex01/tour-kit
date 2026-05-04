import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../components/hint'
import { HintsProvider } from '../context/hints-provider'
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

describe('Hint i18n integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="hint-target">Target</div>'
    const el = document.getElementById('hint-target')
    if (el) vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('interpolates a string content with userContext on hotspot click', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HintsProvider>
        <Hint id="h-i18n-1" target="#hint-target" content="Hi {{user.name}}" />
      </HintsProvider>,
      { userContext: { user: { name: 'Domi' } } }
    )

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(await screen.findByText('Hi Domi')).toBeInTheDocument()
  })

  it('resolves a { key } title via the messages dictionary', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HintsProvider>
        <Hint id="h-i18n-2" target="#hint-target" title={{ key: 'hint.greeting' }} content="Body" />
      </HintsProvider>,
      { messages: { 'hint.greeting': 'Welcome' } }
    )

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    const title = await screen.findByText('Welcome')
    expect(title).toHaveAttribute('data-slot', 'hint-tooltip-title')
  })

  it('falls back to the key string when the message is missing (dev breadcrumb)', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HintsProvider>
        <Hint id="h-i18n-3" target="#hint-target" title={{ key: 'hint.absent' }} content="Body" />
      </HintsProvider>,
      { messages: {} }
    )
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(await screen.findByText('hint.absent')).toBeInTheDocument()
  })
})
