import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hint } from '../components/hint'
import { HintsProvider } from '../context/hints-provider'

function createWrapper(track: AnalyticsPlugin['track']) {
  const plugin: AnalyticsPlugin = { name: 'test', track }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider config={{ plugins: [plugin] }}>
        <HintsProvider>{children}</HintsProvider>
      </AnalyticsProvider>
    )
  }
}

describe('Hint analytics', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
    const target = document.querySelector('#target')
    vi.spyOn(target as Element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 100,
      bottom: 140,
      right: 240,
      width: 140,
      height: 40,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    })
  })

  it('emits shown and dismissed events', async () => {
    const user = userEvent.setup()
    const track = vi.fn<AnalyticsPlugin['track']>()

    render(<Hint id="help" target="#target" content="Helpful hint" />, {
      wrapper: createWrapper(track),
    })

    await user.click(screen.getByRole('button', { name: /show hint/i }))
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'hint_shown',
        tourId: 'help',
        metadata: expect.objectContaining({
          target: '#target',
          trigger: 'hotspot',
        }),
      })
    )

    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'hint_dismissed',
        tourId: 'help',
        metadata: expect.objectContaining({
          target: '#target',
        }),
      })
    )
  })
})
