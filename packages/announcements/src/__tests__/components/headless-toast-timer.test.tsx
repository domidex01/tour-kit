import { act, render } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeadlessToast } from '../../components/headless/headless-toast'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import type { AnnouncementConfig } from '../../types/announcement'

const cfg: AnnouncementConfig = {
  id: 'toast-1',
  variant: 'toast',
  title: 'Hi',
  // The toast is driven via the controlled `open` prop in these tests; opt
  // out of the auto-show path so the provider does not influence timing.
  autoShow: false,
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider announcements={[cfg]} storage={null}>
      {children}
    </AnnouncementsProvider>
  )
}

describe('HeadlessToast auto-dismiss timer', () => {
  let intervalSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    intervalSpy = vi.spyOn(globalThis, 'setInterval')
  })

  afterEach(() => {
    intervalSpy.mockRestore()
    vi.useRealTimers()
  })

  it('schedules a single interval while open across parent re-renders', () => {
    const onOpenChange = vi.fn()
    const renderToast = (key: number) => (
      <Wrapper>
        <HeadlessToast
          id="toast-1"
          open
          onOpenChange={onOpenChange}
          options={{ autoDismiss: true, autoDismissDelay: 5000 }}
        >
          {() => <span data-key={key} />}
        </HeadlessToast>
      </Wrapper>
    )

    const { rerender } = render(renderToast(1))

    // Multiple parent re-renders with unchanged primitives must NOT re-arm
    // the interval. Pre-fix: dismiss closure was a dep; this regressed.
    rerender(renderToast(2))
    rerender(renderToast(3))
    rerender(renderToast(4))

    expect(intervalSpy).toHaveBeenCalledTimes(1)
  })

  it('auto-dismisses after the configured delay', () => {
    const onOpenChange = vi.fn()
    render(
      <Wrapper>
        <HeadlessToast
          id="toast-1"
          open
          onOpenChange={onOpenChange}
          options={{ autoDismiss: true, autoDismissDelay: 5000 }}
        >
          {() => null}
        </HeadlessToast>
      </Wrapper>
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('clears the interval when the toast closes', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Wrapper>
        <HeadlessToast
          id="toast-1"
          open
          onOpenChange={onOpenChange}
          options={{ autoDismiss: true, autoDismissDelay: 5000 }}
        >
          {() => null}
        </HeadlessToast>
      </Wrapper>
    )

    // setInterval ran once for the open render
    expect(intervalSpy).toHaveBeenCalledTimes(1)

    rerender(
      <Wrapper>
        <HeadlessToast
          id="toast-1"
          open={false}
          onOpenChange={onOpenChange}
          options={{ autoDismiss: true, autoDismissDelay: 5000 }}
        >
          {() => null}
        </HeadlessToast>
      </Wrapper>
    )

    // No new interval scheduled after close
    expect(intervalSpy).toHaveBeenCalledTimes(1)

    // Advancing past the original delay must not fire onOpenChange — interval
    // was cleared when open flipped to false.
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('does not schedule an interval when autoDismiss is false', () => {
    render(
      <Wrapper>
        <HeadlessToast id="toast-1" open options={{ autoDismiss: false }}>
          {() => null}
        </HeadlessToast>
      </Wrapper>
    )

    expect(intervalSpy).not.toHaveBeenCalled()
  })
})
