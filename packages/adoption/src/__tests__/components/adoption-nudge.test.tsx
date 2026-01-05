/**
 * @tour-kit/adoption - AdoptionNudge Component Tests
 *
 * Tests for the AdoptionNudge component which displays nudges
 * for unadopted features with configurable delay and rendering.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdoptionNudge } from '../../components/adoption-nudge'
import { AdoptionProvider } from '../../context/adoption-provider'
import type { Feature, NudgeConfig } from '../../types'

// Mock feature factory
function createMockFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'test-feature',
    name: 'Test Feature',
    trigger: { callback: () => false },
    adoptionCriteria: { minUses: 3, recencyDays: 30 },
    category: 'core',
    priority: 1,
    description: 'A test feature description',
    ...overrides,
  }
}

// Provider wrapper factory
function createWrapper(
  options: {
    features?: Feature[]
    nudge?: NudgeConfig
    onNudge?: (feature: Feature, action: string) => void
  } = {}
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AdoptionProvider
        features={options.features ?? [createMockFeature()]}
        storage={{ type: 'memory' }}
        nudge={options.nudge ?? { enabled: true, cooldown: 0, maxPerSession: 10 }}
        onNudge={options.onNudge}
      >
        {children}
      </AdoptionProvider>
    )
  }
}

describe('AdoptionNudge', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Visibility', () => {
    it('renders nothing when no pending nudges', () => {
      const Wrapper = createWrapper({ nudge: { enabled: false } })

      render(
        <Wrapper>
          <AdoptionNudge data-testid="nudge" />
        </Wrapper>
      )

      expect(screen.queryByTestId('nudge')).not.toBeInTheDocument()
    })

    it('renders nothing before delay expires', () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={5000} data-testid="nudge" />
        </Wrapper>
      )

      // Before delay
      expect(screen.queryByTestId('nudge')).not.toBeInTheDocument()
    })

    it('renders after delay with pending nudge', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={1000} data-testid="nudge" />
        </Wrapper>
      )

      // Fast-forward past delay
      await act(async () => {
        vi.advanceTimersByTime(1500)
      })

      await waitFor(() => {
        expect(screen.getByTestId('nudge')).toBeInTheDocument()
      })
    })

    it('uses default delay of 5000ms', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge data-testid="nudge" />
        </Wrapper>
      )

      // Just before default delay
      await act(async () => {
        vi.advanceTimersByTime(4000)
      })

      expect(screen.queryByTestId('nudge')).not.toBeInTheDocument()

      // Past default delay
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('nudge')).toBeInTheDocument()
      })
    })

    it('uses custom delay prop', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} data-testid="nudge" />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByTestId('nudge')).toBeInTheDocument()
      })
    })
  })

  describe('Default Rendering', () => {
    it('displays feature name', async () => {
      const feature = createMockFeature({ name: 'Amazing Feature' })
      const Wrapper = createWrapper({ features: [feature] })

      render(
        <Wrapper>
          <AdoptionNudge delay={100} />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByText('Amazing Feature')).toBeInTheDocument()
      })
    })

    it('displays feature description when present', async () => {
      const feature = createMockFeature({ description: 'This is a great feature' })
      const Wrapper = createWrapper({ features: [feature] })

      render(
        <Wrapper>
          <AdoptionNudge delay={100} />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByText('This is a great feature')).toBeInTheDocument()
      })
    })

    it('renders Try it button', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try it/i })).toBeInTheDocument()
      })
    })

    it('renders Dismiss button', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
      })
    })
  })

  describe('Custom Render', () => {
    it('uses render prop when provided', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge
            delay={100}
            render={() => <div data-testid="custom-render">Custom Content</div>}
          />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByTestId('custom-render')).toBeInTheDocument()
        expect(screen.getByText('Custom Content')).toBeInTheDocument()
      })
    })

    it('passes feature to render function', async () => {
      const feature = createMockFeature({ id: 'custom-feature', name: 'Custom Feature' })
      const Wrapper = createWrapper({ features: [feature] })

      render(
        <Wrapper>
          <AdoptionNudge
            delay={100}
            render={({ feature }) => <div data-testid="feature-id">{feature.id}</div>}
          />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByTestId('feature-id')).toHaveTextContent('custom-feature')
      })
    })

    it('passes onDismiss to render function', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge
            delay={100}
            render={({ onDismiss }) => (
              <button type="button" onClick={onDismiss} data-testid="dismiss-btn">
                Custom Dismiss
              </button>
            )}
          />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await waitFor(() => {
        expect(screen.getByTestId('dismiss-btn')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('dismiss-btn'))

      // After dismiss, nudge should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('dismiss-btn')).not.toBeInTheDocument()
      })
    })

    it('passes onSnooze to render function', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge
            delay={100}
            render={({ onSnooze }) => (
              <button type="button" onClick={() => onSnooze(60000)} data-testid="snooze-btn">
                Snooze 1 minute
              </button>
            )}
          />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await waitFor(() => {
        expect(screen.getByTestId('snooze-btn')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('snooze-btn'))

      // After snooze, nudge should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('snooze-btn')).not.toBeInTheDocument()
      })
    })

    it('passes onClick to render function', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge
            delay={100}
            render={({ onClick }) => (
              <button type="button" onClick={onClick} data-testid="click-btn">
                Try Feature
              </button>
            )}
          />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await waitFor(() => {
        expect(screen.getByTestId('click-btn')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('click-btn'))

      // After click, nudge should be hidden (and usage tracked)
      await waitFor(() => {
        expect(screen.queryByTestId('click-btn')).not.toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('hides nudge after dismiss', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} data-testid="nudge" />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await waitFor(() => {
        expect(screen.getByTestId('nudge')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /dismiss/i }))

      await waitFor(() => {
        expect(screen.queryByTestId('nudge')).not.toBeInTheDocument()
      })
    })

    it('hides nudge after click', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} data-testid="nudge" />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await waitFor(() => {
        expect(screen.getByTestId('nudge')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /try it/i }))

      await waitFor(() => {
        expect(screen.queryByTestId('nudge')).not.toBeInTheDocument()
      })
    })
  })

  describe('asChild Pattern', () => {
    it('renders as div by default', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} data-testid="nudge" />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        const nudge = screen.getByTestId('nudge')
        expect(nudge.tagName).toBe('DIV')
      })
    })

    it('applies className', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} className="custom-class" data-testid="nudge" />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByTestId('nudge')).toHaveClass('custom-class')
      })
    })
  })

  describe('Accessibility', () => {
    it('buttons have accessible names', async () => {
      const Wrapper = createWrapper()

      render(
        <Wrapper>
          <AdoptionNudge delay={100} />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try it/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
      })
    })
  })

  describe('Callbacks', () => {
    it('calls onNudge callback when nudge shown', async () => {
      const onNudge = vi.fn()
      const feature = createMockFeature()
      const Wrapper = createWrapper({ features: [feature], onNudge })

      render(
        <Wrapper>
          <AdoptionNudge delay={100} />
        </Wrapper>
      )

      await act(async () => {
        vi.advanceTimersByTime(150)
      })

      await waitFor(() => {
        expect(onNudge).toHaveBeenCalledWith(expect.objectContaining({ id: feature.id }), 'shown')
      })
    })
  })
})
