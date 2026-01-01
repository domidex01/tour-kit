import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useHintsContext } from './hints-context'
import { HintsProvider } from './hints-provider'

describe('HintsProvider', () => {
  function Consumer() {
    const { hints, activeHint, registerHint, showHint, hideHint, dismissHint, resetHint } =
      useHintsContext()

    const hint = hints.get('hint-1')

    return (
      <div>
        <button type="button" onClick={() => registerHint('hint-1')}>
          Register
        </button>
        <button type="button" onClick={() => showHint('hint-1')}>
          Show
        </button>
        <button type="button" onClick={() => hideHint('hint-1')}>
          Hide
        </button>
        <button type="button" onClick={() => dismissHint('hint-1')}>
          Dismiss
        </button>
        <button type="button" onClick={() => resetHint('hint-1')}>
          Reset
        </button>
        <span data-testid="count">{hints.size}</span>
        <span data-testid="active">{activeHint ?? 'none'}</span>
        <span data-testid="open">{String(hint?.isOpen ?? false)}</span>
        <span data-testid="dismissed">{String(hint?.isDismissed ?? false)}</span>
      </div>
    )
  }

  it('provides context to children', () => {
    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    expect(screen.getByTestId('count')).toBeInTheDocument()
  })

  it('provides empty initial state', () => {
    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    expect(screen.getByTestId('count')).toHaveTextContent('0')
    expect(screen.getByTestId('active')).toHaveTextContent('none')
  })

  it('registers hint', async () => {
    const user = userEvent.setup()

    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))

    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })

  it('shows hint and sets as active', async () => {
    const user = userEvent.setup()

    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Show'))

    expect(screen.getByTestId('active')).toHaveTextContent('hint-1')
    expect(screen.getByTestId('open')).toHaveTextContent('true')
  })

  it('hides hint and clears active', async () => {
    const user = userEvent.setup()

    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Show'))
    await user.click(screen.getByText('Hide'))

    expect(screen.getByTestId('active')).toHaveTextContent('none')
    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })

  it('dismisses hint permanently', async () => {
    const user = userEvent.setup()

    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Show'))
    await user.click(screen.getByText('Dismiss'))

    expect(screen.getByTestId('dismissed')).toHaveTextContent('true')
    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })

  it('resets dismissed hint', async () => {
    const user = userEvent.setup()

    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Dismiss'))

    expect(screen.getByTestId('dismissed')).toHaveTextContent('true')

    await user.click(screen.getByText('Reset'))

    expect(screen.getByTestId('dismissed')).toHaveTextContent('false')
  })

  it('only shows one hint at a time', async () => {
    const user = userEvent.setup()

    function MultiConsumer() {
      const { hints, registerHint, showHint } = useHintsContext()

      return (
        <div>
          <button
            type="button"
            onClick={() => {
              registerHint('hint-1')
              registerHint('hint-2')
            }}
          >
            Register All
          </button>
          <button type="button" onClick={() => showHint('hint-1')}>
            Show 1
          </button>
          <button type="button" onClick={() => showHint('hint-2')}>
            Show 2
          </button>
          <span data-testid="h1-open">{String(hints.get('hint-1')?.isOpen ?? false)}</span>
          <span data-testid="h2-open">{String(hints.get('hint-2')?.isOpen ?? false)}</span>
        </div>
      )
    }

    render(
      <HintsProvider>
        <MultiConsumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register All'))
    await user.click(screen.getByText('Show 1'))

    expect(screen.getByTestId('h1-open')).toHaveTextContent('true')

    await user.click(screen.getByText('Show 2'))

    expect(screen.getByTestId('h1-open')).toHaveTextContent('false')
    expect(screen.getByTestId('h2-open')).toHaveTextContent('true')
  })

  it('does not show dismissed hint', async () => {
    const user = userEvent.setup()

    render(
      <HintsProvider>
        <Consumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Show'))
    await user.click(screen.getByText('Dismiss'))

    // Try to show again
    await user.click(screen.getByText('Show'))

    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })

  it('unregisters hint', async () => {
    const user = userEvent.setup()

    function UnregisterConsumer() {
      const { hints, registerHint, unregisterHint } = useHintsContext()

      return (
        <div>
          <button type="button" onClick={() => registerHint('hint-1')}>
            Register
          </button>
          <button type="button" onClick={() => unregisterHint('hint-1')}>
            Unregister
          </button>
          <span data-testid="count">{hints.size}</span>
        </div>
      )
    }

    render(
      <HintsProvider>
        <UnregisterConsumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    await user.click(screen.getByText('Unregister'))
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('clears activeHint when unregistering active hint', async () => {
    const user = userEvent.setup()

    function UnregisterActiveConsumer() {
      const { activeHint, registerHint, unregisterHint, showHint } = useHintsContext()

      return (
        <div>
          <button type="button" onClick={() => registerHint('hint-1')}>
            Register
          </button>
          <button type="button" onClick={() => showHint('hint-1')}>
            Show
          </button>
          <button type="button" onClick={() => unregisterHint('hint-1')}>
            Unregister
          </button>
          <span data-testid="active">{activeHint ?? 'none'}</span>
        </div>
      )
    }

    render(
      <HintsProvider>
        <UnregisterActiveConsumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Show'))
    expect(screen.getByTestId('active')).toHaveTextContent('hint-1')

    await user.click(screen.getByText('Unregister'))
    expect(screen.getByTestId('active')).toHaveTextContent('none')
  })

  it('resets all hints with resetAllHints', async () => {
    const user = userEvent.setup()

    function ResetAllConsumer() {
      const { hints, registerHint, dismissHint, resetAllHints } = useHintsContext()

      return (
        <div>
          <button
            type="button"
            onClick={() => {
              registerHint('hint-1')
              registerHint('hint-2')
            }}
          >
            Register All
          </button>
          <button
            type="button"
            onClick={() => {
              dismissHint('hint-1')
              dismissHint('hint-2')
            }}
          >
            Dismiss All
          </button>
          <button type="button" onClick={() => resetAllHints()}>
            Reset All
          </button>
          <span data-testid="h1-dismissed">
            {String(hints.get('hint-1')?.isDismissed ?? false)}
          </span>
          <span data-testid="h2-dismissed">
            {String(hints.get('hint-2')?.isDismissed ?? false)}
          </span>
        </div>
      )
    }

    render(
      <HintsProvider>
        <ResetAllConsumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register All'))
    await user.click(screen.getByText('Dismiss All'))

    expect(screen.getByTestId('h1-dismissed')).toHaveTextContent('true')
    expect(screen.getByTestId('h2-dismissed')).toHaveTextContent('true')

    await user.click(screen.getByText('Reset All'))

    expect(screen.getByTestId('h1-dismissed')).toHaveTextContent('false')
    expect(screen.getByTestId('h2-dismissed')).toHaveTextContent('false')
  })

  it('does not re-register existing hint', async () => {
    const user = userEvent.setup()

    function DoubleRegisterConsumer() {
      const { hints, registerHint, showHint } = useHintsContext()

      return (
        <div>
          <button type="button" onClick={() => registerHint('hint-1')}>
            Register
          </button>
          <button type="button" onClick={() => showHint('hint-1')}>
            Show
          </button>
          <span data-testid="count">{hints.size}</span>
          <span data-testid="open">{String(hints.get('hint-1')?.isOpen ?? false)}</span>
        </div>
      )
    }

    render(
      <HintsProvider>
        <DoubleRegisterConsumer />
      </HintsProvider>
    )

    await user.click(screen.getByText('Register'))
    await user.click(screen.getByText('Show'))
    expect(screen.getByTestId('open')).toHaveTextContent('true')

    // Register again should not reset state
    await user.click(screen.getByText('Register'))

    expect(screen.getByTestId('count')).toHaveTextContent('1')
    expect(screen.getByTestId('open')).toHaveTextContent('true')
  })
})
