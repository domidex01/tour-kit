import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnnouncementModal } from '../components/announcement-modal'
import { AnnouncementsProvider } from '../context/announcements-provider'
import type { AnnouncementConfig } from '../types/announcement'
import { renderWithProviders } from './render-with-providers'

describe('Announcement audience filtering', () => {
  it('filters out an announcement when its segment is false', async () => {
    const config: AnnouncementConfig = {
      id: 'admin-notice',
      variant: 'modal',
      title: 'Admin notice',
      audience: { segment: 'admins' },
    }
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <AnnouncementModal id="admin-notice" />
      </AnnouncementsProvider>,
      { segments: { admins: () => false } }
    )

    // Wait one microtask for the auto-show effect to run.
    await waitFor(() => {
      expect(screen.queryByText('Admin notice')).not.toBeInTheDocument()
    })
  })

  it('renders an announcement when its segment is true', async () => {
    const config: AnnouncementConfig = {
      id: 'admin-notice',
      variant: 'modal',
      title: 'Admin notice',
      audience: { segment: 'admins' },
    }
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <AnnouncementModal id="admin-notice" />
      </AnnouncementsProvider>,
      { segments: { admins: () => true } }
    )

    await waitFor(() => {
      expect(screen.getByText('Admin notice')).toBeInTheDocument()
    })
  })

  // ★★ MANDATORY REGRESSION GUARD — keeps the legacy array audience shape
  // working through the discriminated-union widening. Both "match" and
  // "filter out" branches must hold; testing only one would silently let a
  // future bug always-allow or always-filter the array shape. ★★
  describe('legacy AudienceCondition[] shape (regression guard)', () => {
    const proConfig = (): AnnouncementConfig => ({
      id: 'pro-notice',
      variant: 'modal',
      title: 'Pro-only notice',
      audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
    })

    it('renders for a matching userContext (plan=pro)', async () => {
      renderWithProviders(
        <AnnouncementsProvider announcements={[proConfig()]} userContext={{ plan: 'pro' }}>
          <AnnouncementModal id="pro-notice" />
        </AnnouncementsProvider>,
        { userContext: { plan: 'pro' } }
      )

      await waitFor(() => {
        expect(screen.getByText('Pro-only notice')).toBeInTheDocument()
      })
    })

    it('filters out for a non-matching userContext (plan=free)', async () => {
      renderWithProviders(
        <AnnouncementsProvider announcements={[proConfig()]} userContext={{ plan: 'free' }}>
          <AnnouncementModal id="pro-notice" />
        </AnnouncementsProvider>,
        { userContext: { plan: 'free' } }
      )

      await waitFor(() => {
        expect(screen.queryByText('Pro-only notice')).not.toBeInTheDocument()
      })
    })
  })

  it('renders for everyone when no audience is set, regardless of segments/context', async () => {
    const config: AnnouncementConfig = {
      id: 'public-notice',
      variant: 'modal',
      title: 'Public notice',
    }
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]} userContext={{ plan: 'free' }}>
        <AnnouncementModal id="public-notice" />
      </AnnouncementsProvider>,
      { segments: { admins: () => false }, userContext: { plan: 'free' } }
    )

    await waitFor(() => {
      expect(screen.getByText('Public notice')).toBeInTheDocument()
    })
  })
})
