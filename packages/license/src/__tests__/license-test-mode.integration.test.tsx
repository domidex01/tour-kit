import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function findWatermark() {
  return document.body.querySelector('[data-tourkit-watermark]')
}

describe('<LicenseTestMode> integration', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('tier="invalid" → useIsPro() false + watermark present', async () => {
    const { LicenseTestMode } = await import('../components/license-test-mode')
    const { LicenseWatermark } = await import('../components/license-watermark')
    const { useIsPro } = await import('../hooks/use-is-pro')

    function ProGateProbe() {
      const isPro = useIsPro()
      return <span data-testid="probe">is-pro: {String(isPro)}</span>
    }

    const { getByTestId } = render(
      <LicenseTestMode tier="invalid">
        <LicenseWatermark />
        <ProGateProbe />
      </LicenseTestMode>
    )

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })
    expect(getByTestId('probe')).toHaveTextContent('is-pro: false')
  })

  it('tier="pro" → useIsPro() true', async () => {
    const { LicenseTestMode } = await import('../components/license-test-mode')
    const { useIsPro } = await import('../hooks/use-is-pro')

    function ProGateProbe() {
      const isPro = useIsPro()
      return <span data-testid="probe">is-pro: {String(isPro)}</span>
    }

    const { getByTestId } = render(
      <LicenseTestMode tier="pro">
        <ProGateProbe />
      </LicenseTestMode>
    )

    expect(getByTestId('probe')).toHaveTextContent('is-pro: true')
  })

  it('tier="free" → useIsPro() false', async () => {
    const { LicenseTestMode } = await import('../components/license-test-mode')
    const { useIsPro } = await import('../hooks/use-is-pro')

    function ProGateProbe() {
      const isPro = useIsPro()
      return <span data-testid="probe">is-pro: {String(isPro)}</span>
    }

    const { getByTestId } = render(
      <LicenseTestMode tier="free">
        <ProGateProbe />
      </LicenseTestMode>
    )

    expect(getByTestId('probe')).toHaveTextContent('is-pro: false')
  })
})
