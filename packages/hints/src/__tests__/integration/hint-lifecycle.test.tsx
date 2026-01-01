import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../../components/hint'
import { HintsProvider } from '../../context/hints-provider'
import { useHints } from '../../hooks/use-hints'

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

describe('Hint Lifecycle Integration', () => {
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
    document.body.innerHTML = `
      <div id="target-1">Target 1</div>
      <div id="target-2">Target 2</div>
      <div id="target-3">Target 3</div>
    `

    for (const el of document.querySelectorAll('[id^="target-"]')) {
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <HintsProvider>{children}</HintsProvider>
  )

  it('supports multiple independent hints', () => {
    render(
      <>
        <Hint id="h1" target="#target-1" content="Hint 1" />
        <Hint id="h2" target="#target-2" content="Hint 2" />
        <Hint id="h3" target="#target-3" content="Hint 3" />
      </>,
      { wrapper }
    )

    // All three hotspots should render
    const hotspots = screen.getAllByRole('button', { name: /show hint/i })
    expect(hotspots).toHaveLength(3)
  })

  it('only shows one tooltip at a time', async () => {
    const user = userEvent.setup()

    render(
      <>
        <Hint id="h1" target="#target-1" content="Hint 1" />
        <Hint id="h2" target="#target-2" content="Hint 2" />
      </>,
      { wrapper }
    )

    const hotspots = screen.getAllByRole('button', { name: /show hint/i })

    // Open first
    await user.click(hotspots[0])
    expect(screen.getByText('Hint 1')).toBeInTheDocument()

    // Open second
    await user.click(hotspots[1])
    expect(screen.getByText('Hint 2')).toBeInTheDocument()
    expect(screen.queryByText('Hint 1')).not.toBeInTheDocument()
  })

  it('dismissed hint stays hidden until explicitly shown', async () => {
    const user = userEvent.setup()

    function TestComponent({ counter }: { counter: number }) {
      return (
        <>
          <div data-testid="counter">{counter}</div>
          <Hint id="persistent" target="#target-1" content="Help" persist />
        </>
      )
    }

    // Render within a single provider - state persists in the provider
    const { rerender } = render(
      <HintsProvider>
        <TestComponent counter={1} />
      </HintsProvider>
    )

    // Open and dismiss
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Hotspot should be gone
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()

    // Rerender with different props (component doesn't remount, just updates)
    rerender(
      <HintsProvider>
        <TestComponent counter={2} />
      </HintsProvider>
    )

    // Still dismissed because state is in provider and component didn't unmount
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('counter')).toHaveTextContent('2')
  })

  it('resetAllHints allows all dismissed hints to show again', async () => {
    const user = userEvent.setup()

    function ResetButton() {
      const { resetAllHints } = useHints()
      return (
        <button type="button" onClick={resetAllHints}>
          Reset All
        </button>
      )
    }

    render(
      <>
        <Hint id="h1" target="#target-1" content="Hint 1" persist />
        <Hint id="h2" target="#target-2" content="Hint 2" persist />
        <ResetButton />
      </>,
      { wrapper }
    )

    const hotspots = screen.getAllByRole('button', { name: /show hint/i })
    expect(hotspots).toHaveLength(2)

    // Dismiss first
    await user.click(hotspots[0])
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Dismiss second (there's only one hotspot now)
    const remainingHotspot = screen.getByRole('button', { name: /show hint/i })
    await user.click(remainingHotspot)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Both should be gone
    expect(screen.queryAllByRole('button', { name: /show hint/i })).toHaveLength(0)

    // Reset all
    await user.click(screen.getByText('Reset All'))

    // Both should be back
    expect(screen.getAllByRole('button', { name: /show hint/i })).toHaveLength(2)
  })

  it('can show hint programmatically using useHints', async () => {
    const user = userEvent.setup()

    function ShowButton() {
      const { showHint } = useHints()
      return (
        <button type="button" onClick={() => showHint('h1')}>
          Show Programmatically
        </button>
      )
    }

    render(
      <>
        <Hint id="h1" target="#target-1" content="Programmatic Hint" />
        <ShowButton />
      </>,
      { wrapper }
    )

    expect(screen.queryByText('Programmatic Hint')).not.toBeInTheDocument()

    await user.click(screen.getByText('Show Programmatically'))

    expect(screen.getByText('Programmatic Hint')).toBeInTheDocument()
  })

  it('can hide hint programmatically using useHints', async () => {
    const user = userEvent.setup()

    function HideButton() {
      const { hideHint } = useHints()
      return (
        <button type="button" onClick={() => hideHint('h1')}>
          Hide Programmatically
        </button>
      )
    }

    render(
      <>
        <Hint id="h1" target="#target-1" content="Hide Me" />
        <HideButton />
      </>,
      { wrapper }
    )

    // Open hint
    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(screen.getByText('Hide Me')).toBeInTheDocument()

    // Hide programmatically
    await user.click(screen.getByText('Hide Programmatically'))

    expect(screen.queryByText('Hide Me')).not.toBeInTheDocument()
  })

  it('reports correct active hint through useHints', async () => {
    const user = userEvent.setup()

    function ActiveHintDisplay() {
      const { activeHint } = useHints()
      return <div data-testid="active-hint">{activeHint ?? 'none'}</div>
    }

    render(
      <>
        <Hint id="h1" target="#target-1" content="Hint 1" />
        <Hint id="h2" target="#target-2" content="Hint 2" />
        <ActiveHintDisplay />
      </>,
      { wrapper }
    )

    expect(screen.getByTestId('active-hint')).toHaveTextContent('none')

    const hotspots = screen.getAllByRole('button', { name: /show hint/i })

    await user.click(hotspots[0])
    expect(screen.getByTestId('active-hint')).toHaveTextContent('h1')

    await user.click(hotspots[1])
    expect(screen.getByTestId('active-hint')).toHaveTextContent('h2')
  })

  it('tracks hint count through useHints', () => {
    function HintCount() {
      const { hints } = useHints()
      return <div data-testid="hint-count">{hints.length}</div>
    }

    render(
      <>
        <Hint id="h1" target="#target-1" content="Hint 1" />
        <Hint id="h2" target="#target-2" content="Hint 2" />
        <Hint id="h3" target="#target-3" content="Hint 3" />
        <HintCount />
      </>,
      { wrapper }
    )

    expect(screen.getByTestId('hint-count')).toHaveTextContent('3')
  })

  it('callbacks are called in correct order', async () => {
    const user = userEvent.setup()
    const callOrder: string[] = []

    render(
      <Hint
        id="test"
        target="#target-1"
        content="Callback Test"
        onClick={() => callOrder.push('onClick')}
        onShow={() => callOrder.push('onShow')}
        onDismiss={() => callOrder.push('onDismiss')}
      />,
      { wrapper }
    )

    await user.click(screen.getByRole('button', { name: /show hint/i }))

    expect(callOrder).toEqual(['onClick', 'onShow'])

    callOrder.length = 0

    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(callOrder).toEqual(['onDismiss'])
  })

  it('handles rapid open/close interactions', async () => {
    const user = userEvent.setup()

    render(<Hint id="h1" target="#target-1" content="Rapid Test" />, { wrapper })

    const hotspot = screen.getByRole('button', { name: /show hint/i })

    // Rapid clicks
    await user.click(hotspot) // open
    await user.click(hotspot) // close
    await user.click(hotspot) // open
    await user.click(hotspot) // close

    // Should end in closed state
    expect(screen.queryByText('Rapid Test')).not.toBeInTheDocument()
    expect(hotspot).toHaveAttribute('aria-expanded', 'false')
  })

  it('handles unmounting hint while open', async () => {
    const user = userEvent.setup()

    function ToggleableHint({ show }: { show: boolean }) {
      return show ? <Hint id="toggle" target="#target-1" content="Toggle Me" /> : null
    }

    const { rerender } = render(<ToggleableHint show={true} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(screen.getByText('Toggle Me')).toBeInTheDocument()

    // Unmount while open
    rerender(
      <HintsProvider>
        <ToggleableHint show={false} />
      </HintsProvider>
    )

    expect(screen.queryByText('Toggle Me')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()
  })
})
