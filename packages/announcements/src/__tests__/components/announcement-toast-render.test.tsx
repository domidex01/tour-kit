import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AnnouncementToast } from '../../components/announcement-toast'
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

const cfg: AnnouncementConfig = {
  id: 'toast',
  variant: 'toast',
  title: 'Saved',
  description: 'Your changes were saved',
  autoShow: false,
}

describe('AnnouncementToast (portal render)', () => {
  it('renders title + description in a polite alert region', async () => {
    renderWith(<AnnouncementToast id="toast" open options={{ autoDismiss: false }} />, [cfg])

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
    expect(alert).toHaveTextContent('Saved')
    expect(screen.getByText('Your changes were saved')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    renderWith(<AnnouncementToast id="toast" open={false} />, [cfg])
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('close button dismisses the announcement', async () => {
    function Probe() {
      const a = useAnnouncement('toast')
      return <span data-testid="dismissed">{String(a.isDismissed)}</span>
    }
    renderWith(
      <>
        <AnnouncementToast id="toast" open options={{ autoDismiss: false }} />
        <Probe />
      </>,
      [cfg]
    )

    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.getByTestId('dismissed')).toHaveTextContent('true')
    })
  })

  it('renders the progress bar when showProgress + autoDismiss are on', async () => {
    vi.useFakeTimers()
    try {
      renderWith(
        <AnnouncementToast
          id="toast"
          open
          options={{ autoDismiss: true, showProgress: true, autoDismissDelay: 5000 }}
        />,
        [cfg]
      )

      // flush the mount effect that gates the portal
      act(() => {
        vi.advanceTimersByTime(0)
      })

      const alert = screen.getByRole('alert')
      // progress element is the last styled child with a width style
      const progress = alert.querySelector('[style*="width"]')
      expect(progress).not.toBeNull()
    } finally {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
})
