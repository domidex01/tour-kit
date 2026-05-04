import { act, render } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChecklistProvider } from '../context/checklist-provider'
import { useTask } from '../hooks/use-task'
import type { ChecklistConfig } from '../types'
import { countEventOps, spyOnEventListeners } from './history-helpers'
import { resetUrlVisitListener } from './url-visit-test-utils'

// ProGate is a hard runtime gate; bypass it for tests so the provider always renders.
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

interface CompletionProbeProps {
  checklistId: string
  taskId: string
  onState: (completed: boolean) => void
}

function CompletionProbe({ checklistId, taskId, onState }: CompletionProbeProps) {
  const { isCompleted } = useTask(checklistId, taskId)
  React.useEffect(() => {
    onState(isCompleted)
  }, [isCompleted, onState])
  return null
}

describe('urlVisit completion (ChecklistProvider integration)', () => {
  beforeEach(() => {
    history.replaceState({}, '', '/')
    resetUrlVisitListener()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('string pattern auto-completes when location.pathname matches as substring', () => {
    const checklist: ChecklistConfig = {
      id: 'c1',
      title: 'Onboarding',
      tasks: [
        {
          id: 't1',
          title: 'Visit dashboard',
          completedWhen: { type: 'urlVisit', urlPattern: '/dashboard' },
        },
      ],
    }
    let completed = false
    render(
      <ChecklistProvider checklists={[checklist]}>
        <CompletionProbe
          checklistId="c1"
          taskId="t1"
          onState={(v) => {
            completed = v
          }}
        />
      </ChecklistProvider>
    )

    expect(completed).toBe(false)

    act(() => {
      history.pushState({}, '', '/dashboard/main')
    })

    expect(completed).toBe(true)
  })

  it('RegExp pattern only matches the intended path prefix', () => {
    const checklist: ChecklistConfig = {
      id: 'c1',
      title: 'Billing',
      tasks: [
        {
          id: 't1',
          title: 'Visit billing',
          completedWhen: { type: 'urlVisit', urlPattern: /^\/billing/ },
        },
      ],
    }
    let completed = false
    render(
      <ChecklistProvider checklists={[checklist]}>
        <CompletionProbe
          checklistId="c1"
          taskId="t1"
          onState={(v) => {
            completed = v
          }}
        />
      </ChecklistProvider>
    )

    act(() => {
      history.pushState({}, '', '/account/billing')
    })
    expect(completed).toBe(false)

    act(() => {
      history.pushState({}, '', '/billing/plan')
    })
    expect(completed).toBe(true)
  })

  it('idempotent: re-firing pushState after a match does not re-fire onTaskComplete', () => {
    const onTaskComplete = vi.fn()
    const checklist: ChecklistConfig = {
      id: 'c1',
      title: 'X',
      tasks: [
        {
          id: 't1',
          title: 'T',
          completedWhen: { type: 'urlVisit', urlPattern: '/dashboard' },
        },
      ],
    }
    render(
      <ChecklistProvider checklists={[checklist]} onTaskComplete={onTaskComplete}>
        <div />
      </ChecklistProvider>
    )

    act(() => {
      history.pushState({}, '', '/dashboard/main')
    })
    expect(onTaskComplete).toHaveBeenCalledTimes(1)

    act(() => {
      history.pushState({}, '', '/dashboard/other')
    })
    expect(onTaskComplete).toHaveBeenCalledTimes(1)
  })

  it('cleans up: 5 mount/unmount cycles leave balanced popstate listener counts', () => {
    const checklist: ChecklistConfig = {
      id: 'c1',
      title: 'X',
      tasks: [
        {
          id: 't1',
          title: 'T',
          completedWhen: { type: 'urlVisit', urlPattern: '/never-matches-anywhere' },
        },
      ],
    }

    const spies = spyOnEventListeners()

    for (let i = 0; i < 5; i++) {
      const { unmount } = render(
        <ChecklistProvider checklists={[checklist]}>
          <div />
        </ChecklistProvider>
      )
      unmount()
    }

    const adds = countEventOps(spies.add, 'popstate')
    const removes = countEventOps(spies.remove, 'popstate')
    expect(adds).toBeGreaterThan(0)
    expect(removes).toBe(adds)
  })

  it('SSR-safe: importing the listener under typeof window === undefined does not throw', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    await expect(import('../engine/url-visit-listener')).resolves.toBeDefined()
    vi.unstubAllGlobals()
  })
})
