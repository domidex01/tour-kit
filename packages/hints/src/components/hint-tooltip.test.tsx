import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HintTooltip } from './hint-tooltip'

// Mock @floating-ui/react
const mockUseFloating = vi.fn((_options?: unknown) => ({
  refs: {
    setFloating: vi.fn(),
  },
  floatingStyles: { position: 'absolute', top: 0, left: 0 },
  context: {},
}))

vi.mock('@floating-ui/react', () => ({
  useFloating: (options: unknown) => mockUseFloating(options),
  FloatingPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

describe('HintTooltip', () => {
  let targetElement: HTMLButtonElement

  beforeEach(() => {
    targetElement = document.createElement('button')
    document.body.appendChild(targetElement)
    mockUseFloating.mockClear()
  })

  afterEach(() => {
    if (targetElement.parentNode) {
      document.body.removeChild(targetElement)
    }
  })

  // Helper to get default props (must be called inside tests after beforeEach runs)
  const getDefaultProps = () => ({
    target: targetElement,
    onClose: vi.fn(),
    children: 'Tooltip content',
  })

  it('renders children', () => {
    render(<HintTooltip {...getDefaultProps()} />)

    expect(screen.getByText('Tooltip content')).toBeInTheDocument()
  })

  it('has close button with accessible label', () => {
    render(<HintTooltip {...getDefaultProps()} />)

    expect(screen.getByRole('button', { name: 'Dismiss hint' })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<HintTooltip {...getDefaultProps()} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Dismiss hint' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('passes correct placement to useFloating', () => {
    render(<HintTooltip {...getDefaultProps()} placement="top-start" />)

    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'top-start',
      })
    )
  })

  it('applies custom className', () => {
    const { container } = render(<HintTooltip {...getDefaultProps()} className="custom-tooltip" />)

    // Find the tooltip by its class
    const tooltip = container.querySelector('.custom-tooltip')
    expect(tooltip).toBeInTheDocument()
  })

  it('handles placement conversion for center alignments', () => {
    render(<HintTooltip {...getDefaultProps()} placement="top-center" />)

    // top-center should become just 'top' for floating-ui
    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'top',
      })
    )
  })

  it('handles bottom-center placement', () => {
    render(<HintTooltip {...getDefaultProps()} placement="bottom-center" />)

    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'bottom',
      })
    )
  })

  it('handles left-center placement', () => {
    render(<HintTooltip {...getDefaultProps()} placement="left-center" />)

    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'left',
      })
    )
  })

  it('handles right-center placement', () => {
    render(<HintTooltip {...getDefaultProps()} placement="right-center" />)

    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'right',
      })
    )
  })

  it('defaults to bottom placement', () => {
    render(<HintTooltip {...getDefaultProps()} />)

    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'bottom',
      })
    )
  })

  it('renders complex children', () => {
    render(
      <HintTooltip {...getDefaultProps()}>
        <div data-testid="complex-child">
          <h3>Title</h3>
          <p>Description</p>
        </div>
      </HintTooltip>
    )

    expect(screen.getByTestId('complex-child')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('has close button with correct SVG icon', () => {
    render(<HintTooltip {...getDefaultProps()} />)

    const closeButton = screen.getByRole('button', { name: 'Dismiss hint' })
    const svg = closeButton.querySelector('svg')

    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('passes target element to useFloating', () => {
    render(<HintTooltip {...getDefaultProps()} />)

    // The mock should have been called with elements containing reference
    const calls = mockUseFloating.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const lastCall = calls[calls.length - 1] as [{ elements?: { reference?: unknown } }]
    expect(lastCall?.[0]?.elements).toBeDefined()
    expect(lastCall?.[0]?.elements?.reference).toBe(targetElement)
  })

  it('sets open to true', () => {
    render(<HintTooltip {...getDefaultProps()} />)

    expect(mockUseFloating).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
      })
    )
  })
})
