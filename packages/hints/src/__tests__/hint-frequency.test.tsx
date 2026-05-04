import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHintsContext } from '../context/hints-context'
import { HintsProvider } from '../context/hints-provider'
import type { HintConfig } from '../types'
import { createMockStorage, seedHintFrequencyState } from './mock-storage'

vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: { setFloating: vi.fn() },
    floatingStyles: {},
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

const HINT_ID = 'tip-onboarding-step-1'
const baseHint: HintConfig = {
  id: HINT_ID,
  target: '#anchor',
  title: 'Try this',
  content: 'Click the button',
}

interface ProbeRef {
  show(): void
  dismiss(): void
  reset(): void
  resetAll(): void
  active(): string | null
  isOpen(): boolean
}

function Probe({ probeRef }: { probeRef: { current: ProbeRef | null } }) {
  const ctx = useHintsContext()
  probeRef.current = {
    show: () => ctx.showHint(HINT_ID),
    dismiss: () => ctx.dismissHint(HINT_ID),
    reset: () => ctx.resetHint(HINT_ID),
    resetAll: () => ctx.resetAllHints(),
    active: () => ctx.activeHint,
    isOpen: () => ctx.hints.get(HINT_ID)?.isOpen ?? false,
  }
  return <span data-testid="active">{ctx.activeHint ?? 'none'}</span>
}

describe('Hint frequency rules', () => {
  let storage: Storage
  let probe: { current: ProbeRef | null }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-08T00:00:00Z'))
    storage = createMockStorage()
    probe = { current: null }
    document.body.innerHTML = '<div id="anchor">A</div>'
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  function renderProvider(hint: HintConfig) {
    return render(
      <HintsProvider hints={[hint]} storage={storage}>
        <Probe probeRef={probe} />
      </HintsProvider>
    )
  }

  it("frequency: { type: 'interval', days: 7 } suppresses re-show within window, allows after", () => {
    renderProvider({ ...baseHint, frequency: { type: 'interval', days: 7 } })

    // First show + dismiss
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent(HINT_ID)
    act(() => {
      probe.current?.dismiss()
    })
    expect(screen.getByTestId('active')).toHaveTextContent('none')

    // Reset only the dismissed flag — interval is the boundary, not 'once'.
    // We model the typical UX where the user's "last view" was when SHOW fired.
    // Advance 6 days → still suppressed
    vi.advanceTimersByTime(6 * 24 * 60 * 60 * 1000)
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent('none')

    // Advance to +8 days → outside window
    vi.advanceTimersByTime(2 * 24 * 60 * 60 * 1000)
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent(HINT_ID)
  })

  it("frequency: 'once' never re-shows after dismissal", () => {
    renderProvider({ ...baseHint, frequency: 'once' })

    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent(HINT_ID)
    act(() => {
      probe.current?.dismiss()
    })

    vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000)
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent('none')
  })

  it("frequency: { type: 'times', count: 3 } blocks the fourth show", () => {
    renderProvider({ ...baseHint, frequency: { type: 'times', count: 3 } })

    for (let i = 0; i < 3; i++) {
      act(() => {
        probe.current?.show()
      })
      expect(screen.getByTestId('active')).toHaveTextContent(HINT_ID)
      act(() => {
        probe.current?.dismiss()
      })
    }
    // Fourth attempt — blocked. The dismiss above also marks isDismissed,
    // but `times` evaluates viewCount < count first (= 3 < 3 → false).
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent('none')
  })

  it('rehydrates persisted dismissal from storage and suppresses showHint at boot', () => {
    seedHintFrequencyState(storage, HINT_ID, {
      viewCount: 1,
      isDismissed: true,
      lastViewedAt: new Date('2026-01-06T00:00:00Z'),
    })
    renderProvider({ ...baseHint, frequency: { type: 'interval', days: 7 } })

    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent('none')
  })

  it('persists frequency state to storage after a recorded view', () => {
    renderProvider({ ...baseHint, frequency: { type: 'times', count: 3 } })

    act(() => {
      probe.current?.show()
    })

    const raw = storage.getItem(`tourkit:hint:freq:${HINT_ID}`)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.viewCount).toBe(1)
    expect(typeof parsed.lastViewedAt).toBe('string')
  })

  it('resetHint deletes the persisted frequency entry — survives remount', () => {
    const hint: HintConfig = { ...baseHint, frequency: 'once' }
    const { unmount } = renderProvider(hint)

    // Show + dismiss + persist
    act(() => {
      probe.current?.show()
    })
    act(() => {
      probe.current?.dismiss()
    })
    expect(storage.getItem(`tourkit:hint:freq:${HINT_ID}`)).not.toBeNull()

    // Reset clears in-memory state
    act(() => {
      probe.current?.reset()
    })
    // …and the persist effect must have removed the storage entry
    expect(storage.getItem(`tourkit:hint:freq:${HINT_ID}`)).toBeNull()

    // Remount: the hint should be eligible again (no persisted dismissal to rehydrate)
    unmount()
    probe = { current: null }
    renderProvider(hint)
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent(HINT_ID)
  })

  it('resetAllHints clears every persisted entry — survives remount', () => {
    const hint: HintConfig = { ...baseHint, frequency: 'once' }
    const { unmount } = renderProvider(hint)

    act(() => {
      probe.current?.show()
    })
    act(() => {
      probe.current?.dismiss()
    })
    expect(storage.getItem(`tourkit:hint:freq:${HINT_ID}`)).not.toBeNull()

    act(() => {
      probe.current?.resetAll()
    })
    expect(storage.getItem(`tourkit:hint:freq:${HINT_ID}`)).toBeNull()

    unmount()
    probe = { current: null }
    renderProvider(hint)
    act(() => {
      probe.current?.show()
    })
    expect(screen.getByTestId('active')).toHaveTextContent(HINT_ID)
  })
})
