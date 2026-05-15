import { render, screen, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { AnnouncementModal } from '../../components/announcement-modal'
import { AnnouncementSlideout } from '../../components/announcement-slideout'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import type { AnnouncementConfig } from '../../types/announcement'

function renderAnnouncement(ui: React.ReactNode, announcements: AnnouncementConfig[]) {
  return render(
    <AnnouncementsProvider announcements={announcements} storage={null}>
      {ui}
    </AnnouncementsProvider>
  )
}

describe('announcement dialog accessibility content', () => {
  it('renders modal title and description through dialog primitives', async () => {
    renderAnnouncement(<AnnouncementModal id="release" open />, [
      {
        id: 'release',
        variant: 'modal',
        title: 'Release notes',
        description: 'New reporting filters are available.',
        autoShow: false,
      },
    ])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Release notes' })).toBeInTheDocument()
    })
    expect(screen.getByText('New reporting filters are available.')).toBeInTheDocument()
  })

  it('omits aria-describedby when modal config has no description', async () => {
    renderAnnouncement(<AnnouncementModal id="quiet" open />, [
      {
        id: 'quiet',
        variant: 'modal',
        title: 'Quiet update',
        autoShow: false,
      },
    ])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Quiet update' })).toBeInTheDocument()
    })
    expect(screen.getByTestId('dialog-content')).not.toHaveAttribute('aria-describedby')
  })

  it('provides a hidden fallback title for untitled slideouts', async () => {
    renderAnnouncement(<AnnouncementSlideout id="untitled" open />, [
      {
        id: 'untitled',
        variant: 'slideout',
        description: 'Background sync finished.',
        autoShow: false,
      },
    ])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Announcement' })).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Announcement' })).toHaveStyle({
      position: 'absolute',
    })
    expect(screen.getByText('Background sync finished.')).toBeInTheDocument()
  })
})
