import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { SurveysProvider } from '../context'
import { useSurvey, useSurveys } from '../hooks'
import type { SurveyConfig } from '../types'

// License gate is a pass-through in tests (copied from question-rating.test.tsx:7-11).
vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

// Module-scoped storage Map + tour-context stub (copied from storage.test.tsx:13-31).
// Only the persistence-guard test exercises it; the gate tests pass `storage={null}`.
const sharedStore = new Map<string, string>()
vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
    createStorageAdapter: () => ({
      getItem: (key: string) => sharedStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sharedStore.set(key, value)
      },
      removeItem: (key: string) => {
        sharedStore.delete(key)
      },
    }),
  }
})

const QID = 'q1'

// Single-validation survey for the gate tests. `storage={null}` keeps each test
// fully in-memory (no jsdom localStorage / no hydrate cross-talk).
const configs: SurveyConfig[] = [
  {
    id: 'val',
    type: 'csat',
    displayMode: 'modal',
    questions: [
      {
        id: QID,
        type: 'text',
        text: 'Your feedback',
        required: true,
        validation: (v) => (v ? null : 'Please answer'),
      },
      { id: 'q2', type: 'text', text: 'Anything else?' },
    ],
  },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SurveysProvider surveys={configs} storage={null}>
      {children}
    </SurveysProvider>
  )
}

describe('validation gates advance', () => {
  it('fail path: returns the error, does NOT advance, exposes it', async () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })
    await act(async () => {
      result.current.show('val')
    })

    let returned: string | null = null
    await act(async () => {
      returned = result.current.nextQuestion('val')
    })

    expect(returned).toBe('Please answer') // surfaced to the caller
    expect(result.current.getState('val')?.currentStep).toBe(0) // BLOCKED — the point
    expect(result.current.getValidationError('val', QID)).toBe('Please answer')
  })

  it('pass path: a valid answer advances and clears the error', async () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })
    await act(async () => {
      result.current.show('val')
    })
    // trip the error first, then correct it
    await act(async () => {
      result.current.nextQuestion('val')
    })
    expect(result.current.getValidationError('val', QID)).toBe('Please answer')

    await act(async () => {
      result.current.answer('val', QID, 'ok')
    })

    let returned: string | null = 'sentinel'
    await act(async () => {
      returned = result.current.nextQuestion('val')
    })

    expect(returned).toBeNull()
    expect(result.current.getState('val')?.currentStep).toBe(1) // advanced
    expect(result.current.getValidationError('val', QID)).toBeUndefined() // cleared
  })

  it('no-validation regression: a question without validation advances normally', async () => {
    const plain: SurveyConfig[] = [
      {
        id: 'plain',
        type: 'csat',
        displayMode: 'modal',
        questions: [
          { id: 'p1', type: 'text', text: 'Hi' },
          { id: 'p2', type: 'text', text: 'Bye' },
        ],
      },
    ]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <SurveysProvider surveys={plain} storage={null}>
          {children}
        </SurveysProvider>
      ),
    })
    await act(async () => {
      result.current.show('plain')
    })

    let returned: string | null = 'sentinel'
    await act(async () => {
      returned = result.current.nextQuestion('plain')
    })

    expect(returned).toBeNull()
    expect(result.current.getState('plain')?.currentStep).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// A11y for the validation error surface.
//
// There is no built-in multi-question turnkey container with a Next button —
// the advance flow is headless (turnkey modals are single-question). So we
// assert the ARIA contract against a minimal harness built on the REAL exported
// `useSurvey` hook: exactly what a consumer writes, and the pattern the docs
// prescribe (mirrors question-text.tsx:79 `aria-describedby`).
// ---------------------------------------------------------------------------

function ValidationHarness() {
  const { state, config, nextQuestion, answer, validationError } = useSurvey('val')
  const question = config?.questions[state?.currentStep ?? 0]
  if (!question) return <div data-testid="done" />

  const error = validationError(question.id)
  const errorId = `${question.id}-error`

  return (
    <div>
      <input
        aria-label={typeof question.text === 'string' ? question.text : question.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => answer(question.id, e.target.value)}
      />
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
      <button type="button" onClick={() => nextQuestion()}>
        Next
      </button>
    </div>
  )
}

describe('a11y for the error surface', () => {
  it('announces the error and associates it with the control', async () => {
    const user = userEvent.setup()
    render(
      <SurveysProvider surveys={configs} storage={null}>
        <ValidationHarness />
      </SurveysProvider>
    )

    // Advance with no answer → validation fails.
    await user.click(screen.getByRole('button', { name: 'Next' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Please answer')
    expect(alert).toHaveAttribute('id', `${QID}-error`)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', `${QID}-error`)
  })

  it('errored container has no axe violations', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SurveysProvider surveys={configs} storage={null}>
        <ValidationHarness />
      </SurveysProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ---------------------------------------------------------------------------
// Persistence guard — transient errors must NOT be serialized or resurface.
// Uses the module-scoped storage Map (mocked @tour-kit/core).
// ---------------------------------------------------------------------------

const persistConfigs: SurveyConfig[] = [
  {
    id: 'val',
    type: 'csat',
    displayMode: 'modal',
    questions: [
      {
        id: 'q1',
        type: 'text',
        text: 'A',
        required: true,
        validation: (v) => (v ? null : 'need q1'),
      },
      {
        id: 'q2',
        type: 'text',
        text: 'B',
        required: true,
        validation: (v) => (v ? null : 'need q2'),
      },
    ],
  },
]

function persistWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SurveysProvider surveys={persistConfigs} storageKey="val-storage">
      {children}
    </SurveysProvider>
  )
}

describe('persistence guard', () => {
  beforeEach(() => {
    sharedStore.clear()
  })

  it('drops stale validation errors on reload; responses/currentStep survive', async () => {
    const first = renderHook(() => useSurveys(), { wrapper: persistWrapper })
    // flush the hydrate microtask (no-op: empty store) so the persist effect arms
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      first.result.current.show('val')
    })
    // answer q1 + advance to step 1
    await act(async () => {
      first.result.current.answer('val', 'q1', 'keep')
    })
    await act(async () => {
      first.result.current.nextQuestion('val')
    })
    // now on q2 — trip a live error (no answer)
    await act(async () => {
      first.result.current.nextQuestion('val')
    })

    // In memory: advanced to step 1, response kept, q2 error live.
    expect(first.result.current.getState('val')?.currentStep).toBe(1)
    expect(first.result.current.getValidationError('val', 'q2')).toBe('need q2')

    // The persisted blob must NOT carry validationErrors.
    const blob = sharedStore.get('val-storage:state')
    expect(blob).toBeTruthy()
    const parsed = JSON.parse(blob ?? '{}')
    const entry = parsed.surveys.find(([id]: [string, unknown]) => id === 'val')
    expect(entry?.[1]).not.toHaveProperty('validationErrors')
    expect(entry?.[1]?.currentStep).toBe(1)

    first.unmount()

    // Reload: fresh provider hydrates from the same store.
    const second = renderHook(() => useSurveys(), { wrapper: persistWrapper })
    await act(async () => {
      await Promise.resolve()
    })

    const reloaded = second.result.current.getState('val')
    expect(reloaded?.currentStep).toBe(1) // survived
    expect(reloaded?.responses.get('q1')).toBe('keep') // survived
    expect(second.result.current.getValidationError('val', 'q2')).toBeUndefined() // gone
  })
})
