import { cleanup, render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function findWatermarks() {
  return document.body.querySelectorAll('[data-tourkit-watermark]')
}

function findWatermark() {
  return document.body.querySelector('[data-tourkit-watermark]')
}

describe('LicenseWatermark', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders into document.body via portal after mount', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const wrapper = findWatermark() as HTMLElement
    expect(wrapper.parentElement).toBe(document.body)
  })

  it('renders a single badge when five instances mount in the same tree', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(
      <>
        <LicenseWatermark />
        <LicenseWatermark />
        <LicenseWatermark />
        <LicenseWatermark />
        <LicenseWatermark />
      </>
    )

    await waitFor(() => {
      expect(findWatermarks()).toHaveLength(1)
    })
  })

  it('renders a single badge with two same-tick instances', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(
      <>
        <LicenseWatermark />
        <LicenseWatermark />
      </>
    )

    await waitFor(() => {
      expect(findWatermarks()).toHaveLength(1)
    })
  })

  it('transfers ownership and keeps badge when first instance unmounts', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    function Harness({ showFirst }: { showFirst: boolean }) {
      return (
        <>
          {showFirst ? <LicenseWatermark /> : null}
          <LicenseWatermark />
        </>
      )
    }

    const { rerender } = render(<Harness showFirst={true} />)
    await waitFor(() => {
      expect(findWatermarks()).toHaveLength(1)
    })

    rerender(<Harness showFirst={false} />)
    await waitFor(() => {
      expect(findWatermarks()).toHaveLength(1)
    })
  })

  it('keeps a single badge under React.StrictMode', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(
      <StrictMode>
        <LicenseWatermark />
        <LicenseWatermark />
      </StrictMode>
    )

    await waitFor(() => {
      expect(findWatermarks()).toHaveLength(1)
    })
  })

  it('removes the badge after the last instance unmounts', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    const { unmount } = render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    unmount()

    await waitFor(() => {
      expect(findWatermark()).toBeNull()
    })
  })

  it('link href includes Tour Kit pricing UTM params', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const link = findWatermark()?.querySelector('a')
    expect(link).not.toBeNull()
    const href = link?.getAttribute('href') ?? ''
    expect(href).toContain('https://usertourkit.com/pricing')
    expect(href).toContain('utm_source=unlicensed_badge')
    expect(href).toContain('utm_medium=in_app')
    expect(href).toContain('utm_campaign=watermark')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('outer wrapper has pointer-events: none, link has pointer-events: auto', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const wrapper = findWatermark() as HTMLElement
    expect(wrapper.style.pointerEvents).toBe('none')
    expect(wrapper.style.position).toBe('fixed')
    expect(wrapper.style.zIndex).toBe('2147483647')

    const link = wrapper.querySelector('a') as HTMLAnchorElement
    expect(link.style.pointerEvents).toBe('auto')
  })

  it('dispatches gtag("event", "unlicensed_badge_clicked", payload) on click', async () => {
    const gtag = vi.fn()
    vi.stubGlobal('gtag', gtag)

    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const link = findWatermark()?.querySelector('a') as HTMLAnchorElement
    link.click()

    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'unlicensed_badge_clicked',
      expect.objectContaining({ placement: 'watermark' })
    )
  })

  it('falls back to dataLayer.push when gtag is absent', async () => {
    const dataLayer: Array<Record<string, unknown>> = []
    vi.stubGlobal('dataLayer', dataLayer)
    // Ensure gtag is undefined for this case.
    vi.stubGlobal('gtag', undefined)

    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const link = findWatermark()?.querySelector('a') as HTMLAnchorElement
    link.click()

    expect(dataLayer).toHaveLength(1)
    expect(dataLayer[0]).toEqual(
      expect.objectContaining({
        event: 'unlicensed_badge_clicked',
        placement: 'watermark',
      })
    )
  })

  it('does not throw when no analytics globals are present', async () => {
    vi.stubGlobal('gtag', undefined)
    vi.stubGlobal('dataLayer', undefined)

    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const link = findWatermark()?.querySelector('a') as HTMLAnchorElement
    expect(() => link.click()).not.toThrow()
  })

  it('has accessible region label', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')

    render(<LicenseWatermark />)

    await waitFor(() => {
      expect(findWatermark()).not.toBeNull()
    })

    const wrapper = findWatermark() as HTMLElement
    expect(wrapper.getAttribute('role')).toBe('region')
    expect(wrapper.getAttribute('aria-label')).toBe('userTourKit license required')
  })
})
