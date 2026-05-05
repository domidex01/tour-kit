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

describe('Hint media slot', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="hint-target">Target</div>'
    const el = document.getElementById('hint-target')
    if (el) vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders MediaSlot above content when media is provided', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HintsProvider>
        <Hint
          id="h-media-1"
          target="#hint-target"
          content="Try this"
          media={{ src: 'https://youtu.be/dQw4w9WgXcQ', alt: 'demo' }}
        />
      </HintsProvider>
    )

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await screen.findByText('Try this')
    expect(document.querySelector('[data-slot="hint-tooltip-media"]')).not.toBeNull()
    expect(document.querySelector('iframe')).not.toBeNull()
  })

  it('does not render media slot when media is absent', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <HintsProvider>
        <Hint id="h-media-2" target="#hint-target" content="No media" />
      </HintsProvider>
    )

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await screen.findByText('No media')
    expect(document.querySelector('[data-slot="hint-tooltip-media"]')).toBeNull()
    expect(document.querySelector('iframe')).toBeNull()
  })
})
