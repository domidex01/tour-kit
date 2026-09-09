/**
 * v3 Phase 1 — `<Hint autoShow>` under a config-driven provider, on FIRST mount.
 *
 * The one file the 295 cannot stand in for. They drive every `show()` through
 * `act()` after mount (`hint-frequency.test.tsx`) or mount a bare
 * `<HintsProvider>` with no `hints` and no `storage` (`hint-autoshow.test.tsx`),
 * so none of them can see the window between a child's mount effect and the
 * provider's own effects.
 *
 * `<Hint autoShow>` calls `show()` from its own mount effect and `useHint(id)`
 * registers from another; child effects run before the parent's. The
 * suppression asserted below therefore comes from the ENGINE's frequency gate,
 * not from `<Hint>`'s `isDismissed` guard — that guard reads a snapshot that is
 * still `INITIAL_HINTS_STATE` at that point, so the effect fires and
 * `analytics.hintShown` fires with it. Assert observable state, never silence.
 */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../../components/hint'
import { useHintsContext } from '../../context/hints-context'
import { HintsProvider } from '../../context/hints-provider'
import type { HintConfig } from '../../types'
import { createMockStorage, seedHintFrequencyState } from '../mock-storage'

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
const KEY = 'tourkit:hint:freq:h'
const base: HintConfig = { id: 'h', target: '#target', content: 'Hello' }

function Probe() {
  const { activeHint } = useHintsContext()
  return <span data-testid="active">{activeHint ?? 'none'}</span>
}

describe('<Hint autoShow> under a config-driven provider — frequency on first mount', () => {
  let storage: Storage

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-08T00:00:00Z'))
    storage = createMockStorage()
    document.body.innerHTML = '<div id="target">T</div>'
    const el = document.getElementById('target')
    if (el) vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  function mount(hint: HintConfig) {
    return render(
      <HintsProvider hints={[hint]} storage={storage}>
        <Hint {...hint} autoShow />
        <Probe />
      </HintsProvider>
    )
  }

  it('records and persists the auto-show view (times: 3, nothing persisted)', () => {
    mount({ ...base, frequency: { type: 'times', count: 3 } })

    expect(screen.getByTestId('active')).toHaveTextContent('h')
    expect(storage.getItem(KEY)).toContain('"viewCount":1')
  })

  it("a persisted 'once' dismissal suppresses the auto-show", () => {
    seedHintFrequencyState(storage, 'h', {
      viewCount: 1,
      isDismissed: true,
      lastViewedAt: new Date('2026-01-01T00:00:00Z'),
    })
    mount({ ...base, frequency: 'once' })

    expect(screen.getByTestId('active')).toHaveTextContent('none')
    expect(screen.queryByText('Hello')).toBeNull()
  })

  it('a persisted view count is added to, not overwritten (times: 3, 2 persisted)', () => {
    seedHintFrequencyState(storage, 'h', {
      viewCount: 2,
      isDismissed: false,
      lastViewedAt: new Date('2026-01-01T00:00:00Z'),
    })
    mount({ ...base, frequency: { type: 'times', count: 3 } })

    expect(screen.getByTestId('active')).toHaveTextContent('h')
    expect(storage.getItem(KEY)).toContain('"viewCount":3')
  })

  it('an exhausted persisted count suppresses the auto-show (times: 3, 3 persisted)', () => {
    seedHintFrequencyState(storage, 'h', {
      viewCount: 3,
      isDismissed: false,
      lastViewedAt: new Date('2026-01-01T00:00:00Z'),
    })
    mount({ ...base, frequency: { type: 'times', count: 3 } })

    expect(screen.getByTestId('active')).toHaveTextContent('none')
  })
})
