import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementBanner } from '../../components/announcement-banner'
import { AnnouncementModal } from '../../components/announcement-modal'
import { AnnouncementSlideout } from '../../components/announcement-slideout'
import { AnnouncementSpotlight } from '../../components/announcement-spotlight'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import { useAnnouncement } from '../../hooks/use-announcement'
import type { AnnouncementConfig } from '../../types/announcement'

function renderWith(ui: React.ReactNode, announcements: AnnouncementConfig[]) {
  return render(
    <AnnouncementsProvider announcements={announcements} storage={null}>
      {ui}
    </AnnouncementsProvider>
  )
}

describe('AnnouncementBanner', () => {
  it('renders title + description from config and fires the primary action', () => {
    const onClick = vi.fn()
    const cfg: AnnouncementConfig = {
      id: 'banner',
      variant: 'banner',
      title: 'New feature',
      description: 'Now available',
      autoShow: false,
      primaryAction: { label: 'Try it', onClick },
    }
    renderWith(<AnnouncementBanner id="banner" open />, [cfg])

    expect(screen.getByRole('alert')).toHaveTextContent('New feature')
    expect(screen.getByText('Now available')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try it' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when closed', () => {
    const cfg: AnnouncementConfig = { id: 'banner', variant: 'banner', title: 'x', autoShow: false }
    const { container } = renderWith(<AnnouncementBanner id="banner" open={false} />, [cfg])
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('close button dismisses the announcement', () => {
    const cfg: AnnouncementConfig = {
      id: 'banner',
      variant: 'banner',
      title: 'Closable',
      autoShow: false,
    }
    function Probe() {
      const a = useAnnouncement('banner')
      return <span data-testid="dismissed">{String(a.isDismissed)}</span>
    }
    renderWith(
      <>
        <AnnouncementBanner id="banner" open />
        <Probe />
      </>,
      [cfg]
    )

    expect(screen.getByTestId('dismissed')).toHaveTextContent('false')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByTestId('dismissed')).toHaveTextContent('true')
  })

  it('renders children when useConfig is false', () => {
    const cfg: AnnouncementConfig = {
      id: 'banner',
      variant: 'banner',
      title: 'hidden',
      autoShow: false,
    }
    renderWith(
      <AnnouncementBanner id="banner" open useConfig={false}>
        <span>custom banner body</span>
      </AnnouncementBanner>,
      [cfg]
    )
    expect(screen.getByText('custom banner body')).toBeInTheDocument()
    expect(screen.queryByText('hidden')).toBeNull()
  })
})

describe('AnnouncementModal — dismissal paths', () => {
  const cfg: AnnouncementConfig = {
    id: 'modal',
    variant: 'modal',
    title: 'Release',
    description: 'Notes here',
    autoShow: false,
    primaryAction: { label: 'Got it' },
  }

  it('clicking the overlay dismisses via overlay_click', async () => {
    function Probe() {
      const a = useAnnouncement('modal')
      return <span data-testid="reason">{a.state?.dismissalReason ?? 'none'}</span>
    }
    renderWith(
      <>
        <AnnouncementModal id="modal" open />
        <Probe />
      </>,
      [cfg]
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Release' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('dialog-overlay'))
    expect(screen.getByTestId('reason')).toHaveTextContent('overlay_click')
  })

  it('primary action completes the announcement', async () => {
    function Probe() {
      const a = useAnnouncement('modal')
      return <span data-testid="completed">{String(Boolean(a.state?.completedAt))}</span>
    }
    renderWith(
      <>
        <AnnouncementModal id="modal" open />
        <Probe />
      </>,
      [cfg]
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByTestId('completed')).toHaveTextContent('true')
  })
})

describe('AnnouncementSlideout — dismissal paths', () => {
  const cfg: AnnouncementConfig = {
    id: 'slide',
    variant: 'slideout',
    title: 'Details',
    description: 'Side panel content',
    autoShow: false,
  }

  it('renders title + description through dialog primitives', async () => {
    renderWith(<AnnouncementSlideout id="slide" open />, [cfg])
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
    })
    expect(screen.getByText('Side panel content')).toBeInTheDocument()
  })

  it('overlay click dismisses the slideout', async () => {
    function Probe() {
      const a = useAnnouncement('slide')
      return <span data-testid="reason">{a.state?.dismissalReason ?? 'none'}</span>
    }
    renderWith(
      <>
        <AnnouncementSlideout id="slide" open />
        <Probe />
      </>,
      [cfg]
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('dialog-overlay'))
    expect(screen.getByTestId('reason')).toHaveTextContent('overlay_click')
  })

  it('close button dismisses the slideout', async () => {
    function Probe() {
      const a = useAnnouncement('slide')
      return <span data-testid="dismissed">{String(a.isDismissed)}</span>
    }
    renderWith(
      <>
        <AnnouncementSlideout id="slide" open />
        <Probe />
      </>,
      [cfg]
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByTestId('dismissed')).toHaveTextContent('true')
  })
})

describe('AnnouncementSpotlight — spotlightOptions merge + mask', () => {
  let target: HTMLElement
  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'spot-merge-target'
    document.body.appendChild(target)
  })
  afterEach(() => {
    target.remove()
  })

  it('builds a radial-gradient overlay using the merged overlayOpacity override', () => {
    const cfg: AnnouncementConfig = {
      id: 'spot',
      variant: 'spotlight',
      title: 'Look here',
      autoShow: false,
      spotlightOptions: {
        targetSelector: '#spot-merge-target',
        overlayOpacity: 0.8,
        offset: 24,
        closeOnOverlayClick: true,
      },
    }
    render(
      <AnnouncementsProvider announcements={[cfg]} storage={null}>
        <AnnouncementSpotlight id="spot" open />
      </AnnouncementsProvider>
    )

    const overlay = screen.getByRole('button', { name: /close spotlight/i })
    // overlayOpacity flows into the radial-gradient rgba alpha.
    expect(overlay.getAttribute('style')).toContain('radial-gradient')
    expect(overlay.getAttribute('style')).toContain('0.8')
  })

  it('renders the cutout + arrow in the default variant', () => {
    const cfg: AnnouncementConfig = {
      id: 'spot',
      variant: 'spotlight',
      title: 'Look here',
      autoShow: false,
      spotlightOptions: { targetSelector: '#spot-merge-target' },
    }
    render(
      <AnnouncementsProvider announcements={[cfg]} storage={null}>
        <AnnouncementSpotlight id="spot" open />
      </AnnouncementsProvider>
    )

    expect(document.querySelector('[data-tk-spotlight-cutout]')).not.toBeNull()
    expect(document.querySelector('[data-tk-spotlight-arrow]')).not.toBeNull()
  })

  it('legacy-spotlight variant omits the cutout/arrow but keeps the radial overlay', () => {
    const cfg: AnnouncementConfig = {
      id: 'spot',
      variant: 'spotlight',
      title: 'Look here',
      autoShow: false,
      spotlightOptions: { targetSelector: '#spot-merge-target' },
    }
    render(
      <AnnouncementsProvider announcements={[cfg]} storage={null}>
        <AnnouncementSpotlight id="spot" open variant="legacy-spotlight" />
      </AnnouncementsProvider>
    )

    expect(document.querySelector('[data-tk-spotlight-cutout]')).toBeNull()
    expect(document.querySelector('[data-tk-spotlight-arrow]')).toBeNull()
    expect(
      screen.getByRole('button', { name: /close spotlight/i }).getAttribute('style')
    ).toContain('radial-gradient')
  })
})
