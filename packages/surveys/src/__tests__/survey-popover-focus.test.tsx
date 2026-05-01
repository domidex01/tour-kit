import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SurveyPopover } from '../components/survey-popover'
import { SurveysProvider } from '../context'
import { useSurvey } from '../hooks/use-survey'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
    createStorageAdapter: () => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }),
  }
})

const baseConfig: SurveyConfig = {
  id: 'p1',
  type: 'custom',
  displayMode: 'popover',
  title: 'Quick Q',
  questions: [],
}

function Harness({
  config = baseConfig,
  children,
}: {
  config?: SurveyConfig
  children?: React.ReactNode
}) {
  return (
    <SurveysProvider surveys={[config]}>
      <Inner>{children}</Inner>
    </SurveysProvider>
  )
}

function Inner({ children }: { children?: React.ReactNode }) {
  const survey = useSurvey('p1')
  // Pass the anchor as a state-driven ref so the popover sees a real
  // resolvedAnchor on the render that follows the anchor's commit.
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null)
  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        data-testid="anchor"
        onClick={() => survey.show()}
      >
        Open
      </button>
      <SurveyPopover surveyId="p1" anchor={anchor} options={{ showCloseButton: false }}>
        {children ?? (
          <>
            <button type="button" data-testid="first">
              First
            </button>
            <button type="button" data-testid="last">
              Last
            </button>
          </>
        )}
      </SurveyPopover>
    </>
  )
}

describe('SurveyPopover — focus trap', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('focuses the first focusable inside the popover when activated', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await act(async () => {
      await user.click(screen.getByTestId('anchor'))
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Focus moves to first focusable after the activate effect runs.
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('first'))
    })
  })

  it('cycles focus forward from the last focusable back to the first on Tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await act(async () => {
      await user.click(screen.getByTestId('anchor'))
    })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    const last = screen.getByRole('button', { name: /^Last$/ })
    last.focus()
    expect(document.activeElement).toBe(last)

    // Direct keydown dispatch bypasses user-event's behavior layer so the
    // assertion targets the focus-trap's keydown handler exactly.
    act(() => {
      fireEvent.keyDown(last, { key: 'Tab' })
    })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^First$/ }))
  })

  it('cycles focus backward from the first focusable to the last on Shift+Tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await act(async () => {
      await user.click(screen.getByTestId('anchor'))
    })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    const first = screen.getByRole('button', { name: /^First$/ })
    first.focus()
    expect(document.activeElement).toBe(first)

    act(() => {
      fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Last$/ }))
  })

  it('dismisses with reason="escape_key" when Escape is pressed inside the popover', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<Harness config={{ ...baseConfig, onDismiss }} />)

    await act(async () => {
      await user.click(screen.getByTestId('anchor'))
    })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await act(async () => {
      await user.keyboard('{Escape}')
    })

    expect(onDismiss).toHaveBeenCalledWith('escape_key')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('restores focus to the anchor when the popover closes', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const anchor = screen.getByTestId('anchor')
    await act(async () => {
      await user.click(anchor)
    })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await act(async () => {
      await user.keyboard('{Escape}')
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    expect(document.activeElement).toBe(anchor)
  })

  it('does not trap focus globally while the popover is hidden', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    render(<Harness />)

    // No popover dialog rendered yet; focus trap should not have wired any
    // global keydown listener for Tab cycling.
    expect(screen.queryByRole('dialog')).toBeNull()
    const keydownAdds = addSpy.mock.calls.filter((call) => call[0] === 'keydown')
    expect(keydownAdds).toHaveLength(0)
    addSpy.mockRestore()
  })
})
