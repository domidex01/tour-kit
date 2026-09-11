import { render, waitFor } from '@testing-library/react'
import { LicenseGate } from '@tour-kit/license'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HintsProvider } from '../context/hints-provider'

function watermarks() {
  return document.body.querySelectorAll('[data-tourkit-watermark]')
}

describe('@tour-kit/hints licence badge', () => {
  // No body clearing here — this file's afterEach runs before the shared
  // setup's, so wiping the body would rip out the portal nodes RTL's
  // `cleanup()` then tries to unmount.
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders exactly one badge on a production host', async () => {
    // Vitest serves jsdom from localhost, a development host under the licence.
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    render(
      <HintsProvider>
        <div data-testid="content">content</div>
      </HintsProvider>
    )

    await waitFor(() => expect(watermarks().length).toBe(1))
  })

  it('still renders one badge with a Pro package gate nested inside', async () => {
    vi.stubGlobal('location', { hostname: 'app.example.com' })

    // `<LicenseGate>` is exactly what every Pro package mounts, so nesting it
    // exercises the single-owner election without pulling one into hints' deps.
    render(
      <HintsProvider>
        <LicenseGate require="pro">
          <div data-testid="content">content</div>
        </LicenseGate>
      </HintsProvider>
    )

    await waitFor(() => expect(watermarks().length).toBe(1))
  })

  it('renders no badge on a development host', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })

    const { getByTestId } = render(
      <HintsProvider>
        <div data-testid="content">content</div>
      </HintsProvider>
    )

    await waitFor(() => expect(getByTestId('content')).toBeInTheDocument())
    expect(watermarks().length).toBe(0)
  })
})
