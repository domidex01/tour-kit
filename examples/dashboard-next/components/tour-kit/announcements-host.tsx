'use client'

import {
  AnnouncementBanner,
  AnnouncementModal,
  AnnouncementSlideout,
  AnnouncementSpotlight,
  AnnouncementToast,
} from '@tour-kit/announcements'
import { ScheduledBanner } from './scheduled-banner'

export function AnnouncementsHost() {
  return (
    <>
      <AnnouncementModal id="welcome" useConfig />
      {/* Director cue 2 — product-update banner. */}
      <AnnouncementBanner id="product-update" useConfig />
      {/* Director cue 6 — scheduling banner (force-shown for the reel). */}
      <AnnouncementBanner id="business-hours" useConfig />
      <ScheduledBanner />
      <AnnouncementToast id="ai-live" useConfig />
      <AnnouncementSlideout id="whats-new" useConfig />
      <AnnouncementSpotlight id="profile-feature" useConfig />
    </>
  )
}
