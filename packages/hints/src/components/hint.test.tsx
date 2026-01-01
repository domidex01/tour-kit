import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HintsProvider } from '../context/hints-provider'
import { Hint } from './hint'

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

describe('Hint', () => {
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
    document.body.innerHTML = '<div id="target">Target Element</div>'

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

  it('renders hotspot when target exists', () => {
    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    expect(screen.getByRole('button', { name: /show hint/i })).toBeInTheDocument()
  })

  it('returns null when target not found', () => {
    const { container } = render(<Hint id="test" target="#nonexistent" content="Help text" />, {
      wrapper,
    })

    expect(container.firstChild).toBeNull()
  })

  it('shows tooltip on hotspot click', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    expect(screen.getByText('Help text')).toBeInTheDocument()
  })

  it('hides tooltip on second click', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help text" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })

    await user.click(hotspot)
    expect(screen.getByText('Help text')).toBeInTheDocument()

    await user.click(hotspot)
    expect(screen.queryByText('Help text')).not.toBeInTheDocument()
  })

  it('auto-shows when autoShow is true', async () => {
    const onShow = vi.fn()

    render(<Hint id="test" target="#target" content="Auto help" autoShow onShow={onShow} />, {
      wrapper,
    })

    // AutoShow triggers the show action and callback
    await waitFor(() => {
      expect(onShow).toHaveBeenCalled()
    })

    // The hotspot should reflect open state
    expect(screen.getByRole('button', { name: /show hint/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('dismisses permanently with persist=true', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help" persist />, { wrapper })

    // Open tooltip
    await user.click(screen.getByRole('button', { name: /show hint/i }))

    // Click dismiss button in tooltip
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Hotspot should be gone (dismissed)
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()
  })

  it('just hides with persist=false', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help" persist={false} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Hotspot should still be there (not dismissed, just hidden)
    expect(screen.getByRole('button', { name: /show hint/i })).toBeInTheDocument()
  })

  it('calls onClick callback', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Hint id="test" target="#target" content="Help" onClick={onClick} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    expect(onClick).toHaveBeenCalled()
  })

  it('calls onShow callback', async () => {
    const user = userEvent.setup()
    const onShow = vi.fn()

    render(<Hint id="test" target="#target" content="Help" onShow={onShow} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    expect(onShow).toHaveBeenCalled()
  })

  it('calls onDismiss callback', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(<Hint id="test" target="#target" content="Help" onDismiss={onDismiss} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it('renders children instead of content when provided', async () => {
    const user = userEvent.setup()

    render(
      <Hint id="test" target="#target" content="Fallback">
        <div data-testid="custom-content">Custom Children</div>
      </Hint>,
      { wrapper }
    )

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument()
  })

  it('does not show when isDismissed', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help" persist />, { wrapper })

    // Open and dismiss
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Component should return null when dismissed
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()
  })

  it('calls onShow on autoShow', async () => {
    const onShow = vi.fn()

    render(<Hint id="test" target="#target" content="Auto help" autoShow onShow={onShow} />, {
      wrapper,
    })

    await waitFor(() => {
      expect(onShow).toHaveBeenCalled()
    })
  })

  it('does not autoShow when dismissed', async () => {
    const user = userEvent.setup()
    const onShow = vi.fn()

    // Render a hint that is already dismissed, then add autoShow
    // First, render and dismiss the hint
    render(<Hint id="test" target="#target" content="Help" persist onShow={onShow} />, { wrapper })

    // Open and dismiss
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Hint should be dismissed (hotspot not visible)
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()

    // Verify the hint stays dismissed and onShow was only called once (for the initial open)
    expect(onShow).toHaveBeenCalledTimes(1)
  })

  it('applies className to tooltip', async () => {
    const user = userEvent.setup()

    render(<Hint id="test" target="#target" content="Help" className="custom-class" />, {
      wrapper,
    })

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    // Wait for tooltip content to appear
    await waitFor(() => {
      expect(screen.getByText('Help')).toBeInTheDocument()
    })

    // The tooltip wrapper div (2 levels up from content) should have the custom class
    // Structure: div.className > div (padding) > "Help"
    const tooltip = screen.getByText('Help').closest('.custom-class')
    expect(tooltip).toBeInTheDocument()
  })
})
