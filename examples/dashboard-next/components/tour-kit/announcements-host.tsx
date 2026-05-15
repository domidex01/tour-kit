'use client'

import {
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
      <ScheduledBanner />
      <AnnouncementToast id="ai-live" useConfig />
      <AnnouncementSlideout id="whats-new" useConfig />
      <AnnouncementSpotlight id="profile-feature" useConfig />
    </>
  )
}
