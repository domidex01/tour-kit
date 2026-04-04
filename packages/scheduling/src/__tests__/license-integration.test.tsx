// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @tour-kit/license — ProGate wraps ScheduleGate
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode; package: string }) => {
    return <>{children}</>
  },
}))

import { ScheduleGate } from '../components/schedule-gate'

describe('ScheduleGate — license integration (ProGate)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when ProGate allows (licensed)', () => {
    render(
      <ScheduleGate>
        <div data-testid="child">Hello</div>
      </ScheduleGate>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render watermark (hard gate replaces watermark)', () => {
    render(
      <ScheduleGate>
        <div>Hello</div>
      </ScheduleGate>
    )

    expect(screen.queryByText('UNLICENSED')).toBeNull()
    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
  })
})

describe('ScheduleGate — ProGate blocks when unlicensed', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@tour-kit/license', () => ({
      ProGate: ({ package: pkg }: { children: React.ReactNode; package: string }) => (
        <div data-testid="pro-gate-placeholder">Tour Kit Pro license required — {pkg}</div>
      ),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows placeholder instead of children when unlicensed', async () => {
    const { ScheduleGate } = await import('../components/schedule-gate')

    render(
      <ScheduleGate>
        <div data-testid="child">Hello</div>
      </ScheduleGate>
    )

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.getByText(/Tour Kit Pro license required/)).toBeInTheDocument()
    expect(screen.getByText(/@tour-kit\/scheduling/)).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })
})
