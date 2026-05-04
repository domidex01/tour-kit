import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnnouncementModal } from '../components/announcement-modal'
import { AnnouncementsProvider } from '../context/announcements-provider'
import type { AnnouncementConfig } from '../types/announcement'

describe('AnnouncementConfig.category', () => {
  it('round-trips through the AnnouncementConfig type', () => {
    // Compile-time assertion: `category?: string` is accepted on the public type.
    // If this file fails to typecheck, the field has been dropped or renamed.
    const config: AnnouncementConfig = {
      id: 'feat-1',
      variant: 'modal',
      title: 'New feature',
      category: 'feature',
    }
    expect(config.category).toBe('feature')
    expect(config).toMatchObject({ id: 'feat-1', category: 'feature' })
  })

  it('produces DOM identical to the no-category baseline (presentation-layer only)', async () => {
    const baseline: AnnouncementConfig = {
      id: 'feat-1',
      variant: 'modal',
      title: 'New feature',
      description: 'Try it out',
    }
    const withCategory: AnnouncementConfig = { ...baseline, category: 'feature' }

    const baselineRender = render(
      <AnnouncementsProvider announcements={[baseline]}>
        <AnnouncementModal id="feat-1" />
      </AnnouncementsProvider>
    )
    await waitFor(() => {
      expect(baselineRender.queryByText('New feature')).toBeInTheDocument()
    })
    const baselineHtml = baselineRender.container.innerHTML
    baselineRender.unmount()

    const withCatRender = render(
      <AnnouncementsProvider announcements={[withCategory]}>
        <AnnouncementModal id="feat-1" />
      </AnnouncementsProvider>
    )
    await waitFor(() => {
      expect(withCatRender.queryByText('New feature')).toBeInTheDocument()
    })
    const withCatHtml = withCatRender.container.innerHTML
    withCatRender.unmount()

    // 3c declares `category` is presentation-layer metadata only — no
    // rendering changes. Phase 5a's changelog feed will read the field.
    expect(withCatHtml).toBe(baselineHtml)
  })
})
