import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChecklistTask } from '../../components/checklist-task'
import { createMockTaskState } from '../test-utils'

function mockMatchMedia(reduce: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('reduce') ? reduce : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

describe('ChecklistTask completion animation (US-3)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('toggles data-tk-completing for ~200ms when reduce=false', async () => {
    mockMatchMedia(false)
    const pendingTask = createMockTaskState({ completed: false })
    const completedTask = createMockTaskState({ completed: true })

    const { container, rerender } = render(<ChecklistTask task={pendingTask} />)

    let root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('data-tk-completing')).toBeNull()

    // Flip to completed — the component enters the 'completing' phase synchronously
    // through the useEffect on `completed`.
    await act(async () => {
      rerender(<ChecklistTask task={completedTask} />)
    })
    root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('data-tk-completing')).toBe('true')

    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('data-tk-completing')).toBeNull()
  })

  it('skips the completing phase entirely when reduce=true', async () => {
    mockMatchMedia(true)
    const pendingTask = createMockTaskState({ completed: false })
    const completedTask = createMockTaskState({ completed: true })

    const { container, rerender } = render(<ChecklistTask task={pendingTask} />)

    await act(async () => {
      rerender(<ChecklistTask task={completedTask} />)
    })

    const root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('data-tk-completing')).toBeNull()
  })
})
