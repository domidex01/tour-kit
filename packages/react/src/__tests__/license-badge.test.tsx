import { render, waitFor } from '@testing-library/react'
import type {
  TourKitProvider as CoreTourKitProvider,
  TourProvider as CoreTourProvider,
} from '@tour-kit/core'
import { LicenseGate } from '@tour-kit/license'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { TourKitProvider, TourProvider } from '../components/provider/licensed-providers'
import { MultiTourKitProvider } from '../components/provider/tourkit-provider'

function watermarks() {
  return document.body.querySelectorAll('[data-tourkit-watermark]')
}

const TOURS = [
  {
    id: 't1',
    steps: [{ id: 's1', target: '#anchor', title: 'Hello', content: 'World' }],
  },
]

describe('@tour-kit/react licence badge', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  // No `document.body.innerHTML = ''` here: this file's afterEach runs BEFORE
  // the shared setup's, so clearing the body would rip out the portal nodes
  // that RTL's `cleanup()` then tries to unmount ("NotFoundError: The node to
  // be removed is not a child of this node"). The shared setup already clears
  // the body, after cleanup, which is the correct order.
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders exactly one badge with three gates mounted together', async () => {
    // Vitest serves jsdom from localhost, which the licence treats as a
    // development host — stub a production hostname so the badge is in play.
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    // `<LicenseGate>` standing in for a Pro package: every one of the eight
    // mounts exactly this, so nesting it is a faithful stand-in without
    // pulling a Pro package into react's dependency graph.
    render(
      <TourKitProvider>
        <TourProvider tours={TOURS}>
          <LicenseGate require="pro">
            <div data-testid="content">content</div>
          </LicenseGate>
        </TourProvider>
      </TourKitProvider>
    )

    await waitFor(() => expect(watermarks().length).toBe(1))
  })

  it('renders exactly one badge from MultiTourKitProvider too', async () => {
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    render(
      <MultiTourKitProvider>
        <TourProvider tours={TOURS}>
          <div data-testid="content">content</div>
        </TourProvider>
      </MultiTourKitProvider>
    )

    await waitFor(() => expect(watermarks().length).toBe(1))
  })

  it('renders no badge on a development host', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })

    const { getByTestId } = render(
      <TourProvider tours={TOURS}>
        <div data-testid="content">content</div>
      </TourProvider>
    )

    await waitFor(() => expect(getByTestId('content')).toBeInTheDocument())
    expect(watermarks().length).toBe(0)
  })

  it('still renders children — the gate is soft, never a blocker', async () => {
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    const { getByTestId } = render(
      <TourProvider tours={TOURS}>
        <div data-testid="content">content</div>
      </TourProvider>
    )

    await waitFor(() => expect(getByTestId('content')).toBeInTheDocument())
  })

  it("accepts every prop core's TourProvider does", () => {
    // The shim must be source-compatible: consumers import `TourProvider` from
    // `@tour-kit/react` and used to get core's component verbatim.
    expectTypeOf<React.ComponentProps<typeof TourProvider>>().toEqualTypeOf<
      React.ComponentProps<typeof CoreTourProvider>
    >()
    expectTypeOf<React.ComponentProps<typeof TourKitProvider>>().toEqualTypeOf<
      React.ComponentProps<typeof CoreTourKitProvider>
    >()
  })
})
