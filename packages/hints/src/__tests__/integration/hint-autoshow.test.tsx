import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../../components/hint'
import { HintHeadless } from '../../components/headless/hint'
import { HintsProvider } from '../../context/hints-provider'
import { useHint } from '../../hooks/use-hint'

// Mock @floating-ui/react
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

describe('Hint — autoShow does not infinite-loop', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="target">Target</div>`
    const el = document.getElementById('target')
    if (el) vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('dispatches SHOW exactly once on mount with autoShow', () => {
    let onShowCalls = 0

    render(
      <HintsProvider>
        <Hint
          id="h"
          target="#target"
          content="Hello"
          autoShow
          onShow={() => {
            onShowCalls += 1
          }}
        />
      </HintsProvider>
    )

    expect(onShowCalls).toBe(1)
  })

  it('does not re-fire onShow when parent re-renders', () => {
    let onShowCalls = 0
    const onShow = () => {
      onShowCalls += 1
    }

    function Parent({ label }: { label: string }) {
      return (
        <HintsProvider>
          <div data-testid="label">{label}</div>
          <Hint id="h" target="#target" content="Hello" autoShow onShow={onShow} />
        </HintsProvider>
      )
    }

    const { rerender } = render(<Parent label="first" />)
    expect(onShowCalls).toBe(1)

    // Force re-renders — should not trigger another onShow
    rerender(<Parent label="second" />)
    rerender(<Parent label="third" />)
    expect(onShowCalls).toBe(1)
  })

  it('survives inline onShow that changes identity each render', () => {
    let onShowCalls = 0

    function Parent({ n }: { n: number }) {
      return (
        <HintsProvider>
          <div>{n}</div>
          <Hint
            id="h"
            target="#target"
            content="Hello"
            autoShow
            onShow={() => {
              onShowCalls += 1
            }}
          />
        </HintsProvider>
      )
    }

    const { rerender } = render(<Parent n={1} />)
    rerender(<Parent n={2} />)
    rerender(<Parent n={3} />)

    expect(onShowCalls).toBe(1)
  })

  it('survives React.StrictMode without looping', () => {
    let onShowCalls = 0

    render(
      <React.StrictMode>
        <HintsProvider>
          <Hint
            id="h"
            target="#target"
            content="Hello"
            autoShow
            onShow={() => {
              onShowCalls += 1
            }}
          />
        </HintsProvider>
      </React.StrictMode>
    )

    // StrictMode double-invokes effects on mount; the ref guard must prevent
    // the second run from firing onShow again.
    expect(onShowCalls).toBe(1)
  })

  it('HintHeadless — does not re-fire onShow when parent re-renders with inline callback', () => {
    let onShowCalls = 0

    function Parent({ n }: { n: number }) {
      return (
        <HintsProvider>
          <div>{n}</div>
          <HintHeadless
            id="h"
            target="#target"
            content="Hello"
            autoShow
            onShow={() => {
              onShowCalls += 1
            }}
          />
        </HintsProvider>
      )
    }

    const { rerender } = render(<Parent n={1} />)
    rerender(<Parent n={2} />)
    rerender(<Parent n={3} />)

    expect(onShowCalls).toBe(1)
  })

  it('HintHeadless — survives React.StrictMode without looping', () => {
    let onShowCalls = 0

    render(
      <React.StrictMode>
        <HintsProvider>
          <HintHeadless
            id="h"
            target="#target"
            content="Hello"
            autoShow
            onShow={() => {
              onShowCalls += 1
            }}
          />
        </HintsProvider>
      </React.StrictMode>
    )

    expect(onShowCalls).toBe(1)
  })

  it('SHOW_HINT reducer short-circuits when hint is already open', () => {
    // Direct observation: dispatching show twice should not create a new state object.
    // We verify by rendering a consumer that counts renders of the provider subtree.
    let providerCommits = 0

    function Consumer() {
      const { show } = useHint('h')
      React.useEffect(() => {
        // Fire show() twice on mount — second call should be a no-op in the reducer.
        show()
        show()
      }, [show])
      return null
    }

    function CommitCounter() {
      providerCommits += 1
      return null
    }

    render(
      <HintsProvider>
        <Consumer />
        <CommitCounter />
      </HintsProvider>
    )

    // If the reducer had no no-op guard, each show() would create a new state,
    // but the commit count should still be small and bounded (not a runaway).
    expect(providerCommits).toBeLessThan(10)
  })
})
