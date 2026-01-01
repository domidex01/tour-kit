import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../../components/hint'
import { HintsProvider } from '../../context/hints-provider'

// Mock @floating-ui/react
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setFloating: vi.fn(),
    },
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
  useInteractions: vi.fn(() => ({
    getFloatingProps: () => ({}),
  })),
}))

describe('Hint Accessibility', () => {
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

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'

    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <HintsProvider>{children}</HintsProvider>
  )

  it('hotspot has accessible name', () => {
    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })
    expect(hotspot).toHaveAccessibleName('Show hint')
  })

  it('hotspot has aria-expanded', () => {
    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })
    expect(hotspot).toHaveAttribute('aria-expanded', 'false')
  })

  it('hotspot aria-expanded updates when open', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })
    expect(hotspot).toHaveAttribute('aria-expanded', 'false')

    await user.click(hotspot)

    expect(hotspot).toHaveAttribute('aria-expanded', 'true')
  })

  it('dismiss button has accessible name', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    expect(screen.getByRole('button', { name: /dismiss hint/i })).toHaveAccessibleName(
      'Dismiss hint'
    )
  })

  it('hotspot is keyboard accessible', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })

    // Tab to hotspot
    await user.tab()
    expect(hotspot).toHaveFocus()

    // Press Enter to open
    await user.keyboard('{Enter}')
    expect(screen.getByText('Help text')).toBeInTheDocument()
  })

  it('space key opens tooltip', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })

    await user.tab()
    expect(hotspot).toHaveFocus()

    await user.keyboard(' ')
    expect(screen.getByText('Help text')).toBeInTheDocument()
  })

  it('dismiss button is keyboard accessible', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" persist />, { wrapper })

    // Open hint
    await user.click(screen.getByRole('button', { name: /show hint/i }))

    const dismissButton = screen.getByRole('button', { name: /dismiss hint/i })

    // Focus on dismiss button
    dismissButton.focus()
    expect(dismissButton).toHaveFocus()

    // Press Enter to dismiss
    await user.keyboard('{Enter}')

    // Hint should be dismissed
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()
    })
  })

  it('close button has visible close icon with title', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    const dismissButton = screen.getByRole('button', { name: /dismiss hint/i })
    const svg = dismissButton.querySelector('svg')

    expect(svg).toBeInTheDocument()
    expect(svg?.querySelector('title')).toHaveTextContent('Close')
  })

  it('hotspot is focusable', () => {
    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })
    hotspot.focus()

    expect(hotspot).toHaveFocus()
  })

  it('has proper button type to prevent form submission', () => {
    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })
    expect(hotspot).toHaveAttribute('type', 'button')
  })
})
